import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationWhatsApp, sendStatusUpdateWhatsApp, sendAdminOrderAlert } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "order-confirmation") {
      const { customerName, customerPhone, customerEmail, orderNumber, items, total, shippingAddress } = body;

      if (!customerPhone || !orderNumber) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      console.log("[WhatsApp] Sending order confirmation to:", customerPhone);

      // Send to customer + admin in parallel
      const [customerResult] = await Promise.all([
        sendOrderConfirmationWhatsApp({
          customerName,
          customerPhone,
          orderNumber,
          items,
          total,
          shippingAddress,
        }),
        // Send admin alert to your personal WhatsApp
        sendAdminOrderAlert({
          customerName,
          customerPhone,
          customerEmail: customerEmail || "",
          orderNumber,
          items,
          total,
          shippingAddress,
        }).catch((err) => console.error("[WhatsApp] Admin alert failed:", err)),
      ]);

      return NextResponse.json(customerResult);
    }

    if (type === "status-update") {
      const { customerName, customerPhone, orderNumber, status, items, total } = body;

      if (!customerPhone || !orderNumber || !status) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      console.log("[WhatsApp] Sending status update to:", customerPhone, status);
      const result = await sendStatusUpdateWhatsApp({
        customerName,
        customerPhone,
        orderNumber,
        status,
        items,
        total,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("[WhatsApp] Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
