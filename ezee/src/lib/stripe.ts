import Stripe from "stripe";

// Server-side Stripe client. Never import this into client components.
// STRIPE_SECRET_KEY must be set in the environment (see .env).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
