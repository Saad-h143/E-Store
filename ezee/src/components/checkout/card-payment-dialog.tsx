"use client";

import { useState } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStripe } from "@/lib/stripe-client";
import { formatPrice } from "@/store/cart-store";
import { toast } from "sonner";

const stripePromise = getStripe();

interface CardPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  email: string;
  onSuccess: (paymentIntentId: string) => void;
}

// Split card fields (number / expiry / cvc) — the styled multi-field layout
// with brand icons, and no Stripe Link, wallets, country or "save my info" UI.
function CheckoutForm({
  amount,
  email,
  onSuccess,
}: {
  amount: number;
  email: string;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const elementStyle = {
    style: {
      base: {
        fontSize: "15px",
        color: isDark ? "#fafafa" : "#18181b",
        "::placeholder": { color: isDark ? "#71717a" : "#a1a1aa" },
      },
      invalid: { color: "#ef4444" },
    },
  };
  const boxClass =
    "rounded-xl border bg-background px-3.5 py-3 focus-within:border-primary/60 transition-colors";

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setProcessing(true);
    try {
      // Create the PaymentIntent now (only on Pay) so we never leave orphaned
      // "incomplete" intents from opening the dialog.
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email }),
      });
      const data = await res.json();
      if (!data.clientSecret) {
        toast.error(data.error || "Could not start payment.");
        setProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: cardNumber } }
      );

      if (error) {
        toast.error(error.message || "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Parent creates the order and closes this dialog; keep the spinner
        // until then so the button can't be double-clicked.
        onSuccess(paymentIntent.id);
      } else {
        toast.error("Payment was not completed.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("[CardPayment] payment error:", err);
      toast.error("Something went wrong with the payment. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Card number</Label>
        <div className={boxClass}>
          <CardNumberElement options={{ showIcon: true, ...elementStyle }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Expiration date</Label>
          <div className={boxClass}>
            <CardExpiryElement options={elementStyle} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Security code</Label>
          <div className={boxClass}>
            <CardCvcElement options={elementStyle} />
          </div>
        </div>
      </div>

      <Button
        onClick={handlePay}
        disabled={!stripe || processing}
        className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" /> Pay {formatPrice(amount)}
          </>
        )}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">
        Payments are processed securely by Stripe.
      </p>
    </div>
  );
}

export function CardPaymentDialog({
  open,
  onOpenChange,
  amount,
  email,
  onSuccess,
}: CardPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Secure Card Payment
          </DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <CheckoutForm amount={amount} email={email} onSuccess={onSuccess} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
