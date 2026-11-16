/**
 * How a kitchen ticket on the Cafe queue is outlined (v1.0.0 Phase C1, UI_UX_BIBLE.md "POS tickets"). Pure: the
 * browser draws it every second from the server's clock, and the tests check the thresholds.
 *
 * - A New ticket (PLACED): amber after NEW_AMBER_MIN minutes without an Accept, brick and "Waiting" after NEW_RED_MIN.
 * - A delivery in progress: amber from DUE_SOON_MIN minutes before its promised time, brick from the promised time
 *   through the end of grace (until the sweep settles it). Pickups never fail by themselves (docs/FLOWS.md section 5),
 *   so they get no time outline, the same as the "Due now" rule.
 * - A Ready delivery with no runner for UNCLAIMED_ALERT_MIN minutes keeps its amber "No runner yet" outline.
 * Brick wins over amber. There are no side stripes: the outline goes all the way round.
 */
import { DUE_SOON_MIN, NEW_AMBER_MIN, NEW_RED_MIN } from "./config";
import { canBeLate, isUnclaimed } from "./late-rules";
import type { Holder, OrderMode, OrderStatus } from "./order-types";

const MIN_MS = 60_000;

export type TicketOutline = "none" | "amber" | "brick";

export interface TicketLook {
  outline: TicketOutline;
  /** The "Waiting" badge on a New ticket left too long. */
  waiting: boolean;
  /** Whole minutes since the order was placed, never negative. */
  ageMin: number;
}

export interface TicketTimes {
  status: OrderStatus;
  mode: OrderMode;
  createdAt: number;
  promisedAt?: number;
  readyAt?: number;
  holder?: Holder;
}

export function ticketLook(card: TicketTimes, now: number): TicketLook {
  const ageMin = Math.max(0, Math.floor((now - card.createdAt) / MIN_MS));
  if (card.status === "PLACED") {
    const waited = now - card.createdAt;
    if (waited >= NEW_RED_MIN * MIN_MS) return { outline: "brick", waiting: true, ageMin };
    if (waited >= NEW_AMBER_MIN * MIN_MS) return { outline: "amber", waiting: false, ageMin };
    return { outline: "none", waiting: false, ageMin };
  }
  if (canBeLate(card)) {
    const promisedAt = card.promisedAt as number;
    if (now >= promisedAt) return { outline: "brick", waiting: false, ageMin };
    if (now >= promisedAt - DUE_SOON_MIN * MIN_MS) return { outline: "amber", waiting: false, ageMin };
  }
  if (isUnclaimed(card, now)) return { outline: "amber", waiting: false, ageMin };
  return { outline: "none", waiting: false, ageMin };
}
