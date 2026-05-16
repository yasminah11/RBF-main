import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantLabel: string;
  price: number;
  image: string;
  quantity: number;
};

const KEY = "rbf_cart_v1";
let items: CartItem[] = load();
let isDrawerOpen = false;
const listeners = new Set<() => void>();

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const cart = {
  get(): CartItem[] { return items; },
  isOpen(): boolean { return isDrawerOpen; },
  setOpen(open: boolean) {
    isDrawerOpen = open;
    listeners.forEach((l) => l());
  },
  add(item: CartItem) {
    const idx = items.findIndex((i) => i.variantId === item.variantId);
    if (idx >= 0) items[idx].quantity += item.quantity;
    else items = [...items, item];
    isDrawerOpen = true; // Auto open drawer when item added
    persist();
  },
  update(variantId: string, qty: number) {
    items = items.map((i) => i.variantId === variantId ? { ...i, quantity: Math.max(1, qty) } : i);
    persist();
  },
  remove(variantId: string) {
    items = items.filter((i) => i.variantId !== variantId);
    persist();
  },
  clear() { items = []; persist(); },
  subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); },
};

export function useCart() {
  return useSyncExternalStore(
    (cb) => cart.subscribe(cb),
    () => items,
    () => items,
  );
}

export function useCartDrawer() {
  return useSyncExternalStore(
    (cb) => cart.subscribe(cb),
    () => isDrawerOpen,
    () => isDrawerOpen,
  );
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}
export function cartTotal(items: CartItem[]) {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
