import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cacheSet, CACHE_KEYS } from "@/lib/cache";
import { stripe } from "@/lib/stripe";

// Service-role client: bypasses RLS so guest orders (user_id = null) can be
// inserted and read back. Never expose this key to the browser.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      shippingAddress,
      paymentMethod,
      paymentIntentId,
    } = body as {
      userId?: string | null;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      items?: OrderItem[];
      total?: number;
      shippingAddress?: string;
      paymentMethod?: "card" | "cod";
      paymentIntentId?: string;
    };

    // --- Server-side validation (do not trust the client) ---
    const name = (customerName || "").trim();
    const email = (customerEmail || "").trim().toLowerCase();
    const phone = (customerPhone || "").trim();
    const address = (shippingAddress || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    if (!address) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (typeof total !== "number" || !Number.isFinite(total) || total < 0) {
      return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
    }

    const method: "card" | "cod" = paymentMethod === "card" ? "card" : "cod";

    // For card orders, verify the payment actually succeeded with Stripe and
    // that the amount paid matches the order total — never trust the client.
    let paymentVerified = false;
    if (method === "card") {
      if (!paymentIntentId) {
        return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
      }
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== "succeeded") {
          return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
        }
        if (intent.amount_received !== Math.round(total * 100)) {
          return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
        }
        paymentVerified = true;
      } catch (err) {
        console.error("[Orders/Create] Stripe verify error:", err);
        return NextResponse.json({ error: "Could not verify payment" }, { status: 400 });
      }
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const baseRow = {
      order_number: orderNumber,
      user_id: userId || null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      items,
      total,
      shipping_address: address,
    };
    const paymentRow = {
      payment_method: method,
      payment_intent_id: method === "card" ? paymentIntentId : null,
      payment_verified: paymentVerified,
    };

    let { data, error } = await supabase
      .from("orders")
      .insert({ ...baseRow, ...paymentRow })
      .select()
      .single();

    // Safety net: if the payment columns haven't been migrated yet, don't lose a
    // successful charge — retry without them. (Run stripe_payments.sql to fix.)
    if (error && /payment_method|payment_intent_id|payment_verified/i.test(error.message || "")) {
      console.warn(
        "[Orders/Create] Payment columns missing — run stripe_payments.sql. Saving order without them."
      );
      ({ data, error } = await supabase
        .from("orders")
        .insert(baseRow)
        .select()
        .single());
    }

    if (error) {
      console.error("[Orders/Create] Insert error:", error);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Invalidate the shared orders cache so admin sees the new order.
    cacheSet(CACHE_KEYS.ORDERS, null, 0);

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("[Orders/Create] Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
