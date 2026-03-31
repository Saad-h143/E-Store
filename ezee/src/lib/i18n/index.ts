import { en } from "./translations/en";
import { pt } from "./translations/pt";
import { es } from "./translations/es";
import { it } from "./translations/it";
import { fr } from "./translations/fr";
import { de } from "./translations/de";

export type Locale = "en" | "pt" | "es" | "it" | "fr" | "de";
export type Translations = typeof en;

export const translations: Record<Locale, Translations> = { en, pt, es, it, fr, de };

export const localeNames: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
};

export const localeFlags: Record<Locale, string> = {
  en: "GB",
  pt: "PT",
  es: "ES",
  it: "IT",
  fr: "FR",
  de: "DE",
};

// Country code to locale mapping for auto-detection
export const countryToLocale: Record<string, Locale> = {
  GB: "en", US: "en", AU: "en", CA: "en", NZ: "en", IE: "en", IN: "en", PK: "en",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  IT: "it", SM: "it", VA: "it",
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr",
  DE: "de", AT: "de", LI: "de",
};
