"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAllProducts,
  getCategories,
  updateProduct,
  deleteProduct as deleteProductFromDb,
  getProductSalesMap,
} from "@/lib/supabase/queries";
import type { Product, Category } from "@/types";
import { formatPrice } from "@/store/cart-store";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [productList, setProductList] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; title: string; currentActive: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState<string | null>(null);
  const [salesMap, setSalesMap] = useState<Record<string, { totalSold: number; totalRevenue: number; orders: { orderNumber: string; customerName: string; quantity: number; date: string; status: string }[] }>>({});
  const [salesProductId, setSalesProductId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [products, categories, sales] = await Promise.all([
        getAllProducts(),
        getCategories(),
        getProductSalesMap(),
      ]);
      setProductList(products);
      setCategoryList(categories);
      setSalesMap(sales);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refetch when tab/window regains focus (e.g., after editing a product)
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData]);

  const filtered = productList.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    // Optimistic update — change UI instantly
    setProductList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
    );
    toast.success(currentActive ? "Product deactivated" : "Product activated");

    try {
      await updateProduct(id, { active: !currentActive });
    } catch (error) {
      // Revert on failure
      console.error("Failed to update product:", error);
      setProductList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: currentActive } : p))
      );
      toast.error("Failed to update product status");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Optimistic delete — remove from UI instantly
    const backup = productList;
    setProductList((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    toast.success("Product deleted");

    try {
      await deleteProductFromDb(id);
    } catch (error) {
      // Revert on failure
      console.error("Failed to delete product:", error);
      setProductList(backup);
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product inventory
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryList.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sold
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((product, index) => {
                const cat = categoryList.find((c) => c.id === product.categoryId);
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/40 transition-all duration-200"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{cat?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3">
                      {product.discount > 0 ? (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-0 text-xs">
                          {product.discount}% OFF
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={product.stock === 0 ? "destructive" : product.stock <= 5 ? "secondary" : "secondary"}
                        className={`text-xs ${product.stock <= 5 && product.stock > 0 ? "bg-amber-500/10 text-amber-600 border-0" : ""}`}
                      >
                        {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {salesMap[product.id]?.totalSold ? (
                        <button
                          onClick={() => setSalesProductId(product.id)}
                          className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          {salesMap[product.id].totalSold}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={`text-xs border-0 ${
                          product.active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={mutating === product.id}
                          onClick={() => setPendingToggle({ id: product.id, title: product.title, currentActive: product.active })}
                          title={product.active ? "Deactivate" : "Activate"}
                        >
                          {mutating === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : product.active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/admin/products/new?edit=${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Dialog
                          open={deleteId === product.id}
                          onOpenChange={(open) => !open && setDeleteId(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Product</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete &quot;{product.title}&quot;? This
                                action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteId(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={mutating === product.id}
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                {mutating === product.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground px-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {paginated.length} of {filtered.length} products
      </p>

      {/* Activate/Deactivate Confirmation */}
      <AlertDialog
        open={pendingToggle !== null}
        onOpenChange={(open) => { if (!open) setPendingToggle(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.currentActive ? "Deactivate Product?" : "Activate Product?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.currentActive
                ? `"${pendingToggle?.title}" will be hidden from customers and no longer available for purchase.`
                : `"${pendingToggle?.title}" will be visible to customers and available for purchase.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingToggle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={pendingToggle?.currentActive ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
              onClick={() => {
                if (pendingToggle) {
                  toggleActive(pendingToggle.id, pendingToggle.currentActive);
                  setPendingToggle(null);
                }
              }}
            >
              {pendingToggle?.currentActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sales History Dialog */}
      <Dialog open={salesProductId !== null} onOpenChange={(open) => { if (!open) setSalesProductId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sales History
            </DialogTitle>
            <DialogDescription>
              {productList.find((p) => p.id === salesProductId)?.title}
            </DialogDescription>
          </DialogHeader>
          {salesProductId && salesMap[salesProductId] && (
            <div className="space-y-4 mt-2">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary/10 p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{salesMap[salesProductId].totalSold}</p>
                  <p className="text-xs text-muted-foreground mt-1">Units Sold</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{formatPrice(salesMap[salesProductId].totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
                </div>
              </div>

              {/* Order history list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <p className="text-sm font-medium text-muted-foreground">Recent Orders</p>
                {salesMap[salesProductId].orders.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{sale.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">x{sale.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
