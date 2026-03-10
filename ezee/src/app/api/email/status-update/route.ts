import { NextRequest, NextResponse } from "next/server";
import { sendStatusUpdateEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, orderNumber, status, items, total } = body;

    console.log("[EMAIL] Status update request for:", customerEmail, orderNumber, status);

    if (!customerEmail || !orderNumber || !status) {
      console.error("[EMAIL] Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await sendStatusUpdateEmail({
      customerName,
      customerEmail,
      orderNumber,
      status,
      items,
      total,
    });

    console.log("[EMAIL] Send result:", result);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[EMAIL] Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
