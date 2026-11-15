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
  SLOT_LEAD_BUFFER_MIN,
} from "./config";
import { sourceBlockNow, sourceLabel, windowLabel, windowOf, windowSentence, outsideWindow, type HoursConfig, type ServiceState } from "./hours-rules";
import { slotEpoch } from "./time";

/**
 * ok. unavailable: the cafe switched it off for today. closed: its place is not taking orders now (closed, paused, or the
 * whole service is off). window: the item has a time window and now is outside it. sold-out: vending slot empty.
 */
export type ItemStatus = "ok" | "unavailable" | "closed" | "window" | "sold-out";

export interface MenuState {
  /** Server time, epoch ms, when this was read. */
  now: number;
  /** Item IDs the cafe has switched off for today. */
  unavailable: string[];
  /** Vending slot -> units left. */
  stock: Record<string, number>;
  /** Opening hours, open days, pauses, item windows and holidays (Cafe portal › Hours and items). */
  hours: HoursConfig;
  /** The service-wide switch (Admin › Service). */
  service: ServiceState;
}

/** Why an item can or cannot be added to a cart. */
export function itemStatus(item: MenuItem, state: MenuState): ItemStatus {
  if (state.unavailable.includes(item.id)) return "unavailable";
  if (sourceBlockNow(state.hours, state.service, item.sourceId, state.now)) return "closed";
  const w = windowOf(state.hours, item.id);
  if (w && outsideWindow(w, state.now)) return "window";
  if (item.slot !== undefined && (state.stock[item.slot] ?? item.startStock ?? 0) <= 0) return "sold-out";
  return "ok";
}

/**
 * Goes under "Unavailable" on a cafe's menu: the cafe switched it off, it is outside its own time window, or it is sold
 * out. An item whose whole place is closed or paused is not unavailable in this sense: the menu stays readable.
 */
export function isUnavailableItem(item: MenuItem, state: MenuState): boolean {
  const status = itemStatus(item, state);
  return status === "unavailable" || status === "window" || status === "sold-out";
}

/** The short reason shown on a row that cannot be added right now ("Breakfast, until 11:00", "Opens at 12:00"), or null. */
export function itemNote(item: MenuItem, state: MenuState): string | null {
  const status = itemStatus(item, state);
  if (status === "window") {
    const w = windowOf(state.hours, item.id);
    return w ? windowLabel(item, w) : null;
  }
  if (status === "closed") return sourceLabel(state.hours, state.service, item.sourceId, state.now).text;
  return null;
}

/** The same reason as a full sentence ("Kanda Poha is breakfast only, until 11:00.", "Global Bistro opens at 12:00."), or null. */
export function itemMessage(item: MenuItem, state: MenuState): string | null {
  const status = itemStatus(item, state);
  if (status === "closed") return sourceBlockNow(state.hours, state.service, item.sourceId, state.now)?.message ?? null;
  if (status === "window") {
    const w = windowOf(state.hours, item.id);
    return w ? windowSentence(item, w) : null;
  }
  return null;
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
export function nextBreak(
  nowMs: number,
  prepMin: number,
  buildingId: BuildingId | null,
  /** Skip breaks that do not fit (a closed place, an item outside its window). */
  usable: (slot: string) => boolean = () => true,
): NextBreak | null {
  // No building means pickup at UC: there is no walk.
  const leadMin = prepMin + (buildingId ? getBuilding(buildingId).walkMin : 0) + SLOT_LEAD_BUFFER_MIN;
  for (const slot of BREAK_SLOTS) {
    const orderByMs = slotEpoch(slot, nowMs) - leadMin * 60_000;
    if (orderByMs >= nowMs && usable(slot)) return { slot, orderByMs, leadMin };
  }
  return null;
}
