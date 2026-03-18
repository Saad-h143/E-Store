"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { useCartStore, getDiscountedPrice, formatPrice } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();

  const discountedPrice = getDiscountedPrice(product);
  const hasDiscount = product.discount > 0;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart.");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is currently out of stock.");
      return;
    }

    addItem(product);
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/product/${product.slug}`} className="group block h-full">
        <div className="relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer flex flex-col h-full">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                isOutOfStock && "opacity-50 grayscale"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {hasDiscount && !isOutOfStock && (
                <Badge className="bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-lg backdrop-blur-sm">
                  {product.discountType === "percentage"
                    ? `${product.discount}% OFF`
                    : `${formatPrice(product.discount)} OFF`}
                </Badge>
              )}
              {product.newArrival && (
                <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  NEW
                </Badge>
              )}
              {product.bestSeller && (
                <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  BESTSELLER
                </Badge>
              )}
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <Badge variant="destructive" className="text-sm font-bold px-4 py-1.5 rounded-xl">
                  Out of Stock
                </Badge>
              </div>
            )}

            {/* Action Buttons - desktop only overlay on hover */}
            <div className="absolute bottom-0 left-0 right-0 hidden md:block translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-300 p-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 shadow-lg shadow-primary/30 text-xs h-9 font-semibold focus-visible:ring-2 focus-visible:ring-primary/50"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  aria-label={`Add ${product.title} to cart`}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Add to Cart
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 shadow-lg shadow-primary/30 focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={`Quick view ${product.title}`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 sm:p-4 flex flex-col flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
              {product.specs?.["Chip"] || "Smartphone"}
            </p>
            <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2lh]">
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-bold text-primary truncate">
                {formatPrice(discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-muted-foreground line-through truncate">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            {product.stock > 0 && product.stock <= 5 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                Only {product.stock} left!
              </p>
            )}

            {/* Mobile Add to Cart - below price, pushed to bottom */}
            <Button
              size="sm"
              className="mt-auto pt-0 w-full md:hidden rounded-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 shadow-sm text-[11px] h-8 font-semibold flex items-center justify-center"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${product.title} to cart`}
            >
              <ShoppingCart className="h-3 w-3 mr-1" aria-hidden="true" />
              Add to Cart
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
