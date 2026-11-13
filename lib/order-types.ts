/**
 * Order shapes and status helpers. Source: docs/FLOWS.md "Order record" and the
 * status machine. Pure types and functions: safe in the browser and on the server.
 */
import type { BuildingId } from "@/data/locations";
import type { SourceId } from "@/data/menu";

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERED"
  | "COLLECTED"
  | "CANCELLED"
  | "REJECTED"
  | "FAILED_LATE";

export type OrderMode = "pickup" | "delivery";

/** Done: nothing more can happen to the order. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "COLLECTED",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
  "FAILED_LATE",
];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export interface OrderItem {
  itemId: string;
  name: string;
  /** Whole rupees, as priced by the server when the order was placed. */
  price: number;
  qty: number;
}

export interface OrderEvent {
  at: number;
  status: OrderStatus;
  note?: string;
}

export interface Holder {
  kind: "runner" | "staff";
  id: string;
  name: string;
}

export interface Order {
  /** "QX-4821" */
  id: string;
  buyerId: string;
  buyerName: string;
  sourceId: SourceId;
  items: OrderItem[];
  mode: OrderMode;
  buildingId?: BuildingId;
  /** "asap" or a break slot such as "11:50". */
  when: "asap" | string;
  subtotal: number;
  fee: number;
  total: number;
  /** 4-digit handover or collect code. Only the buyer is ever sent this. */
  code: string;
  status: OrderStatus;
  holder?: Holder;
  prepMin: number;
  walkMin: number;
  /** Epoch ms. An estimate at placement, fixed when the cafe accepts. */
  promisedAt?: number;
  events: OrderEvent[];
  createdAt: number;
  updatedAt: number;
}

/** What lists get: everything except the code and the event history. */
export interface OrderSummary {
  id: string;
  sourceId: SourceId;
  status: OrderStatus;
  mode: OrderMode;
  buildingId?: BuildingId;
  when: string;
  units: number;
  total: number;
  promisedAt?: number;
  holder?: Holder;
  createdAt: number;
  updatedAt: number;
}

export function summarize(order: Order): OrderSummary {
  return {
    id: order.id,
    sourceId: order.sourceId,
    status: order.status,
    mode: order.mode,
    buildingId: order.buildingId,
    when: order.when,
    units: order.items.reduce((sum, item) => sum + item.qty, 0),
    total: order.total,
    promisedAt: order.promisedAt,
    holder: order.holder,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/** The steps of the tracker for this order: vending skips Preparing, pickup ends at Collected. */
export function stepsFor(order: Pick<Order, "sourceId" | "mode">): OrderStatus[] {
  const cooked = order.sourceId !== "vending";
  const middle: OrderStatus[] = cooked ? ["ACCEPTED", "PREPARING", "READY"] : ["ACCEPTED", "READY"];
  return order.mode === "delivery"
    ? ["PLACED", ...middle, "PICKED_UP", "DELIVERED"]
    : ["PLACED", ...middle, "COLLECTED"];
}
