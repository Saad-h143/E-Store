import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/supabase/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ezeeparts.online";

export const revalidate = 3600; // regenerate at most hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Add every product and category page so Google can discover them.
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    dynamicRoutes = [
      ...products.map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...categories.map((c) => ({
        url: `${SITE_URL}/shop?category=${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // If the data fetch fails, still return the static routes.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
