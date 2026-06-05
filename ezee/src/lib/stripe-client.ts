import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Client-side Stripe.js loader (singleton). Uses the publishable key.
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
    );
  }
  return stripePromise;
}
