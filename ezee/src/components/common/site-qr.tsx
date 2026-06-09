"use client";

import QRCode from "react-qr-code";
import { Smartphone } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ezeeparts.online";

interface SiteQRProps {
  /** What the QR encodes — defaults to the site homepage. */
  url?: string;
  /** Brand name shown in the header. */
  brand?: string;
  /** Call-to-action label on the button. */
  ctaLabel?: string;
}

export function SiteQR({
  url = SITE_URL,
  brand = "EZEE PARTS",
  ctaLabel = "Scan to shop Ezee Parts",
}: SiteQRProps) {
  const display = url.replace(/^https?:\/\//, "");

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-3xl border-2 border-primary/40 bg-white p-6 shadow-xl shadow-primary/10">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/30">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-slate-900">
          {brand}
        </span>
      </div>

      {/* QR with centered logo (level H = 30% error correction, so the logo
          doesn't break scanning) */}
      <div className="relative">
        <QRCode
          value={url}
          size={256}
          level="H"
          fgColor="#1e1b4b"
          bgColor="#ffffff"
          className="h-auto w-full"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg ring-4 ring-white">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 py-3 text-center text-sm font-bold text-white shadow-md shadow-primary/30">
        {ctaLabel}
      </div>

      {/* URL */}
      <p className="mt-3 text-center text-xs text-slate-500 break-all">{display}</p>
    </div>
  );
}
