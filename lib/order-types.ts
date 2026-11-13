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
  | "FAILED_LATE"
  | "NO_SHOW";

export type OrderMode = "pickup" | "delivery";

/** Done: nothing more can happen to the order. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  "COLLECTED",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
  "FAILED_LATE",
  "NO_SHOW",
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
  /** Epoch ms. Set when the holder taps "I'm here" at the drop point (PICKED_UP only). */
  arrivedAt?: number;
  /** Epoch ms. A NO_SHOW bag handed to the buyer at the counter (the status stays NO_SHOW). */
  collectedAt?: number;
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

/**
 * What the cafe desk sees of an order. No code, no buyer, no prices: the desk
 * needs what to make and where it goes. (The counter asks the buyer for the code.)
 */
export interface CafeCard {
  id: string;
  sourceId: SourceId;
  status: OrderStatus;
  mode: OrderMode;
  buildingId?: BuildingId;
  when: string;
  items: { name: string; qty: number }[];
  promisedAt?: number;
  createdAt: number;
  /** When it became READY, for how long a bag has been waiting. */
  readyAt?: number;
  /** When the holder tapped "I'm here". */
  arrivedAt?: number;
  holder?: Holder;
}

export function toCafeCard(order: Order): CafeCard {
  const ready = [...order.events].reverse().find((event) => event.status === "READY");
  return {
    id: order.id,
    sourceId: order.sourceId,
    status: order.status,
    mode: order.mode,
    buildingId: order.buildingId,
    when: order.when,
    items: order.items.map((line) => ({ name: line.name, qty: line.qty })),
    promisedAt: order.promisedAt,
    createdAt: order.createdAt,
    readyAt: ready?.at,
    arrivedAt: order.arrivedAt,
    holder: order.holder,
  };
}

export type QueueColumnId = "new" | "preparing" | "ready" | "out";

/** Which column of the cafe queue an order sits in. Accepted orders wait under Preparing for "Start preparing". */
export function columnOf(status: OrderStatus): QueueColumnId | null {
  switch (status) {
    case "PLACED":
      return "new";
    case "ACCEPTED":
    case "PREPARING":
      return "preparing";
    case "READY":
      return "ready";
    case "PICKED_UP":
      return "out";
    default:
      return null;
  }
}

/**
 * A run as the person carrying it sees it (Orders › My runs). The buyer's first name is
 * there so the runner can call it out at the drop point. No code, no buyer ID, no prices.
 */
export interface RunCard {
  id: string;
  sourceId: SourceId;
  buildingId: BuildingId;
  buyerName: string;
  status: OrderStatus;
  promisedAt?: number;
  arrivedAt?: number;
  pickedUpAt?: number;
}

export function toRunCard(order: Order): RunCard {
  const picked = [...order.events].reverse().find((event) => event.status === "PICKED_UP" && event.note === undefined);
  return {
    id: order.id,
    sourceId: order.sourceId,
    buildingId: order.buildingId as BuildingId,
    buyerName: order.buyerName,
    status: order.status,
    promisedAt: order.promisedAt,
    arrivedAt: order.arrivedAt,
    pickedUpAt: picked?.at,
  };
}

/** What the runner is shown before they accept: where it goes, by when, and what they earn. No buyer details. */
export interface RunPreview {
  id: string;
  sourceName: string;
  units: number;
  buildingId: BuildingId;
  promisedAt?: number;
  /** Rupees the runner earns on a confirmed handover. 0 for staff. */
  earn: number;
  staff: boolean;
}

/** The cards pinned above the cafe queue. One per settled order, kept until a staff member acts. */
export type AlertKind = "failed" | "staff-return" | "no-show";

export interface CafeAlert {
  /** The order ID: one alert per order. */
  id: string;
  orderId: string;
  kind: AlertKind;
  /** Server time it was raised, epoch ms. */
  at: number;
  sourceId: SourceId;
  buildingId?: BuildingId;
  /** What the order cost, so "₹X refunded" can be said. */
  total: number;
  /** failed: whether anybody had picked it up. */
  why?: "runner" | "before-pickup";
  holderName?: string;
  holderKind?: "runner" | "staff";
  /** no-show: the buyer can collect at the counter until this time. */
  holdUntil?: number;
}
