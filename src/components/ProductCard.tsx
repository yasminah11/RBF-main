import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { productImg } from "@/lib/assets";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { useWishlist, wishlist } from "@/store/wishlist";
import { cart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  sku: string;
  slug: string;
  name_ar: string; name_en: string; name_tr: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  sale_label_ar?: string | null; sale_label_en?: string | null; sale_label_tr?: string | null;
  is_new_arrival?: boolean;
  product_images?: { url: string; is_main: boolean; position: number }[];
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { locale, formatPrice, t } = useI18n();
  const wishlistItems = useWishlist();
  const isWishlisted = wishlist.has(p.id);
  
  const name = localizedField(p, "name", locale);
  const saleLabel = localizedField(p, "sale_label", locale);

  // Determine the image to show: prioritize is_main, then position 0, then fallback
  const mainImage = useMemo(() => {
    if (p.product_images && p.product_images.length > 0) {
      const main = p.product_images.find(img => img.is_main) || 
                   [...p.product_images].sort((a, b) => a.position - b.position)[0];
      return main.url;
    }
    return productImg(p.sku);
  }, [p.product_images, p.sku]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(p);
    if (!isWishlisted) {
      toast.success(name, { 
        description: "Added to your favorites",
        icon: <Heart className="h-4 w-4 fill-primary text-primary" />,
      });
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Quick add uses a default variant (usually first available, here LFB-Default)
    cart.add({
      productId: p.id,
      variantId: `${p.id}-default`,
      sku: p.sku,
      name,
      variantLabel: "Standard Size",
      price: p.is_on_sale && p.sale_price ? p.sale_price : p.price,
      image: mainImage,
      quantity: 1,
    });
    
    toast.success(name, { 
      description: "Added to selection",
      icon: <Check className="h-4 w-4 text-primary" />,
    });
  };

  return (
    <Link to={`/product/${p.slug}`} className="product-card block group">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <img
          src={mainImage}
          alt={name}
          loading="lazy"
          className="product-card-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          width={800}
          height={1000}
        />
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Action Buttons - Visible on mobile, hover on desktop */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col gap-2">
          <button
            onClick={toggleWishlist}
            className="bg-background/90 backdrop-blur-md p-3 md:p-2.5 rounded-full text-foreground/90 md:text-foreground/70 hover:text-primary transition-all duration-300 md:transform md:translate-x-4 md:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-luxury"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-5 w-5 md:h-4 md:w-4 transition-colors", isWishlisted && "fill-primary text-primary")} />
          </button>
          
          <button
            onClick={handleQuickAdd}
            className="bg-background/90 backdrop-blur-md p-3 md:p-2.5 rounded-full text-foreground/90 md:text-foreground/70 hover:text-primary transition-all duration-300 md:transform md:translate-x-4 md:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-luxury md:delay-75"
            aria-label="Quick add to cart"
          >
            <ShoppingBag className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>

        {p.is_on_sale && saleLabel && (
          <span className="absolute top-3 start-3 bg-primary text-primary-foreground text-[9px] md:text-[10px] tracking-widest uppercase px-2.5 py-1 font-bold shadow-luxury">
            {saleLabel}
          </span>
        )}
        {p.is_new_arrival && !p.is_on_sale && (
          <span className="absolute top-3 start-3 bg-cream text-cream-foreground text-[9px] md:text-[10px] tracking-widest uppercase px-2.5 py-1 font-bold shadow-luxury">
            {t.common.new}
          </span>
        )}
        
        {/* Mobile quick add button - always visible on touch */}
        <div className="md:hidden absolute bottom-0 inset-x-0 bg-background/60 backdrop-blur-md py-2 text-center transform translate-y-full group-hover:translate-y-0 transition-transform">
        </div>
      </div>
      
      <div className="product-card-info">
        <h3 className="product-card-title">{name}</h3>
        <div className="flex items-center justify-center gap-2 text-base sm:text-sm mt-auto">
          {p.is_on_sale && p.sale_price ? (
            <>
              <span className="text-primary font-medium">{formatPrice(p.sale_price)}</span>
              <span className="text-muted-foreground line-through opacity-40 text-sm sm:text-xs">{formatPrice(p.price)}</span>
            </>
          ) : (
            <span className="text-primary font-light">{formatPrice(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
