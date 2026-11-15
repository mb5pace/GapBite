/**
 * Menu rules that decide what can be ordered right now. Pure functions with no
 * Redis and no clock of their own: callers pass the server's time. The browser
 * uses them to grey things out; ordering uses the same ones on the
 * server, which has the final say. Source: docs/BUSINESS_RULES.md "Other limits".
 */
import { BREAK_SLOTS } from "@/data/breaks";
import { getBuilding, type BuildingId } from "@/data/locations";
import type { MenuItem } from "@/data/menu";
import {
  MAX_UNITS_PER_ORDER,
  MORNING_CUTOFF,
  SLOT_LEAD_BUFFER_MIN,
} from "./config";
import { istMinutesOfDay, slotEpoch } from "./time";

export type ItemStatus = "ok" | "morning-closed" | "unavailable" | "sold-out";

export interface MenuState {
  /** Server time, epoch ms, when this was read. */
  now: number;
  /** Item IDs the cafe has switched off for today. */
  unavailable: string[];
  /** Vending slot -> units left. */
  stock: Record<string, number>;
}

/** True from 11:30 IST: items tagged "morning" cannot be ordered any more. */
export function isMorningClosed(nowMs: number): boolean {
  return istMinutesOfDay(nowMs) >= MORNING_CUTOFF.hour * 60 + MORNING_CUTOFF.minute;
}

/** Why an item can or cannot be added to a cart. */
export function itemStatus(item: MenuItem, state: MenuState): ItemStatus {
  if (state.unavailable.includes(item.id)) return "unavailable";
  if (item.tags.includes("morning") && isMorningClosed(state.now)) return "morning-closed";
  if (item.slot !== undefined && (state.stock[item.slot] ?? item.startStock ?? 0) <= 0) return "sold-out";
  return "ok";
}

/** Most units of this item one order can hold: the 10-unit limit, and the stock for vending. */
export function maxQtyFor(item: MenuItem, state: MenuState): number {
  if (item.slot === undefined) return MAX_UNITS_PER_ORDER;
  const left = state.stock[item.slot] ?? item.startStock ?? 0;
  return Math.max(0, Math.min(MAX_UNITS_PER_ORDER, left));
}

export interface NextBreak {
  slot: string;
  /** Epoch ms of the latest moment the order can still be placed for this break. */
  orderByMs: number;
  /** Minutes the order needs: prep + walk + SLOT_LEAD_BUFFER_MIN. */
  leadMin: number;
}

/**
 * The first break you can still make: break time minus (prep + walk + buffer) is
 * not in the past. With prep 5, GICT 2 and buffer 5 the lead is 12 minutes, so
 * the 11:50 break needs an order by 11:38. Null when no break is left today.
 */
export function nextBreak(nowMs: number, prepMin: number, buildingId: BuildingId | null): NextBreak | null {
  // No building means pickup at UC: there is no walk.
  const leadMin = prepMin + (buildingId ? getBuilding(buildingId).walkMin : 0) + SLOT_LEAD_BUFFER_MIN;
  for (const slot of BREAK_SLOTS) {
    const orderByMs = slotEpoch(slot, nowMs) - leadMin * 60_000;
    if (orderByMs >= nowMs) return { slot, orderByMs, leadMin };
  }
  return null;
}
