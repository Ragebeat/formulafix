import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Stripe client, or null when no key is set (payments disabled). */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}
