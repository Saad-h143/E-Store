"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileImage,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders, verifyPayment } from "@/lib/supabase/queries";
import { formatPrice } from "@/store/cart-store";
import { toast } from "sonner";
import type { Order } from "@/types";

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const handleFocus = () => loadOrders();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(loadOrders, 30000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [loadOrders]);

  const handleVerify = async (orderId: string, verified: boolean) => {
    setVerifying(orderId);
    try {
      await verifyPayment(orderId, verified);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentVerified: verified } : o))
      );

      const order = orders.find((o) => o.id === orderId);
      if (verified && order) {
        // Send payment verified email
        fetch("/api/email/status-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            orderNumber: order.orderNumber,
            status: "payment_verified",
            items: order.items,
            total: order.total,
          }),
        }).catch(() => {});
      }

      toast.success(verified ? "Payment approved!" : "Payment rejected");
      setSelectedOrder(null);
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setVerifying(null);
    }
  };

  // Stats
  const totalOrders = orders.length;
  const pendingPayments = orders.filter((o) => !o.paymentProof && o.status !== "cancelled").length;
  const uploadedReceipts = orders.filter((o) => o.paymentProof && !o.paymentVerified).length;
  const verifiedPayments = orders.filter((o) => o.paymentVerified).length;

  // Filter
  const filtered = orders
    .filter((o) => o.status !== "cancelled")
    .filter((o) => {
      if (filter === "awaiting") return !o.paymentProof;
      if (filter === "uploaded") return !!o.paymentProof && !o.paymentVerified;
      if (filter === "verified") return !!o.paymentVerified;
      return true;
    })
    .filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve payment receipts</p>
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
          <CreditCard className="h-6 w-6 text-primary" />
          Payments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Review and approve payment receipts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setFilter("all")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 cursor-pointer hover:border-amber-500/30 transition-colors" onClick={() => setFilter("awaiting")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{pendingPayments}</p>
          <p className="text-xs text-muted-foreground">Awaiting Receipt</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 cursor-pointer hover:border-blue-500/30 transition-colors" onClick={() => setFilter("uploaded")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileImage className="h-4 w-4 text-blue-600" />
            </div>
            {uploadedReceipts > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-5 border-0 animate-pulse">
                {uploadedReceipts} new
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-600">{uploadedReceipts}</p>
          <p className="text-xs text-muted-foreground">Needs Review</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => setFilter("verified")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{verifiedPayments}</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
      </div>

      {/* Search & Filter */}
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
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="awaiting">Awaiting Receipt</SelectItem>
            <SelectItem value="uploaded">Needs Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Status</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-muted/40 transition-all duration-200 ${
                    order.paymentProof && !order.paymentVerified ? "bg-blue-500/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-3 text-sm font-medium">{order.orderNumber}</td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    {order.paymentVerified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </Badge>
                    ) : order.paymentProof ? (
                      <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs gap-1 animate-pulse">
                        <FileImage className="h-3 w-3" /> Review Now
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-xs gap-1">
                        <Clock className="h-3 w-3" /> Awaiting
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {order.paymentProof ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
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
        Showing {paginated.length} of {filtered.length} orders
      </p>

      {/* Payment Proof Review Dialog */}
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Review
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Order Info */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-semibold">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-primary">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                <Separator />

                {/* Receipt Image */}
                <div>
                  <p className="text-sm font-semibold mb-2">Payment Receipt</p>
                  {selectedOrder.paymentProof && (
                    <a
                      href={selectedOrder.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <img
                        src={selectedOrder.paymentProof}
                        alt="Payment receipt"
                        className="w-full max-h-[300px] object-contain bg-muted"
                      />
                    </a>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                {selectedOrder.paymentVerified ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 rounded-xl px-4 py-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Payment Already Verified</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      onClick={() => handleVerify(selectedOrder.id, true)}
                      disabled={verifying === selectedOrder.id}
                    >
                      {verifying === selectedOrder.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Payment
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold cursor-pointer"
                      onClick={() => {
                        toast.info("Payment rejected — customer needs to re-upload");
                        setSelectedOrder(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {!selectedOrder.paymentVerified && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Verify that the payment amount matches the order total before approving.</span>
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
