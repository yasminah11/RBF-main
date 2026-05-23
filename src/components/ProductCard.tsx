import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { productImg } from "@/lib/assets";
import { Heart, ShoppingBag, Check, Eye } from "lucide-react";
import { useWishlist, wishlist } from "@/store/wishlist";
import { cart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  sku: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_tr: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  sale_label_ar?: string | null;
  sale_label_en?: string | null;
  sale_label_tr?: string | null;
  is_new_arrival?: boolean;
  stock_count?: number | null;
  product_images?: { url: string; is_main: boolean; position: number }[];
};

// Ripple effect helper
function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const ripple = document.createElement("span");
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    position:absolute; border-radius:50%; background:hsl(46 65% 52% / 0.35);
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size / 2}px;
    top:${e.clientY - rect.top - size / 2}px;
    transform:scale(0); animation:ripple-expand 0.55s ease-out forwards;
    pointer-events:none;
  `;
  // inject keyframes once
  if (!document.getElementById("ripple-style")) {
    const s = document.createElement("style");
    s.id = "ripple-style";
    s.textContent = `@keyframes ripple-expand { to { transform:scale(2.5); opacity:0; } }`;
    document.head.appendChild(s);
  }
  btn.style.position = "relative";
  btn.style.overflow = "hidden";
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

export function ProductCard({
  p,
  featured = false,
}: {
  p: ProductCardData;
  featured?: boolean;
}) {
  const { locale, formatPrice, t } = useI18n();
  const wishlistItems = useWishlist();
  const isWishlisted = wishlist.has(p.id);
  const [addedToCart, setAddedToCart] = useState(false);

  const name = localizedField(p, "name", locale);
  const saleLabel = localizedField(p, "sale_label", locale);

  // Low stock threshold
  const isLowStock =
    p.stock_count != null && p.stock_count > 0 && p.stock_count <= 5;

  const mainImage = useMemo(() => {
    if (p.product_images && p.product_images.length > 0) {
      const main =
        p.product_images.find((img) => img.is_main) ||
        [...p.product_images].sort((a, b) => a.position - b.position)[0];
      return main.url;
    }
    return productImg(p.sku);
  }, [p.product_images, p.sku]);

  // Second image for hover swap
  const hoverImage = useMemo(() => {
    if (p.product_images && p.product_images.length > 1) {
      const sorted = [...p.product_images].sort(
        (a, b) => a.position - b.position,
      );
      const nonMain = sorted.find((img) => !img.is_main);
      return nonMain?.url ?? null;
    }
    return null;
  }, [p.product_images]);

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

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    createRipple(e);
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
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    toast.success(name, {
      description: "Added to selection",
      icon: <Check className="h-4 w-4 text-primary" />,
    });
  };

  return (
    <Link to={`/product/${p.slug}`} className="product-card block group">
      {/* ── Image container ── */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-navy border border-border/5 group-hover:border-primary/20 transition-colors duration-500",
          featured ? "aspect-[3/4]" : "aspect-[4/5]",
        )}
      >
        {/* Main image */}
        <img
          src={mainImage}
          alt={name}
          loading="lazy"
          className={cn(
            "product-card-img w-full h-full object-cover transition-all duration-700",
            hoverImage ? "group-hover:opacity-0" : "group-hover:scale-110",
          )}
          width={800}
          height={1000}
        />

        {/* Hover swap image */}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            width={800}
            height={1000}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Inner border on hover */}
        <div className="absolute inset-2 border border-primary/0 group-hover:border-primary/25 transition-all duration-500 pointer-events-none" />

        {/* Side action buttons */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col gap-2">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className="bg-background/90 backdrop-blur-md p-3 md:p-2.5 rounded-full text-foreground/90 md:text-foreground/70 hover:text-primary transition-all duration-300 md:transform md:translate-x-4 md:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-lg"
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
          >
            <Heart
              className={cn(
                "h-5 w-5 md:h-4 md:w-4 transition-all duration-300",
                isWishlisted && "fill-primary text-primary scale-110",
              )}
            />
          </button>

          {/* Quick add */}
          <button
            onClick={handleQuickAdd}
            className="bg-background/90 backdrop-blur-md p-3 md:p-2.5 rounded-full text-foreground/90 md:text-foreground/70 hover:text-primary transition-all duration-300 md:transform md:translate-x-4 md:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-lg md:delay-75"
            aria-label="Quick add to cart"
          >
            {addedToCart ? (
              <Check className="h-5 w-5 md:h-4 md:w-4 text-primary" />
            ) : (
              <ShoppingBag className="h-5 w-5 md:h-4 md:w-4" />
            )}
          </button>
        </div>

        {/* ── Badges ── */}
        {p.is_on_sale && saleLabel && (
          <span className="absolute top-3 start-3 bg-gradient-gold text-primary-foreground text-[9px] md:text-[10px] tracking-widest uppercase px-2.5 py-1 font-bold shadow-gold-glow">
            {saleLabel}
          </span>
        )}
        {p.is_new_arrival && !p.is_on_sale && (
          <span className="absolute top-3 start-3 bg-cream text-cream-foreground text-[9px] md:text-[10px] tracking-widest uppercase px-2.5 py-1 font-bold shadow-lg">
            {t.common.new}
          </span>
        )}

        {/* Low stock urgency */}
        {isLowStock && (
          <span className="badge-urgency">Only {p.stock_count} left</span>
        )}

        {/* ── Quick View bar ── */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-background/85 backdrop-blur-sm py-3 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-primary/20 flex items-center justify-center gap-2">
          <Eye className="h-3 w-3 text-primary" />
          <span className="text-[9px] uppercase tracking-[0.35em] text-primary font-bold">
            View Details
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="product-card-info">
        <h3 className="product-card-title">{name}</h3>
        <div className="price-display flex items-center justify-center gap-2 text-base sm:text-sm mt-auto">
          {p.is_on_sale && p.sale_price ? (
            <>
              <span className="text-primary font-medium tracking-wide">
                {formatPrice(p.sale_price)}
              </span>
              <span className="text-muted-foreground line-through opacity-40 text-sm sm:text-xs">
                {formatPrice(p.price)}
              </span>
            </>
          ) : (
            <span className="text-primary font-light tracking-widest">
              {formatPrice(p.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
