import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { ShieldCheck, RefreshCw, Clock, PackageCheck } from "lucide-react";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function ReturnRules() {
  const { t, locale } = useI18n();
  const { data, isLoading } = useSiteSettings("returns");

  useEffect(() => {
    document.title = `${t.returnRules.title} | ${t.brand}`;
    window.scrollTo(0, 0);
  }, [t]);

  const lang = locale as string;
  const content = data?.[lang] ||
    data?.en || {
      policy: "",
      conditions: "",
      exchanges: "",
      timeframe: "",
      refund: "",
    };

  const cards = [
    {
      icon: ShieldCheck,
      title: { en: "Returns", ar: "الإرجاع", tr: "İadeler" },
      text: content.conditions,
    },
    {
      icon: RefreshCw,
      title: { en: "Exchanges", ar: "الاستبدال", tr: "Değişimler" },
      text: content.exchanges,
    },
    {
      icon: Clock,
      title: { en: "Timeframe", ar: "المدة الزمنية", tr: "Süre" },
      text: content.timeframe,
    },
    {
      icon: PackageCheck,
      title: { en: "Refund Process", ar: "عملية الاسترداد", tr: "İade Süreci" },
      text: content.refund,
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="relative py-12 md:py-16 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-dots bg-[length:24px_24px] opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-6 tracking-widest uppercase">
            {t.returnRules.title}
          </h1>
          <Ornament className="mb-6 scale-75 md:scale-100" />
          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed italic font-light px-4">
            {t.returnRules.subtitle}
          </p>
        </div>
      </div>

      <div className="container-luxury px-4 sm:px-6 md:px-10 pb-24 -mt-4 relative z-20">
        <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 fill-mode-both">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">
              Loading...
            </div>
          ) : (
            <>
              <p className="text-foreground/80 text-base md:text-lg leading-relaxed text-center font-light">
                {content.policy}
              </p>
              <div className="grid sm:grid-cols-2 gap-8 md:gap-12">
                {cards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border/40 p-8 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                      <card.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg text-cream uppercase tracking-widest mb-4">
                      {card.title[lang as keyof typeof card.title] ||
                        card.title.en}
                    </h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
