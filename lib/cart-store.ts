/**
 * The cart's storage: in memory, mirrored to sessionStorage so a refresh keeps
 * it. One store per signed-in user, so a cart never leaks to the next person on
 * the same device. Every storage call is wrapped in try/catch because storage
 * can be missing or blocked (private windows, blocked site data). Browser only.
 */
import { EMPTY_CART, sanitizeCart, type CartState } from "./cart";

export interface CartStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CartState;
  set(next: CartState): void;
}

export function createCartStore(userId: string): CartStore {
  const storageKey = `qx-cart-${userId}`;
  let state: CartState | null = null;
  const listeners = new Set<() => void>();

  function load(): CartState {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw ? sanitizeCart(JSON.parse(raw)) : EMPTY_CART;
    } catch {
      return EMPTY_CART;
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Loaded the first time it is read in the browser, then kept in memory.
    getSnapshot() {
      if (state === null) state = load();
      return state;
    },
    set(next) {
      state = next;
      try {
        if (next.lines.length === 0) window.sessionStorage.removeItem(storageKey);
        else window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Memory still holds the cart.
      }
      listeners.forEach((listener) => listener());
    },
  };
}
