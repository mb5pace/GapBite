/**
 * When an order is due, and what happens when grace ends. Pure functions: the browser uses them to
 * show the amber "Due now" state, the server uses the same ones to settle. The server's clock is the
 * only clock; callers pass `now`. Source: docs/BUSINESS_RULES.md "When grace ends", docs/FLOWS.md section 5.
 */
import { GRACE_MIN, PICKUP_STALE_MIN, UNCLAIMED_ALERT_MIN } from "./config";
import type { Holder, OrderMode, OrderStatus } from "./order-types";

const MIN_MS = 60_000;

/** The statuses the sweep looks at. PLACED is left to the buyer (cancel) and the cafe (reject). */
export const LATE_STATUSES: readonly OrderStatus[] = ["ACCEPTED", "PREPARING", "READY", "PICKED_UP"];

interface Timed {
  mode: OrderMode;
  status: OrderStatus;
  promisedAt?: number;
}

/** True for a delivery order that can still be late: in progress, and with a promised time. Pickups never fail by themselves. */
export function canBeLate(order: Timed): boolean {
  return order.mode === "delivery" && order.promisedAt !== undefined && LATE_STATUSES.includes(order.status);
}

/** At or after the promised time, before grace ends: shown amber as "Due now". */
export function isDue(order: Timed, now: number): boolean {
  return canBeLate(order) && now >= (order.promisedAt as number);
}

/** When grace ends: the promised time + GRACE_MIN. */
export function graceEndsAt(promisedAt: number): number {
  return promisedAt + GRACE_MIN * MIN_MS;
}

/** What settling an overdue order does. See the four rows of "When grace ends". */
export type LateOutcome = "no-show" | "failed-runner" | "failed-staff" | "failed-before-pickup";

/**
 * Null while the order is not overdue (or cannot be). Otherwise the outcome, first match wins:
 * an on-time arrival (arrivedAt at or before the promised time) is a no-show whoever holds it; a student
 * runner who was late is debited; staff are not; an order nobody picked up is absorbed by the cafe.
 */
export function lateOutcome(
  order: Timed & { holder?: Holder; arrivedAt?: number },
  now: number,
): LateOutcome | null {
  if (!canBeLate(order)) return null;
  const promisedAt = order.promisedAt as number;
  if (now < graceEndsAt(promisedAt)) return null;
  if (order.status === "PICKED_UP" && order.holder) {
    if (order.arrivedAt !== undefined && order.arrivedAt <= promisedAt) return "no-show";
    return order.holder.kind === "runner" ? "failed-runner" : "failed-staff";
  }
  return "failed-before-pickup";
}

/** A Ready delivery order with nobody carrying it for UNCLAIMED_ALERT_MIN minutes: "No runner yet, send with staff?". */
export function isUnclaimed(
  card: { mode: OrderMode; status: OrderStatus; holder?: Holder; readyAt?: number },
  now: number,
): boolean {
  return (
    card.mode === "delivery" &&
    card.status === "READY" &&
    !card.holder &&
    card.readyAt !== undefined &&
    now - card.readyAt >= UNCLAIMED_ALERT_MIN * MIN_MS
  );
}

/** A no-show bag is held at the counter until this time. */
export function noShowHoldEnd(noShowAt: number): number {
  return noShowAt + PICKUP_STALE_MIN * MIN_MS;
}

/**
 * A NO_SHOW order the buyer can still collect at the source counter with the same code: until
 * PICKUP_STALE_MIN after the no-show, and only if the bag has not been handed over. Null for any other order.
 */
export function noShowHold(
  order: { status: OrderStatus; collectedAt?: number; events: { status: OrderStatus; at: number }[] },
  now: number,
): { until: number; open: boolean } | null {
  if (order.status !== "NO_SHOW") return null;
  const event = [...order.events].reverse().find((e) => e.status === "NO_SHOW");
  if (!event) return null;
  const until = noShowHoldEnd(event.at);
  return { until, open: order.collectedAt === undefined && now < until };
}
