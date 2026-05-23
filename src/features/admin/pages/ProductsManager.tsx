import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
  Settings,
  Image as ImageIcon,
  Palette,
  Layers,
  DollarSign,
  Barcode,
  Truck,
  FileText,
  AlertCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, toSlug } from "../services/api";

// --- Types ---

interface ColorVariant {
  id: string;
  name_en: string;
  name_ar: string;
  name_tr: string;
  hex: string;
  stock: number;
  images: string[];
  is_active: boolean;
  is_main: boolean;
}

interface ProductFormData {
  id?: string;
  name_en: string;
  name_ar: string;
  name_tr: string;
  description_en: string;
  description_ar: string;
  description_tr: string;
  category_id: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku: string;
  weight: number;
  requires_shipping: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  track_inventory: boolean;
  low_stock_threshold: number;
  total_stock: number;
  sizes: string[];
  has_one_size: boolean;
  size_guide?: string;
  colors: ColorVariant[];
  general_images: string[];
  care_instructions_en: string;
  care_instructions_ar: string;
  care_instructions_tr: string;
  material_en: string;
  material_ar: string;
  material_tr: string;
  related_products: string[];
  tags: string;
}

const DEFAULT_FORM_STATE: ProductFormData = {
  name_en: "",
  name_ar: "",
  name_tr: "",
  description_en: "",
  description_ar: "",
  description_tr: "",
  category_id: "",
  price: 0,
  compare_at_price: 0,
  cost_per_item: 0,
  sku: "",
  weight: 0,
  requires_shipping: true,
  is_active: true,
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: false,
  track_inventory: true,
  low_stock_threshold: 5,
  total_stock: 0,
  sizes: [],
  has_one_size: false,
  size_guide: "",
  colors: [],
  general_images: [],
  care_instructions_en: "",
  care_instructions_ar: "",
  care_instructions_tr: "",
  material_en: "",
  material_ar: "",
  material_tr: "",
  related_products: [],
  tags: "",
};

