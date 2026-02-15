import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/data/orders";

const memoryOrders = [...orders];

export async function GET() {
  await new Promise((r) => setTimeout(r, 300));
  return NextResponse.json(memoryOrders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newOrder = {
    id: `ORD-${String(memoryOrders.length + 1).padStart(3, "0")}`,
    ...body,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  memoryOrders.unshift(newOrder);
  await new Promise((r) => setTimeout(r, 500));

  return NextResponse.json(newOrder, { status: 201 });
}
