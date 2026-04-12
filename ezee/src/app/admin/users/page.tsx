"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  Package,
  Shield,
  X,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllUsers, getOrders } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import type { UserProfile, Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function load() {
      const [usersData, ordersData] = await Promise.all([
        getAllUsers(),
        getOrders(),
      ]);
      setUsers(usersData);
      setOrders(ordersData);
      setLoading(false);
    }
    load();
  }, []);

  const getUserOrders = (userId: string) => {
    const userOrders = orders.filter((o) => o.userId === userId);
    // Deduplicate by order id
    const seen = new Set<string>();
    return userOrders.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  };

  const getUserPhone = (userId: string) => {
    const userOrders = getUserOrders(userId);
    // Get phone from the most recent order
    if (userOrders.length > 0) return userOrders[0].customerPhone;
    return "";
  };

  const getUserStats = (userId: string) => {
    const userOrders = getUserOrders(userId);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
    return { orderCount: userOrders.length, totalSpent };
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search)) ||
      getUserPhone(u.id).includes(search)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const selectedUserOrders = selectedUser ? getUserOrders(selectedUser.id) : [];
  const selectedUserStats = selectedUser ? getUserStats(selectedUser.id) : { orderCount: 0, totalSpent: 0 };
  const selectedUserPhone = selectedUser ? (selectedUser.phone || getUserPhone(selectedUser.id)) : "";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${users.length} registered users`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border bg-card/80 overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No users found</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_100px_60px] gap-4 px-5 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>User</span>
            <span>Joined</span>
            <span>Orders</span>
            <span>Total Spent</span>
            <span></span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/50">
            {paginated.map((user) => {
              const stats = getUserStats(user.id);
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_140px_100px_60px] gap-3 md:gap-4 items-center px-4 md:px-5 py-3.5 hover:bg-accent/30 transition-colors"
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        {user.role === "admin" && (
                          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] px-1.5 py-0 h-4 border-0 shrink-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Joined - desktop */}
                  <span className="hidden md:block text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>

                  {/* Orders count - desktop */}
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm font-semibold">{stats.orderCount}</span>
                    <span className="text-xs text-muted-foreground">order{stats.orderCount !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Total spent - desktop */}
                  <span className="hidden md:block text-sm font-bold text-primary">
                    {formatPrice(stats.totalSpent)}
                  </span>

                  {/* View button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary"
                    onClick={() => setSelectedUser(user)}
                    aria-label={`View ${user.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground px-2">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {paginated.length} of {filtered.length} users
      </p>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
          {selectedUser && (
            <>
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-primary to-purple-600 px-6 pt-6 pb-8 relative">
                <DialogHeader>
                  <DialogTitle className="text-white text-lg">User Profile</DialogTitle>
                </DialogHeader>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/20 cursor-pointer"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User card overlapping header */}
              <div className="px-6 -mt-5">
                <div className="rounded-xl border bg-card p-4 shadow-lg flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xl font-bold shrink-0 ring-4 ring-card">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base truncate">{selectedUser.name}</h3>
                      {selectedUser.role === "admin" && (
                        <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0 h-5 border-0 shrink-0">
                          <Shield className="h-3 w-3 mr-0.5" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 pt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-3 text-center">
                  <p className="text-xl font-bold text-primary">{selectedUserStats.orderCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Orders</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(selectedUserStats.totalSpent)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Spent</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-sm font-bold truncate">{selectedUserPhone || "—"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Phone</p>
                </div>
              </div>

              {/* Contact details */}
              <div className="px-6 pt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(selectedUser.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              <Separator className="mt-4" />

              {/* Order History */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="flex items-center gap-2 py-3 sticky top-0 bg-background dark:bg-zinc-800 z-10">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Order History</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{selectedUserOrders.length}</Badge>
                </div>

                {selectedUserOrders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No orders yet</p>
                    <p className="text-xs mt-1">This user hasn&apos;t placed any orders.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedUserOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border bg-muted/30 dark:bg-muted/10 p-3.5 hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-primary">{order.orderNumber}</span>
                          <Badge className={`${statusColors[order.status] || ""} text-[10px] px-2 py-0 h-5 border-0 capitalize font-semibold`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate mr-2">{item.title} x{item.quantity}</span>
                              <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
