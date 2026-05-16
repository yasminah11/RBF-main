import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function About() {
  const { locale } = useI18n();
  const { data, isLoading } = useSiteSettings("about");

  const fallback: Record<string, { title: string; body: string }> = {
    en: {
      title: "Royal Brands Fashion",
      body: "Royal Brands Fashion is a refined house of couture, founded on the belief that true luxury is timeless. Every piece is crafted with reverence for tradition and an unwavering commitment to modern elegance.",
    },
    ar: {
      title: "رويال براندز فاشن",
      body: "رويال براندز فاشن دار أزياء راقية، تأسست على الإيمان بأن الفخامة الحقيقية خالدة.",
    },
    tr: {
      title: "Royal Brands Fashion Hakkında",
      body: "Royal Brands Fashion, gerçek lüksün zamansız olduğu inancı üzerine kurulmuş zarif bir kotür evidir.",
    },
  };

  const lang = (locale as string) in fallback ? (locale as string) : "en";
  const title = fallback[lang].title;
  const body = data?.[lang] || fallback[lang].body;

  return (
    <div className="container-luxury py-8 md:py-10 max-w-3xl">
      <div className="text-center">
        <h1 className="font-display text-6xl sm:text-5xl text-cream">
          {title}
        </h1>
        <Ornament />
      </div>
      <p className="text-xl sm:text-lg text-foreground/80 leading-loose text-center">
        {body}
      </p>
    </div>
  );
}
