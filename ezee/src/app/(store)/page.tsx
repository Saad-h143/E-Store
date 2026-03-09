"use client";

import { useEffect, useState } from "react";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CategoriesSection } from "@/components/home/categories-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { FeaturesStrip } from "@/components/home/features-strip";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeader } from "@/components/common/section-header";
import { ProductGridSkeleton, BannerSkeleton } from "@/components/common/product-skeleton";
import { getProducts, getCategories, getBanners } from "@/lib/supabase/queries";
import { testimonials } from "@/data/testimonials";
import type { Product, Category, BannerSlide } from "@/types";

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [featuredData, newData, bestData, dealsData, catsData, bannersData] =
        await Promise.all([
          getProducts({ featured: true, limit: 4 }),
          getProducts({ newArrival: true, sort: "newest", limit: 4 }),
          getProducts({ bestSeller: true, limit: 4 }),
          getProducts({ deals: true, sort: "discount", limit: 4 }),
          getCategories(),
          getBanners(),
        ]);
      setFeatured(featuredData);
      setNewArrivals(newData);
      setBestSellers(bestData);
      setDeals(dealsData);
      setCategories(catsData);
      setBanners(bannersData);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-20">
      {/* Banner — full-width, behind transparent navbar */}
      {loading ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24">
          <BannerSkeleton />
        </div>
      ) : (
        banners.length > 0 && <BannerCarousel slides={banners} />
      )}

      {/* All other sections in container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20 pb-8">
        <FeaturesStrip />

        <section>
          <SectionHeader title="Featured Products" subtitle="Handpicked phones for you" href="/shop" />
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </section>

        {categories.length > 0 && <CategoriesSection categories={categories} />}

        <section>
          <SectionHeader title="New Arrivals" subtitle="Just dropped — the latest smartphones" href="/shop?sort=newest" />
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Best Sellers" subtitle="Top rated and most popular" href="/shop?sort=best-selling" />
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Hot Deals" subtitle="Incredible discounts you won't want to miss" href="/shop?deals=true" />
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {deals.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </section>

        <TestimonialsSection testimonials={testimonials} />
      </div>
    </div>
  );
}
