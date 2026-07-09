import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/** Создание Stripe Checkout-сессии для подписки Pro. Требует логина. */
export async function POST() {
  const stripe = getStripe();
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!stripe || !price) {
    return NextResponse.json(
      { error: "payments_not_configured", message: "Payments are not set up yet." },
      { status: 503 }
    );
  }

  const supabase = getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user?.email) {
    return NextResponse.json(
      { error: "auth_required", message: "Sign in first — we need your email for the subscription." },
      { status: 401 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${BASE}/?upgraded=1`,
      cancel_url: `${BASE}/`,
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout failed:", e);
    return NextResponse.json(
      { error: "checkout_failed", message: "Couldn't start checkout. Try again." },
      { status: 502 }
    );
  }
}
