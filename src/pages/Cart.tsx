import { Link } from "react-router-dom";
import { useCart, cart, cartTotal } from "@/store/cart";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const items = useCart();
  const { t, formatPrice, locale } = useI18n();
  const total = cartTotal(items);

  return (
    <div className="container-luxury py-8 md:py-12 min-h-[70vh]">
      <div className="text-center mb-10 px-4">
        <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-3">Your Selection</p>
        <h1 className="font-display text-4xl sm:text-3xl md:text-5xl text-cream">{t.cart.title}</h1>
        <Ornament className="mt-4" />
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-4 bg-card/20 border border-dashed border-border/20 max-w-2xl mx-auto rounded-lg flex flex-col items-center"
        >
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-primary w-8 h-8" />
          </div>
          <p className="text-muted-foreground mb-8 text-xl sm:text-lg italic">{t.cart.empty}</p>
          <Link to="/shop" className="inline-flex items-center justify-between sm:justify-center gap-3 bg-primary text-primary-foreground w-fit mx-auto sm:w-auto px-12 sm:px-10 py-4 sm:py-4 text-sm sm:text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary-glow transition-all hover:shadow-gold">
            {t.cart.continue} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 px-2 md:px-0">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="hidden md:grid grid-cols-12 pb-4 border-b border-border/10 text-[10px] uppercase tracking-widest text-primary font-bold">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-end">Total</div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((i) => (
                  <motion.div 
                    key={i.variantId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.3 } }}
                    className="group relative flex flex-col sm:flex-row gap-4 md:gap-0 md:grid md:grid-cols-12 items-center bg-card/40 md:bg-transparent border border-border/10 md:border-0 md:border-b md:border-border/10 p-4 md:px-0 md:py-8 transition-all hover:bg-card/30 md:hover:bg-transparent"
                  >
                    {/* Product Detail */}
                    <div className="col-span-6 flex gap-4 md:gap-6 w-full">
                      <div className="w-24 h-32 md:w-32 md:h-40 shrink-0 overflow-hidden bg-secondary">
                        <img src={i.image} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="flex flex-col justify-center text-start">
                        <h3 className="font-display text-xl sm:text-lg md:text-2xl text-cream mb-1">{i.name}</h3>
                        <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-widest text-primary font-medium">{i.variantLabel}</p>
                        <p className="text-base sm:text-muted-foreground text-sm mt-2 md:hidden">{formatPrice(i.price)}</p>
                      </div>
                    </div>

                    {/* Quantity - Mobile friendly */}
                    <div className="col-span-3 flex justify-center w-full sm:w-auto">
                      <div className="flex items-center border border-border/30 h-10 bg-background/40">
                        <button 
                          onClick={() => cart.update(i.variantId, i.quantity - 1)} 
                          className="w-10 flex items-center justify-center hover:text-primary transition-colors text-lg"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <div className="w-12 flex items-center justify-center border-x border-border/30 overflow-hidden relative">
                          <AnimatePresence mode="wait">
                            <motion.span 
                              key={i.quantity}
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -10, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-sm sm:text-xs font-medium text-cream block"
                            >
                              {i.quantity}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => cart.update(i.variantId, i.quantity + 1)} 
                          className="w-10 flex items-center justify-center hover:text-primary transition-colors text-lg"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Total */}
                    <div className="col-span-3 hidden md:flex flex-col items-end justify-center w-full">
                      <motion.span 
                        key={i.price * i.quantity}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="text-xl sm:text-lg text-primary font-light"
                      >
                        {formatPrice(i.price * i.quantity)}
                      </motion.span>
                    </div>

                    {/* Remove - Absolute position on mobile card style */}
                    <button 
                      onClick={() => cart.remove(i.variantId)} 
                      className="absolute top-2 right-2 md:relative md:top-auto md:right-auto md:ms-4 p-2 text-muted-foreground hover:text-destructive transition-colors" 
                      aria-label={t.cart.remove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="pt-4 flex justify-between md:hidden">
              <span className="text-muted-foreground uppercase text-xs sm:text-[10px] tracking-widest">Total Selection</span>
              <motion.span 
                key={total}
                initial={{ scale: 1.1, color: "hsl(var(--primary))" }}
                animate={{ scale: 1, color: "hsl(var(--primary))" }}
                className="text-primary font-bold text-lg sm:text-base"
              >
                {formatPrice(total)}
              </motion.span>
            </div>
          </div>

          {/* Summary Sticky */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-card/60 backdrop-blur-sm border border-border/20 p-6 md:p-8 sticky top-24">
              <h2 className="font-display text-3xl sm:text-2xl md:text-3xl text-cream mb-8 border-b border-border/10 pb-4">{t.cart.subtotal}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm sm:text-[11px] uppercase tracking-widest">
                  <span className="text-muted-foreground">{t.cart.subtotal}</span>
                  <motion.span 
                    key={total}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="text-cream"
                  >
                    {formatPrice(total)}
                  </motion.span>
                </div>
                <div className="flex justify-between text-sm sm:text-[11px] uppercase tracking-widest">
                  <span className="text-muted-foreground">{t.trust.shipping}</span>
                  <span className="text-primary font-bold">Free</span>
                </div>
              </div>

              <div className="border-t border-border/20 pt-6 flex justify-between items-end mb-10">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Total Amount</span>
                  <motion.span 
                    key={total}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-primary text-3xl sm:text-2xl md:text-3xl font-light"
                  >
                    {formatPrice(total)}
                  </motion.span>
                </div>
              </div>

              <Link 
                to="/checkout"
                className="group relative block w-full bg-primary text-primary-foreground py-5 text-sm sm:text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:shadow-gold text-center"
              >
                <span className="relative z-10">{t.cart.checkout}</span>
                <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0" />
              </Link>
              
              <p className="text-center text-xs sm:text-[10px] text-muted-foreground mt-6 italic">
                Secure checkout with encrypted protection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
