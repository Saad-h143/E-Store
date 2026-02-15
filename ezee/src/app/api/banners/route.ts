import { NextResponse } from "next/server";
import { banners } from "@/data/banners";

export async function GET() {
  await new Promise((r) => setTimeout(r, 200));
  return NextResponse.json(banners);
}
