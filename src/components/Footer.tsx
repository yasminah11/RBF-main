import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "./Ornament";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-card mt-8 sm:mt-12 border-t border-border/40">
      <div className="container-luxury py-8 md:py-10">
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <div className="w-10 h-10 md:w-12 md:h-12 border border-primary flex items-center justify-center mb-4">
            <span className="font-display text-base md:text-lg text-primary">RBF</span>
          </div>
          <Ornament />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-10 px-4 md:px-0">
          <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-start">
            <h3 className="font-display text-2xl sm:text-xl md:text-2xl text-cream mb-4 tracking-wider uppercase">ROYAL <span className="text-primary">BRANDS</span> FASHION</h3>
            <p className="text-sm sm:text-[13px] md:text-sm text-muted-foreground leading-relaxed max-w-xs italic font-light">
              {t.tagline}
            </p>
            <div className="flex gap-8 md:gap-6 mt-8 md:mt-6 text-foreground/60">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-all hover:scale-110 p-2 -m-2">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-primary transition-all hover:scale-110 p-2 -m-2">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary transition-all hover:scale-110 p-2 -m-2">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-start pt-4 md:pt-0">
            <h4 className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">{t.footer.shop}</h4>
            <ul className="space-y-4 md:space-y-3 text-sm sm:text-[13px] md:text-sm text-foreground/70">
              <li><Link to="/category/modest-dresses" className="hover:text-primary transition-colors block py-1">{t.nav.modestDresses}</Link></li>
              <li><Link to="/category/evening-dresses" className="hover:text-primary transition-colors block py-1">{t.nav.eveningDresses}</Link></li>
              <li><Link to="/category/wedding-dresses" className="hover:text-primary transition-colors block py-1">{t.nav.weddingDresses}</Link></li>
              <li><Link to="/category/engagement-dresses" className="hover:text-primary transition-colors block py-1">{t.nav.engagementDresses}</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-start pt-4 md:pt-0">
            <h4 className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">{t.footer.maison}</h4>
            <ul className="space-y-4 md:space-y-3 text-sm sm:text-[13px] md:text-sm text-foreground/70">
              <li><Link to="/about" className="hover:text-primary transition-colors block py-1">{t.footer.about}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors block py-1">{t.footer.contact}</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors block py-1">{t.footer.faq}</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-start pt-4 md:pt-0">
            <h4 className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">{t.footer.help}</h4>
            <ul className="space-y-4 md:space-y-3 text-sm sm:text-[13px] md:text-sm text-foreground/70">
              <li><Link to="/returns" className="hover:text-primary transition-colors block py-1">{t.footer.returns}</Link></li>
              <li className="pt-4 mt-4 border-t border-border/10 w-full md:w-auto">
                <Link to="/admin/login" className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 md:mt-12 pt-6 border-t border-border/10 text-center">
          <p className="text-xs sm:text-[9px] md:text-xs text-muted-foreground tracking-[0.2em] uppercase opacity-60 px-4">
            © {new Date().getFullYear()} Royal Brands Fashion. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
