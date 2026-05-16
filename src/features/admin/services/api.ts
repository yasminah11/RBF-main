import { supabase } from "@/integrations/supabase/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");
}

async function saveColorVariants(productId: string, colors: any[]) {
  if (!colors || colors.length === 0) return;

  const rows = colors.map((c, i) => ({
    product_id: productId,
    name_en: c.name_en || "",
    name_ar: c.name_ar || "",
    name_tr: c.name_tr || "",
    hex_color: c.hex || "#000000",
    stock_quantity: Number(c.stock) || 0,
    is_available: c.is_active ?? true,
    is_main: c.is_main ?? i === 0,
    position: i,
  }));

  const { error } = await supabase.from("product_color_variants").insert(rows);
  if (error) throw new Error(`Color variants save failed: ${error.message}`);
}

async function saveSizes(
  productId: string,
  sizes: string[],
  hasOneSize: boolean,
) {
  const labels = hasOneSize ? ["One Size"] : sizes;
  if (!labels || labels.length === 0) return;

  const rows = labels.map((label, i) => ({
    product_id: productId,
    size_label: label,
    position: i,
  }));

  const { error } = await supabase.from("product_sizes").insert(rows);
  if (error) throw new Error(`Sizes save failed: ${error.message}`);
}

async function saveImages(productId: string, images: string[]) {
  if (!images || images.length === 0) return;

  const rows = images.map((url, i) => ({
    product_id: productId,
    url,
    position: i,
    is_main: i === 0,
    color_variant_id: null,
  }));

  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw new Error(`Images save failed: ${error.message}`);
}

// ─── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardStats: async () => {
    const [products, orders, revenue] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }),
      supabase.from("orders").select("id", { count: "exact" }),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("payment_status", "paid"),
    ]);

    const totalRevenue =
      revenue.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    return {
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalRevenue,
    };
  },

  // ── Products ───────────────────────────────────────────────────────────────

  getProducts: async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          categories(id, name_en, name_ar, name_tr),
          product_images(id, url, is_main, position),
          product_color_variants(*),
          product_sizes(*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to mock products", e);
      const { MOCK_PRODUCTS_FULL } = await import("@/lib/constants");
      return MOCK_PRODUCTS_FULL || [];
    }
  },

  createProduct: async (productData: any) => {
    const { data: product, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) throw new Error(`Product insert failed: ${error.message}`);
    return product;
  },

  updateProduct: async (id: string, productData: any) => {
    const { data, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Product update failed: ${error.message}`);
    return data;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(`Product delete failed: ${error.message}`);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────

  getOrders: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  updateOrderStatus: async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to mock categories", e);
      const { MOCK_CATEGORIES } = await import("@/lib/constants");
      return MOCK_CATEGORIES || [];
    }
  },

  createCategory: async (category: any) => {
    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCategory: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
