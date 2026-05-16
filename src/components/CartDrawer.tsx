import { useCart, cart, cartTotal } from "@/store/cart";
import { useI18n } from "@/i18n/I18nContext";
import { Trash2, ShoppingBag, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const items = useCart();
  const { t, formatPrice } = useI18n();
  const total = cartTotal(items);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-primary/10 p-0 flex flex-col shadow-luxury">
        <SheetHeader className="px-6 py-6 border-b border-border/10 flex flex-row items-center justify-between">
          <SheetTitle className="font-display text-3xl sm:text-2xl text-cream flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {t.cart.title}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center">
                <ShoppingBag className="text-primary/40 w-10 h-10" />
              </div>
              <p className="text-muted-foreground italic text-xl sm:text-lg">{t.cart.empty}</p>
              <button 
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-between sm:justify-center gap-3 bg-primary text-primary-foreground w-full sm:w-auto px-8 sm:py-3 py-4 text-sm sm:text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary-glow transition-all"
              >
                {t.cart.continue} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((i) => (
                  <motion.div 
                    key={i.variantId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    className="flex gap-4 group relative"
                  >
                    <div className="w-20 h-28 shrink-0 overflow-hidden bg-secondary">
                      <img src={i.image} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-display text-lg sm:text-base text-cream leading-tight">{i.name}</h3>
                          <button 
                            onClick={() => cart.remove(i.variantId)} 
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            aria-label={t.cart.remove}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-[10px] uppercase tracking-widest text-primary mt-1">{i.variantLabel}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-border/30 h-8">
                          <button 
                            onClick={() => cart.update(i.variantId, i.quantity - 1)} 
                            className="w-8 flex items-center justify-center hover:text-primary transition-colors text-sm"
                          >
                            −
                          </button>
                          <div className="w-8 flex items-center justify-center border-x border-border/30 overflow-hidden relative h-full">
                            <AnimatePresence mode="wait">
                              <motion.span 
                                key={i.quantity}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -5, opacity: 0 }}
                                className="text-sm sm:text-[11px] font-medium text-cream"
                              >
                                {i.quantity}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <button 
                            onClick={() => cart.update(i.variantId, i.quantity + 1)} 
                            className="w-8 flex items-center justify-center hover:text-primary transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-base sm:text-sm text-primary font-light">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-8 bg-card/40 border-t border-border/10 space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-xs sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{t.cart.subtotal}</span>
                <motion.span 
                  key={total}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="text-primary text-3xl sm:text-2xl font-light"
                >
                  {formatPrice(total)}
                </motion.span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground italic mb-1">{t.cart.shippingNote}</span>
            </div>

            <div className="space-y-3">
              <Link 
                to="/checkout"
                onClick={() => onOpenChange(false)}
                className="group relative block w-full bg-primary text-primary-foreground py-4 text-sm sm:text-[10px] uppercase tracking-[0.4em] font-bold overflow-hidden transition-all hover:shadow-gold text-center"
              >
                <span className="relative z-10">{t.cart.checkout}</span>
                <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0" />
              </Link>
              <Link 
                to="/cart" 
                onClick={() => onOpenChange(false)}
                className="block w-full text-center py-2 text-xs sm:text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
              >
                {t.cart.viewFull}
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
