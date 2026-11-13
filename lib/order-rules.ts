/**
 * Ordering rules as pure functions. The checkout screen uses them to show the
 * exact bill and to grey things out; the server uses the same ones to price and
 * check the real order, and has the final say. Source: docs/BUSINESS_RULES.md,
 * docs/FLOWS.md section 1. Money is whole rupees.
 */
import { BREAK_SLOTS } from "@/data/breaks";
import { getBuilding, type BuildingId } from "@/data/locations";
import { getItem, type SourceId } from "@/data/menu";
import { BUFFER_MIN, FEES, MAX_UNITS_PER_ORDER, SLOT_LEAD_BUFFER_MIN } from "./config";
import type { OrderItem, OrderMode } from "./order-types";
import { slotEpoch } from "./time";

export type PriceFailure = "empty" | "unknown-item" | "mixed-sources" | "too-many";

export type PriceResult =
  | { ok: true; items: OrderItem[]; subtotal: number; units: number; prepMin: number; sourceId: SourceId }
  | { ok: false; reason: PriceFailure };

/**
 * Prices a list of { itemId, qty } from data/menu.ts, never from anything the
 * client sent. Merges repeated items. The prep time is the slowest item (items are made in parallel).
 */
export function priceLines(lines: { itemId: string; qty: number }[]): PriceResult {
  const merged = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.qty) || line.qty < 1) return { ok: false, reason: "empty" };
    merged.set(line.itemId, (merged.get(line.itemId) ?? 0) + line.qty);
  }
  if (merged.size === 0) return { ok: false, reason: "empty" };

  const items: OrderItem[] = [];
  let sourceId: SourceId | null = null;
  let prepMin = 0;
  let units = 0;
  for (const [itemId, qty] of merged) {
    const item = getItem(itemId);
    if (!item) return { ok: false, reason: "unknown-item" };
    if (sourceId !== null && item.sourceId !== sourceId) return { ok: false, reason: "mixed-sources" };
    sourceId = item.sourceId;
    items.push({ itemId, name: item.name, price: item.price, qty });
    prepMin = Math.max(prepMin, item.prepMin);
    units += qty;
  }
  if (units > MAX_UNITS_PER_ORDER) return { ok: false, reason: "too-many" };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { ok: true, items, subtotal, units, prepMin, sourceId: sourceId as SourceId };
}

/** What the buyer pays on top of the food: ₹0 for pickup, by zone for delivery (never by who delivers). */
export function feeFor(mode: OrderMode, buildingId?: BuildingId): number {
  if (mode === "pickup" || !buildingId) return FEES.pickup;
  return FEES[getBuilding(buildingId).zone];
}

/** Minutes of walking from UC: none for pickup. */
export function walkFor(mode: OrderMode, buildingId?: BuildingId): number {
  if (mode === "pickup" || !buildingId) return 0;
  return getBuilding(buildingId).walkMin;
}

/** Break slots still ahead of us today, in order. */
export function slotsLeftToday(nowMs: number): string[] {
  return BREAK_SLOTS.filter((slot) => slotEpoch(slot, nowMs) > nowMs);
}

/** A slot can be chosen only if now + prep + walk + 5 minutes is before it. */
export function slotAvailable(slot: string, nowMs: number, prepMin: number, walkMin: number): boolean {
  const leadMs = (prepMin + walkMin + SLOT_LEAD_BUFFER_MIN) * 60_000;
  return nowMs + leadMs < slotEpoch(slot, nowMs);
}

/**
 * When the order should reach the buyer, as an estimate at placement (the cafe fixes it
 * when it accepts). ASAP delivery: now + prep + walk + 2 minutes. ASAP pickup: now + prep.
 * A break slot: the slot time.
 */
export function estimatePromisedAt(args: {
  mode: OrderMode;
  when: string;
  nowMs: number;
  prepMin: number;
  walkMin: number;
}): number {
  if (args.when !== "asap") return slotEpoch(args.when, args.nowMs);
  const minutes = args.mode === "delivery" ? args.prepMin + args.walkMin + BUFFER_MIN : args.prepMin;
  return args.nowMs + minutes * 60_000;
}
