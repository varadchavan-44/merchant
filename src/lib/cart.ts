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

// Adding the same product+size again merges into the existing line
// instead of creating a duplicate row.
export function addToCart(item: CartItem) {
  const items = getCart();
  const existing = items.find(
    (i) => i.productId === item.productId && i.sizeId === item.sizeId
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  saveCart(items);
}

export function updateQuantity(productId: string, sizeId: string, quantity: number) {
  const items = getCart()
    .map((i) =>
      i.productId === productId && i.sizeId === sizeId ? { ...i, quantity } : i
    )
    .filter((i) => i.quantity > 0);
  saveCart(items);
}

export function removeFromCart(productId: string, sizeId: string) {
  const items = getCart().filter(
    (i) => !(i.productId === productId && i.sizeId === sizeId)
  );
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
