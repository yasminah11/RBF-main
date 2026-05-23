import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle,
  XCircle,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScanStatus = "loading" | "success" | "error" | "already_zero";

export default function QRScan() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ScanStatus>("loading");
  const [productName, setProductName] = useState("");
  const [newQty, setNewQty] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const process = async () => {
      let sku = searchParams.get("sku");
      const rawData = searchParams.get("data");

      if (!sku && rawData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(rawData));
          sku = parsed.sku;
        } catch {
          sku = rawData;
        }
      }

      if (!sku) {
        setStatus("error");
        setErrorMsg("Invalid QR code — no SKU found.");
        return;
      }

      try {
        // Find inventory item
        const { data: item, error } = await supabase
          .from("inventory")
          .select(
            `
            id, sku, quantity, product_id,
            product:products(name_en, name_ar, name_tr)
          `,
          )
          .eq("sku", sku)
          .maybeSingle();

        if (error || !item) {
          setStatus("error");
          setErrorMsg(`Product not found for SKU: ${sku}`);
          return;
        }

        const productData = item.product as any;
        setProductName(
          productData?.name_en || productData?.name_ar || "Product",
        );

        if (item.quantity <= 0) {
          setStatus("already_zero");
          setNewQty(0);
          return;
        }

        const updatedQty = item.quantity - 1;

        // Update inventory
        const { error: updateErr } = await supabase
          .from("inventory")
          .update({ quantity: updatedQty })
          .eq("id", item.id);

        if (updateErr) throw updateErr;

        // Log the scan
        await supabase.from("inventory_logs").insert({
          inventory_id: item.id,
          product_id: item.product_id,
          action_type: "scan",
          quantity_change: -1,
          quantity_before: item.quantity,
          quantity_after: updatedQty,
          notes: "QR Scan — mobile/scanner auto deduct",
        });

        setNewQty(updatedQty);
        setStatus("success");
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e.message || "Something went wrong.");
      }
    };

    process();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 border border-primary flex items-center justify-center mb-3">
            <span className="font-display text-sm text-primary font-bold">
              RBF
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Royal Brands Fashion
          </p>
        </div>

        {/* Status Card */}
        <div
          className={cn(
            "border rounded-lg p-8 flex flex-col items-center text-center space-y-4 transition-all",
            status === "loading" && "border-border bg-card",
            status === "success" && "border-green-500/30 bg-green-500/5",
            status === "already_zero" && "border-yellow-500/30 bg-yellow-500/5",
            status === "error" && "border-red-500/30 bg-red-500/5",
          )}
        >
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground uppercase tracking-widest">
                Processing...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-green-500 mb-2">
                  Stock Deducted
                </p>
                <p className="font-display text-xl text-foreground mb-1">
                  {productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  1 unit removed from inventory
                </p>
              </div>
              <div className="w-full border border-border rounded p-3 bg-background">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Remaining Stock
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    newQty === 0
                      ? "text-red-500"
                      : newQty <= 3
                        ? "text-yellow-500"
                        : "text-foreground",
                  )}
                >
                  {newQty}
                </p>
              </div>
              {newQty === 0 && (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-xs text-red-500 uppercase tracking-widest">
                    ⚠️ Out of Stock
                  </p>
                </div>
              )}
              {newQty > 0 && newQty <= 3 && (
                <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="text-xs text-yellow-500 uppercase tracking-widest">
                    ⚠️ Low Stock
                  </p>
                </div>
              )}
            </>
          )}

          {status === "already_zero" && (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-500 mb-2">
                  Already Out of Stock
                </p>
                <p className="font-display text-xl text-foreground mb-1">
                  {productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  This item has 0 units in inventory.
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 mb-2">
                  Scan Failed
                </p>
                <p className="text-xs text-muted-foreground">{errorMsg}</p>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        {status !== "loading" && (
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight className="h-3 w-3 rotate-180" />
              Back to Store
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
