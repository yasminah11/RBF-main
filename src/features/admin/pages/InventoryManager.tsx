import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Search,
  QrCode,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import QRCode from "qrcode";

interface InventoryItem {
  id: string;
  product_id: string;
  color_variant_id: string | null;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  qr_code: string | null;
  created_at: string;
  updated_at: string;
  product?: { name_en: string; name_ar: string; name_tr: string; sku: string };
  color_variant?: { name_en: string; hex_color: string | null };
}

interface InventoryLog {
  id: string;
  inventory_id: string;
  product_id: string;
  action_type: "add" | "remove" | "adjust" | "scan";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  notes: string | null;
  created_at: string;
  product?: { name_en: string; name_ar: string; name_tr: string };
}

function generateSKU(productSku: string, suffix?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const base = productSku || "RB";
  return suffix ? `${base}-${suffix}-${timestamp}` : `${base}-${timestamp}`;
}

const SCAN_BASE_URL = window.location.origin;

function generateQRUrl(sku: string): string {
  return `${SCAN_BASE_URL}/scan?sku=${encodeURIComponent(sku)}`;
}

function StatusBadge({
  status,
  t,
}: {
  status: InventoryItem["status"];
  t: any;
}) {
  const map = {
    in_stock: {
      label: t.admin.inventory.inStock,
      icon: CheckCircle,
      cls: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    low_stock: {
      label: t.admin.inventory.lowStock,
      icon: AlertTriangle,
      cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    out_of_stock: {
      label: t.admin.inventory.outOfStock,
      icon: XCircle,
      cls: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };
  const { label, icon: Icon, cls } = map[status];
  return (
    <Badge
      className={cn("text-[10px] uppercase tracking-widest gap-1 border", cls)}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function InventoryManager() {
  const { locale, t } = useI18n();
  const inv = t.admin.inventory;

  const getProductName = (item: InventoryItem) => {
    if (locale === "ar")
      return item.product?.name_ar || item.product?.name_en || "—";
    if (locale === "tr")
      return item.product?.name_tr || item.product?.name_en || "—";
    return item.product?.name_en || "—";
  };

  const getLogProductName = (log: InventoryLog) => {
    if (locale === "ar")
      return log.product?.name_ar || log.product?.name_en || "—";
    if (locale === "tr")
      return log.product?.name_tr || log.product?.name_en || "—";
    return log.product?.name_en || "—";
  };

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"inventory" | "logs">("inventory");
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [qrModal, setQrModal] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "adjust">(
    "add",
  );
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inventory")
      .select(
        `*, product:products(name_en, name_ar, name_tr, sku), color_variant:product_color_variants(name_en, hex_color)`,
      )
      .order("updated_at", { ascending: false });
    if (data) setInventory(data as any);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("inventory_logs")
      .select(`*, product:products(name_en, name_ar, name_tr)`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setLogs(data as any);
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();
  }, []);

  const syncInventory = async () => {
    const loadingToast = toast.loading(inv.syncing);
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, sku, product_color_variants(id, name_en, stock_quantity)");
      if (!products) return;
      for (const product of products) {
        const variants = (product as any).product_color_variants || [];
        if (variants.length > 0) {
          for (const variant of variants) {
            const { data: existing } = await supabase
              .from("inventory")
              .select("id")
              .eq("product_id", product.id)
              .eq("color_variant_id", variant.id)
              .maybeSingle();
            if (!existing) {
              const sku = generateSKU(
                product.sku,
                variant.name_en.slice(0, 3).toUpperCase(),
              );
              const qrData = generateQRUrl(sku);
              const qrUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
              });

              await supabase.from("inventory").insert({
                product_id: product.id,
                color_variant_id: variant.id,
                sku,
                quantity: variant.stock_quantity ?? 0,
                qr_code: qrUrl,
              });
            }
          }
        } else {
          const { data: existing } = await supabase
            .from("inventory")
            .select("id")
            .eq("product_id", product.id)
            .is("color_variant_id", null)
            .maybeSingle();
          if (!existing) {
            const sku = generateSKU(product.sku);
            const qrData = generateQRUrl(sku);
            const qrUrl = await QRCode.toDataURL(qrData, {
              width: 300,
              margin: 2,
            });
            await supabase.from("inventory").insert({
              product_id: product.id,
              color_variant_id: null,
              sku,
              quantity: 0,
              qr_code: qrUrl,
            });
          }
        }
      }
      toast.dismiss(loadingToast);
      toast.success(inv.synced);
      fetchInventory();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(e.message);
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    const item = adjustModal;
    let newQty = item.quantity;
    if (adjustType === "add") newQty += adjustQty;
    else if (adjustType === "remove")
      newQty = Math.max(0, item.quantity - adjustQty);
    else newQty = adjustQty;

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQty })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.from("inventory_logs").insert({
      inventory_id: item.id,
      product_id: item.product_id,
      action_type: adjustType,
      quantity_change: newQty - item.quantity,
      quantity_before: item.quantity,
      quantity_after: newQty,
      notes: adjustNotes || null,
    });
    toast.success(t.admin.common.success);
    setAdjustModal(null);
    setAdjustQty(1);
    setAdjustNotes("");
    fetchInventory();
    fetchLogs();
  };

  const openQR = async (item: InventoryItem) => {
    setQrModal(item);
    if (item.qr_code) {
      setQrDataUrl(item.qr_code);
    } else {
      const qrData = generateQRUrl(item.sku);
      const url = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
      setQrDataUrl(url);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl || !qrModal) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${qrModal.sku}.png`;
    a.click();
  };

  const filtered = inventory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.sku.toLowerCase().includes(q) ||
      item.product?.name_en?.toLowerCase().includes(q) ||
      item.product?.name_ar?.includes(q) ||
      item.product?.name_tr?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: inventory.length,
    inStock: inventory.filter((i) => i.status === "in_stock").length,
    lowStock: inventory.filter((i) => i.status === "low_stock").length,
    outOfStock: inventory.filter((i) => i.status === "out_of_stock").length,
  };

  const isRTL = locale === "ar";

  return (
    <div className="space-y-6 animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">{inv.title}</h1>
          <p className="text-muted-foreground">{inv.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={syncInventory}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {inv.syncProducts}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: inv.totalSKUs,
            value: stats.total,
            icon: Package,
            color: "text-primary",
          },
          {
            label: inv.inStock,
            value: stats.inStock,
            icon: CheckCircle,
            color: "text-green-500",
          },
          {
            label: inv.lowStock,
            value: stats.lowStock,
            icon: AlertTriangle,
            color: "text-yellow-500",
          },
          {
            label: inv.outOfStock,
            value: stats.outOfStock,
            icon: XCircle,
            color: "text-red-500",
          },
        ].map((s, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={cn("h-8 w-8", s.color)} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["inventory", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-all",
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "inventory" ? inv.stock : inv.movementLogs}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab === "inventory" && (
        <div className="relative max-w-md">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
              isRTL ? "right-3" : "left-3",
            )}
          />
          <Input
            placeholder={inv.searchPlaceholder}
            className={cn(
              "bg-background border-border",
              isRTL ? "pr-10" : "pl-10",
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Inventory Table */}
      {activeTab === "inventory" && (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-medium">{inv.product}</th>
                  <th className="px-6 py-4 font-medium">{inv.sku}</th>
                  <th className="px-6 py-4 font-medium">{inv.variant}</th>
                  <th className="px-6 py-4 font-medium">{inv.quantity}</th>
                  <th className="px-6 py-4 font-medium">{inv.status}</th>
                  <th className="px-6 py-4 font-medium text-right">
                    {inv.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      {inv.loading}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground mb-3">
                        {inv.noRecords}
                      </p>
                      <Button
                        onClick={syncInventory}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" /> {inv.syncProducts}
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">
                          {getProductName(item)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.product?.sku}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-primary border border-primary/20">
                          {item.sku}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {item.color_variant ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border border-border"
                              style={{
                                backgroundColor:
                                  item.color_variant.hex_color || "#000",
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.color_variant.name_en}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            item.quantity === 0
                              ? "text-red-500"
                              : item.quantity <= item.low_stock_threshold
                                ? "text-yellow-500"
                                : "text-foreground",
                          )}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} t={t} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQR(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title={inv.viewQR}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAdjustModal(item);
                              setAdjustType("add");
                            }}
                            className="h-8 w-8 text-green-500"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAdjustModal(item);
                              setAdjustType("remove");
                            }}
                            className="h-8 w-8 text-red-500"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAdjustModal(item);
                              setAdjustType("adjust");
                              setAdjustQty(item.quantity);
                            }}
                            className="h-8 w-8 text-primary"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Logs Table */}
      {activeTab === "logs" && (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-medium">{inv.product}</th>
                  <th className="px-6 py-4 font-medium">{inv.action}</th>
                  <th className="px-6 py-4 font-medium">{inv.change}</th>
                  <th className="px-6 py-4 font-medium">{inv.beforeAfter}</th>
                  <th className="px-6 py-4 font-medium">{inv.notes}</th>
                  <th className="px-6 py-4 font-medium">{inv.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      {inv.noLogs}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {getLogProductName(log)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={cn(
                            "text-[10px] uppercase tracking-widest",
                            log.action_type === "add"
                              ? "bg-green-500/10 text-green-500"
                              : log.action_type === "remove"
                                ? "bg-red-500/10 text-red-500"
                                : log.action_type === "scan"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-primary/10 text-primary",
                          )}
                        >
                          {log.action_type === "add" && (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          )}
                          {log.action_type === "remove" && (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {log.action_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "font-bold",
                            log.quantity_change > 0
                              ? "text-green-500"
                              : "text-red-500",
                          )}
                        >
                          {log.quantity_change > 0 ? "+" : ""}
                          {log.quantity_change}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {log.quantity_before} → {log.quantity_after}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {log.notes || "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Adjust Modal */}
      <Dialog open={!!adjustModal} onOpenChange={() => setAdjustModal(null)}>
        <DialogContent
          className="bg-card border-border max-w-md"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {adjustType === "add"
                ? inv.addStock
                : adjustType === "remove"
                  ? inv.removeStock
                  : inv.setQuantity}
            </DialogTitle>
          </DialogHeader>
          {adjustModal && (
            <div className="space-y-5 pt-2">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="font-bold text-foreground">
                  {getProductName(adjustModal)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  SKU: {adjustModal.sku} • {inv.currentQty}:{" "}
                  {adjustModal.quantity}
                </p>
              </div>
              <div className="flex gap-2">
                {(["add", "remove", "adjust"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAdjustType(type)}
                    className={cn(
                      "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded border transition-all",
                      adjustType === type
                        ? type === "add"
                          ? "bg-green-500/20 text-green-500 border-green-500/30"
                          : type === "remove"
                            ? "bg-red-500/20 text-red-500 border-red-500/30"
                            : "bg-primary/20 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {type === "add"
                      ? inv.add
                      : type === "remove"
                        ? inv.remove
                        : inv.adjust}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {adjustType === "adjust" ? inv.newQuantity : inv.quantity}
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setAdjustQty(
                        Math.max(
                          adjustType === "adjust" ? 0 : 1,
                          adjustQty - 1,
                        ),
                      )
                    }
                    className="h-10 w-10 rounded border border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Input
                    type="number"
                    value={adjustQty}
                    onChange={(e) =>
                      setAdjustQty(Math.max(0, Number(e.target.value)))
                    }
                    className="text-center text-xl font-bold bg-background border-border"
                    min={0}
                  />
                  <button
                    onClick={() => setAdjustQty(adjustQty + 1)}
                    className="h-10 w-10 rounded border border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {adjustType !== "adjust" && (
                  <p className="text-[10px] text-muted-foreground">
                    {inv.result}:{" "}
                    {adjustType === "add"
                      ? adjustModal.quantity + adjustQty
                      : Math.max(0, adjustModal.quantity - adjustQty)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {inv.notesOptional}
                </Label>
                <Textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder={inv.reasonPlaceholder}
                  className="bg-background border-border h-20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAdjustModal(null)}
                  className="flex-1 bg-background border-border"
                >
                  {inv.cancel}
                </Button>
                <Button
                  onClick={handleAdjust}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
                >
                  {inv.confirm}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent
          className="bg-card border-border max-w-sm"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {inv.qrCode}
            </DialogTitle>
          </DialogHeader>
          {qrModal && (
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="p-4 bg-white rounded-lg">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                )}
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">
                  {getProductName(qrModal)}
                </p>
                <code className="text-[11px] text-primary">{qrModal.sku}</code>
              </div>
              <Button
                onClick={downloadQR}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                {inv.downloadQR}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
