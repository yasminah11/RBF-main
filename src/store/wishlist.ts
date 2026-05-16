import { useSyncExternalStore } from "react";

export type WishlistItem = {
  id: string;
  sku: string;
  slug: string;
  name_ar: string; name_en: string; name_tr: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
};

const KEY = "rbf_wishlist_v1";
let items: WishlistItem[] = load();
const listeners = new Set<() => void>();

function load(): WishlistItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const wishlist = {
  get(): WishlistItem[] { return items; },
  toggle(item: WishlistItem) {
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items = items.filter((i) => i.id !== item.id);
    else items = [...items, item];
    persist();
  },
  remove(id: string) {
    items = items.filter((i) => i.id !== id);
    persist();
  },
  has(id: string) {
    return items.some((i) => i.id === id);
  },
  subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); },
};

export function useWishlist() {
  return useSyncExternalStore(
    (cb) => wishlist.subscribe(cb),
    () => items,
    () => items,
  );
}
