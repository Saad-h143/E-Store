import { NextRequest, NextResponse } from "next/server";
import { products } from "@/data/products";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await new Promise((r) => setTimeout(r, 200));
  return NextResponse.json(product);
}
