import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Html5Qrcode } from "html5-qrcode";
import {
  Package,
  Search,
  QrCode,
  Plus,
  Minus,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Camera,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Edit3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ─── Types ────────────────────────────────────────────────────────────────────

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
  product?: {
    name_en: string;
    name_ar: string;
    name_tr: string;
    sku: string;
  };
  color_variant?: {
    name_en: string;
    hex_color: string | null;
  };
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
  product?: { name_en: string };
}

// ─── Generate SKU ─────────────────────────────────────────────────────────────

function generateSKU(productSku: string, suffix?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const base = productSku || "RB";
  return suffix ? `${base}-${suffix}-${timestamp}` : `${base}-${timestamp}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InventoryItem["status"] }) {
  const map = {
    in_stock: {
      label: "In Stock",
      icon: CheckCircle,
      cls: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    low_stock: {
      label: "Low Stock",
      icon: AlertTriangle,
      cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    out_of_stock: {
      label: "Out of Stock",
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function InventoryManager() {
  const { locale } = useI18n();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"inventory" | "logs">("inventory");

  // Modals
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [qrModal, setQrModal] = useState<InventoryItem | null>(null);
  const [scanModal, setScanModal] = useState(false);

  // Adjust form
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "adjust">(
    "add",
  );
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustNotes, setAdjustNotes] = useState("");

  // QR
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [scanInput, setScanInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inventory")
      .select(
        `
        *,
        product:products(name_en, name_ar, name_tr, sku),
        color_variant:product_color_variants(name_en, hex_color)
      `,
      )
      .order("updated_at", { ascending: false });

    if (data) setInventory(data as any);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("inventory_logs")
      .select(`*, product:products(name_en)`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setLogs(data as any);
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();
  }, []);

  // ── Sync products → inventory ───────────────────────────────────────────────

  const syncInventory = async () => {
    const loadingToast = toast.loading("Syncing inventory...");
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, sku, product_color_variants(id, name_en)");

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
              const qrData = JSON.stringify({
                sku,
                product_id: product.id,
                variant_id: variant.id,
              });
              const qrUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
              });

              await supabase.from("inventory").insert({
                product_id: product.id,
                color_variant_id: variant.id,
                sku,
                quantity: 0,
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
            const qrData = JSON.stringify({ sku, product_id: product.id });
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
      toast.success("Inventory synced!");
      fetchInventory();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(e.message);
    }
  };

  // ── Adjust Stock ────────────────────────────────────────────────────────────

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

    toast.success("Stock updated!");
    setAdjustModal(null);
    setAdjustQty(1);
    setAdjustNotes("");
    fetchInventory();
    fetchLogs();
  };

  // ── QR Modal ────────────────────────────────────────────────────────────────

  const openQR = async (item: InventoryItem) => {
    setQrModal(item);
    if (item.qr_code) {
      setQrDataUrl(item.qr_code);
    } else {
      const qrData = JSON.stringify({
        sku: item.sku,
        product_id: item.product_id,
      });
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

  // ── QR Scan ─────────────────────────────────────────────────────────────────

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    try {
      const parsed = JSON.parse(scanInput);
      const sku = parsed.sku;
      const item = inventory.find((i) => i.sku === sku);
      if (!item) {
        toast.error("Product not found");
        return;
      }
      setScanModal(false);
      setScanInput("");
      setAdjustModal(item);
      setAdjustType("remove");
      toast.info(`Found: ${item.product?.name_en}`);
    } catch {
      // Try plain SKU
      const item = inventory.find((i) => i.sku === scanInput.trim());
      if (!item) {
        toast.error("Product not found");
        return;
      }
      setScanModal(false);
      setScanInput("");
      setAdjustModal(item);
      setAdjustType("remove");
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = inventory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.sku.toLowerCase().includes(q) ||
      item.product?.name_en.toLowerCase().includes(q) ||
      item.product?.name_ar?.includes(q)
    );
  });

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: inventory.length,
    inStock: inventory.filter((i) => i.status === "in_stock").length,
    lowStock: inventory.filter((i) => i.status === "low_stock").length,
    outOfStock: inventory.filter((i) => i.status === "out_of_stock").length,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">Inventory</h1>
          <p className="text-muted-foreground">
            Stock management & QR tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setScanModal(true)}
            className="bg-background border-border gap-2"
          >
            <Camera className="h-4 w-4" />
            Scan QR
          </Button>
          <Button
            onClick={syncInventory}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Products
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total SKUs",
            value: stats.total,
            icon: Package,
            color: "text-primary",
          },
          {
            label: "In Stock",
            value: stats.inStock,
            icon: CheckCircle,
            color: "text-green-500",
          },
          {
            label: "Low Stock",
            value: stats.lowStock,
            icon: AlertTriangle,
            color: "text-yellow-500",
          },
          {
            label: "Out of Stock",
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
            {tab === "inventory" ? "Stock" : "Movement Logs"}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab === "inventory" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by SKU or product name..."
            className="pl-10 bg-background border-border"
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
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Variant</th>
                  <th className="px-6 py-4 font-medium">Quantity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground mb-3">
                        No inventory records found.
                      </p>
                      <Button
                        onClick={syncInventory}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" /> Sync Products
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
                          {item.product?.name_en || "—"}
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
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQR(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="View QR Code"
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
                            title="Add Stock"
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
                            title="Remove Stock"
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
                            title="Set Quantity"
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
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Change</th>
                  <th className="px-6 py-4 font-medium">Before → After</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {log.product?.name_en || "—"}
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

      {/* ── Adjust Modal ── */}
      <Dialog open={!!adjustModal} onOpenChange={() => setAdjustModal(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {adjustType === "add"
                ? "Add Stock"
                : adjustType === "remove"
                  ? "Remove Stock"
                  : "Set Quantity"}
            </DialogTitle>
          </DialogHeader>
          {adjustModal && (
            <div className="space-y-5 pt-2">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <p className="font-bold text-foreground">
                  {adjustModal.product?.name_en}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  SKU: {adjustModal.sku} • Current: {adjustModal.quantity}
                </p>
              </div>

              {/* Type Selector */}
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
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {adjustType === "adjust" ? "New Quantity" : "Quantity"}
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
                    Result:{" "}
                    {adjustType === "add"
                      ? adjustModal.quantity + adjustQty
                      : Math.max(0, adjustModal.quantity - adjustQty)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Notes (Optional)
                </Label>
                <Textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for adjustment..."
                  className="bg-background border-border h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAdjustModal(null)}
                  className="flex-1 bg-background border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjust}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── QR Modal ── */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              QR Code
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
                  {qrModal.product?.name_en}
                </p>
                <code className="text-[11px] text-primary">{qrModal.sku}</code>
              </div>
              <Button
                onClick={downloadQR}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Scan Modal ── */}
      <Dialog
        open={scanModal}
        onOpenChange={(open) => {
          if (!open) {
            // Stop camera
            if ((window as any).__qrScanner) {
              (window as any).__qrScanner.stop().catch(() => {});
              (window as any).__qrScanner = null;
            }
          }
          setScanModal(open);
        }}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              Scan QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2 border-b border-border pb-3">
              <button
                onClick={() => setScanMode("camera")}
                className={cn(
                  "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded border transition-all",
                  scanMode === "camera"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "border-border text-muted-foreground",
                )}
              >
                Camera
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={cn(
                  "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded border transition-all",
                  scanMode === "manual"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "border-border text-muted-foreground",
                )}
              >
                Manual
              </button>
            </div>

            {scanMode === "camera" ? (
              <div className="space-y-3">
                <div
                  id="qr-reader"
                  className="w-full rounded-lg overflow-hidden"
                />
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                  Point camera at QR code
                </p>
                <Button
                  onClick={() => {
                    const scanner = new Html5Qrcode("qr-reader");
                    (window as any).__qrScanner = scanner;
                    scanner
                      .start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        async (decodedText: string) => {
                          await scanner.stop();
                          (window as any).__qrScanner = null;
                          setScanInput(decodedText);
                          setScanModal(false);
                          // Process scan
                          try {
                            const parsed = JSON.parse(decodedText);
                            const item = inventory.find(
                              (i) => i.sku === parsed.sku,
                            );
                            if (!item) {
                              toast.error("Product not found");
                              return;
                            }
                            setAdjustModal(item);
                            setAdjustType("remove");
                            toast.info(`Found: ${item.product?.name_en}`);
                          } catch {
                            const item = inventory.find(
                              (i) => i.sku === decodedText.trim(),
                            );
                            if (!item) {
                              toast.error("Product not found");
                              return;
                            }
                            setAdjustModal(item);
                            setAdjustType("remove");
                          }
                        },
                        () => {},
                      )
                      .catch((err: any) => toast.error("Camera error: " + err));
                  }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Type the SKU manually:
                </p>
                <Input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  placeholder="e.g. RB-001-ABC"
                  className="bg-background border-border font-mono"
                  autoFocus
                />
                <Button
                  onClick={handleScan}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
                >
                  Find Product
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setScanModal(false)}
              className="w-full bg-background border-border"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
