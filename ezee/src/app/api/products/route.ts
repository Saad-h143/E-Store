import { NextRequest, NextResponse } from "next/server";
import { products } from "@/data/products";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const deals = searchParams.get("deals") === "true";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;

  let filtered = products.filter((p) => p.active);

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    );
  }

  if (category) {
    const { categories } = await import("@/data/categories");
    const cat = categories.find((c) => c.slug === category);
    if (cat) {
      filtered = filtered.filter((p) => p.categoryId === cat.id);
    }
  }

  if (deals) {
    filtered = filtered.filter((p) => p.discount > 0);
  }

  filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  switch (sort) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "best-selling":
      filtered = filtered.filter((p) => p.bestSeller).concat(filtered.filter((p) => !p.bestSeller));
      break;
    default:
      filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
  }

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));

  return NextResponse.json(filtered);
}
