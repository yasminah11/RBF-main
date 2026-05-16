import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Banknote,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { createPaymentSession } from "@/lib/payment-api";
import { supabase } from "@/integrations/supabase/client";
import { cart } from "@/store/cart";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type PaymentMethod = "iyzico" | "cod" | "whatsapp";

interface PaymentSectionProps {
  items: any[];
  totalAmount: number;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  };
  isValid: boolean;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `RB-${timestamp}${random}`;
}

async function saveOrderToSupabase(
  items: any[],
  totalAmount: number,
  clientInfo: PaymentSectionProps["clientInfo"],
  paymentMethod: string,
  paymentStatus: string = "pending",
) {
  const orderNumber = generateOrderNumber();

  const orderItems = items.map((i) => ({
    id: i.id || i.variantId,
    name: i.name,
    image: i.image,
    quantity: i.quantity,
    price: i.price,
    variantLabel: i.variantLabel || "",
  }));

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: clientInfo.name,
      customer_email: clientInfo.email,
      customer_phone: clientInfo.phone,
      shipping_address: clientInfo.address,
      city: clientInfo.city,
      district: clientInfo.district,
      items: orderItems,
      subtotal: totalAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      status: "processing",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function PaymentSection({
  items,
  totalAmount,
  clientInfo,
  isValid,
}: PaymentSectionProps) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>("iyzico");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  const WHATSAPP_NUMBER = "201000000000";

  const handleCOD = async () => {
    if (!isValid || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const order = await saveOrderToSupabase(
        items,
        totalAmount,
        clientInfo,
        "cod",
        "pending",
      );
      cart.clear();
      toast.success("Order placed successfully!");
      navigate(`/order-success?order=${order.order_number}`);
    } catch (err: any) {
      setError("Failed to place order: " + err.message);
      toast.error("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendToWhatsApp = async () => {
    if (!isValid || items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const order = await saveOrderToSupabase(
        items,
        totalAmount,
        clientInfo,
        "whatsapp",
        "pending",
      );

      let message = "";
      if (locale === "ar") {
        message = `مرحباً، أود تأكيد طلبي:\n\n🔖 رقم الطلب: ${order.order_number}\n\n🛍️ طلبي:\n`;
        items.forEach((item) => {
          message += `- ${item.name} (${item.variantLabel || ""}) × ${item.quantity} = ${item.price * item.quantity} جنيه\n`;
        });
        message += `\n💰 الإجمالي: ${totalAmount} جنيه\n\n📦 العنوان: ${clientInfo.address}, ${clientInfo.district}, ${clientInfo.city}`;
      } else if (locale === "tr") {
        message = `Merhaba, siparişimi onaylamak istiyorum:\n\n🔖 Sipariş No: ${order.order_number}\n\n🛍️ Siparişim:\n`;
        items.forEach((item) => {
          message += `- ${item.name} (${item.variantLabel || ""}) × ${item.quantity} = ${item.price * item.quantity}\n`;
        });
        message += `\n💰 Toplam: ${totalAmount}\n\n📦 Adres: ${clientInfo.address}, ${clientInfo.district}, ${clientInfo.city}`;
      } else {
        message = `Hello, I'd like to confirm my order:\n\n🔖 Order #: ${order.order_number}\n\n🛍️ My Order:\n`;
        items.forEach((item) => {
          message += `- ${item.name} (${item.variantLabel || ""}) × ${item.quantity} = ${item.price * item.quantity}\n`;
        });
        message += `\n💰 Total: ${totalAmount}\n\n📦 Address: ${clientInfo.address}, ${clientInfo.district}, ${clientInfo.city}`;
      }

      cart.clear();
      toast.success("Order saved! Redirecting to WhatsApp...");

      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
        "_blank",
      );
      navigate(`/order-success?order=${order.order_number}`);
    } catch (err: any) {
      setError("Failed to place order: " + err.message);
      toast.error("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeIyzico = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await createPaymentSession({
        items,
        totalAmount,
        currency: "TRY",
        clientInfo,
      });

      if (response.status === "success" && response.checkoutFormContent) {
        setSessionInitialized(true);
        const container = document.getElementById("iyzico-checkout-form");
        if (container) {
          container.innerHTML = response.checkoutFormContent;
        }
      } else {
        setError(
          response.errorMessage || "Failed to initialize payment gateway.",
        );
      }
    } catch (err) {
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [items, totalAmount, clientInfo]);

  useEffect(() => {
    if (method === "iyzico" && isValid && !sessionInitialized) {
      initializeIyzico();
    }
  }, [method, isValid, sessionInitialized, initializeIyzico]);

  return (
    <section className="bg-card/40 backdrop-blur-sm border border-border/10 p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-3 border-b border-border/10 pb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl text-cream">
          {t.checkout.paymentMethod}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Iyzico */}
        <button
          onClick={() => setMethod("iyzico")}
          className={cn(
            "flex flex-col items-center gap-4 p-6 border transition-all duration-500 relative overflow-hidden group",
            method === "iyzico"
              ? "border-primary bg-primary/5 shadow-luxury"
              : "border-border/10 bg-background/20 hover:border-primary/40",
          )}
        >
          <div className="bg-white px-3 py-1 rounded shadow-sm scale-75">
            <span className="text-[#19385c] font-black italic tracking-tighter">
              iyzi
            </span>
            <span className="text-[#207ecc] font-black italic tracking-tighter">
              co
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cream">
            {t.checkout.creditCard}
          </span>
          {method === "iyzico" && (
            <motion.div
              layoutId="payment-check"
              className="absolute top-2 right-2"
            >
              <Check className="h-3 w-3 text-primary" />
            </motion.div>
          )}
        </button>

        {/* COD */}
        <button
          onClick={() => setMethod("cod")}
          className={cn(
            "flex flex-col items-center gap-4 p-6 border transition-all duration-500 relative overflow-hidden group",
            method === "cod"
              ? "border-primary bg-primary/5 shadow-luxury"
              : "border-border/10 bg-background/20 hover:border-primary/40",
          )}
        >
          <Banknote className="h-6 w-6 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cream">
            {t.checkout.cod}
          </span>
          {method === "cod" && (
            <motion.div
              layoutId="payment-check"
              className="absolute top-2 right-2"
            >
              <Check className="h-3 w-3 text-primary" />
            </motion.div>
          )}
        </button>

        {/* WhatsApp */}
        <button
          onClick={() => setMethod("whatsapp")}
          className={cn(
            "flex flex-col items-center gap-4 p-6 border transition-all duration-500 relative overflow-hidden group",
            method === "whatsapp"
              ? "border-[#25D366] bg-[#25D366]/5 shadow-luxury"
              : "border-border/10 bg-background/20 hover:border-[#25D366]/40",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-[#25D366]"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-cream text-center">
            {t.checkout.whatsappOrder}
          </span>
          {method === "whatsapp" && (
            <motion.div
              layoutId="payment-check"
              className="absolute top-2 right-2"
            >
              <Check className="h-3 w-3 text-[#25D366]" />
            </motion.div>
          )}
        </button>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {method === "iyzico" ? (
            <motion.div
              key="iyzico-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {!isValid ? (
                <div className="bg-primary/5 border border-primary/20 p-8 text-center rounded-sm">
                  <AlertCircle className="h-6 w-6 text-primary/60 mx-auto mb-3" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Please complete your shipping information to proceed with
                    online payment.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-background/40 border border-border/10 p-1 min-h-[200px] flex items-center justify-center relative">
                    {loading && (
                      <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                          Securing Payment Session...
                        </p>
                      </div>
                    )}
                    {error ? (
                      <div className="text-center p-8">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                        <p className="text-sm text-cream mb-4">{error}</p>
                        <button
                          onClick={initializeIyzico}
                          className="text-[10px] uppercase tracking-widest text-primary hover:text-primary-glow underline underline-offset-4"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div id="iyzico-checkout-form" className="w-full">
                        {!loading && !sessionInitialized && (
                          <div className="p-8 text-center text-muted-foreground italic text-sm">
                            Initializing secure payment...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-6">
                    Secure encrypted transaction powered by Iyzico
                  </p>
                </>
              )}
            </motion.div>
          ) : method === "cod" ? (
            <motion.div
              key="cod-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary/5 border border-primary/20 p-6 md:p-10 text-center rounded-sm"
            >
              <p className="text-primary font-bold text-[11px] uppercase tracking-[0.3em] mb-3">
                {t.checkout.payAtDoor}
              </p>
              <p className="text-muted-foreground text-xs italic mb-0">
                {t.checkout.payAtDoorNote}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-primary/60 mt-4">
                {t.checkout.codFee}
              </p>
              {error && (
                <p className="text-destructive text-xs mt-4">{error}</p>
              )}
              <div className="mt-8 md:mt-10 flex justify-center">
                <button
                  disabled={!isValid || loading}
                  onClick={handleCOD}
                  className="group relative w-fit mx-auto sm:w-auto px-12 sm:px-10 bg-primary text-primary-foreground py-4 text-[10px] uppercase tracking-[0.4em] font-bold overflow-hidden transition-all hover:shadow-gold disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span className="relative z-10">
                    {t.checkout.completeOrder}
                  </span>
                  <div className="absolute inset-0 bg-primary-glow translate-y-full transition-transform group-hover:translate-y-0" />
                </button>
              </div>
            </motion.div>
          ) : method === "whatsapp" ? (
            <motion.div
              key="whatsapp-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#25D366]/5 border border-[#25D366]/20 p-6 md:p-10 text-center rounded-sm"
            >
              <p className="text-[#25D366] font-bold text-[11px] uppercase tracking-[0.3em] mb-3">
                {t.checkout.whatsappOrder}
              </p>
              <p className="text-muted-foreground text-xs italic mb-0">
                {t.checkout.whatsappNote}
              </p>
              {error && (
                <p className="text-destructive text-xs mt-4">{error}</p>
              )}
              <div className="mt-8 md:mt-10 flex justify-center">
                <button
                  disabled={!isValid || loading}
                  onClick={sendToWhatsApp}
                  className="group relative flex items-center justify-center gap-3 w-fit mx-auto px-12 sm:px-10 bg-[#25D366] text-white py-4 text-[10px] uppercase tracking-[0.4em] font-bold overflow-hidden transition-all hover:bg-[#1DA851] disabled:opacity-50 disabled:grayscale shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="shrink-0"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                  )}
                  <span className="relative z-10">
                    {t.cart.whatsappCheckout}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
