import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ezeeparts.online";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ezee Parts — Wholesale iPhone LCD, OLED Screens & Mobile Parts",
    template: "%s | Ezee Parts",
  },
  description:
    "Ezee Parts (ezeeparts.online) — wholesale prices on authentic iPhone LCD & OLED screens, batteries and mobile spare parts. 100% genuine stock, tested before dispatch, fast shipping across Europe.",
  keywords: [
    "ezeeparts",
    "ezee parts",
    "iPhone LCD",
    "iPhone OLED screen",
    "phone screen replacement",
    "mobile spare parts",
    "wholesale phone parts",
    "iPhone screen wholesale",
    "phone parts Europe",
  ],
  applicationName: "Ezee Parts",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ezee Parts — Wholesale iPhone & Mobile Parts",
    description:
      "Authentic iPhone LCD/OLED screens, batteries & mobile parts at wholesale prices. Fast EU shipping.",
    url: SITE_URL,
    type: "website",
    siteName: "Ezee Parts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ezee Parts — Wholesale iPhone & Mobile Parts",
    description: "Authentic iPhone screens, batteries & mobile parts at wholesale prices.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
