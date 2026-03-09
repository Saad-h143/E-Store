"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { getAllProducts, getOrders } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-20 mt-1" />
      <Skeleton className="h-3 w-28 mt-1.5" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-3.5">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </td>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-5 py-3.5"><Skeleton className="h-4 w-14" /></td>
    </tr>
  );
}

function LowStockRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, ordersData] = await Promise.all([
          getAllProducts(),
          getOrders(),
        ]);
        setProducts(productsData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const lowStockCount = products.filter((p) => p.stock <= 5 && p.stock > 0).length;
    const revenue = orders.reduce((a, o) => a + o.total, 0);

    return [
      {
        title: "Total Products",
        value: products.length.toString(),
        change: "+2 this month",
        trend: "up" as const,
        icon: Package,
        href: "/admin/products",
        color: "text-blue-600 bg-blue-500/10",
      },
      {
        title: "Total Orders",
        value: orders.length.toString(),
        change: "+3 this week",
        trend: "up" as const,
        icon: ShoppingCart,
        href: "/admin/orders",
        color: "text-emerald-600 bg-emerald-500/10",
      },
      {
        title: "Low Stock Items",
        value: lowStockCount.toString(),
        change: "Needs attention",
        trend: "down" as const,
        icon: AlertTriangle,
        href: "/admin/products",
        color: "text-amber-600 bg-amber-500/10",
      },
      {
        title: "Revenue",
        value: formatPrice(revenue),
        change: "+12% vs last month",
        trend: "up" as const,
        icon: TrendingUp,
        href: "/admin/orders",
        color: "text-purple-600 bg-purple-500/10",
      },
    ];
  }, [products, orders]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.stock <= 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <StatCardSkeleton />
              </motion.div>
            ))
          : stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={stat.href}>
                  <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-5 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.change}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))
                : recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors rounded-lg">
                      <td className="px-5 py-3.5 text-sm font-medium">{order.orderNumber}</td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium">{formatPrice(order.total)}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={`${statusColors[order.status]} border-0 capitalize text-xs`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Low Stock Alert</h2>
          <Link href="/admin/products" className="text-sm text-primary hover:underline">
            Manage inventory
          </Link>
        </div>
        <div className="divide-y">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <LowStockRowSkeleton key={index} />
              ))
            : lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                  </div>
                  <Badge
                    variant={product.stock === 0 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {product.stock === 0 ? "Out of Stock" : `${product.stock} left`}
                  </Badge>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
