"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/product-card";
import { getProductBySlug, getProducts, getCategories } from "@/lib/supabase/queries";
import { useCartStore, getDiscountedPrice, formatPrice } from "@/store/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

export function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const p = await getProductBySlug(slug);
      setProduct(p);

      if (p) {
        const [cats, related] = await Promise.all([
          getCategories(),
          getProducts({ category: undefined, limit: 5 }),
        ]);
        const cat = cats.find((c) => c.id === p.categoryId) || null;
        setCategory(cat);
        setRelatedProducts(
          related.filter((r) => r.categoryId === p.categoryId && r.id !== p.id).slice(0, 4)
        );
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const discountedPrice = getDiscountedPrice(product);
  const hasDiscount = product.discount > 0;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    toast.success(`${product.title} added to cart!`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    window.location.href = "/cart";
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto no-scrollbar min-w-0">
        <Link href="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <Link href="/shop" className="hover:text-foreground transition-colors shrink-0">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        {category && (
          <>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-foreground transition-colors shrink-0">
              {category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          </>
        )}
        <span className="text-foreground font-medium truncate min-w-0">{product.title}</span>
      </nav>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted/50">
            <Image
              src={product.images[selectedImage] || "/placeholder.png"}
              alt={product.title}
              fill
              className={cn("object-cover", isOutOfStock && "opacity-50 grayscale")}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {hasDiscount && !isOutOfStock && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white font-bold px-3 py-1 text-sm rounded-xl shadow-lg">
                  {product.discountType === "percentage" ? `${product.discount}% OFF` : `${formatPrice(product.discount)} OFF`}
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="destructive" className="font-bold px-3 py-1 text-sm rounded-xl">Out of Stock</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {product.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                  selectedImage === index ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            {category && <p className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2 uppercase tracking-wider">{category.name}</p>}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{product.title}</h1>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.0) 128 reviews</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap min-w-0">
            <span className="text-2xl sm:text-4xl font-bold text-primary">{formatPrice(discountedPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-sm sm:text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold">
                  Save {formatPrice(product.price - discountedPrice)}
                </Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">This product is currently out of stock</span>
            </div>
          ) : product.stock <= 5 ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Hurry! Only {product.stock} left in stock</span>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center rounded-xl border">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-l-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-r-xl" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button size="lg" className="flex-1 h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white" disabled={isOutOfStock} onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
              <Button size="lg" variant="secondary" className="flex-1 h-12 rounded-xl text-sm font-semibold" disabled={isOutOfStock} onClick={handleBuyNow}>
                Buy Now
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">1 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">7 Day Returns</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="specs">
          <TabsList className="w-full justify-start rounded-xl h-12 p-1 bg-muted/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="specs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm shrink-0">Specifications</TabsTrigger>
            <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm shrink-0">Description</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm shrink-0">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="specs" className="mt-6">
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                {Object.entries(product.specs).map(([key, value], index) => (
                  <div key={key} className={cn("flex items-start px-4 sm:px-6 py-3 sm:py-4 gap-3", index % 2 === 0 ? "bg-muted/30" : "bg-background")}>
                    <span className="w-28 sm:w-40 shrink-0 text-xs sm:text-sm font-medium text-muted-foreground">{key}</span>
                    <span className="text-xs sm:text-sm min-w-0 break-words">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="description" className="mt-6">
            <div className="rounded-2xl border bg-card p-6">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
