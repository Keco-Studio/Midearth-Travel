import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  stripeClient ??= new Stripe(secretKey, {
    appInfo: { name: "MidEarth Travel", version: "0.1.0" },
  });
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Stripe webhook is not configured. Set STRIPE_WEBHOOK_SECRET.");
  }
  return secret;
}
