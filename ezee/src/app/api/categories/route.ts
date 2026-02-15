import { NextResponse } from "next/server";
import { categories } from "@/data/categories";

export async function GET() {
  await new Promise((r) => setTimeout(r, 200));
  return NextResponse.json(categories);
}
