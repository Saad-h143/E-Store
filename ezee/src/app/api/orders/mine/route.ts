import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS. We still authenticate the caller via their
// Supabase access token, so a user can only ever read their OWN orders
// (matched by account id AND by their verified account email, so guest orders
// placed with the same email before signing up are included).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get the real user — prevents spoofing someone else's email.
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const email = (user.email || "").toLowerCase();
    const filter = email
      ? `user_id.eq.${user.id},customer_email.eq.${email}`
      : `user_id.eq.${user.id}`;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(filter)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Orders/Mine] Query error:", error);
      return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    console.error("[Orders/Mine] Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
