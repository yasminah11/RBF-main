import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nContext";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { Ornament } from "@/components/Ornament";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function Contact() {
  const { t } = useI18n();
  const { data, isLoading } = useSiteSettings("contact");

  useEffect(() => {
    document.title = `${t.contactInfo.title} | ${t.brand}`;
    window.scrollTo(0, 0);
  }, [t]);

  const email = data?.email || "clientcare@royalbrands.com";
  const phone = data?.phone || "+90 (555) 123 45 67";
  const address =
    data?.address || "Nişantaşı, Abdi İpekçi Cd. Şişli / İstanbul";
  const instagram = data?.instagram || "#";
  const facebook = data?.facebook || "#";
  const youtube = data?.youtube || "#";

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="relative py-12 md:py-16 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-dots bg-[length:24px_24px] opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-6 tracking-widest uppercase">
            {t.contactInfo.title}
          </h1>
          <Ornament className="mb-6 scale-75 md:scale-100" />
          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed italic font-light px-4">
            {t.contactInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="container-luxury px-4 sm:px-6 md:px-10 pb-24 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto bg-card border border-border/40 p-8 sm:p-12 md:p-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

          <div className="flex flex-col items-center text-center space-y-12 relative z-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-display text-cream uppercase tracking-widest mb-6">
                Maison Royal
              </h2>
              <p className="text-foreground/90 text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto italic font-light">
                {t.contactInfo.supportDesc}
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-start gap-10 md:gap-16 text-sm md:text-base text-foreground/80 w-full">
                <div className="flex flex-col items-center gap-4 group flex-1">
                  <div className="w-16 h-16 border border-primary/40 rounded-full flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-gold">
                    <Mail className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
                      {t.contactInfo.email}
                    </h3>
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 group flex-1">
                  <div className="w-16 h-16 border border-primary/40 rounded-full flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-gold">
                    <Phone className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
                      {t.contactInfo.phone}
                    </h3>
                    <a
                      href={`tel:${phone}`}
                      className="hover:text-primary transition-colors font-medium"
                      dir="ltr"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 group flex-1">
                  <div className="w-16 h-16 border border-primary/40 rounded-full flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-all duration-300 shadow-sm group-hover:shadow-gold">
                    <MapPin className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-2">
                      {t.contactInfo.address}
                    </h3>
                    <p className="leading-relaxed font-medium whitespace-pre-line">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 w-full max-w-md mx-auto border-t border-primary/10">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-6">
                {t.contactInfo.social}
              </h3>
              <div className="flex justify-center gap-6">
                <a
                  href={instagram}
                  className="w-12 h-12 border border-border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary transition-all duration-300 group rounded-full hover:bg-primary/5 hover:shadow-gold"
                >
                  <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a
                  href={facebook}
                  className="w-12 h-12 border border-border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary transition-all duration-300 group rounded-full hover:bg-primary/5 hover:shadow-gold"
                >
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a
                  href={youtube}
                  className="w-12 h-12 border border-border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary transition-all duration-300 group rounded-full hover:bg-primary/5 hover:shadow-gold"
                >
                  <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