export function ProductsManager() {
  const { t, locale, formatPrice, dir } = useI18n();
  const queryClient = useQueryClient();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_STATE);
  const [isDirty, setIsUnsaved] = useState(false);
  const [customSize, setCustomSize] = useState("");
  const [activeSection, setActiveSection] = useState("basic");

  // Fetch Data
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: adminApi.getProducts,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.getCategories,
  });

  // --- Handlers ---

  const handleOpenModal = (product?: any) => {
    if (product) {
      const sortedSizes = product.product_sizes
        ? [...product.product_sizes].sort(
            (a: any, b: any) => (a.position || 0) - (b.position || 0),
          )
        : [];

      const hasOneSize =
        sortedSizes.length === 1 && sortedSizes[0].size_label === "One Size";
      const mappedSizes = hasOneSize
        ? []
        : sortedSizes.map((s: any) => s.size_label);

      setFormData({
        ...DEFAULT_FORM_STATE,
        ...product,
        tags: product.tags?.join(", ") || "",
        colors: product.colors || [],
        sizes: mappedSizes,
        has_one_size: hasOneSize,
        is_best_seller: product.is_best_seller || false, // ✅ NEW
        is_new_arrival: product.is_new_arrival || false, // ✅ NEW
      });
    } else {
      setFormData(DEFAULT_FORM_STATE);
    }
    setIsUnsaved(false);
    setIsModalOpen(true);
  };

  const handleCloseModalAttempt = () => {
    if (isDirty) {
      setIsUnsavedConfirmOpen(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleFormChange = (updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setIsUnsaved(true);
  };

  const handleSave = async (status: "active" | "inactive") => {
    if (!formData.name_en || !formData.price || !formData.category_id) {
      toast.error(t.admin.products.modal.validation.required);
      return;
    }

    const loadingToast = toast.loading(
      formData.id ? "Updating product..." : "Creating product...",
    );

    try {
      const productData = {
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        name_tr: formData.name_tr,
        description_en: formData.description_en,
        description_ar: formData.description_ar,
        description_tr: formData.description_tr,
        category_id: formData.category_id,
        price: formData.price,
        compare_at_price: formData.compare_at_price,
        cost_per_item: formData.cost_per_item,
        weight_grams: formData.weight,
        requires_shipping: formData.requires_shipping,
        status: status,
        featured: formData.is_featured,
        is_best_seller: formData.is_best_seller, // ✅ NEW
        is_new_arrival: formData.is_new_arrival, // ✅ NEW
        track_inventory: formData.track_inventory,
        low_stock_threshold: formData.low_stock_threshold,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        slug: toSlug(formData.name_en) + "-" + Date.now(),
        sku: formData.sku || "RB-" + Date.now(),
      };

      let productId = formData.id;

      if (formData.id) {
        await adminApi.updateProduct(formData.id, productData);
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", formData.id);
        await supabase
          .from("product_color_variants")
          .delete()
          .eq("product_id", formData.id);
        await supabase
          .from("product_sizes")
          .delete()
          .eq("product_id", formData.id);
      } else {
        const newProduct = await adminApi.createProduct(productData);
        productId = newProduct.id;
      }

      if (!productId) throw new Error("Failed to get product ID");

      // 1. Handle General Images
      const generalImageRecords = [];
      for (let i = 0; i < formData.general_images.length; i++) {
        const imageData = formData.general_images[i];
        let url = imageData;

        if (imageData.startsWith("data:")) {
          url = await uploadImage(productId, imageData);
        }

        generalImageRecords.push({
          product_id: productId,
          url,
          position: i,
          is_main: i === 0,
        });
      }

      if (generalImageRecords.length > 0) {
        const { error: imgError } = await supabase
          .from("product_images")
          .insert(generalImageRecords);
        if (imgError) throw imgError;
      }

      // 2. Handle Color Variants and their images
      for (let i = 0; i < formData.colors.length; i++) {
        const color = formData.colors[i];
        const { data: variantData, error: varError } = await supabase
          .from("product_color_variants")
          .insert({
            product_id: productId,
            name_en: color.name_en,
            name_ar: color.name_ar,
            name_tr: color.name_tr,
            hex_color: color.hex,
            stock_quantity: color.stock,
            is_available: color.is_active,
            is_main: color.is_main,
            position: i,
          })
          .select()
          .single();

        if (varError) throw varError;

        const colorImageRecords = [];
        for (let j = 0; j < color.images.length; j++) {
          const imageData = color.images[j];
          let url = imageData;

          if (imageData.startsWith("data:")) {
            url = await uploadImage(productId, imageData, color.name_en);
          }

          colorImageRecords.push({
            product_id: productId,
            color_variant_id: variantData.id,
            url,
            position: j,
            is_main: false,
          });
        }

        if (colorImageRecords.length > 0) {
          const { error: colImgError } = await supabase
            .from("product_images")
            .insert(colorImageRecords);
          if (colImgError) throw colImgError;
        }
      }

      // 3. Handle Sizes
      if (formData.sizes.length > 0) {
        const sizeRecords = formData.sizes.map((size, idx) => ({
          product_id: productId,
          size_label: size,
          position: idx,
        }));
        const { error: sizeError } = await supabase
          .from("product_sizes")
          .insert(sizeRecords);
        if (sizeError) throw sizeError;
      }

      toast.dismiss(loadingToast);
      toast.success(t.admin.common.success);
      setIsModalOpen(false);
      setIsUnsaved(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(e?.message || "Failed to save product");
      console.error(e);
    }
  };

  const uploadImage = async (
    productId: string,
    dataUrl: string,
    suffix = "gen",
  ) => {
    try {
      const base64 = dataUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const fileName = `${productId}/${Date.now()}-${suffix}-${Math.random().toString(36).substr(2, 5)}.jpg`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("Failed to upload image");
    }
  };

  const generateSKU = () => {
    const sku = "RB-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    handleFormChange({ sku });
  };

  // --- Size Handlers ---
  const toggleSize = (size: string) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter((s) => s !== size)
      : [...formData.sizes, size];
    handleFormChange({ sizes: newSizes });
  };

  const addCustomSize = () => {
    if (customSize && !formData.sizes.includes(customSize)) {
      handleFormChange({ sizes: [...formData.sizes, customSize] });
      setCustomSize("");
    }
  };

  // --- Color Handlers ---
  const addColorVariant = () => {
    const newColor: ColorVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name_en: "New Color",
      name_ar: "",
      name_tr: "",
      hex: "#000000",
      stock: 0,
      images: [],
      is_active: true,
      is_main: formData.colors.length === 0,
    };
    handleFormChange({ colors: [...formData.colors, newColor] });
  };

  const updateColor = (id: string, updates: Partial<ColorVariant>) => {
    handleFormChange({
      colors: formData.colors.map((c) => {
        if (c.id === id) {
          if (updates.is_main) return { ...c, ...updates };
          return { ...c, ...updates };
        }
        if (updates.is_main) return { ...c, is_main: false };
        return c;
      }),
    });
  };

  const moveColor = (index: number, direction: "up" | "down") => {
    const newColors = [...formData.colors];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newColors.length) return;
    const temp = newColors[index];
    newColors[index] = newColors[targetIndex];
    newColors[targetIndex] = temp;
    handleFormChange({ colors: newColors });
  };

  // --- Image Handlers ---
  const handleImageUploadClick = (type: "general" | string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        addImage(type, reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addImage = (type: "general" | string, url: string) => {
    if (type === "general") {
      if (formData.general_images.length >= 10) {
        toast.error(t.admin.products.modal.validation.maxImages);
        return;
      }
      handleFormChange({ general_images: [...formData.general_images, url] });
    } else {
      const color = formData.colors.find((c) => c.id === type);
      if (color && color.images.length >= 5) {
        toast.error("Max 5 images per color");
        return;
      }
      handleFormChange({
        colors: formData.colors.map((c) =>
          c.id === type ? { ...c, images: [...c.images, url] } : c,
        ),
      });
    }
  };

  // --- Computations ---

  const profitMargin = useMemo(() => {
    if (!formData.price || !formData.cost_per_item) return 0;
    return Math.round(
      ((formData.price - formData.cost_per_item) / formData.price) * 100,
    );
  }, [formData.price, formData.cost_per_item]);

  const progress = useMemo(() => {
    const fields = [
      formData.name_en && formData.category_id,
      formData.price > 0,
      formData.has_one_size || formData.sizes.length > 0,
      formData.colors.length > 0 || !formData.track_inventory,
      formData.general_images.length > 0,
      formData.description_en,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [formData]);

  // --- Table Filtering ---
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products].filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        p.name_en?.toLowerCase().includes(searchLower) ||
        p.name_ar?.toLowerCase().includes(searchLower) ||
        p.name_tr?.toLowerCase().includes(searchLower);
      const matchesCategory =
        categoryFilter === "all" || p.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    return result;
  }, [products, searchQuery, categoryFilter]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Package className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">
            {t.admin.products.title}
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} total products
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
        >
          <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t.admin.products.addProduct}
        </Button>
      </div>

      <Card className="bg-card border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
            <Input
              placeholder={t.admin.products.search}
              className="pl-10 rtl:pr-10 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] bg-background border-border">
                <Filter className="h-3.5 w-3.5 mr-2 rtl:ml-2" />
                <SelectValue placeholder={t.admin.products.category} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">
                  {t.admin.products.allCategories}
                </SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 font-medium">
                  {t.admin.products.name}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.products.category}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.products.price}
                </th>
                <th className="px-6 py-4 font-medium">Labels</th>
                <th className="px-6 py-4 font-medium">
                  {t.admin.products.status}
                </th>
                <th className="px-6 py-4 font-medium text-right rtl:text-left">
                  {t.admin.products.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded border border-border overflow-hidden bg-muted">
                        <img
                          src={
                            product.product_images?.find(
                              (img: any) => img.is_main,
                            )?.url ||
                            product.product_images?.[0]?.url ||
                            "/placeholder.svg"
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          {locale === "ar"
                            ? product.name_ar
                            : locale === "tr"
                              ? product.name_tr
                              : product.name_en}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          SKU: {product.sku || "N/A"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground">
                      {product.categories?.name_en || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {formatPrice(product.price)}
                  </td>

                  {/* ✅ NEW: Labels column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.is_best_seller && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold">
                          Best Seller
                        </span>
                      )}
                      {product.is_new_arrival && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                          New Arrival
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        try {
                          const newStatus =
                            product.status === "active" ? "inactive" : "active";
                          const { error } = await supabase
                            .from("products")
                            .update({ status: newStatus })
                            .eq("id", product.id);
                          if (error) throw error;
                          queryClient.invalidateQueries({
                            queryKey: ["admin", "products"],
                          });
                          toast.success(
                            newStatus === "active"
                              ? "Product published"
                              : "Product hidden",
                          );
                        } catch (e: any) {
                          toast.error(e.message || "Failed to update status");
                        }
                      }}
                      className={cn(
                        "text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all hover:opacity-80 font-bold",
                        product.status === "active"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                      title="Click to toggle"
                    >
                      {product.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(product)}
                        className="h-8 w-8 text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProductToDelete(product);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {paginatedProducts.map((product) => (
            <div key={product.id} className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded border border-border overflow-hidden bg-muted shrink-0">
                  <img
                    src={
                      product.product_images?.find((img: any) => img.is_main)
                        ?.url ||
                      product.product_images?.[0]?.url ||
                      "/placeholder.svg"
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">
                    {locale === "ar"
                      ? product.name_ar
                      : locale === "tr"
                        ? product.name_tr
                        : product.name_en}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                    SKU: {product.sku || "N/A"}
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatPrice(product.price)}
                  </p>
                  {/* ✅ NEW: Labels on mobile */}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {product.is_best_seller && (
                      <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold">
                        Best Seller
                      </span>
                    )}
                    {product.is_new_arrival && (
                      <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold">
                        New Arrival
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge
                  className={cn(
                    "text-[10px] uppercase tracking-widest",
                    product.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {product.status === "active" ? "Active" : "Inactive"}
                </Badge>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(product)}
                    className="h-8 px-3 text-[10px] uppercase tracking-widest font-bold border-primary/20 text-primary"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductToDelete(product);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="h-8 px-3 text-[10px] uppercase tracking-widest font-bold border-destructive/20 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* --- Main Modal --- */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModalAttempt()}
      >
        <DialogContent className="sm:max-w-5xl h-full sm:h-auto sm:max-h-[92vh] overflow-hidden flex flex-col p-0 bg-card border-border shadow-2xl rounded-none sm:rounded-lg">
          <DialogHeader className="p-4 sm:p-6 border-b border-border bg-background/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="font-display text-xl sm:text-2xl text-primary">
                  {formData.id
                    ? t.admin.products.modal.editTitle
                    : t.admin.products.modal.addTitle}
                </DialogTitle>
                <div className="flex items-center gap-4 mt-2">
                  <div className="h-1.5 w-24 sm:w-32 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {progress}% Complete
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:self-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModalAttempt}
                  className="bg-background border-border text-[10px] sm:text-xs h-8 sm:h-10"
                >
                  {t.admin.products.modal.cancel}
                </Button>
                <Button
                  onClick={() => handleSave("active")}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold text-[10px] sm:text-xs h-8 sm:h-10 px-4"
                >
                  {t.admin.products.modal.publish}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <Accordion
              type="multiple"
              defaultValue={["basic"]}
              className="space-y-4"
            >
              {/* 1. Basic Info */}
              <AccordionItem
                value="basic"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.basic}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.nameEn}
                      </Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) =>
                          handleFormChange({ name_en: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.nameAr}
                      </Label>
                      <Input
                        dir="rtl"
                        value={formData.name_ar}
                        onChange={(e) =>
                          handleFormChange({ name_ar: e.target.value })
                        }
                        className="bg-background border-border text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.nameTr}
                      </Label>
                      <Input
                        value={formData.name_tr}
                        onChange={(e) =>
                          handleFormChange({ name_tr: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.category}
                      </Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(val) =>
                          handleFormChange({ category_id: val })
                        }
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {categories?.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.tags}
                      </Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) =>
                          handleFormChange({ tags: e.target.value })
                        }
                        placeholder="Silk, Luxury, New"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Pricing & SKU */}
              <AccordionItem
                value="pricing"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.pricing}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.price} (USD)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            handleFormChange({ price: Number(e.target.value) })
                          }
                          className="pl-8 bg-background border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.compareAt}
                      </Label>
                      <Input
                        type="number"
                        value={formData.compare_at_price}
                        onChange={(e) =>
                          handleFormChange({
                            compare_at_price: Number(e.target.value),
                          })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.costPerItem}
                      </Label>
                      <Input
                        type="number"
                        value={formData.cost_per_item}
                        onChange={(e) =>
                          handleFormChange({
                            cost_per_item: Number(e.target.value),
                          })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.margin}
                      </Label>
                      <div className="h-10 flex items-center px-4 rounded border border-border bg-muted/20 font-bold text-primary">
                        {profitMargin}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.sku}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.sku}
                          onChange={(e) =>
                            handleFormChange({ sku: e.target.value })
                          }
                          className="bg-background border-border"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={generateSKU}
                          className="shrink-0 bg-background border-border"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.weight}
                      </Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) =>
                          handleFormChange({ weight: Number(e.target.value) })
                        }
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Inventory & Sizes */}
              <AccordionItem
                value="inventory"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.inventory}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-6 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold uppercase tracking-widest">
                        {t.admin.products.modal.trackInventory}
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Keep record of your stock levels
                      </p>
                    </div>
                    <Switch
                      checked={formData.track_inventory}
                      onCheckedChange={(val) =>
                        handleFormChange({ track_inventory: val })
                      }
                    />
                  </div>

                  {formData.track_inventory && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {!formData.colors.length && (
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            {t.admin.products.modal.stock}
                          </Label>
                          <Input
                            type="number"
                            value={formData.total_stock}
                            onChange={(e) =>
                              handleFormChange({
                                total_stock: Number(e.target.value),
                              })
                            }
                            className="bg-background border-border"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                          {t.admin.products.modal.lowStock}
                        </Label>
                        <Input
                          type="number"
                          value={formData.low_stock_threshold}
                          onChange={(e) =>
                            handleFormChange({
                              low_stock_threshold: Number(e.target.value),
                            })
                          }
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-widest">
                        {t.admin.products.modal.sizes}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground uppercase">
                          {t.admin.products.modal.oneSize}
                        </Label>
                        <Checkbox
                          checked={formData.has_one_size}
                          onCheckedChange={(val) =>
                            handleFormChange({ has_one_size: val as boolean })
                          }
                        />
                      </div>
                    </div>

                    {!formData.has_one_size && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex gap-2 max-w-xs">
                          <Input
                            type="number"
                            placeholder="Add numeric size (e.g. 38)"
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addCustomSize())
                            }
                            className="bg-background border-border text-[10px] h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addCustomSize}
                            className="h-8 shrink-0"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {formData.sizes
                            .sort((a, b) => Number(a) - Number(b))
                            .map((size) => (
                              <Badge
                                key={size}
                                className="gap-1 px-2 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                              >
                                {size}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => toggleSize(size)}
                                />
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t.admin.products.modal.sizeGuide}
                      </Label>
                      <Input
                        value={formData.size_guide}
                        onChange={(e) =>
                          handleFormChange({ size_guide: e.target.value })
                        }
                        placeholder="URL or descriptive text"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Color Variants */}
              <AccordionItem
                value="colors"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.colors}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4 pt-2">
                  <div className="space-y-4">
                    {formData.colors.map((color, i) => (
                      <Card
                        key={color.id}
                        className="bg-background border-border relative group overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-6 w-6 rounded-full border border-border shadow-sm"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="font-bold text-xs uppercase tracking-widest">
                                {color.name_en || "Unnamed Color"}
                              </span>
                              {color.is_main && (
                                <Badge className="text-[8px] bg-primary/20 text-primary">
                                  MAIN
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => moveColor(i, "up")}
                                disabled={i === 0}
                                className="text-muted-foreground hover:text-primary disabled:opacity-20"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveColor(i, "down")}
                                disabled={i === formData.colors.length - 1}
                                className="text-muted-foreground hover:text-primary disabled:opacity-20"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleFormChange({
                                    colors: formData.colors.filter(
                                      (c) => c.id !== color.id,
                                    ),
                                  })
                                }
                                className="h-7 w-7 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                                  Name EN
                                </Label>
                                <Input
                                  value={color.name_en}
                                  onChange={(e) =>
                                    updateColor(color.id, {
                                      name_en: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs bg-muted/30"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                                  Name AR
                                </Label>
                                <Input
                                  dir="rtl"
                                  value={color.name_ar}
                                  onChange={(e) =>
                                    updateColor(color.id, {
                                      name_ar: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs bg-muted/30 text-right"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                                  Name TR
                                </Label>
                                <Input
                                  value={color.name_tr}
                                  onChange={(e) =>
                                    updateColor(color.id, {
                                      name_tr: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs bg-muted/30"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                                Hex Color
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={color.hex}
                                  onChange={(e) =>
                                    updateColor(color.id, {
                                      hex: e.target.value,
                                    })
                                  }
                                  className="h-8 w-12 p-0 bg-transparent border-none"
                                />
                                <Input
                                  value={color.hex}
                                  onChange={(e) =>
                                    updateColor(color.id, {
                                      hex: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs font-mono bg-muted/30"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                                {t.admin.products.modal.stock}
                              </Label>
                              <Input
                                type="number"
                                value={color.stock}
                                onChange={(e) =>
                                  updateColor(color.id, {
                                    stock: Number(e.target.value),
                                  })
                                }
                                className="h-8 text-xs bg-muted/30"
                              />
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                              <Switch
                                checked={color.is_active}
                                onCheckedChange={(val) =>
                                  updateColor(color.id, { is_active: val })
                                }
                              />
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Available
                              </span>
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                              <Checkbox
                                checked={color.is_main}
                                onCheckedChange={(val) =>
                                  updateColor(color.id, { is_main: !!val })
                                }
                              />
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Main Color
                              </span>
                            </div>
                          </div>

                          {/* Color Gallery */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-[8px] uppercase font-bold text-muted-foreground">
                              Color Specific Images (Max 5)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {color.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="h-12 w-12 rounded border border-border relative overflow-hidden bg-muted"
                                >
                                  <img
                                    src={img}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    className="absolute top-0 right-0 bg-destructive text-white p-0.5"
                                    onClick={() =>
                                      updateColor(color.id, {
                                        images: color.images.filter(
                                          (_, i) => i !== idx,
                                        ),
                                      })
                                    }
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-12 w-12 border-dashed border-border"
                                onClick={() => handleImageUploadClick(color.id)}
                              >
                                <Upload className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 h-10"
                      onClick={addColorVariant}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t.admin.products.modal.addColor}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Images */}
              <AccordionItem
                value="images"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.images}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4 pt-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {t.admin.products.modal.generalImages}
                  </Label>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer group"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          addImage("general", reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => handleImageUploadClick("general")}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      Drag and drop images here, or click to upload
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                      Maximum 10 images • JPG, PNG, WebP • Max 5MB each
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {formData.general_images.map((img, idx) => (
                      <Card
                        key={idx}
                        className="relative aspect-[3/4] bg-background border-border group overflow-hidden cursor-move"
                      >
                        <img src={img} className="h-full w-full object-cover" />
                        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm h-5 w-5 flex items-center justify-center rounded text-[10px] font-bold border border-border">
                          {idx + 1}
                        </div>
                        <button
                          className="absolute top-2 right-2 h-5 w-5 bg-destructive text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            handleFormChange({
                              general_images: formData.general_images.filter(
                                (_, i) => i !== idx,
                              ),
                            })
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground py-1 text-[8px] text-center font-bold uppercase tracking-widest">
                            {t.admin.products.modal.mainImage}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none" />
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Description & Details */}
              <AccordionItem
                value="details"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.details}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-6 pt-2">
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="bg-muted/50 border border-border mb-4">
                      <TabsTrigger
                        value="en"
                        className="text-[10px] uppercase font-bold px-4 tracking-widest"
                      >
                        English
                      </TabsTrigger>
                      <TabsTrigger
                        value="ar"
                        className="text-[10px] uppercase font-bold px-4 tracking-widest"
                      >
                        العربية
                      </TabsTrigger>
                      <TabsTrigger
                        value="tr"
                        className="text-[10px] uppercase font-bold px-4 tracking-widest"
                      >
                        Türkçe
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="en"
                      className="space-y-4 animate-fade-in"
                    >
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                          {t.admin.products.modal.descEn}
                        </Label>
                        <Textarea
                          value={formData.description_en}
                          onChange={(e) =>
                            handleFormChange({ description_en: e.target.value })
                          }
                          className="h-32 bg-background border-border"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Material (EN)
                          </Label>
                          <Input
                            value={formData.material_en}
                            onChange={(e) =>
                              handleFormChange({ material_en: e.target.value })
                            }
                            className="bg-background border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Care Instructions (EN)
                          </Label>
                          <Textarea
                            value={formData.care_instructions_en}
                            onChange={(e) =>
                              handleFormChange({
                                care_instructions_en: e.target.value,
                              })
                            }
                            className="bg-background border-border"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="ar"
                      className="space-y-4 animate-fade-in"
                      dir="rtl"
                    >
                      <div className="space-y-2 text-right">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                          {t.admin.products.modal.descAr}
                        </Label>
                        <Textarea
                          value={formData.description_ar}
                          onChange={(e) =>
                            handleFormChange({ description_ar: e.target.value })
                          }
                          className="h-32 bg-background border-border"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            المادة (AR)
                          </Label>
                          <Input
                            value={formData.material_ar}
                            onChange={(e) =>
                              handleFormChange({ material_ar: e.target.value })
                            }
                            className="bg-background border-border text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            تعليمات العناية (AR)
                          </Label>
                          <Textarea
                            value={formData.care_instructions_ar}
                            onChange={(e) =>
                              handleFormChange({
                                care_instructions_ar: e.target.value,
                              })
                            }
                            className="bg-background border-border text-right"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="tr"
                      className="space-y-4 animate-fade-in"
                    >
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                          {t.admin.products.modal.descTr}
                        </Label>
                        <Textarea
                          value={formData.description_tr}
                          onChange={(e) =>
                            handleFormChange({ description_tr: e.target.value })
                          }
                          className="h-32 bg-background border-border"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Materyal (TR)
                          </Label>
                          <Input
                            value={formData.material_tr}
                            onChange={(e) =>
                              handleFormChange({ material_tr: e.target.value })
                            }
                            className="bg-background border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Bakım Talimatları (TR)
                          </Label>
                          <Textarea
                            value={formData.care_instructions_tr}
                            onChange={(e) =>
                              handleFormChange({
                                care_instructions_tr: e.target.value,
                              })
                            }
                            className="bg-background border-border"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Additional Options */}
              <AccordionItem
                value="additional"
                className="border border-border rounded-lg overflow-hidden bg-background/30"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                      {t.admin.products.modal.sections.additional}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4 pt-2">
                  {/* Featured */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold uppercase tracking-widest">
                        {t.admin.products.modal.featured}
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Display this product on the boutique homepage
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(val) =>
                        handleFormChange({ is_featured: val })
                      }
                    />
                  </div>

                  {/* ✅ NEW: Best Seller Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold uppercase tracking-widest text-yellow-500">
                        Best Seller
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Show in the Best Sellers section on the homepage
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_best_seller}
                      onCheckedChange={(val) =>
                        handleFormChange({ is_best_seller: val })
                      }
                    />
                  </div>

                  {/* ✅ NEW: New Arrival Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold uppercase tracking-widest">
                        New Arrival
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Show in the New Arrivals section on the homepage
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_new_arrival}
                      onCheckedChange={(val) =>
                        handleFormChange({ is_new_arrival: val })
                      }
                    />
                  </div>

                  {/* Related Products */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {t.admin.products.modal.relatedProducts}
                    </Label>
                    <Select
                      onValueChange={(val) =>
                        !formData.related_products.includes(val) &&
                        handleFormChange({
                          related_products: [...formData.related_products, val],
                        })
                      }
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Choose products..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {products
                          ?.filter((p) => p.id !== formData.id)
                          .map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name_en}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.related_products.map((pid) => {
                        const p = products?.find((prod) => prod.id === pid);
                        return (
                          <Badge
                            key={pid}
                            variant="outline"
                            className="gap-1 border-border bg-background"
                          >
                            {p?.name_en || pid}
                            <X
                              className="h-2.5 w-2.5 cursor-pointer"
                              onClick={() =>
                                handleFormChange({
                                  related_products:
                                    formData.related_products.filter(
                                      (id) => id !== pid,
                                    ),
                                })
                              }
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] uppercase text-muted-foreground tracking-widest">
                Changes are automatically drafted
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="text-xs uppercase tracking-widest font-bold"
                onClick={handleCloseModalAttempt}
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => handleSave("active")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold px-8 font-bold uppercase tracking-widest text-xs"
              >
                {formData.id
                  ? "Update & Publish"
                  : t.admin.products.modal.publish}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary font-display">
              {t.admin.products.confirmDelete}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-muted-foreground">
            {productToDelete && (
              <p>
                Are you sure you want to delete{" "}
                <span className="text-foreground font-bold">
                  {locale === "ar"
                    ? productToDelete.name_ar
                    : locale === "tr"
                      ? productToDelete.name_tr
                      : productToDelete.name_en}
                </span>
                ? This action cannot be undone.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="bg-background border-border"
            >
              {t.admin.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await adminApi.deleteProduct(productToDelete.id);
                  queryClient.invalidateQueries({
                    queryKey: ["admin", "products"],
                  });
                  toast.success(t.admin.common.success);
                  setIsDeleteConfirmOpen(false);
                } catch (e) {
                  toast.error("Failed to delete product");
                }
              }}
            >
              {t.admin.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <Dialog
        open={isUnsavedConfirmOpen}
        onOpenChange={setIsUnsavedConfirmOpen}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary font-display">
              Unsaved Changes
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-muted-foreground">
            You have unsaved changes that will be lost if you close this modal.
            Are you sure?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUnsavedConfirmOpen(false)}
              className="bg-background border-border"
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsUnsavedConfirmOpen(false);
                setIsUnsaved(false);
                setIsModalOpen(false);
              }}
            >
              Discard & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
