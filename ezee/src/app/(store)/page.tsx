"use client";

import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { banners } from "@/data/banners";
import { testimonials } from "@/data/testimonials";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoriesSection } from "@/components/home/categories-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { FeaturesStrip } from "@/components/home/features-strip";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeader } from "@/components/common/section-header";

export default function HomePage() {
  const featured = products.filter((p) => p.featured && p.active);
  const newArrivals = products.filter((p) => p.newArrival && p.active);
  const bestSellers = products.filter((p) => p.bestSeller && p.active);
  const deals = products.filter((p) => p.discount > 0 && p.active);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 py-6">
      {/* Hero Banner */}
      <BannerCarousel slides={banners} />

      {/* Features Strip */}
      <FeaturesStrip />

      {/* Featured Products */}
      <section>
        <SectionHeader
          title="Featured Products"
          subtitle="Handpicked phones for you"
          href="/shop"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <CategoriesSection categories={categories} />

      {/* New Arrivals */}
      <section>
        <SectionHeader
          title="New Arrivals"
          subtitle="Just dropped — the latest smartphones"
          href="/shop?sort=newest"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section>
        <SectionHeader
          title="Best Sellers"
          subtitle="Top rated and most popular"
          href="/shop?sort=best-selling"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {bestSellers.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Deals */}
      <section>
        <SectionHeader
          title="Hot Deals"
          subtitle="Incredible discounts you won't want to miss"
          href="/shop?deals=true"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {deals.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} />
    </div>
  );
}
