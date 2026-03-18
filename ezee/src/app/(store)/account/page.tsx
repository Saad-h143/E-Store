"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Shield, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { getUserOrders } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import Link from "next/link";
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (user) {
        const data = await getUserOrders(user.id);
        setUserOrders(data);
      }
      setOrdersLoading(false);
    }
    loadOrders();
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Please Login</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your account.</p>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8 gradient-text">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold">{user.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role === "admin" ? "Administrator" : "Customer"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</span>
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full rounded-xl text-destructive hover:text-destructive"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          id="orders"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 scroll-mt-20"
        >
          <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">My Orders</h2>
            </div>

            {userOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border p-4 space-y-3 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold">{order.orderNumber}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={`${statusColors[order.status]} border-0 capitalize font-semibold`}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.title} x {item.quantity}
                          </span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
