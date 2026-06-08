import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { dict, LOCALES, DEFAULT_LOCALE, type Locale } from "./translations";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof dict.en;
  dir: "ltr" | "rtl";
  formatPrice: (n: number) => string;
  formatNumber: (n: number) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const saved = localStorage.getItem("locale") as Locale | null;
    return saved && LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
  });

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem("locale", locale);
  }, [locale, dir]);

  const value = useMemo<Ctx>(() => ({
    locale,
    setLocale: setLocaleState,
    t: dict[locale],
    dir,
    formatPrice: (n: number) => {
      // Force English format (dot for decimals, comma for thousands) and USD currency
      const formatLocale = "en-US";
      const fmt = new Intl.NumberFormat(formatLocale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2, // Dollars usually show cents
      });
      return fmt.format(n);
    },
    formatNumber: (n: number) => {
      // Force English format
      return new Intl.NumberFormat("en-US").format(n);
    },
  }), [locale, dir]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}

export function localizedField<T extends Record<string, any>>(
  obj: T,
  base: string,
  locale: Locale,
): string {
  return obj[`${base}_${locale}`] ?? obj[`${base}_en`] ?? "";
}
