import heroVideo from "@/assets/make_it_more_realastic.mp4";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Ornament } from "@/components/Ornament";
import { header1 } from "@/lib/assets";
import { useHeaderMedia } from "@/components/Header";
import {
  Award,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Star,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
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
import { toast } from "sonner";

// ─── Hero Component (reads from admin settings) ───────────────────────────

function HeroSection({ t }: { t: any }) {
  const { media, currentIndex } = useHeaderMedia();
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  const titleWords = t.hero.title.split(" ");
  const firstWord = titleWords[0];
  const restOfTitle = titleWords.slice(1).join(" ");

  const renderMedia = () => {
    if (media) {
      if (media.type === "video" && media.video_url) {
        return (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={videoMuted}
            playsInline
            poster={header1}
            className="hero-video-bg"
          >
            <source src={media.video_url} type="video/mp4" />
          </video>
        );
      }

      if (
        media.type === "slideshow" &&
        media.images.filter(Boolean).length > 1
      ) {
        return (
          <>
            {media.images.filter(Boolean).map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                  i === currentIndex ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </>
        );
      }

      if (media.type === "image" && media.images[0]) {
        return (
          <img
            src={media.images[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        );
      }
    }

    // Default: local video asset
    return (
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={videoMuted}
        playsInline
        poster={header1}
        className="hero-video-bg"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
    );
  };

  const isVideo = !media || media.type === "video";

  return (
    <section className="relative h-[85vh] md:h-screen overflow-hidden md:-mt-[120px] bg-background">
      {/* Media */}
      <div className="absolute inset-0 overflow-hidden">{renderMedia()}</div>

      <div className="grain-overlay" />

      {/* Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_hsl(var(--background)/0.7)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      {/* Slideshow dots */}
      {media?.type === "slideshow" &&
        media.images.filter(Boolean).length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {media.images.filter(Boolean).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-500",
                  i === currentIndex
                    ? "w-6 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-primary/30",
                )}
              />
            ))}
          </div>
        )}

      {/* Hero Content */}
      <div className="container-luxury relative z-20 h-full flex items-center justify-center pointer-events-none">
        <div className="max-w-3xl pointer-events-auto text-center mx-auto pt-28 sm:pt-36 md:pt-44">
          <Reveal delay={400}>
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-cream leading-[1.1] md:leading-[0.9] mb-6 md:mb-8 drop-shadow-lg">
              <span className="text-shimmer block">{firstWord}</span>
              {restOfTitle && (
                <span className="block italic opacity-95">{restOfTitle}</span>
              )}
            </h1>
          </Reveal>

          <Reveal delay={600}>
            <p className="text-base md:text-xl text-cream mb-8 md:mb-10 max-w-lg mx-auto leading-relaxed font-normal drop-shadow-md px-1 md:px-0 text-center italic">
              {t.hero.subtitle}
            </p>
          </Reveal>

          <Reveal delay={800}>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
              <Link
                to="/shop"
                className="group relative inline-flex items-center justify-center gap-4 bg-gradient-gold bg-[length:200%_auto] hover:bg-right text-primary-foreground w-fit mx-auto sm:w-auto px-8 sm:px-10 py-3 sm:py-5 text-xs sm:text-[10px] uppercase tracking-[0.3em] font-bold overflow-hidden transition-all duration-500 hover:shadow-gold-glow text-center whitespace-nowrap"
              >
                <span className="relative z-10">{t.hero.cta}</span>
                <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4 relative z-10 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Mute button — only for video */}
      {isVideo && (
        <button
          onClick={toggleMute}
          className="video-mute-btn"
          aria-label={videoMuted ? "Unmute video" : "Mute video"}
        >
          {videoMuted ? (
            <>
              <VolumeX className="h-3 w-3" /> <span>Sound off</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3 w-3" /> <span>Sound on</span>
            </>
          )}
        </button>
      )}
    </section>
  );
}

