"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { getProducts, getCategories, getSubcategories } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import type { Product, Category, Subcategory } from "@/types";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "";
  const initialDeals = searchParams.get("deals") === "true";
  const initialSubcategory = searchParams.get("subcategory") || "";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [sortBy, setSortBy] = useState(initialSort || "featured");
  const [dealsOnly, setDealsOnly] = useState(initialDeals);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;

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

  // Load subcategories when a single category is selected
  useEffect(() => {
    if (selectedCategories.length === 1) {
      const cat = categories.find((c) => c.slug === selectedCategories[0]);
      if (cat) {
        getSubcategories(cat.id).then(setSubcategories);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
      setSelectedSubcategory("");
    }
  }, [selectedCategories, categories]);

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

  // Client-side filtering for multi-category selection and subcategory
  const filtered = products.filter((p) => {
    if (selectedCategories.length > 1) {
      const cat = categories.find((c) => c.id === p.categoryId);
      if (!cat || !selectedCategories.includes(cat.slug)) return false;
    }
    if (selectedSubcategory) {
      const sub = subcategories.find((s) => s.slug === selectedSubcategory);
      if (sub && p.subcategoryId !== sub.id) return false;
    }
    return true;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategories, selectedSubcategory, sortBy, dealsOnly, priceRange]);

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedSubcategory("");
    setPriceRange([0, 200000]);
    setSortBy("featured");
    setDealsOnly(false);
    setCurrentPage(1);
  };

  const activeFilterCount =
    selectedCategories.length +
    (selectedSubcategory ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 200000 ? 1 : 0);

  const FilterContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "space-y-5 px-1" : "space-y-6"}>
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Brand</h4>
        <div className={mobile ? "space-y-1" : "space-y-2.5"}>
          {categoriesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
              ))
            : categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 cursor-pointer group ${
                    mobile
                      ? "min-h-[44px] py-2 px-2 -mx-2 rounded-xl hover:bg-accent/50 active:bg-accent transition-colors"
                      : ""
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.slug)}
                    onCheckedChange={() => toggleCategory(cat.slug)}
                    className={mobile ? "h-5 w-5" : ""}
                  />
                  <span className={`${mobile ? "text-[15px]" : "text-sm"} text-muted-foreground group-hover:text-foreground transition-colors`}>
                    {cat.name}
                  </span>
                  <Badge variant="secondary" className={`ml-auto ${mobile ? "text-xs px-2 py-0.5" : "text-xs"}`}>
                    {cat.productCount}
                  </Badge>
                </label>
              ))}
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">Subcategory</h4>
            <div className={mobile ? "space-y-1" : "space-y-2.5"}>
              <label className={`flex items-center gap-3 cursor-pointer group ${
                mobile ? "min-h-[44px] py-2 px-2 -mx-2 rounded-xl hover:bg-accent/50 active:bg-accent transition-colors" : ""
              }`}>
                <Checkbox
                  checked={!selectedSubcategory}
                  onCheckedChange={() => setSelectedSubcategory("")}
                  className={mobile ? "h-5 w-5" : ""}
                />
                <span className={`${mobile ? "text-[15px]" : "text-sm"} text-muted-foreground group-hover:text-foreground transition-colors`}>
                  All
                </span>
              </label>
              {subcategories.map((sub) => (
                <label key={sub.id} className={`flex items-center gap-3 cursor-pointer group ${
                  mobile ? "min-h-[44px] py-2 px-2 -mx-2 rounded-xl hover:bg-accent/50 active:bg-accent transition-colors" : ""
                }`}>
                  <Checkbox
                    checked={selectedSubcategory === sub.slug}
                    onCheckedChange={() => setSelectedSubcategory(selectedSubcategory === sub.slug ? "" : sub.slug)}
                    className={mobile ? "h-5 w-5" : ""}
                  />
                  <span className={`${mobile ? "text-[15px]" : "text-sm"} text-muted-foreground group-hover:text-foreground transition-colors`}>
                    {sub.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Price Range</h4>
        <div className={mobile ? "px-1" : ""}>
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            min={0}
            max={200000}
            step={1000}
            className="mb-3"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span className={mobile ? "text-sm font-medium bg-accent/60 px-2.5 py-1 rounded-lg" : ""}>{formatPrice(priceRange[0])}</span>
          <span className={mobile ? "text-sm font-medium bg-accent/60 px-2.5 py-1 rounded-lg" : ""}>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Deals Only */}
      <label className={`flex items-center gap-3 cursor-pointer ${
        mobile ? "min-h-[44px] py-2 px-2 -mx-2 rounded-xl hover:bg-accent/50 active:bg-accent transition-colors" : ""
      }`}>
        <Checkbox
          checked={dealsOnly}
          onCheckedChange={(checked) => setDealsOnly(checked === true)}
          className={mobile ? "h-5 w-5" : ""}
        />
        <span className={`${mobile ? "text-[15px]" : "text-sm"} font-medium`}>Deals & Offers Only</span>
      </label>

      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button
            variant="outline"
            size={mobile ? "default" : "sm"}
            className={`w-full cursor-pointer ${mobile ? "h-12 rounded-xl text-sm font-medium" : ""}`}
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Shop</h1>
        <p className="text-muted-foreground mt-1">
          Browse our collection of premium smartphones
        </p>
      </div>

      {/* Search + Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-background/60 backdrop-blur-sm w-full"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 min-w-0">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[180px] h-11 rounded-xl shrink-0">
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
            <SheetContent side="left" className="w-[min(85vw,340px)] p-0 flex flex-col">
              <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg">Filters</SheetTitle>
                  {activeFilterCount > 0 && (
                    <Badge className="text-xs">{activeFilterCount} active</Badge>
                  )}
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                <FilterContent mobile />
              </div>
              {activeFilterCount > 0 && (
                <div className="shrink-0 border-t border-border/50 p-4 bg-background/95 backdrop-blur-sm">
                  <Button
                    className="w-full h-12 rounded-xl font-semibold cursor-pointer bg-gradient-to-r from-primary to-purple-600 text-white"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    Show {filtered.length} Result{filtered.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategories.length > 0 || selectedSubcategory || dealsOnly) && (
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
          {selectedSubcategory && (
            <Badge
              variant="secondary"
              className="pl-3 pr-1 py-1 rounded-lg cursor-pointer"
              onClick={() => setSelectedSubcategory("")}
            >
              {subcategories.find((s) => s.slug === selectedSubcategory)?.name || selectedSubcategory}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
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
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-20 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-primary to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">Filters</h3>
                {activeFilterCount > 0 && (
                  <Badge className="bg-white/20 text-white text-[10px] font-bold border-0 backdrop-blur-sm">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-5">
              <FilterContent />
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading products..."
                : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            {!loading && filtered.length > PRODUCTS_PER_PAGE && (
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {Math.ceil(filtered.length / PRODUCTS_PER_PAGE)}
              </p>
            )}
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                {filtered
                  .slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)
                  .map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
              </div>

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="mt-10 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-1.5 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl cursor-pointer"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      aria-label="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl cursor-pointer"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: Math.ceil(filtered.length / PRODUCTS_PER_PAGE) }).map((_, i) => {
                      const page = i + 1;
                      const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="icon"
                            className={`h-9 w-9 rounded-xl text-xs font-semibold cursor-pointer ${
                              currentPage === page
                                ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/20"
                                : ""
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      }
                      // Show dots
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-1 text-xs text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl cursor-pointer"
                      disabled={currentPage === Math.ceil(filtered.length / PRODUCTS_PER_PAGE)}
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filtered.length / PRODUCTS_PER_PAGE), p + 1))}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl cursor-pointer"
                      disabled={currentPage === Math.ceil(filtered.length / PRODUCTS_PER_PAGE)}
                      onClick={() => setCurrentPage(Math.ceil(filtered.length / PRODUCTS_PER_PAGE))}
                      aria-label="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters} className="cursor-pointer">
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
