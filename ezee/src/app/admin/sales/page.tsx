"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, Search, TrendingUp, Package, DollarSign, ShoppingCart } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllProducts, getOrders } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import type { Product, Order } from "@/types";

interface SaleRecord {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  status: string;
}

interface ProductSales {
  product: Product;
  totalSold: number;
  totalRevenue: number;
  sales: SaleRecord[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminSalesPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sold");
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductSales | null>(null);
  const [totals, setTotals] = useState({ totalOrders: 0, totalRevenue: 0, totalUnitsSold: 0, avgOrderValue: 0 });

  const loadData = useCallback(async () => {
    try {
      const [products, orders] = await Promise.all([getAllProducts(), getOrders()]);

      // Build sales map
      const salesMap: Record<string, { totalSold: number; totalRevenue: number; sales: SaleRecord[] }> = {};

      let totalOrders = 0;
      let totalRevenue = 0;
      let totalUnitsSold = 0;

      for (const order of orders) {
        if (order.status === "cancelled") continue;
        totalOrders++;
        totalRevenue += order.total;

        for (const item of order.items) {
          const pid = item.productId;
          if (!pid) continue;
          if (!salesMap[pid]) {
            salesMap[pid] = { totalSold: 0, totalRevenue: 0, sales: [] };
          }
          salesMap[pid].totalSold += item.quantity;
          salesMap[pid].totalRevenue += item.price * item.quantity;
          totalUnitsSold += item.quantity;
          salesMap[pid].sales.push({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
            date: order.createdAt,
            status: order.status,
          });
        }
      }

      // Merge with products
      const merged: ProductSales[] = products.map((product) => ({
        product,
        totalSold: salesMap[product.id]?.totalSold || 0,
        totalRevenue: salesMap[product.id]?.totalRevenue || 0,
        sales: salesMap[product.id]?.sales || [],
      }));

      setProductSales(merged);
      setTotals({
        totalOrders,
        totalRevenue,
        totalUnitsSold,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      });
    } catch (err) {
      console.error("Failed to load sales data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = productSales
    .filter((ps) => ps.product.title.toLowerCase().includes(search.toLowerCase()))
    .filter((ps) => ps.totalSold > 0)
    .sort((a, b) => {
      switch (sortBy) {
        case "sold": return b.totalSold - a.totalSold;
        case "revenue": return b.totalRevenue - a.totalRevenue;
        case "name": return a.product.title.localeCompare(b.product.title);
        default: return 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground text-sm mt-1">Track product sales and revenue</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Sales History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track product sales and revenue</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totals.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatPrice(totals.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totals.totalUnitsSold}</p>
          <p className="text-xs text-muted-foreground">Units Sold</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatPrice(totals.avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground">Avg Order Value</p>
        </div>
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sold">Most Sold</SelectItem>
            <SelectItem value="revenue">Highest Revenue</SelectItem>
            <SelectItem value="name">Product Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Sales Table */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Units Sold</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Left</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((ps, index) => (
                <motion.tr
                  key={ps.product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-muted/40 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedProduct(ps)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                        {ps.product.images[0] && (
                          <img src={ps.product.images[0]} alt={ps.product.title} className="object-cover w-full h-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ps.product.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm">{formatPrice(ps.product.price)}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-primary">{ps.totalSold}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-emerald-600">{formatPrice(ps.totalRevenue)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      className={`text-xs border-0 ${
                        ps.product.stock === 0
                          ? "bg-red-500/10 text-red-600"
                          : ps.product.stock <= 5
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ps.product.stock === 0 ? "Out of Stock" : `${ps.product.stock} units`}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No sales data yet</p>
            <p className="text-xs mt-1">Sales will appear here when orders are placed</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} products with sales (cancelled orders excluded)
      </p>

      {/* Sales Detail Dialog */}
      <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {selectedProduct.product.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selectedProduct.totalSold}</p>
                    <p className="text-[11px] text-muted-foreground">Sold</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{formatPrice(selectedProduct.totalRevenue)}</p>
                    <p className="text-[11px] text-muted-foreground">Revenue</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 text-center">
                    <p className="text-xl font-bold">{selectedProduct.product.stock}</p>
                    <p className="text-[11px] text-muted-foreground">In Stock</p>
                  </div>
                </div>

                <Separator />

                {/* Individual sales */}
                <div>
                  <p className="text-sm font-semibold mb-3">Order History ({selectedProduct.sales.length})</p>
                  <div className="space-y-2">
                    {selectedProduct.sales.map((sale, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{sale.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">{sale.customerEmail}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <Badge className={`${statusColors[sale.status] || ""} border-0 text-[10px] capitalize`}>
                            {sale.status}
                          </Badge>
                          <p className="text-sm font-bold">{formatPrice(sale.total)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            x{sale.quantity} · {new Date(sale.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
