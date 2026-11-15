/** What Order History and Refund Status show. Plain data, safe to import in the browser. */
import type { BuildingId } from "@/data/locations";
import type { SourceId } from "@/data/menu";
import type { OrderSummary } from "./order-types";

/** How a run the user carried ended. */
export type RunOutcome = "delivered" | "failed-late" | "no-show";

export interface RunHistoryItem {
  /** The order ID. The order page belongs to the buyer, so this is not a link. */
  id: string;
  sourceId: SourceId;
  buildingId: BuildingId;
  outcome: RunOutcome;
  kind: "runner" | "staff";
  /** What the run did to the wallet, from the ledger: +5 for a delivery, −75 for a late run. Null when nothing moved (staff). */
  amount: number | null;
  /** Server time the run ended, epoch ms. */
  at: number;
}

export interface HistoryReply {
  /** Finished orders, newest first (the same list as Orders › Past). */
  orders: OrderSummary[];
  /** Finished runs, newest first. */
  runs: RunHistoryItem[];
  now: number;
}

/** Why an order was refunded. A no-show is not here: nothing is refunded for one. */
export type RefundReason = "cancelled" | "rejected" | "failed-late";

export interface RefundItem {
  orderId: string;
  sourceId: SourceId;
  reason: RefundReason;
  /** Whole rupees: refunds are always the full total. */
  amount: number;
  /** Server time the order was closed, epoch ms. */
  at: number;
}

export interface RefundsReply {
  refunds: RefundItem[];
  /** All of them added up. */
  total: number;
  now: number;
}
