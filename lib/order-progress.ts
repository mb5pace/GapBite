/**
 * The progress line on Home (docs/SCREENS.md "Order progress line"): four segments tied to the real status of an order.
 * Pure: the browser and the tests use it.
 *
 *   Delivery: Placed, Preparing, On the way, Delivered.
 *   Pickup and vending: Placed, Preparing, Ready at counter, Collected.
 *
 * A segment is full once its stage has been reached. The two stages that last a known time fill honestly while they last:
 * Preparing (elapsed since the cafe accepted, over the prep time) and On the way (elapsed since pickup, over the walk).
 * Until the status really changes they stop at PROGRESS_FILL_CAP, so the line is never ahead of what has happened.
 */
import { PROGRESS_FILL_CAP } from "./config";
import type { OrderSummary } from "./order-types";

export const DELIVERY_STAGES = ["Placed", "Preparing", "On the way", "Delivered"] as const;
export const PICKUP_STAGES = ["Placed", "Preparing", "Ready at counter", "Collected"] as const;

export type ProgressInput = Pick<OrderSummary, "mode" | "status" | "prepMin" | "walkMin" | "acceptedAt" | "pickedUpAt" | "updatedAt">;

export interface Progress {
  labels: readonly string[];
  /** Four numbers from 0 to 1. */
  fills: number[];
  /** The stage the order is in (0 to 3). */
  current: number;
}

/** Elapsed over expected, never above the cap. 0 when there is no expected time. */
export function stageFill(elapsedMs: number, expectedMin: number): number {
  if (expectedMin <= 0) return 0;
  return Math.min(PROGRESS_FILL_CAP, Math.max(0, elapsedMs / (expectedMin * 60_000)));
}

export function orderProgress(order: ProgressInput, now: number): Progress {
  const delivery = order.mode === "delivery";
  const labels = delivery ? DELIVERY_STAGES : PICKUP_STAGES;
  switch (order.status) {
    case "PLACED":
      return { labels, fills: [1, 0, 0, 0], current: 0 };
    case "ACCEPTED":
    case "PREPARING":
      return { labels, fills: [1, stageFill(now - (order.acceptedAt ?? order.updatedAt), order.prepMin), 0, 0], current: 1 };
    case "READY":
      // A delivery waits here for a runner: preparing is done, the way has not started. A pickup is ready at the counter.
      return delivery ? { labels, fills: [1, 1, 0, 0], current: 1 } : { labels, fills: [1, 1, 1, 0], current: 2 };
    case "PICKED_UP":
      return { labels, fills: [1, 1, stageFill(now - (order.pickedUpAt ?? order.updatedAt), order.walkMin), 0], current: 2 };
    default:
      return { labels, fills: [1, 1, 1, 1], current: 3 };
  }
}

/** Where the walker sits along the whole track, 0 to 100: the end of the fill. */
export function progressPercent(fills: readonly number[]): number {
  return (fills.reduce((sum, fill) => sum + fill, 0) / fills.length) * 100;
}

/** The order that needs attention first: the earliest promised time (one with no promised time goes last). */
export function mostUrgent<T extends Pick<OrderSummary, "promisedAt" | "createdAt" | "id">>(orders: readonly T[]): T | null {
  if (orders.length === 0) return null;
  return [...orders].sort(
    (a, b) => (a.promisedAt ?? Infinity) - (b.promisedAt ?? Infinity) || a.createdAt - b.createdAt || a.id.localeCompare(b.id),
  )[0];
}
