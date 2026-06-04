"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore, getDiscountedPrice, formatPrice } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { createOrder } from "@/lib/supabase/queries";
import { BankTransferDetails } from "@/components/common/payment-details";
import { toast } from "sonner";
import { useLanguageStore } from "@/store/language-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CartPage() {
  const { t } = useLanguageStore();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; total: number; email: string } | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const total = getTotal();
  const shipping = total > 25000 ? 0 : 499;
  const grandTotal = total + shipping;

  const handleCheckout = async () => {
    // Logged-in users reuse their account name/email; guests provide their own.
    const customerName = (user?.name || shippingInfo.name).trim();
    const customerEmail = (user?.email || shippingInfo.email).trim();

    if (!customerName) {
      toast.error(t.cart.nameRequired);
      return;
    }
    if (!EMAIL_RE.test(customerEmail)) {
      toast.error(t.cart.emailInvalid);
      return;
    }
    if (!shippingInfo.phone.trim()) {
      toast.error(t.cart.phoneRequired);
      return;
    }
    if (!shippingInfo.address.trim()) {
      toast.error(t.cart.addressRequired);
      return;
    }

    setPlacingOrder(true);

    const orderItems = items.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      price: getDiscountedPrice(item.product),
      quantity: item.quantity,
      image: item.product.images[0] || "",
    }));

    try {
      const order = await createOrder({
        userId: user?.id ?? null,
        customerName,
        customerEmail,
        customerPhone: shippingInfo.phone,
        items: orderItems,
        total: grandTotal,
        shippingAddress: shippingInfo.address,
      });

      // Send email + WhatsApp in background (fire-and-forget)
      const orderNum = order.orderNumber || order.id;
      fetch("/api/email/order-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone: shippingInfo.phone,
          orderNumber: orderNum,
          items: orderItems,
          total: grandTotal,
          shippingAddress: shippingInfo.address,
        }),
      }).catch(() => {});

      fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order-confirmation",
          customerName,
          customerEmail,
          customerPhone: shippingInfo.phone,
          orderNumber: orderNum,
          items: orderItems,
          total: grandTotal,
          shippingAddress: shippingInfo.address,
        }),
      }).catch(() => {});

      clearCart();
      setOrderSuccess({ orderNumber: orderNum, total: grandTotal, email: customerEmail });
    } catch (err) {
      console.error("Order error:", err);
      toast.error(t.cart.orderFailed);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0 && orderSuccess) {
    return (
      <Dialog open onOpenChange={(open) => {
        if (!open) {
          setOrderSuccess(null);
          if (user?.role === "admin") {
            router.push("/admin/orders");
          } else if (user) {
            router.push("/account#orders");
          } else {
            router.push("/shop");
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-emerald-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="text-lg font-bold text-primary mt-1">{orderSuccess.orderNumber}</p>
              <p className="text-sm font-semibold mt-1">Total: {formatPrice(orderSuccess.total)}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thank you for your order! To process and dispatch your order, please transfer the payment to the bank account below and upload your payment receipt.
            </p>
            <BankTransferDetails />
            {!user && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs text-muted-foreground">
                  A confirmation was sent to <strong className="text-foreground">{orderSuccess.email}</strong>.
                  Create an account with this email to track this and all your orders.
                </p>
              </div>
            )}
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl cursor-pointer" onClick={() => { setOrderSuccess(null); router.push(user?.role === "admin" ? "/admin/orders" : user ? "/account#orders" : "/register"); }}>
                {user ? "View My Orders" : "Track My Order"}
              </Button>
              <Button className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white cursor-pointer" onClick={() => { setOrderSuccess(null); router.push("/shop"); }}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center"
        >
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.cart.empty}</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t.cart.emptyText}
          </p>
          <Link href="/shop">
            <Button size="lg" className="rounded-xl">
              {t.cart.continueShopping}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8 gradient-text">{t.cart.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => {
              const price = getDiscountedPrice(item.product);
              return (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 rounded-2xl border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden shrink-0"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1 hover:text-primary transition-colors">
                        {item.product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.product.specs?.["Storage"]} | {item.product.specs?.["RAM"]}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-primary">{formatPrice(price)}</span>
                      {item.product.discount > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.product.price)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-lg border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              Math.min(item.product.stock, item.quantity + 1)
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          removeItem(item.product.id);
                          toast.success(t.cart.itemRemoved);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="flex justify-between">
            <Link href="/shop">
              <Button variant="outline" className="rounded-xl">
                {t.cart.continueShopping}
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive rounded-xl"
              onClick={() => {
                clearCart();
                toast.success(t.cart.cartCleared);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t.cart.clearCart}
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-20 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 space-y-4 overflow-hidden relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-primary before:to-purple-600">
            <h2 className="text-lg font-bold">{t.cart.orderSummary}</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.cart.subtotal} ({items.reduce((a, b) => a + b.quantity, 0)} {t.cart.items})
                </span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.cart.shipping}</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-600">{t.cart.free}</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.cart.freeShippingAbove.replace("{price}", formatPrice(25000))}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>{t.cart.total}</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>

            <div className="space-y-3">
              <Separator />
              <h3 className="font-semibold text-sm">{t.cart.shippingDetails}</h3>

              {/* Guests provide name + email; logged-in users reuse their account. */}
              {!isAuthenticated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs">{t.cart.fullName} *</Label>
                    <Input
                      id="name"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo((p) => ({ ...p, name: e.target.value }))}
                      placeholder={t.cart.fullNamePlaceholder}
                      className="h-9 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">{t.cart.emailAddress} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo((p) => ({ ...p, email: e.target.value }))}
                      placeholder={t.cart.emailPlaceholder}
                      className="h-9 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs">{t.cart.phoneNumber} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={t.cart.phonePlaceholder}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs">{t.cart.shippingAddress} *</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo((p) => ({ ...p, address: e.target.value }))}
                  placeholder={t.cart.addressPlaceholder}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
            </div>

            {!isAuthenticated && (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2.5 rounded-xl border border-dashed text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t.cart.guestCheckoutNote.split("{link}")[0]}
                  <Link href="/login" className="text-primary font-medium underline underline-offset-2">
                    {t.cart.loginLink}
                  </Link>
                  {t.cart.guestCheckoutNote.split("{link}")[1]}
                </span>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white"
              disabled={placingOrder}
              onClick={handleCheckout}
            >
              {placingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.cart.placingOrder}
                </>
              ) : (
                t.cart.placeOrder
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
