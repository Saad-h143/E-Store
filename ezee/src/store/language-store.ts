import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, countryToLocale, type Locale, type Translations } from "@/lib/i18n";

interface LanguageState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  detectLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "en",
      t: translations.en,

      setLocale: (locale: Locale) => {
        set({ locale, t: translations[locale] });
      },

      detectLanguage: async () => {
        // Only auto-detect if user hasn't manually chosen a language
        try {
          const stored = localStorage.getItem("ezee-language");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.state?.locale) return; // User already chose
          }
        } catch {
          // ignore parse errors
        }

        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
          const data = await res.json();
          const countryCode = data.country_code;
          const detectedLocale = countryToLocale[countryCode] || "en";
          set({ locale: detectedLocale, t: translations[detectedLocale] });
        } catch {
          // Fallback to browser language
          const browserLang = navigator.language.split("-")[0] as Locale;
          if (translations[browserLang]) {
            set({ locale: browserLang, t: translations[browserLang] });
          }
        }
      },
    }),
    {
      name: "ezee-language",
      partialize: (state) => ({ locale: state.locale }),
      merge: (persisted, current) => {
        const p = persisted as { locale?: Locale } | undefined;
        const locale = p?.locale || current.locale;
        return { ...current, locale, t: translations[locale] };
      },
    }
  )
);
