"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SWRConfig } from "swr";
import { COPY, refusalMessage } from "@/data/copy";
import { getItem, getSource, type MenuItem, type SourceId } from "@/data/menu";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { Toast } from "@/components/ui/Toast";
import {
  EMPTY_CART,
  cartCount,
  cartIssues,
  cartSubtotal,
  qtyOf,
  removeItem,
  startNewCart,
  tryAdd,
  trySetQty,
  type CartState,
  type LineIssue,
} from "@/lib/cart";
import { createCartStore } from "@/lib/cart-store";
import { TOAST_MS } from "@/lib/config";
import type { MeData } from "@/lib/me";
import { maxQtyFor, type MenuState } from "@/lib/menu-rules";
import { useMenuState } from "./menu-state";

interface CartContextValue {
  cart: CartState;
  menu: MenuState;
  count: number;
  subtotal: number;
  issues: Record<string, LineIssue>;
  qtyOf: (itemId: string) => number;
  add: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside the student layout.");
  return value;
}

/**
 * The cart for the whole student portal: kept in memory and in sessionStorage,
 * checked against the same rules the server will use (one source, 10 units,
 * stock, morning cutoff, unavailable items). The server prices and re-checks
 * everything at checkout, so none of this is trusted for money.
 */
function CartScope({ userId, children }: { userId: string; children: ReactNode }) {
  const store = useMemo(() => createCartStore(userId), [userId]);
  const cart = useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY_CART);
  const menu = useMenuState();

  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [pending, setPending] = useState<{ item: MenuItem; from: SourceId } | null>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  const add = useCallback(
    (itemId: string) => {
      const item = getItem(itemId);
      if (!item) return;
      const outcome = tryAdd(store.getSnapshot(), item, menu);
      if (outcome.kind === "added") store.set(outcome.cart);
      else if (outcome.kind === "switch") setPending({ item, from: outcome.from });
      else toast(refusalMessage(outcome.reason, item.name, maxQtyFor(item, menu)));
    },
    [store, menu, toast],
  );

  const setQty = useCallback(
    (itemId: string, qty: number) => {
      const item = getItem(itemId);
      if (!item) return;
      const result = trySetQty(store.getSnapshot(), item, qty, menu);
      store.set(result.cart);
      if (result.refused) toast(refusalMessage(result.refused, item.name, maxQtyFor(item, menu)));
    },
    [store, menu, toast],
  );

  const remove = useCallback(
    (itemId: string) => {
      const item = getItem(itemId);
      if (item) store.set(removeItem(store.getSnapshot(), item));
    },
    [store],
  );

  const clear = useCallback(() => store.set(EMPTY_CART), [store]);

  function confirmSwitch() {
    if (!pending) return;
    const outcome = startNewCart(pending.item, menu);
    if (outcome.kind === "added") store.set(outcome.cart);
    setPending(null);
  }

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      menu,
      count: cartCount(cart),
      subtotal: cartSubtotal(cart),
      issues: cartIssues(cart, menu),
      qtyOf: (itemId) => qtyOf(cart, itemId),
      add,
      setQty,
      remove,
      clear,
    }),
    [cart, menu, add, setQty, remove, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <Toast message={message} />
      <Sheet
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `Start a new cart from ${getSource(pending.item.sourceId).name}?` : ""}
      >
        {pending ? (
          <>
            <p className="text-body text-espresso">
              Your {getSource(pending.from).name} cart will be cleared.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <PillButton full arrow onClick={confirmSwitch}>
                {COPY.student.cart.startNew}
              </PillButton>
              <PillButton full variant="secondary" onClick={() => setPending(null)}>
                {COPY.student.cart.keepCart}
              </PillButton>
            </div>
          </>
        ) : null}
      </Sheet>
    </CartContext.Provider>
  );
}

/** Seeds the menu state and "me" from the server, then provides the cart to everything below it. */
export function StudentProviders({
  userId,
  initialMenu,
  initialMe,
  children,
}: {
  userId: string;
  initialMenu: MenuState;
  initialMe: MeData;
  children: ReactNode;
}) {
  return (
    <SWRConfig value={{ fallback: { "/api/menu": initialMenu, "/api/me": initialMe } }}>
      <CartScope userId={userId}>{children}</CartScope>
    </SWRConfig>
  );
}
