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
    text_en: "The craftsmanship is unparalleled. Stepping into my Royal Brands gown felt like a transformation. The silk draped like a second skin, and the meticulous attention to detail left me breathless. It wasn't just a dress; it was a moment of absolute perfection that I will cherish forever.",
    text_ar: "الحرفية لا مثيل لها. ارتداء فستان رويال براندز الخاص بي كان بمثابة تحول. انسكب الحرير كطبقة ثانية من الجلد، والاهتمام الدقيق بالتفاصيل تركني بلا أنفاس. لم يكن مجرد فستان؛ لقد كانت لحظة من الكمال المطلق التي سأعتز بها إلى الأبد.",
    text_tr: "İşçilik tek kelimeyle eşsiz. Royal Brands elbisemi giydiğimde adeta dönüştüğümü hissettim. İpek üzerimde ikinci bir ten gibi duruyordu ve detaylara gösterilen özen beni büyüledi. Bu sadece bir elbise değildi; sonsuza dek değer vereceğim mutlak bir mükemmellik anıydı.",
    rating: 5
  },
  {
    id: 2,
    name: "Leyla Demir",
    text_en: "A truly exquisite experience from start to finish. Finding a couture piece that balances modern elegance with timeless grace is rare. When I wore it to the gala, the room simply paused. The personalized service made me feel like fashion royalty.",
    text_ar: "تجربة رائعة حقاً من البداية إلى النهاية. من النادر العثور على قطعة كوتور توازن بين الأناقة العصرية والجاذبية الخالدة. عندما ارتديته في الحفل، توقفت الغرفة ببساطة. الخدمة الشخصية جعلتني أشعر وكأنني من ملوك الموضة.",
    text_tr: "Baştan sona gerçekten zarif bir deneyim. Modern zarafeti zamansız bir incelikle dengeleyen bir couture parçası bulmak nadirdir. Galada giydiğimde herkesin nefesi kesildi. Kişiselleştirilmiş hizmet beni adeta moda kraliyetinin bir parçası gibi hissettirdi.",
    rating: 5
  },
  {
    id: 3,
    name: "Sophia L.",
    text_en: "Maison Royal has entirely redefined my expectations of haute couture. The way their silhouettes celebrate the feminine form is nothing short of artistic genius. Absolute elegance in every single stitch—I have never felt more confident and radiant.",
    text_ar: "لقد أعاد ميزون رويال تعريف توقعاتي للأزياء الراقية (هوت كوتور) بالكامل. الطريقة التي تحتفل بها تصاميمهم بالشكل الأنثوي ليست سوى عبقرية فنية. أناقة مطلقة في كل غرزة - لم أشعر يوماً بمزيد من الثقة والإشراق.",
    text_tr: "Maison Royal, haute couture beklentilerimi tamamen yeniden tanımladı. Silüetlerinin kadın formunu yüceltiş şekli tam anlamıyla sanatsal bir deha. Her bir dikişte mutlak zarafet—hiçbir zaman bu kadar özgüvenli ve ışıltılı hissetmemiştim.",
    rating: 5
  }
];
