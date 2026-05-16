// Use relative imports to ensure maximum compatibility with Vite's resolution
import p1_raw from "../assets/product-1.jpg";
import p3_raw from "../assets/product-3.jpg";
import p4_raw from "../assets/product-4.jpg";
import p5_raw from "../assets/product-5.jpg";
import p6_raw from "../assets/product-6.jpg";
import p7_raw from "../assets/product-7.jpg";
import p8_raw from "../assets/product-8.jpg";
import p9_raw from "../assets/product-9.jpg";
import p10_raw from "../assets/product-10.jpg";
import catDresses_raw from "../assets/cat-dresses.jpg";
import catOuterwear_raw from "../assets/cat-outerwear.jpg";
import catAccessories_raw from "../assets/cat-accessories.jpg";
import header1_raw from "../assets/header1.jpg";
import coverEmail_raw from "../assets/coverEmail.png";

// Helper to ensure we get a string URL regardless of how Vite imports it
const resolve = (asset: any): string => {
  if (typeof asset === 'string') return asset;
  if (asset && typeof asset === 'object' && asset.default) return asset.default;
  return asset;
};

// Normalized asset strings
export const p1 = resolve(p1_raw);
export const p3 = resolve(p3_raw);
export const p4 = resolve(p4_raw);
export const p5 = resolve(p5_raw);
export const p6 = resolve(p6_raw);
export const p7 = resolve(p7_raw);
export const p8 = resolve(p8_raw);
export const p9 = resolve(p9_raw);
export const p10 = resolve(p10_raw);
export const catDresses = resolve(catDresses_raw);
export const catOuterwear = resolve(catOuterwear_raw);
export const catAccessories = resolve(catAccessories_raw);
export const header1 = resolve(header1_raw);
export const coverEmail = resolve(coverEmail_raw);

// SKU to Image Mapping (Case-insensitive)
const productMap: Record<string, string> = {
  "LFB-001": p1,
  "LFB-002": p1,
  "LFB-003": p3,
  "LFB-004": p4,
  "LFB-005": p5,
  "LFB-006": p6,
  "LFB-007": p7,
  "LFB-008": p8,
  "LFB-009": p9,
  "LFB-010": p10,
};

// Category Slug to Image Mapping (Case-insensitive)
const catMap: Record<string, string> = {
  "modest-dresses": catDresses,
  "evening-dresses": catDresses,
  "wedding-dresses": catDresses,
  "engagement-dresses": catDresses,
};

/**
 * Returns the product image URL based on SKU.
 */
export function productImg(sku: string | null | undefined, fallback?: string) {
  if (!sku) return fallback || p1;
  const key = sku.toString().toUpperCase();
  return productMap[key] || fallback || p1;
}

/**
 * Returns the category image URL based on slug.
 */
export function categoryImg(slug: string | null | undefined) {
  if (!slug) return catDresses;
  const key = slug.toString().toLowerCase();
  return catMap[key] || catDresses;
}
