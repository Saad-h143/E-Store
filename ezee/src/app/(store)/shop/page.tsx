"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/common/product-skeleton";
import { getProducts, getCategories } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import type { Product, Category } from "@/types";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "";
  const initialDeals = searchParams.get("deals") === "true";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [sortBy, setSortBy] = useState(initialSort || "featured");
  const [dealsOnly, setDealsOnly] = useState(initialDeals);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Debounce timer ref for search input
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  // Load categories once on mount
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setCategoriesLoading(true);
      const data = await getCategories();
      if (!cancelled) {
        setCategories(data);
        setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load products whenever filters change
  const loadProducts = useCallback(async () => {
    setLoading(true);

    // When a single category is selected, let Supabase filter it.
    // When multiple are selected, we fetch all and filter client-side.
    const singleCategory =
      selectedCategories.length === 1 ? selectedCategories[0] : undefined;

    const data = await getProducts({
      search: debouncedSearch || undefined,
      category: singleCategory,
      sort: sortBy,
      deals: dealsOnly || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
    });

    setProducts(data);
    setLoading(false);
  }, [debouncedSearch, selectedCategories, sortBy, dealsOnly, priceRange]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Client-side filtering for multi-category selection
  const filtered =
    selectedCategories.length > 1
      ? products.filter((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          return cat && selectedCategories.includes(cat.slug);
        })
      : products;

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setPriceRange([0, 200000]);
    setSortBy("featured");
    setDealsOnly(false);
  };

  const activeFilterCount =
    selectedCategories.length +
    (dealsOnly ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 200000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Brand</h4>
        <div className="space-y-2.5">
          {categoriesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
              ))
            : categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.slug)}
                    onCheckedChange={() => toggleCategory(cat.slug)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {cat.name}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {cat.productCount}
                  </Badge>
                </label>
              ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          min={0}
          max={200000}
          step={5000}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Deals Only */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <Checkbox
          checked={dealsOnly}
          onCheckedChange={(checked) => setDealsOnly(checked === true)}
        />
        <span className="text-sm font-medium">Deals & Offers Only</span>
      </label>

      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="text-muted-foreground mt-1">
          Browse our collection of premium smartphones
        </p>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="best-selling">Best Selling</SelectItem>
              <SelectItem value="discount">Biggest Discount</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Toggle */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden h-11 rounded-xl relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategories.length > 0 || dealsOnly) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategories.map((slug) => {
            const cat = categories.find((c) => c.slug === slug);
            return (
              <Badge
                key={slug}
                variant="secondary"
                className="pl-3 pr-1 py-1 rounded-lg cursor-pointer"
                onClick={() => toggleCategory(slug)}
              >
                {cat?.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
          {dealsOnly && (
            <Badge
              variant="secondary"
              className="pl-3 pr-1 py-1 rounded-lg cursor-pointer"
              onClick={() => setDealsOnly(false)}
            >
              Deals Only
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 rounded-2xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Filters</h3>
            <FilterContent />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading products..."
                : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <ProductGridSkeleton count={8} />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
