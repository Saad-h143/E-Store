"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore, getDiscountedPrice, formatPrice } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const total = getTotal();
  const shipping = total > 25000 ? 0 : 499;
  const grandTotal = total + shipping;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order.");
      return;
    }
    toast.success("Order placed successfully! (Mock)");
    clearCart();
  };

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
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Looks like you haven&apos;t added any items to your cart yet.
            Browse our collection and find something you love!
          </p>
          <Link href="/shop">
            <Button size="lg" className="rounded-xl">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

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
                  className="flex gap-4 rounded-2xl border bg-card p-4"
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
                          toast.success("Item removed from cart");
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
                Continue Shopping
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive rounded-xl"
              onClick={() => {
                clearCart();
                toast.success("Cart cleared");
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-20 rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)
                </span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Free shipping on orders above {formatPrice(25000)}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>

            {!isAuthenticated && (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2.5 rounded-xl border border-dashed text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Please{" "}
                  <Link href="/login" className="text-primary font-medium underline underline-offset-2">
                    login
                  </Link>{" "}
                  to place an order.
                </span>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={!isAuthenticated}
              onClick={handleCheckout}
            >
              {isAuthenticated ? "Place Order" : "Login to Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
