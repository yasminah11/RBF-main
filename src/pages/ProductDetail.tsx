import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Ornament } from "@/components/Ornament";
import { productImg } from "@/lib/assets";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useWishlist, wishlist } from "@/store/wishlist";
import { cart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "@/lib/constants";

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, locale, formatPrice } = useI18n();
  const [p, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  const wishlistItems = useWishlist();
  const isWishlisted = p ? wishlist.has(p.id) : false;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("products")
          .select(
            "*, product_sizes(*), product_images(*), product_color_variants(*)",
          )
          .eq("slug", slug)
          .maybeSingle();
        if (data) {
          setProduct(data);

          // Set default color
          const variants = data.product_color_variants || [];
          const mainColor =
            variants.find((c: any) => c.is_main) || variants[0] || null;
          setSelectedColor(mainColor);

          // Set active image based on color
          const allImgs = data.product_images || [];
          const colorImgs = mainColor
            ? allImgs.filter(
                (img: any) => img.color_variant_id === mainColor.id,
              )
            : [];
          const generalImgs = allImgs.filter(
            (img: any) => !img.color_variant_id,
          );
          const pool = colorImgs.length > 0 ? colorImgs : generalImgs;
          const sorted = [...pool].sort((a, b) => a.position - b.position);
          const main = sorted.find((img: any) => img.is_main) || sorted[0];
          if (main) setActiveImage(main.url);
          else setActiveImage(productImg(data.sku));

          const { data: rel } = await supabase
            .from("products")
            .select("*, product_images(*)")
            .eq("category_id", data.category_id)
            .neq("id", data.id)
            .limit(4);
          setRelated((rel as any) || []);
        } else {
          // Fallback to mock
          const mock = MOCK_PRODUCTS.find((m) => m.slug === slug);
          if (mock) {
            setProduct(mock);
            setActiveImage(productImg(mock.sku));
            const rel = MOCK_PRODUCTS.filter((m) => m.id !== mock.id).slice(
              0,
              4,
            );
            setRelated(rel);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleAdd = () => {
    if (!selectedSize) {
      toast.error(t.product.size, {
        description: "Please select a size first.",
      });
      return;
    }

    cart.add({
      productId: p.id,
      variantId: `${p.id}-${selectedSize}`,
      sku: p.sku,
      name: localizedField(p, "name", locale),
      variantLabel: `${t.product.size}: ${selectedSize}`,
      price: p.is_on_sale && p.sale_price ? p.sale_price : p.price,
      image: activeImage,
      quantity: qty,
    });
    toast.success(localizedField(p, "name", locale), {
      description: "Added to selection",
      icon: <ShoppingBag className="h-4 w-4 text-primary" />,
    });
  };

  const handleColorSelect = (color: any) => {
    if (!color.is_available) return;
    setSelectedColor(color);
    const allImgs = p.product_images || [];
    const colorImgs = allImgs.filter(
      (img: any) => img.color_variant_id === color.id,
    );
    const generalImgs = allImgs.filter((img: any) => !img.color_variant_id);
    const pool = colorImgs.length > 0 ? colorImgs : generalImgs;
    const sorted = [...pool].sort((a: any, b: any) => a.position - b.position);
    if (sorted.length > 0) setActiveImage(sorted[0].url);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current || !zoom) return;
    const { left, top, width, height } =
      zoomRef.current.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    zoomRef.current.style.setProperty("--x", `${x}%`);
    zoomRef.current.style.setProperty("--y", `${y}%`);
  };

  if (loading)
    return (
      <div className="container-luxury py-20 flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!p)
    return (
      <div className="container-luxury py-32 text-center">
        <h2 className="font-display text-5xl sm:text-4xl text-cream mb-6">
          {t.product.selectionNotFound}
        </h2>
        <p className="text-base sm:text-muted-foreground mb-10">
          {t.product.selectionNotFoundText}
        </p>
        <Link
          to="/shop"
          className="bg-primary text-primary-foreground px-10 py-4 text-sm sm:text-[10px] uppercase tracking-widest font-bold hover:bg-primary-glow transition-all"
        >
          {t.product.backToCollections}
        </Link>
      </div>
    );

  const name = localizedField(p, "name", locale);
  const desc = localizedField(p, "description", locale);
  const sizes = p.product_sizes
    ? [...p.product_sizes]
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((s: any) => s.size_label)
    : [];
  const colorVariants = p.product_color_variants
    ? [...p.product_color_variants].sort(
        (a: any, b: any) => a.position - b.position,
      )
    : [];

  const images = p.product_images
    ? [...p.product_images]
        .filter(
          (img: any) =>
            !img.color_variant_id || img.color_variant_id === selectedColor?.id,
        )
        .sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="pb-20 overflow-x-hidden">
      <div className="container-luxury py-6 md:py-10 w-full max-w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-[9px] uppercase tracking-widest text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2 px-4 md:px-0">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/shop" className="hover:text-primary transition-colors">
            {t.nav.shop}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-primary font-medium truncate">{name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="w-full md:w-7/12 max-w-full space-y-4">
            <div
              ref={zoomRef}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={handleMouseMove}
              className={cn(
                "relative aspect-[3/4] w-full overflow-hidden bg-secondary group md:cursor-zoom-in border border-border/5",
                zoom && "md:cursor-zoom-out",
              )}
              style={
                {
                  "--x": "50%",
                  "--y": "50%",
                } as any
              }
            >
              <img
                src={activeImage}
                alt={name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  zoom
                    ? "md:scale-[2.5] md:origin-[var(--x)_var(--y)]"
                    : "scale-100",
                )}
              />
              {!zoom && (
                <div className="hidden md:flex absolute bottom-6 left-6 items-center gap-2 bg-background/40 backdrop-blur-md px-3 py-1.5 text-xs sm:text-[9px] uppercase tracking-widest text-cream opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3 w-3" /> {t.product.zoom}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  wishlist.toggle(p);
                }}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-3.5 md:p-3 rounded-full bg-background/60 backdrop-blur-md text-foreground/90 md:text-foreground/80 hover:text-primary transition-all border border-border/10 shadow-luxury z-10"
              >
                <Heart
                  className={cn(
                    "h-6 w-6 md:h-5 md:w-5 transition-colors",
                    isWishlisted && "fill-primary text-primary",
                  )}
                />
              </button>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img: any) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={cn(
                      "relative aspect-[3/4] w-20 flex-shrink-0 border transition-all",
                      activeImage === img.url
                        ? "border-primary"
                        : "border-border/20 opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={img.url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="w-full md:w-5/12 space-y-8 md:sticky md:top-[140px] md:self-start px-4 md:px-0 max-w-full">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {p.is_new_arrival && (
                  <span className="text-xs sm:text-[9px] uppercase tracking-[0.2em] font-bold text-primary px-3 py-1 bg-primary/10 border border-primary/20">
                    {t.common.new}
                  </span>
                )}
                {colorVariants.length > 0 &&
                  colorVariants.every((c: any) => c.stock_quantity === 0) && (
                    <span className="text-xs sm:text-[9px] uppercase tracking-[0.2em] font-bold text-destructive px-3 py-1 bg-destructive/10 border border-destructive/20">
                      Sold Out
                    </span>
                  )}
                <span className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">
                  SKU: {p.sku}
                </span>
              </div>
              <h1 className="font-display text-5xl sm:text-4xl md:text-5xl lg:text-6xl text-cream leading-[1.1]">
                {name}
              </h1>

              <div className="flex items-center gap-4 pt-2">
                {p.is_on_sale && p.sale_price ? (
                  <>
                    <span className="text-4xl sm:text-3xl md:text-4xl text-primary font-light">
                      {formatPrice(p.sale_price)}
                    </span>
                    <span className="text-2xl sm:text-xl text-muted-foreground line-through opacity-50">
                      {formatPrice(p.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-4xl sm:text-3xl md:text-4xl text-primary font-light">
                    {formatPrice(p.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-border/10 w-full" />

            {/* Color Variants */}
            {colorVariants.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.3em] font-bold text-cream/90">
                    {locale === "ar"
                      ? "اللون"
                      : locale === "tr"
                        ? "Renk"
                        : "Color"}
                  </span>
                  {selectedColor && (
                    <span className="text-xs text-muted-foreground">
                      {localizedField(selectedColor, "name", locale)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorVariants.map((color: any) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color)}
                      title={localizedField(color, "name", locale)}
                      disabled={!color.is_available}
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-all duration-300 relative",
                        selectedColor?.id === color.id
                          ? "border-primary scale-110 shadow-gold"
                          : "border-border/30 hover:border-primary/50 hover:scale-105",
                        !color.is_available && "opacity-40 cursor-not-allowed",
                      )}
                      style={{ backgroundColor: color.hex_color || "#000000" }}
                    >
                      {selectedColor?.id === color.id && (
                        <span className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border/10 w-full" />
            {/* Sizes */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[10px] uppercase tracking-[0.3em] font-bold text-cream/90">
                  {t.product.size}
                </span>
                <button className="text-xs sm:text-[9px] uppercase tracking-[0.2em] text-primary hover:text-primary-glow underline underline-offset-4 transition-colors font-medium">
                  {t.product.sizeGuide}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border text-sm sm:text-[11px] md:text-xs tracking-[0.1em] transition-all duration-300 font-medium",
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground shadow-gold"
                        : "border-border/20 text-foreground/60 hover:border-primary/40 hover:text-cream",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full">
              {/* Piece Counter - Full width on mobile */}
              <div className="flex items-center border border-border/20 h-14 bg-card/20 w-full sm:w-[140px] shrink-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex-1 h-full flex items-center justify-center hover:text-primary transition-colors p-2"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-5 w-5 md:h-4 md:w-4" />
                </button>
                <span className="w-12 text-center text-sm md:text-xs font-bold text-cream tracking-tighter">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="flex-1 h-full flex items-center justify-center hover:text-primary transition-colors p-2"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-5 w-5 md:h-4 md:w-4" />
                </button>
              </div>

              {/* Add to Cart Button - Centered fixed width on mobile */}
              <button
                onClick={handleAdd}
                className="group relative inline-flex items-center justify-center gap-4 bg-primary text-primary-foreground w-fit mx-auto sm:w-auto px-12 sm:px-10 py-3 sm:py-5 text-sm sm:text-[10px] uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:shadow-gold flex-1"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <ShoppingBag className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{t.product.addToCart}</span>
                </div>
                <ArrowRight className="h-5 w-5 sm:hidden relative z-10" />
                <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0 duration-500" />
              </button>
            </div>

            {/* Informational Blocks */}
            <div className="grid grid-cols-1 gap-6 pt-10 border-t border-border/5">
              {/* Shipping & Returns */}
              <div className="flex items-start gap-5 group">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 transition-colors group-hover:bg-primary/10">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold text-cream">
                    {t.product.shipping}
                  </h4>
                  <p className="text-xs sm:text-[10px] md:text-[11px] leading-relaxed text-muted-foreground/80 font-medium">
                    {t.product.shippingText}
                  </p>
                </div>
              </div>

              {/* Authenticity */}
              <div className="flex items-start gap-5 group">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 transition-colors group-hover:bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold text-cream">
                    Authenticity
                  </h4>
                  <p className="text-xs sm:text-[10px] md:text-[11px] leading-relaxed text-muted-foreground/80 font-medium">
                    Certified 100% authentic designer evening wear from Royal
                    Brands.
                  </p>
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="pt-8">
              <p className="text-base sm:text-sm md:text-base text-muted-foreground leading-relaxed font-light italic">
                {desc}
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-24 md:mt-32">
            <div className="flex items-center gap-4 md:gap-6 mb-12 md:mb-16 px-4 md:px-0">
              <h2 className="font-display text-4xl sm:text-3xl md:text-5xl text-cream whitespace-nowrap">
                {t.product.related}
              </h2>
              <div className="h-px w-full bg-border/10" />
              <span className="text-xs sm:text-[9px] uppercase tracking-[0.4em] text-primary whitespace-nowrap font-bold">
                {t.product.relatedTag}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 px-2 md:px-0">
              {related.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
