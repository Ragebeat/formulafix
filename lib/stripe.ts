import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Stripe-клиент; null, если ключ не задан (оплата отключена). */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}
