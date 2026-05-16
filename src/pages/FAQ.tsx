import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function FAQ() {
  const { t, locale } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { data, isLoading } = useSiteSettings("faq");

  useEffect(() => {
    document.title = `${t.faqPage.title} | ${t.brand}`;
    window.scrollTo(0, 0);
  }, [t]);

  const lang = locale as string;
  const items: { q: string; a: string }[] = (data?.items || []).map(
    (item: any) => ({
      q: item[`q_${lang}`] || item.q_en,
      a: item[`a_${lang}`] || item.a_en,
    }),
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="relative py-12 md:py-16 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-dots bg-[length:24px_24px] opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-6 tracking-widest uppercase">
            {t.faqPage.title}
          </h1>
          <Ornament className="mb-6 scale-75 md:scale-100" />
          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed italic font-light px-4">
            {t.faqPage.subtitle}
          </p>
        </div>
      </div>

      <div className="container-luxury px-4 sm:px-6 md:px-10 pb-24 -mt-4 relative z-20">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              Loading...
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "border border-border/60 bg-card transition-all duration-300",
                      isOpen
                        ? "border-primary/40 shadow-sm"
                        : "hover:border-primary/20",
                    )}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full text-start px-6 py-6 flex items-center justify-between gap-4"
                    >
                      <span
                        className={cn(
                          "font-display text-sm md:text-base tracking-wide uppercase transition-colors duration-300",
                          isOpen ? "text-primary" : "text-cream",
                        )}
                      >
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-primary shrink-0 transition-transform duration-300",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-border/30 mx-6">
                        <p className="text-foreground/70 text-sm leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
