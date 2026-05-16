import { useWishlist } from "@/store/wishlist";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Wishlist() {
  const items = useWishlist();
  const { t } = useI18n();

  return (
    <div className="container-luxury py-8 md:py-12 min-h-[70vh]">
      <div className="text-center mb-16">
        <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-3 font-semibold">{t.wishlist.tag}</p>
        <h1 className="font-display text-5xl sm:text-4xl md:text-6xl text-cream">{t.wishlist.title}</h1>
        <Ornament className="mt-4" />
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center py-12 bg-card/30 border border-dashed border-border/10 rounded-sm px-4 flex flex-col items-center"
        >
          <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-primary/40 w-8 h-8" />
          </div>
          <p className="text-muted-foreground italic mb-10 text-xl sm:text-lg">{t.wishlist.empty}</p>
          <Link to="/shop" className="inline-flex items-center justify-between sm:justify-center gap-3 bg-primary text-primary-foreground w-fit mx-auto sm:w-auto px-12 sm:px-10 py-4 sm:py-4 text-sm sm:text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary-glow transition-all hover:shadow-gold">
            {t.hero.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 px-2 md:px-0">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
