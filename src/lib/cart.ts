import { CartItem } from "./types";

const CART_KEY = "cart_items";

// Fires on every mutation so any mounted component (e.g. the header
// cart badge) can re-read without needing a shared React context.
function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  notify();
}

function newLineId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `line_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Adding the same product+size again merges into the existing line —
// UNLESS the item carries per-unit customizations, in which case each
// "add to cart" click becomes its own line, since merging would blur
// which name/number belongs to which unit.
export function addToCart(item: Omit<CartItem, "lineId">) {
  const items = getCart();

  if (!item.customizations) {
    const existing = items.find(
      (i) => !i.customizations && i.productId === item.productId && i.sizeId === item.sizeId
    );
    if (existing) {
      existing.quantity += item.quantity;
      saveCart(items);
      return;
    }
  }

  items.push({ ...item, lineId: newLineId() });
  saveCart(items);
}

export function updateQuantity(lineId: string, quantity: number) {
  const items = getCart()
    .map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  saveCart(items);
}

export function removeFromCart(lineId: string) {
  const items = getCart().filter((i) => i.lineId !== lineId);
  saveCart(items);
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY);
  notify();
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotalPaise(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0);
}
