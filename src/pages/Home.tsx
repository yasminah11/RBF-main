import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Ornament } from "@/components/Ornament";
import { header1 } from "@/lib/assets";
import { Award, ShieldCheck, CreditCard, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_REVIEWS,
  type Category,
} from "@/lib/constants";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const { t, locale, dir } = useI18n();
  const [bestSellers, setBestSellers] = useState<ProductCardData[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 1. Embla for Hero (3s Autoplay, Swipe enabled)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30,
      skipSnaps: false,
      direction: dir,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // 2. Embla for Testimonials
  const [reviewsRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      direction: dir,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Best Sellers — products marked as best seller
        const { data: bestSellersData } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("status", "active")
          .eq("is_best_seller", true)
          .limit(4);

        // New Arrivals — products marked as new arrival
        const { data: newArrivalsData } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("status", "active")
          .eq("is_new_arrival", true)
          .order("created_at", { ascending: false })
          .limit(8);

        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .eq("status", "active")
          .order("display_order", { ascending: true });

        setBestSellers(
          bestSellersData?.length
            ? (bestSellersData as any)
            : MOCK_PRODUCTS.slice(0, 4),
        );
        setNewArrivals(
          newArrivalsData?.length
            ? (newArrivalsData as any)
            : MOCK_PRODUCTS.slice(0, 8),
        );
        setCategories(
          categoriesData?.length ? (categoriesData as any) : MOCK_CATEGORIES,
        );
      } catch (err) {
        setBestSellers(MOCK_PRODUCTS.slice(0, 4));
        setNewArrivals(MOCK_PRODUCTS.slice(0, 8));
        setCategories(MOCK_CATEGORIES);
      }
    };
    fetchData();
  }, []);

  const titleWords = t.hero.title.split(" ");
  const firstWord = titleWords[0];
  const restOfTitle = titleWords.slice(1).join(" ");

  const heroImages = [header1];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-screen overflow-hidden md:-mt-[120px] bg-background">
        {/* Carousel Container */}
        <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {heroImages.map((src, index) => (
              <div key={index} className="relative flex-[0_0_100%] h-full">
                <img
                  src={src}
                  alt={`Royal Brands Fashion luxury collection ${index + 1}`}
                  className="w-full h-full object-cover object-center animate-slow-zoom"
                />
              </div>
            ))}
          </div>

          {/* Static Content Overlay (On top of carousel) */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-0 bg-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/10 to-transparent md:from-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Hero Content (Static) */}
        <div className="container-luxury relative z-20 h-full flex items-center justify-center pointer-events-none">
          <div className="max-w-3xl pointer-events-auto text-center mx-auto pt-28 sm:pt-36 md:pt-44">
            <Reveal delay={400}>
              <h1 className="font-display text-5xl sm:text-5xl md:text-8xl lg:text-9xl text-cream leading-[1.15] md:leading-[0.9] mb-6 md:mb-8 drop-shadow-lg">
                <span className="text-shimmer block">{firstWord}</span>
                {restOfTitle && (
                  <span className="block italic opacity-95">{restOfTitle}</span>
                )}
              </h1>
            </Reveal>

            <Reveal delay={600}>
              <p className="text-base md:text-xl text-cream mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed font-normal drop-shadow-md px-1 md:px-0 text-center">
                {t.hero.subtitle}
              </p>
            </Reveal>

            <Reveal delay={800}>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
                <Link
                  to="/shop"
                  className="group relative inline-flex items-center justify-center gap-4 bg-primary text-primary-foreground w-fit mx-auto sm:w-auto px-8 sm:px-10 py-3 sm:py-5 text-xs sm:text-[10px] uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:shadow-gold text-center whitespace-nowrap"
                >
                  <span className="relative z-10">{t.hero.cta}</span>
                  <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4 relative z-10 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 flex gap-2">
          {heroImages.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-0.5 transition-all duration-500",
                i === selectedIndex ? "w-8 bg-primary" : "w-4 bg-white/30",
              )}
            />
          ))}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="container-luxury py-8 md:py-12">
        <Reveal>
          <div className="text-center mb-6 md:mb-8 px-4">
            <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-3 md:mb-4 font-normal">
              {t.common.featured}
            </p>
            <h2 className="font-display text-4xl sm:text-3xl md:text-7xl text-cream mb-4 md:mb-6">
              {t.sections.bestsellers}
            </h2>
            <Ornament className="mb-6 md:mb-8" />
            <p className="text-base sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed italic">
              {t.sections.bestsellersSub}
            </p>
          </div>
        </Reveal>

        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-12">
            {bestSellers.map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <ProductCard p={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12">
            No best sellers yet. Mark products as Best Seller from the admin
            panel.
          </p>
        )}
      </section>

      {/* Trust Section */}
      <section className="relative z-20 border-y border-border/20 bg-card/30 backdrop-blur-sm shadow-xl">
        <div className="container-luxury grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 md:divide-x divide-border/20">
          {[
            { icon: Award, label: t.trust.shipping },
            { icon: ShieldCheck, label: t.trust.secure },
            {
              icon: CreditCard,
              label: t.trust.cod,
              className: "sm:col-span-2 md:col-span-1",
            },
          ].map((it, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-center gap-4 py-6 md:py-12 text-cream group hover:bg-primary/5 transition-all duration-500",
                it.className,
              )}
            >
              <it.icon className="h-5 w-5 md:h-6 md:w-6 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
              <span className="text-xs sm:text-[9px] md:text-[12px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-normal">
                {it.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Collection Types Section */}
      <section className="bg-secondary/10 py-8 md:py-12">
        <div className="container-luxury">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4 md:gap-6 px-4">
              <div className="max-w-xl">
                <h2 className="font-display text-4xl sm:text-3xl md:text-7xl text-cream mb-3 md:mb-4">
                  {t.sections.categories}
                </h2>
                <div className="h-0.5 md:h-1 w-12 md:w-20 bg-primary mb-4 md:mb-6" />
                <p className="text-base sm:text-sm md:text-base">
                  {t.sections.categoriesSub}
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary hover:text-primary-glow flex items-center gap-2 group transition-colors"
              >
                {t.common.viewAll}{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 150}>
                <Link
                  to={`/category/${c.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-background"
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name_en}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/20 transition-all m-3 md:m-4" />
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 transform translate-y-2 md:translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="font-display text-2xl md:text-4xl text-cream mb-2 md:mb-3">
                      {localizedField(c, "name", locale)}
                    </h3>
                    <span className="text-xs sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary opacity-0 group-hover:opacity-100 transition-all duration-500">
                      Explore Collection
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="container-luxury py-8 md:py-12">
        <Reveal>
          <div className="flex items-center gap-3 md:gap-6 mb-6 md:mb-8 px-4">
            <h2 className="font-display text-4xl sm:text-3xl md:text-6xl text-cream whitespace-nowrap">
              {t.sections.newArrivals}
            </h2>
            <div className="h-px w-full bg-border/20" />
            <p className="text-xs sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary whitespace-nowrap font-normal">
              {t.common.new}
            </p>
          </div>
        </Reveal>

        {newArrivals.length > 0 ? (
          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-4 md:px-0 lg:grid lg:grid-cols-4">
            {newArrivals.map((p, i) => (
              <div
                key={p.id}
                className="snap-start min-w-[240px] md:min-w-[300px] lg:min-w-0"
              >
                <Reveal delay={i * 80}>
                  <ProductCard p={p} />
                </Reveal>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12 px-4">
            No new arrivals yet. Mark products as New Arrival from the admin
            panel.
          </p>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="py-8 md:py-12 bg-background border-t border-border/10 overflow-hidden">
        <div className="container-luxury">
          <Reveal>
            <div className="text-center mb-10 md:mb-12">
              <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.5em] text-primary mb-3 font-normal">
                {t.sections.reviewsTag}
              </p>
              <h2 className="font-display text-4xl sm:text-3xl md:text-5xl text-cream leading-tight">
                {t.sections.reviews}
              </h2>
              <Ornament className="mt-4" />
            </div>
          </Reveal>

          <div className="max-w-3xl mx-auto px-6">
            <div className="overflow-hidden" ref={reviewsRef}>
              <div className="flex touch-pan-y">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="flex-[0_0_100%] min-w-0 px-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex gap-1 mb-6">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <blockquote className="font-display text-xl sm:text-lg md:text-2xl text-cream/90 leading-relaxed italic mb-6 px-4">
                        "{localizedField(review, "text", locale)}"
                      </blockquote>
                      <cite className="not-italic">
                        <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-primary font-normal block mb-1">
                          {review.name}
                        </span>
                        <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-muted-foreground opacity-80">
                          {t.sections.verified}
                        </span>
                      </cite>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
