"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useLanguageStore } from "@/store/language-store";

function LanguageDetector() {
  const detectLanguage = useLanguageStore((s) => s.detectLanguage);
  useEffect(() => {
    // Load the saved locale after mount (store uses skipHydration to avoid a
    // server/client hydration mismatch), then run auto-detection.
    useLanguageStore.persist.rehydrate();
    detectLanguage();
  }, [detectLanguage]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageDetector />
      {children}
      <Toaster position="top-right" richColors closeButton duration={2000} />
    </ThemeProvider>
  );
}
