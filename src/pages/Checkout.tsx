import { useCart, cartTotal, cart } from "@/store/cart";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";
import { Truck, ShieldCheck, MapPin, User, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PaymentSection } from "@/components/checkout/PaymentSection";

type ApiProvince = { id: number; name: string };
type ApiDistrict = { id: number; name: string; provinceId: number };

export default function Checkout() {
  const items = useCart();
  const { t, formatPrice, locale } = useI18n();
  const subtotal = cartTotal(items);
  const shipping = 0;
  const total = subtotal + shipping;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    cityId: null as number | null,
    district: "",
  });

  const [citySearch, setCitySearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // API Data
  const [provinces, setProvinces] = useState<ApiProvince[]>([]);
  const [districts, setDistricts] = useState<ApiDistrict[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const isFormValid = useMemo(() => {
    return !!(formData.name && formData.email && formData.phone && formData.address && formData.city && formData.district);
  }, [formData]);

  // Fetch Cities (Provinces) from TurkiyeAPI
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("https://api.turkiyeapi.dev/v1/provinces?sort=name");
        const json = await res.json();
        if (json.data) setProvinces(json.data);
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch Districts when city changes
  useEffect(() => {
    if (!formData.cityId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`https://api.turkiyeapi.dev/v1/districts?provinceId=${formData.cityId}&sort=name`);
        const json = await res.json();
        if (json.data) setDistricts(json.data);
      } catch (err) {
        console.error("Failed to fetch districts", err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [formData.cityId]);

  const filteredProvinces = useMemo(() => {
    return provinces.filter(p => 
      p.name.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [provinces, citySearch]);

  const filteredDistricts = useMemo(() => {
    return districts.filter(d => 
      d.name.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districts, districtSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectCity = (name: string, id: number) => {
    setFormData(prev => ({ ...prev, city: name, cityId: id, district: "" }));
    setCitySearch(name);
    setShowCityDropdown(false);
    setDistrictSearch("");
  };

  const selectDistrict = (name: string) => {
    setFormData(prev => ({ ...prev, district: name }));
    setDistrictSearch(name);
    setShowDistrictDropdown(false);
  };

  if (items.length === 0) {
    return (
      <div className="container-luxury py-12 text-center">
        <h2 className="font-display text-4xl sm:text-3xl text-cream mb-6">{t.product.selectionNotFound}</h2>
        <p className="text-xl sm:text-muted-foreground mb-10">{t.cart.empty}</p>
        <Link to="/shop" className="bg-primary text-primary-foreground px-8 py-3 text-sm sm:text-[10px] uppercase tracking-widest font-bold">
          {t.product.backToCollections}
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="container-luxury py-10 md:py-16">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary mb-3 font-bold">{t.checkout.tag}</p>
          <h1 className="font-display text-5xl sm:text-4xl md:text-6xl text-cream">{t.checkout.title}</h1>
          <Ornament className="mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 space-y-12">

            {/* Shipping Information Section (Second) */}
            <section className="bg-card/40 backdrop-blur-sm border border-border/10 p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-display text-3xl sm:text-2xl text-cream">{t.checkout.clientInfo}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">{t.checkout.fullName}</label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Jane Doe"
                    className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">{t.checkout.email}</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jane@example.com"
                    className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">{t.checkout.phone}</label>
                  <input 
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+90 555 123 45 67"
                    className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream"
                  />
                </div>

                <div className="space-y-2 md:col-span-2 border-t border-border/10 pt-6 mt-2">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm sm:text-xs uppercase tracking-[0.2em] text-cream font-bold">{t.checkout.deliveryTurkeyOnly}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* City Selector */}
                    <div className="space-y-2 relative">
                      <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">{t.checkout.city}</label>
                      <div className="relative">
                        <input 
                          type="text" value={citySearch}
                          onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
                          onFocus={() => setShowCityDropdown(true)}
                          placeholder={loadingProvinces ? "..." : "Select"}
                          className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream"
                        />
                      </div>
                      <AnimatePresence>
                        {showCityDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="absolute z-40 top-full left-0 right-0 mt-1 bg-card border border-border/20 max-h-[200px] overflow-y-auto shadow-2xl scrollbar-hide"
                          >
                            {filteredProvinces.map(p => (
                              <button key={p.id} onClick={() => selectCity(p.name, p.id)} className="w-full text-start px-4 py-2.5 text-xs text-cream hover:bg-primary/10 border-b border-border/5">{p.name}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* District Selector */}
                    <div className="space-y-2 relative">
                      <label className={cn("text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground transition-opacity", !formData.city && "opacity-30")}>{t.checkout.district}</label>
                      <div className="relative">
                        <input 
                          type="text" value={districtSearch}
                          onChange={(e) => { setDistrictSearch(e.target.value); setShowDistrictDropdown(true); }}
                          onFocus={() => setShowDistrictDropdown(true)}
                          disabled={!formData.city}
                          placeholder={loadingDistricts ? "..." : formData.city ? "Select District" : "Select city first"}
                          className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream disabled:opacity-30"
                        />
                      </div>
                      <AnimatePresence>
                        {showDistrictDropdown && formData.city && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="absolute z-40 top-full left-0 right-0 mt-1 bg-card border border-border/20 max-h-[200px] overflow-y-auto shadow-2xl scrollbar-hide"
                          >
                            {filteredDistricts.map(d => (
                              <button key={d.id} onClick={() => selectDistrict(d.name)} className="w-full text-start px-4 py-2.5 text-xs text-cream hover:bg-primary/10 border-b border-border/5">{d.name}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs sm:text-[10px] uppercase tracking-widest text-muted-foreground">{t.checkout.address}</label>
                  <textarea 
                    name="address" value={formData.address} onChange={handleInputChange} rows={3}
                    placeholder="Mahalle, Sokak, No, Kat/Daire..."
                    className="w-full bg-background/40 border border-border/20 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-primary transition-all text-cream resize-none"
                  />
                </div>
              </div>
            </section>

            {/* NEW Refactored Payment Section (Second) */}
            <PaymentSection 
              items={items}
              totalAmount={total}
              clientInfo={formData}
              isValid={isFormValid}
            />
          </div>

          <div className="lg:col-span-5">
            <div className="bg-card/60 backdrop-blur-md border border-border/20 p-6 md:p-8 sticky top-28 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-border/10 pb-4 mb-6">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-display text-3xl sm:text-2xl text-cream">{t.checkout.orderSummary}</h2>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide mb-8">
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((i) => (
                    <motion.div 
                      key={i.variantId} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                      className="flex gap-4 group relative"
                    >
                      <div className="w-14 h-18 shrink-0 overflow-hidden bg-secondary">
                        <img src={i.image} alt={i.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display text-base sm:text-sm text-cream mb-0.5 leading-tight">{i.name}</h4>
                          <button 
                            onClick={() => cart.remove(i.variantId)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1 -mr-1"
                            aria-label={t.cart.remove}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-[9px] uppercase tracking-widest text-primary font-medium">{i.variantLabel}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-sm sm:text-[10px] text-muted-foreground">{i.quantity} x {formatPrice(i.price)}</span>
                          <span className="text-base sm:text-xs text-cream">{formatPrice(i.price * i.quantity)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/10 mb-8">
                <div className="flex justify-between text-sm sm:text-[11px] uppercase tracking-widest">
                  <span className="text-muted-foreground">{t.cart.subtotal}</span>
                  <span className="text-cream">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-[11px] uppercase tracking-widest">
                  <span className="text-muted-foreground">{t.checkout.shipping}</span>
                  <div className="text-end">
                    <span className="text-primary font-bold block">{locale === "ar" ? "مجاني" : locale === "tr" ? "Ücretsiz" : "Complimentary"}</span>
                    {formData.city && <span className="text-xs sm:text-[8px] text-muted-foreground block mt-1">To {formData.city}, TR</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/20 pt-6 flex justify-between items-end mb-10">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">{t.checkout.grandTotal}</span>
                  <span className="text-primary text-4xl sm:text-3xl font-light">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/10">
                <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary/60" /><span className="text-xs sm:text-[8px] uppercase tracking-widest text-muted-foreground">{t.checkout.secureSsl}</span></div>
                <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary/60" /><span className="text-xs sm:text-[8px] uppercase tracking-widest text-muted-foreground">{t.checkout.turkeyDelivery}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
