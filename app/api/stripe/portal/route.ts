import { NextResponse } from "next/server";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/** Stripe Customer Portal: manage or cancel the subscription. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const admin = getAdminSupabase();
  const { data: prof } = admin
    ? await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single()
    : { data: null };

  if (!prof?.stripe_customer_id) {
    return NextResponse.json(
      { error: "no_subscription", message: "No active subscription found." },
      { status: 404 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: prof.stripe_customer_id,
    return_url: `${BASE}/`,
  });
  return NextResponse.json({ url: session.url });
}
