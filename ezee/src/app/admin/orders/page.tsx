"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders, updateOrderStatus } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import { toast } from "sonner";
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const allStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState<{
    orderId: string;
    orderNumber: string;
    currentStatus: string;
    newStatus: Order["status"];
  } | null>(null);

  const loadOrders = useCallback(async () => {
    const data = await getOrders();
    setOrderList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orderList.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    // Optimistic — update UI first
    const prevStatus = orderList.find((o) => o.id === orderId)?.status;
    setOrderList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    const order = orderList.find((o) => o.id === orderId);
    toast.success(`Order ${order?.orderNumber || orderId} updated to ${newStatus}`);

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch {
      // Revert on failure
      if (prevStatus) {
        setOrderList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: prevStatus } : o))
        );
      }
      toast.error("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage customer orders</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
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
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-muted/40 transition-all duration-200"
                >
                  <td className="px-5 py-3 text-sm font-medium">{order.orderNumber}</td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        setPendingStatus({
                          orderId: order.id,
                          orderNumber: order.orderNumber,
                          currentStatus: order.status,
                          newStatus: v as Order["status"],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px] rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                        <Badge className={`${statusColors[order.status]} border-0 capitalize text-xs`}>
                          {order.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-50">
                        {allStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize cursor-pointer">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Order {order.orderNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>Customer:</strong> {order.customerName}
                            </p>
                            <p>
                              <strong>Email:</strong> {order.customerEmail}
                            </p>
                            <p>
                              <strong>Phone:</strong> {order.customerPhone}
                            </p>
                            <p>
                              <strong>Address:</strong> {order.shippingAddress}
                            </p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>
                                  {item.title} x {item.quantity}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {orderList.length} orders
      </p>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Change order {pendingStatus?.orderNumber} from{" "}
              {pendingStatus?.currentStatus} to {pendingStatus?.newStatus}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatus) {
                  handleUpdateStatus(pendingStatus.orderId, pendingStatus.newStatus);
                  setPendingStatus(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
