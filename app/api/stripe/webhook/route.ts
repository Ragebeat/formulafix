import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase";
import type Stripe from "stripe";

/**
 * Stripe webhook: оплата → plan='pro'; отмена подписки → plan='free'.
 * В Stripe Dashboard подписать события:
 *   checkout.session.completed, customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (e) {
    console.error("webhook signature verification failed:", e);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "db_not_configured" }, { status: 503 });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.user_id;
      if (userId) {
        await admin
          .from("profiles")
          .update({ plan: "pro", stripe_customer_id: String(session.customer ?? "") })
          .eq("id", userId);
        console.log("upgraded to pro:", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
      } else if (sub.customer) {
        await admin
          .from("profiles")
          .update({ plan: "free" })
          .eq("stripe_customer_id", String(sub.customer));
      }
      console.log("downgraded to free:", userId ?? sub.customer);
    }
  } catch (e) {
    console.error("webhook handling failed:", e);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
