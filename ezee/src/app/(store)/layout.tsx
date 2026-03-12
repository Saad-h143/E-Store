"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const noFooterPages = ["/login", "/register"];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = noFooterPages.includes(pathname);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}
