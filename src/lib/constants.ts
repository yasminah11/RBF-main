import { type ProductCardData } from "@/components/ProductCard";

export type Category = { id: string; slug: string; name_ar: string; name_en: string; name_tr: string; image: string | null };

export const MOCK_PRODUCTS: ProductCardData[] = [
  { id: "4", sku: "LFB-004", slug: "graduation-lace-dress", name_en: "Graduation Lace Dress", name_ar: "فستان تخرج من الدانتيل", name_tr: "Dantelli Mezuniyet Elbisesi", price: 1500, is_on_sale: false, sale_price: null },
  { id: "5", sku: "LFB-005", slug: "mermaid-evening-dress", name_en: "Mermaid Style Evening Dress", name_ar: "فستان سهرة بتصميم حورية البحر", name_tr: "Balık Model Abiye Elbise", price: 1100, is_on_sale: false, sale_price: null },
  { id: "8", sku: "LFB-008", slug: "graduation-classic-gown", name_en: "Classic Graduation Gown", name_ar: "فستان تخرج كلاسيكي", name_tr: "Klasik Mezuniyet Elbisesi", price: 200, is_on_sale: false, sale_price: null },
  { id: "9", sku: "LFB-009", slug: "mermaid-velvet-gown", name_en: "Mermaid Velvet Gown", name_ar: "فستان حورية البحر من المخمل", name_tr: "Kadife Balık Model Elbise", price: 400, is_on_sale: false, sale_price: null },
];

export const MOCK_PRODUCTS_FULL = MOCK_PRODUCTS.map(p => ({
  ...p,
  description_en: `A masterpiece of contemporary luxury from Royal Brands Fashion. This ${p.name_en.toLowerCase()} is meticulously crafted using the finest materials to ensure unparalleled elegance and comfort.`,
  description_ar: `تحفة فنية من الفخامة المعاصرة من رويال براندز فاشن. صُنع هذا الـ ${p.name_en.toLowerCase()} بعناية فائقة باستخدام أجود المواد لضمان أناقة وراحة لا مثيل لهما.`,
  description_tr: `Royal Brands Fashion'dan çağdaş lüksün bir başyapıtı. Bu ${p.name_en.toLowerCase()}, benzersiz zarafet ve konfor sağlamak için en iyi malzemeler kullanılarak titizlikle üretilmiştir.`,
  category_id: p.slug.includes("graduation") ? "c3" : "c4"
}));

export const MOCK_CATEGORIES: Category[] = [
  { id: "c3", slug: "graduation-evening-dresses", name_en: "Graduation Evening Dresses", name_ar: "فستان سهرة للتخرج", name_tr: "Mezuniyet Abiye Elbiseleri", image: null },
  { id: "c4", slug: "mermaid-style-evening-dresses", name_en: "Mermaid Style Evening Dresses", name_ar: "فستان سهرة بتصميم حورية البحر", name_tr: "Balık Model Abiye Elbiseler", image: null },
];

export const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Alexandra V.",
    text_en: "The craftsmanship is unparalleled. My evening gown felt like a second skin, draped in pure luxury.",
    text_ar: "الحرفية لا مثيل لها. فستان السهرة الخاص بي كان وكأنه طبقة ثانية من الجلد، مكسواً بالفخامة الخالصة.",
    text_tr: "İşçilik tek kelimeyle eşsiz. Gece elbisem üzerimde adeta ikinci bir ten gibiydi, saf lüksle sarmalanmış hissettim.",
    rating: 5
  },
  {
    id: 2,
    name: "Leyla Demir",
    text_en: "A truly royal experience. From the ordering process to the final delivery, everything was exquisite.",
    text_ar: "تجربة ملكية حقاً. من عملية الطلب وحتى التسليم النهائي، كان كل شيء رائعاً.",
    text_tr: "Gerçekten asil bir deneyim. Sipariş sürecinden son teslimata kadar her şey mükemmeldi.",
    rating: 5
  },
  {
    id: 3,
    name: "Sophia L.",
    text_en: "Maison Royal has redefined my standard for evening wear. Absolute elegance in every stitch.",
    text_ar: "لقد أعاد ميزون رويال تعريف معاييري لأزياء السهرة. أناقة مطلقة في كل غرزة.",
    text_tr: "Maison Royal, abiye giyim standartlarımı yeniden belirledi. Her dikişte mutlak zarafet var.",
    rating: 5
  }
];
