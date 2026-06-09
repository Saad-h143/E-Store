"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useLanguageStore } from "@/store/language-store";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase/client";

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

// Keeps the auth store in sync with the Supabase session — on load and whenever
// it changes (e.g. after a Google OAuth redirect lands on any page).
function AuthSync() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  useEffect(() => {
    refreshUser();
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });
    return () => data.subscription.unsubscribe();
  }, [refreshUser]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageDetector />
      <AuthSync />
      {children}
      <Toaster position="top-right" richColors closeButton duration={2000} />
    </ThemeProvider>
  );
}
