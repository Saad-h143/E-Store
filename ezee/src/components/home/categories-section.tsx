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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              href={`/shop?category=${category.slug}`}
              className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 transition-all hover:bg-card/80 hover:backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 cursor-pointer"
            >
              <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="80px"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {category.productCount} products
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
