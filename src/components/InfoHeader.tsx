import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useState } from "react";
import { LOCALES } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function InfoHeader() {
  const { t, locale, setLocale } = useI18n();
  const [openLang, setOpenLang] = useState(false);
  const { data: contact } = useSiteSettings("contact");
  const whatsapp = contact?.whatsapp;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-luxury bg-background/95 backdrop-blur-xl shadow-gold border-b border-primary/10 py-2 md:py-3">
      <div className="container-luxury flex items-center justify-between px-4 sm:px-6 md:px-10 gap-1 sm:gap-4 md:gap-8">
        
        {/* Left: Language Switcher & WhatsApp */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1">
          <a
            href={`https://wa.me/${(whatsapp || "201000000000").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-[#25D366] transition-all p-2 drop-shadow-md"
            aria-label="WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 sm:h-4.5 sm:w-4.5"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </a>
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
