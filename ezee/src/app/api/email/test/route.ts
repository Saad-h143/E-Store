import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET() {
  const result = await sendOrderConfirmationEmail({
    customerName: "Saad Ahmed",
    customerEmail: "saadshafiq1270@gmail.com",
    orderNumber: "TEST-001",
    items: [
      { title: "iPhone 15 Pro Max", price: 159900, quantity: 1 },
      { title: "AirPods Pro 2", price: 24900, quantity: 2 },
    ],
    total: 209700,
    shippingAddress: "123 Test Street, Karachi, Pakistan",
  });

  return NextResponse.json(result);
}
