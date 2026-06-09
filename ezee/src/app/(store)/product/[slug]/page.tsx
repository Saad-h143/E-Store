import type { Metadata } from "next";
import { cache } from "react";
import { getProductBySlug } from "@/lib/supabase/queries";
import { ProductDetail } from "@/components/product/product-detail";
import type { Product } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ezeeparts.online";

// Dedupe the fetch so generateMetadata + the page share one request.
const loadProduct = cache((slug: string) => getProductBySlug(slug));

function discountedPrice(p: Product): number {
  if (!p.discount || p.discount <= 0) return p.price;
  if (p.discountType === "percentage") return Math.round(p.price * (1 - p.discount / 100));
  return Math.max(0, p.price - p.discount);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = (
    product.description ||
    `Buy ${product.title} at Ezee Parts — authentic, tested before dispatch, with fast shipping across Europe.`
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const image = product.images?.[0];

  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: `${product.title} | Ezee Parts`,
      description,
      url: `${SITE_URL}/product/${slug}`,
      type: "website",
      siteName: "Ezee Parts",
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  // Product structured data so Google can show price/availability in results.
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description || undefined,
        image: product.images?.length ? product.images : undefined,
        sku: product.id,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${slug}`,
          priceCurrency: "EUR",
          price: discountedPrice(product).toFixed(2),
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail slug={slug} />
    </>
  );
}
