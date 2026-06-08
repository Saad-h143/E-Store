"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Category } from "@/types";
import { SectionHeader } from "@/components/common/section-header";

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section>
      <SectionHeader
        title="Shop by Brand"
        subtitle="Find your perfect phone from top brands"
        href="/shop"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              href={`/shop?category=${category.slug}`}
              className="group block overflow-hidden rounded-2xl border bg-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
            >
              {/* Logo / image — contained on a light tile so the whole logo shows */}
              <div className="relative aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted p-4">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name + count */}
              <div className="p-2.5 text-center">
                <h3 className="text-xs sm:text-sm font-semibold line-clamp-1">
                  {category.name}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
