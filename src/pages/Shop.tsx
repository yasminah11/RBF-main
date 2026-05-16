import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedField } from "@/i18n/I18nContext";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Ornament } from "@/components/Ornament";
import { cn } from "@/lib/utils";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/constants";

export default function Shop() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let categoryId: string | undefined;
        if (slug) {
          const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
          if (cat) {
            categoryId = (cat as any).id;
            setCategoryName(localizedField(cat as any, "name", locale));
          } else {
            const mockCat = MOCK_CATEGORIES.find(c => c.slug === slug);
            setCategoryName(mockCat ? localizedField(mockCat, "name", locale) : slug);
          }
        } else if (searchQuery) {
          setCategoryName(`${t.common.search}: ${searchQuery}`);
        } else {
          setCategoryName(t.nav.shop);
        }

        let q = supabase.from("products").select("*, product_images(url, is_main, position)").eq("status", "active");
        if (categoryId) q = q.eq("category_id", categoryId);

        if (searchQuery) {
          q = q.or(`name_en.ilike.%${searchQuery}%,name_tr.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,description_en.ilike.%${searchQuery}%`);
        }

        if (sort === "newest") q = q.order("created_at", { ascending: false });
        else if (sort === "price_asc") q = q.order("price", { ascending: true });
        else q = q.order("price", { ascending: false });

        const { data } = await q;

        if (data && data.length > 0) {
          setProducts(data as any);
        } else {
          let baseProducts = MOCK_PRODUCTS;
          if (slug) {
            baseProducts = MOCK_PRODUCTS.filter(p => {
              if (slug === 'long-evening-dresses') return p.slug.includes('long');
              if (slug === 'short-evening-dresses') return p.slug.includes('short');
              if (slug === 'graduation-evening-dresses') return p.slug.includes('graduation');
              if (slug === 'mermaid-style-evening-dresses') return p.slug.includes('mermaid');
              return true;
            });
          }

          if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            baseProducts = baseProducts.filter(p =>
              p.name_en.toLowerCase().includes(lowerQuery) ||
              p.name_tr.toLowerCase().includes(lowerQuery) ||
              p.name_ar.includes(lowerQuery)
            );
          }

          setProducts(baseProducts);
        }
      } catch (err) {
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, searchQuery, locale, sort, t.nav.shop, t.common.search]);

  return (
    <div className="container-luxury py-10 md:py-16">
      <div className="text-center mb-10 px-4">
        <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-3">{t.nav.shop}</p>
        <h1 className="font-display text-4xl sm:text-3xl md:text-6xl text-cream leading-tight">{categoryName}</h1>
        <Ornament className="mt-4" />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 md:mb-12 border-b border-border/10 pb-6 px-4 md:px-0">
        <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground order-2 sm:order-1">
          {products.length} {locale === "ar" ? "منتج" : locale === "tr" ? "Ürün" : "Products"}
        </p>
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="w-full sm:w-[200px] bg-card border border-border/20 text-sm sm:text-[11px] md:text-xs uppercase tracking-widest px-4 py-3 md:py-2.5 focus:outline-none focus:border-primary transition-colors appearance-none text-cream"
          >
            <option value="newest">{locale === "ar" ? "الأحدث" : locale === "tr" ? "En Yeni" : "Newest"}</option>
            <option value="price_asc">{locale === "ar" ? "السعر: من الأقل" : locale === "tr" ? "Fiyat: Artan" : "Price: Low to High"}</option>
            <option value="price_desc">{locale === "ar" ? "السعر: من الأعلى" : locale === "tr" ? "Fiyat: Azalan" : "Price: High to Low"}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-0">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-card/50 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-0">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {products.length === 0 && (
            <div className="text-center py-24">
              <p className="text-base text-muted-foreground italic">
                {locale === "ar" ? "لم يتم العثور على منتجات." : locale === "tr" ? "Ürün bulunamadı." : "No products found."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
