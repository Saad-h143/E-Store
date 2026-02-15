import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ezee — Premium Mobile Store",
    template: "%s | Ezee",
  },
  description:
    "Your trusted destination for premium smartphones. Shop the latest iPhones, Samsung Galaxy, Google Pixel, and more at the best prices.",
  keywords: ["mobile store", "smartphones", "iPhone", "Samsung", "buy phone online", "Ezee"],
  openGraph: {
    title: "Ezee — Premium Mobile Store",
    description: "Shop the latest smartphones at the best prices.",
    type: "website",
    locale: "en_IN",
    siteName: "Ezee",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
