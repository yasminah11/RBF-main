import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useState } from "react";
import { LOCALES } from "@/i18n/translations";
import { cn } from "@/lib/utils";

export function InfoHeader() {
  const { t, locale, setLocale } = useI18n();
  const [openLang, setOpenLang] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-luxury bg-background/95 backdrop-blur-xl shadow-gold border-b border-primary/10 py-2 md:py-3">
      <div className="container-luxury flex items-center justify-between px-4 sm:px-6 md:px-10 gap-1 sm:gap-4 md:gap-8">
        
        {/* Left: Language Switcher */}
        <div className="flex items-center gap-1 sm:gap-4 flex-1">
          <div className="relative">
            <button 
              onClick={() => setOpenLang(!openLang)} 
              className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold p-3 -ms-3" 
              aria-label={t.common.selectLanguage}
            >
              <Globe className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{locale.toUpperCase()}</span>
            </button>
            {openLang && (
              <div className="absolute top-full mt-4 start-0 bg-card/95 backdrop-blur-md border border-primary/20 shadow-gold min-w-[140px] py-2 z-50 animate-fade-in-up">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setOpenLang(false); }}
                    className={cn(
                      "block w-full text-start px-5 py-3 text-[10px] uppercase tracking-widest transition-all duration-300 hover:bg-primary/10 hover:ps-6",
                      l === locale ? "text-primary font-bold" : "text-foreground/80"
                    )}
                  >
                    {l === "ar" ? "العربية" : l === "tr" ? "Türkçe" : "English"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Logo */}
        <Link to="/" className="flex flex-col items-center transition-all duration-500 ease-luxury group text-center px-1 shrink-0 scale-90 md:scale-95">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border border-primary flex items-center justify-center relative overflow-hidden group-hover:bg-primary transition-all duration-500 shrink-0">
              <span className="font-display text-[8px] sm:text-[10px] text-primary group-hover:text-primary-foreground transition-colors duration-500 z-10 font-bold">RBF</span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div className="flex flex-col items-start justify-center">
              <span className="font-display tracking-[0.05em] sm:tracking-[0.2em] text-[11px] sm:text-base md:text-xl text-cream transition-all duration-500 block leading-tight whitespace-nowrap font-bold md:font-semibold">
                ROYAL <span className="text-primary">BRANDS</span> FASHION
              </span>
            </div>
          </div>
        </Link>

        {/* Right: Empty space to balance flex */}
        <div className="flex-1" />
        
      </div>
    </header>
  );
}
