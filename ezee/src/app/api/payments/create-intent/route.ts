import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";

// Creates a Stripe PaymentIntent for the cart total and returns its client
// secret. The card is collected on the client with Stripe Elements; the order
// is only created after the payment succeeds (verified again server-side in
// /api/orders/create).
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured. Set STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, email } = body as { amount?: number; email?: string };

    // amount is the order total in major units (EUR). Convert to cents.
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const amountInCents = Math.round(amount * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      // Card only — avoids the long list of wallets/local methods and Stripe Link.
      payment_method_types: ["card"],
      receipt_email: email || undefined,
      metadata: { email: email || "" },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (err) {
    console.error("[Payments/CreateIntent] error:", err);
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 });
  }
}