export default function Home() {
  const { t, locale, dir } = useI18n();
  const [bestSellers, setBestSellers] = useState<ProductCardData[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [trustVisible, setTrustVisible] = useState(false);
  const trustRef = useRef<HTMLDivElement>(null);

  // ── Scroll progress bar ──
  useEffect(() => {
    const bar = document.createElement("div");
    bar.id = "scroll-progress";
    document.body.appendChild(bar);
    const onScroll = () => {
      const scrolled =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);
      bar.style.width = scrolled * 100 + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      bar.remove();
    };
  }, []);

  // ── Trust section IntersectionObserver for counters ──
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTrustVisible(true);
      },
      { threshold: 0.4 },
    );
    if (trustRef.current) obs.observe(trustRef.current);
    return () => obs.disconnect();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30, skipSnaps: false, direction: dir },
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

  const [reviewsRef] = useEmblaCarousel(
    { loop: true, dragFree: true, direction: dir },
    [Autoplay({ delay: 5000, stopOnInteraction: false })],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: bestSellersData } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("status", "active")
          .eq("is_best_seller", true)
          .limit(4);

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
      } catch {
        setBestSellers(MOCK_PRODUCTS.slice(0, 4));
        setNewArrivals(MOCK_PRODUCTS.slice(0, 8));
        setCategories(MOCK_CATEGORIES);
      }
    };
    fetchData();
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Welcome to Royal Brands Fashion", {
      description:
        "You'll be the first to know about new arrivals & exclusive offers.",
    });
    setNewsletterEmail("");
    setNewsletterLoading(false);
  };

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <HeroSection t={t} />

      {/* ─── Best Sellers — Minimal Catchy Layout ───────────────────────────── */}
      <section className="container-luxury py-16 md:py-24">
        <Reveal>
          <div className="flex flex-col items-center text-center mb-12 md:mb-16">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-primary mb-4 font-medium">
              {t.common.featured || "Featured"}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-cream mb-6 italic tracking-tight">
              {t.sections.bestsellers}
            </h2>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent mb-6" />
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto font-light">
              {t.sections.bestsellersSub}
            </p>
          </div>
        </Reveal>

        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {bestSellers.map((p, i) => (
              <Reveal key={p.id} delay={i * 150}>
                <div className="group relative transition-transform duration-500 hover:-translate-y-2">
                  <ProductCard p={p} />
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12">
            No best sellers yet.
          </p>
        )}

        <Reveal delay={400}>
          <div className="flex justify-center mt-12 md:mt-16">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.3em] font-semibold text-cream hover:text-primary transition-colors"
            >
              <span className="relative">
                {t.common.viewAll || "Explore Collection"}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ─── Trust Bar — Animated Counters ────────────────────────────── */}
      <section
        ref={trustRef}
        className="relative z-20 border-y border-border/20 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(46 65% 52% / 0.4), transparent)",
          }}
        />

        <div className="container-luxury">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 md:divide-x divide-border/20">
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
                  "flex items-center justify-center gap-4 py-5 md:py-10 text-cream group hover:bg-primary/5 transition-all duration-500",
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
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(46 65% 52% / 0.4), transparent)",
          }}
        />
      </section>

      {/* ─── Collection Types — Parallax ──────────────────────────────── */}
      <section className="bg-secondary/20 py-10 md:py-16">
        <div className="container-luxury">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 md:gap-6 px-4">
              <div className="max-w-xl">
                <h2 className="font-display text-4xl sm:text-3xl md:text-7xl text-cream mb-3 md:mb-4 italic">
                  {t.sections.categories}
                </h2>
                <div className="section-gold-line" />
                <p className="text-base sm:text-sm md:text-base">
                  {t.sections.categoriesSub}
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary hover:text-[hsl(var(--primary-glow))] flex items-center gap-2 group transition-colors"
              >
                {t.common.viewAll}{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 150}>
                <Link
                  to={`/category/${c.slug}`}
                  className="category-card group relative block aspect-[4/5] overflow-hidden bg-background"
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name_en}
                      className="category-card-inner absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-500" />
                  <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/30 transition-all duration-500 m-3" />

                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="font-display text-2xl md:text-3xl text-cream mb-2 italic">
                      {localizedField(c, "name", locale)}
                    </h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                      <div className="h-px w-6 bg-primary" />
                      <span className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-primary">
                        Explore
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── New Arrivals ─────────────────────────────────────────────── */}
      <section className="container-luxury py-8 md:py-16">
        <Reveal>
          <div className="flex items-center gap-3 md:gap-6 mb-8 md:mb-10 px-4">
            <h2 className="font-display text-4xl sm:text-3xl md:text-6xl text-cream whitespace-nowrap italic">
              {t.sections.newArrivals}
            </h2>
            <div className="h-px w-full bg-border/20" />
            <p className="text-xs sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] text-primary whitespace-nowrap font-normal">
              {t.common.new}
            </p>
          </div>
        </Reveal>

        {newArrivals.length > 0 ? (
          <div className="relative">
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-4 md:px-0 lg:grid lg:grid-cols-4">
              {newArrivals.map((p, i) => (
                <div
                  key={p.id}
                  className="snap-start min-w-[240px] md:min-w-[280px] lg:min-w-0"
                >
                  <Reveal delay={i * 80}>
                    <ProductCard p={p} />
                  </Reveal>
                </div>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none lg:hidden" />
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12 px-4">
            No new arrivals yet.
          </p>
        )}
      </section>

      {/* ─── Community & Exclusive Access ──────────────────────────────── */}
      <section className="relative py-16 md:py-24 bg-gradient-navy border-t border-border/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-navy-light opacity-30 pointer-events-none" />

        <div className="container-luxury relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Column: Newsletter */}
            <div className="flex flex-col text-center lg:text-start px-4 lg:px-0 lg:border-r lg:border-border/10 lg:pr-16">
              <Reveal>
                <p className="text-[10px] uppercase tracking-[0.5em] text-primary mb-4 font-normal">
                  Private Fashion Club
                </p>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight italic">
                  Join the Inner Circle
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-10 leading-relaxed font-light">
                  Enter a world of unparalleled luxury. Subscribe to unlock
                  private VIP collections, exclusive early access to our
                  seasonal archives, and curated styling secrets from our
                  atelier. Only for the distinguished few.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <form
                  onSubmit={handleNewsletter}
                  className="flex flex-col sm:flex-row gap-0 w-full max-w-md mx-auto lg:mx-0 border border-border/40 overflow-hidden"
                >
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 bg-card/60 backdrop-blur-sm px-5 py-4 text-sm text-cream placeholder:text-muted-foreground/50 outline-none focus:bg-card/80 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="group flex items-center justify-center gap-2 bg-gradient-gold bg-[length:200%_auto] hover:bg-right text-primary-foreground px-6 py-4 text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 hover:shadow-gold-glow disabled:opacity-60 whitespace-nowrap"
                  >
                    {newsletterLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <>
                        Request Access{" "}
                        <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mt-4 text-center lg:text-start">
                  Your exclusivity is guaranteed. Unsubscribe anytime.
                </p>
              </Reveal>
            </div>

            {/* Right Column: Testimonials Carousel */}
            <div className="flex flex-col">
              <Reveal delay={300}>
                <div className="text-center lg:text-start mb-8 px-4 lg:px-0">
                  <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.5em] text-primary mb-3 font-normal">
                    {t.sections.reviewsTag}
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl text-cream leading-tight italic">
                    {t.sections.reviews}
                  </h2>
                  <Ornament className="mt-4 lg:justify-start" />
                </div>
              </Reveal>

              <div
                className="w-full overflow-hidden px-4 lg:px-0"
                ref={reviewsRef}
              >
                <div className="flex touch-pan-y">
                  {MOCK_REVIEWS.map((review) => (
                    <div
                      key={review.id}
                      className="flex-[0_0_100%] min-w-0 lg:pr-4"
                    >
                      <div className="group relative flex flex-col text-center lg:text-start bg-gradient-navy border border-border/10 p-8 lg:p-10 transition-all duration-700 h-full mx-2 lg:mx-0 hover:shadow-card hover:border-primary/30 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-navy-light opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-center lg:justify-start gap-1 mb-6">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-3.5 w-3.5 fill-primary text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                              />
                            ))}
                          </div>
                          <blockquote className="font-display text-lg sm:text-xl text-cream/90 leading-relaxed italic mb-8 flex-1">
                            "{localizedField(review, "text", locale)}"
                          </blockquote>
                          <cite className="not-italic mt-auto">
                            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-primary font-normal block mb-1">
                              {review.name}
                            </span>
                            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-muted-foreground opacity-80">
                              {t.sections.verified}
                            </span>
                          </cite>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
