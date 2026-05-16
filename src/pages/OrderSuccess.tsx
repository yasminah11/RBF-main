import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, ShoppingBag, Home } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Ornament } from "@/components/Ornament";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { locale } = useI18n();

  const content = {
    en: {
      tag: "Thank You",
      title: "Order Placed!",
      subtitle: "Your order has been received and is being processed.",
      orderLabel: "Order Number",
      note: "You will receive a confirmation shortly. Our team will be in touch to confirm your delivery details.",
      shopMore: "Continue Shopping",
      home: "Back to Home",
    },
    ar: {
      tag: "شكراً لك",
      title: "تم تأكيد طلبك!",
      subtitle: "تم استلام طلبك وجاري معالجته.",
      orderLabel: "رقم الطلب",
      note: "ستصلك رسالة تأكيد قريباً. سيتواصل معك فريقنا لتأكيد تفاصيل التوصيل.",
      shopMore: "متابعة التسوق",
      home: "العودة للرئيسية",
    },
    tr: {
      tag: "Teşekkürler",
      title: "Siparişiniz Alındı!",
      subtitle: "Siparişiniz alındı ve işleme konuluyor.",
      orderLabel: "Sipariş Numarası",
      note: "Kısa süre içinde onay alacaksınız. Ekibimiz teslimat detaylarını onaylamak için sizinle iletişime geçecek.",
      shopMore: "Alışverişe Devam",
      home: "Ana Sayfaya Dön",
    },
  };

  const c = content[locale as keyof typeof content] || content.en;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-bold">
            {c.tag}
          </p>
          <h1 className="font-display text-5xl text-cream">{c.title}</h1>
          <Ornament className="my-4" />
          <p className="text-muted-foreground">{c.subtitle}</p>
        </div>

        {/* Order Number */}
        {orderNumber && (
          <div className="bg-card/60 border border-border/20 p-6 rounded-sm space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {c.orderLabel}
            </p>
            <p className="font-display text-3xl text-primary">{orderNumber}</p>
          </div>
        )}

        {/* Note */}
        <p className="text-sm text-muted-foreground/80 italic leading-relaxed">
          {c.note}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs uppercase tracking-widest font-bold hover:shadow-gold transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            {c.shopMore}
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 border border-border bg-background text-foreground px-8 py-3 text-xs uppercase tracking-widest font-bold hover:border-primary transition-all"
          >
            <Home className="h-4 w-4" />
            {c.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
