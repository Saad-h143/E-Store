"use client";

import { useState } from "react";
import { CreditCard, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Single source of truth for the store's bank-transfer / payment details.
const BANK_FIELDS = [
  { label: "Account Holder", value: "ABDULLAH MOBILES LIMITED" },
  { label: "Bank", value: "Wise" },
  { label: "IBAN", value: "BE92 9050 2646 3223" },
  { label: "BIC/SWIFT", value: "TRWIBEB1XXX" },
];
const BANK_ADDRESS = "Rue du Trône 100, 3rd floor, Brussels 1050, Belgium";
const PAYMENT_WHATSAPP = "+351 924 288 509";

/** The bank-transfer details card + WhatsApp note. Reused by the cart success
 *  modal and the account "Payment Details" dialog. */
export function BankTransferDetails() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Bank Transfer Details</p>
        </div>
        <div className="space-y-1.5 text-sm">
          {BANK_FIELDS.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{item.value}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.value);
                    toast.success(`${item.label} copied!`);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{BANK_ADDRESS}</p>
      </div>
      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          You can also send your payment receipt via WhatsApp: <strong>{PAYMENT_WHATSAPP}</strong>
        </p>
      </div>
    </div>
  );
}

/** A button that opens a dialog showing the bank-transfer details. */
export function PaymentDetailsDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Payment Details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Transfer the order total to the account below, then upload your payment
            receipt to process and dispatch your order.
          </p>
          <BankTransferDetails />
        </DialogContent>
      </Dialog>
    </>
  );
}
