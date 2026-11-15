/**
 * Cart rules as pure functions on plain data. A cart holds item IDs and
 * quantities only, never prices: prices always come from data/menu.ts here, and
 * the server prices the order again at checkout (CLAUDE.md rule 4, FLOWS.md).
 * Source: docs/BUSINESS_RULES.md "Other limits". Safe in the browser and on the server.
 */
import { MENU_ITEMS, getItem, type MenuItem, type SourceId } from "@/data/menu";
import { MAX_UNITS_PER_ORDER } from "./config";
import { itemStatus, maxQtyFor, type ItemStatus, type MenuState } from "./menu-rules";

export interface CartLine {
  itemId: string;
  qty: number;
}

export interface CartState {
  /** The one source this cart is for, or null while it is empty. */
  sourceId: SourceId | null;
  lines: CartLine[];
}

export const EMPTY_CART: CartState = { sourceId: null, lines: [] };

export type RefusalReason = "limit" | "stock" | "unavailable" | "closed" | "window" | "sold-out";

export type AddOutcome =
  | { kind: "added"; cart: CartState }
  | { kind: "switch"; from: SourceId; to: SourceId }
  | { kind: "refused"; reason: RefusalReason };

/** Total units in the cart. */
export function cartCount(cart: CartState): number {
  return cart.lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Sum of price x quantity, integer rupees. */
export function cartSubtotal(cart: CartState): number {
  return cart.lines.reduce((sum, line) => sum + (getItem(line.itemId)?.price ?? 0) * line.qty, 0);
}

export function qtyOf(cart: CartState, itemId: string): number {
  return cart.lines.find((line) => line.itemId === itemId)?.qty ?? 0;
}

function withQty(cart: CartState, item: MenuItem, qty: number): CartState {
  const others = cart.lines.filter((line) => line.itemId !== item.id);
  const lines = qty > 0 ? [...others, { itemId: item.id, qty }] : others;
  // Keep lines in menu order so the cart does not jump around.
  const order = new Map(MENU_ITEMS.map((m, i) => [m.id, i]));
  lines.sort((a, b) => (order.get(a.itemId) ?? 0) - (order.get(b.itemId) ?? 0));
  return { sourceId: lines.length > 0 ? item.sourceId : null, lines };
}

/**
 * Adds one unit. Refuses an item that cannot be ordered right now, a 11th unit,
 * or more than the vending machine has. Asks to switch when the item is from
 * another source than the cart's.
 */
export function tryAdd(cart: CartState, item: MenuItem, menu: MenuState): AddOutcome {
  const status = itemStatus(item, menu);
  if (status !== "ok") return { kind: "refused", reason: status };

  if (cart.sourceId !== null && cart.lines.length > 0 && cart.sourceId !== item.sourceId) {
    return { kind: "switch", from: cart.sourceId, to: item.sourceId };
  }

  if (cartCount(cart) + 1 > MAX_UNITS_PER_ORDER) return { kind: "refused", reason: "limit" };
  const next = qtyOf(cart, item.id) + 1;
  if (next > maxQtyFor(item, menu)) return { kind: "refused", reason: "stock" };

  return { kind: "added", cart: withQty(cart, item, next) };
}

/** Sets a line to an exact quantity. Going down always works; going up follows the same limits as adding. */
export function trySetQty(
  cart: CartState,
  item: MenuItem,
  qty: number,
  menu: MenuState,
): { cart: CartState; refused?: RefusalReason } {
  const current = qtyOf(cart, item.id);
  const wanted = Math.max(0, Math.floor(qty));
  if (wanted <= current) return { cart: withQty(cart, item, wanted) };
  if (cartCount(cart) - current + wanted > MAX_UNITS_PER_ORDER) return { cart, refused: "limit" };
  if (wanted > maxQtyFor(item, menu)) return { cart, refused: "stock" };
  return { cart: withQty(cart, item, wanted) };
}

export function removeItem(cart: CartState, item: MenuItem): CartState {
  return withQty(cart, item, 0);
}

/** A cart with `item` as its only line, for "Start a new cart from ...". */
export function startNewCart(item: MenuItem, menu: MenuState): AddOutcome {
  return tryAdd(EMPTY_CART, item, menu);
}

export type LineIssue = ItemStatus | "over-stock";

/** Lines that can no longer be ordered as they are, for example an item the cafe switched off after it went into the cart. */
export function cartIssues(cart: CartState, menu: MenuState): Record<string, LineIssue> {
  const issues: Record<string, LineIssue> = {};
  for (const line of cart.lines) {
    const item = getItem(line.itemId);
    if (!item) continue;
    const status = itemStatus(item, menu);
    if (status !== "ok") issues[line.itemId] = status;
    else if (line.qty > maxQtyFor(item, menu)) issues[line.itemId] = "over-stock";
  }
  return issues;
}

/** Reads a cart back from storage, dropping anything that no longer makes sense. */
export function sanitizeCart(raw: unknown): CartState {
  if (typeof raw !== "object" || raw === null) return EMPTY_CART;
  const lines = (raw as { lines?: unknown }).lines;
  if (!Array.isArray(lines)) return EMPTY_CART;

  let cart: CartState = EMPTY_CART;
  let source: SourceId | null = null;
  let total = 0;
  for (const entry of lines) {
    const itemId = (entry as { itemId?: unknown })?.itemId;
    const qty = (entry as { qty?: unknown })?.qty;
    if (typeof itemId !== "string" || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    const item = getItem(itemId);
    if (!item) continue;
    if (source !== null && item.sourceId !== source) continue; // one source only
    const room = MAX_UNITS_PER_ORDER - total;
    const kept = Math.min(qty, room);
    if (kept < 1) continue;
    source = item.sourceId;
    total += kept;
    cart = withQty(cart, item, kept);
  }
  return cart;
}

export interface ReorderPlan {
  /** The cart after the reorder (only use it if something was added). */
  cart: CartState;
  added: MenuItem[];
  /** Items that cannot be ordered right now (switched off, closed, outside their time, sold out) or are not on the menu. */
  skipped: { itemId: string; name: string }[];
  /** The source whose cart would be cleared to make room, if the cart holds another cafe's items. */
  replaces: SourceId | null;
}

/**
 * "Order again": the same items into the cart, as many of each as can be added now. Anything that cannot be ordered right
 * now is skipped (and named). If the cart holds another cafe's items it starts a new cart, and says which one it replaces
 * so the screen can ask first. The usual limits (10 units, vending stock) still apply.
 */
export function planReorder(cart: CartState, lines: readonly { itemId: string; name: string; qty: number }[], menu: MenuState): ReorderPlan {
  const source = lines.map((line) => getItem(line.itemId)?.sourceId).find((id): id is SourceId => id !== undefined) ?? null;
  const replaces = source !== null && cart.sourceId !== null && cart.lines.length > 0 && cart.sourceId !== source ? cart.sourceId : null;
  let next: CartState = replaces ? EMPTY_CART : cart;
  const added: MenuItem[] = [];
  const skipped: { itemId: string; name: string }[] = [];
  for (const line of lines) {
    const item = getItem(line.itemId);
    if (!item || item.sourceId !== source || itemStatus(item, menu) !== "ok") {
      skipped.push({ itemId: line.itemId, name: item?.name ?? line.name });
      continue;
    }
    let put = 0;
    for (let i = 0; i < line.qty; i++) {
      const outcome = tryAdd(next, item, menu);
      if (outcome.kind !== "added") break;
      next = outcome.cart;
      put++;
    }
    if (put > 0) added.push(item);
    else skipped.push({ itemId: item.id, name: item.name });
  }
  return { cart: next, added, skipped, replaces: added.length > 0 ? replaces : null };
}
