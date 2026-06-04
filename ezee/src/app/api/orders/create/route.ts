import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cacheSet, CACHE_KEYS } from "@/lib/cache";

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
    } = body as {
      userId?: string | null;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      items?: OrderItem[];
      total?: number;
      shippingAddress?: string;
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

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        items,
        total,
        shipping_address: address,
      })
      .select()
      .single();

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
