import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { dict, LOCALES, DEFAULT_LOCALE, type Locale } from "./translations";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof dict.en;
  dir: "ltr" | "rtl";
  formatPrice: (n: number) => string;
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
      const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      });
      return fmt.format(n);
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
