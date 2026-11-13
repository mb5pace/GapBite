/**
 * Words for orders: status headlines, code instructions, Update texts, errors.
 * Plain, short, specific to campus (UI_UX_BIBLE.md section 8). Pure, safe anywhere.
 */
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { formatRupees } from "@/lib/format";
import type { Order, OrderStatus, OrderSummary } from "@/lib/order-types";
import { formatClock } from "@/lib/time";

type Shape = Pick<OrderSummary, "sourceId" | "mode" | "buildingId" | "status">;

/** One or two words for lists and badges. */
export function statusWord(status: OrderStatus, mode: "pickup" | "delivery"): string {
  switch (status) {
    case "PLACED":
      return "Placed";
    case "ACCEPTED":
      return "Accepted";
    case "PREPARING":
      return "Preparing";
    case "READY":
      return mode === "delivery" ? "Ready" : "Ready to collect";
    case "PICKED_UP":
      return "On the way";
    case "DELIVERED":
      return "Delivered";
    case "COLLECTED":
      return "Collected";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return "Rejected";
    case "FAILED_LATE":
      return "Failed late";
  }
}

/** The big line at the top of Order Detail. */
export function headline(order: Shape): string {
  const source = getSource(order.sourceId).name;
  const building = order.buildingId ? getBuilding(order.buildingId).short : "";
  switch (order.status) {
    case "PLACED":
      return `Waiting for ${source} to accept`;
    case "ACCEPTED":
      return `${source} accepted your order`;
    case "PREPARING":
      return `${source} is preparing your order`;
    case "READY":
      if (order.mode === "delivery") return "Ready, waiting for a runner";
      return order.sourceId === "vending" ? "Ready at the vending machine" : `Ready at the ${source} counter`;
    case "PICKED_UP":
      return `Out for delivery to ${building}`;
    case "DELIVERED":
      return `Delivered at ${building}`;
    case "COLLECTED":
      return "Collected. Enjoy!";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return `${source} could not make this order`;
    case "FAILED_LATE":
      return order.buildingId ? `Could not reach ${building} in time` : "Not ready in time";
  }
}

/** The label above the large code box. */
export function codeInstruction(order: Pick<Order, "sourceId" | "mode">): string {
  if (order.mode === "delivery") return "Show this code to your runner";
  return order.sourceId === "vending" ? "Enter this code at the vending machine" : "Show this code at the counter";
}

/** Where and when it should reach the buyer, as one sentence. */
export function promisedLine(order: Pick<Order, "sourceId" | "mode" | "buildingId" | "promisedAt">): string | null {
  if (order.promisedAt === undefined) return null;
  const time = formatClock(order.promisedAt);
  if (order.mode === "delivery") {
    const building = order.buildingId ? getBuilding(order.buildingId) : null;
    return building ? `At ${building.short}, ${building.dropPoint.toLowerCase()}, by ${time}` : `By ${time}`;
  }
  return order.sourceId === "vending"
    ? `Ready by ${time} at the vending machine`
    : `Ready by ${time} at the ${getSource(order.sourceId).name} counter`;
}

export const ORDER_COPY = {
  // Checkout and placing
  emptyCart: "Your cart is empty. Pick something from UC first.",
  needBuilding: "Choose a building for delivery.",
  badItem: "One of those items is not on the menu any more. Go back to your cart and try again.",
  oneSource: "An order can hold items from one place only.",
  breakTooClose: "That break is too close. Pick a later one, or choose as soon as possible.",
  badBreak: "That is not a break time. Pick one from the list.",
  cancelTooLate: "Too late to cancel. The cafe has already taken this order.",
  noSuchOrder: "We could not find that order.",
  tryAgain: "Could not place the order. Nothing was charged. Try again in a moment.",
} as const;

export function placedUpdate(order: Pick<Order, "id" | "sourceId">): { title: string; body: string } {
  return { title: "Order placed", body: `Order ${order.id} placed at ${getSource(order.sourceId).name}.` };
}

export function cancelledUpdate(order: Pick<Order, "id" | "total">): { title: string; body: string } {
  return {
    title: "Order cancelled",
    body: `Order ${order.id} cancelled. ${formatRupees(order.total)} has been refunded to your wallet.`,
  };
}

export function topUpUpdate(amount: number, balance: number): { title: string; body: string } {
  return { title: "Wallet topped up", body: `${formatRupees(amount)} added to your wallet. Balance ${formatRupees(balance)}.` };
}

export function adjustmentUpdate(amount: number, note: string, balance: number): { title: string; body: string } {
  const verb = amount > 0 ? `${formatRupees(amount)} added` : `${formatRupees(Math.abs(amount))} taken`;
  return { title: "Wallet adjusted by QuickX", body: `${verb}: ${note}. Balance ${formatRupees(balance)}.` };
}

export const CHECKOUT_COPY = {
  pickup: "Pick up at UC",
  delivery: "Deliver to my building",
  modeLabel: "Pickup or delivery",
  buildingLabel: "Deliver to",
  whenLabel: "When",
  asap: "As soon as possible",
  tooLate: "Too late",
  breakCaption: "Break",
  billLabel: "Bill",
  subtotal: "Subtotal",
  deliveryFee: "Delivery fee",
  pickupFee: "Pickup is free",
  total: "Total",
  walletLabel: "Your wallet",
  walletNow: "Balance now",
  walletAfter: "After paying",
  estimateLabel: "Estimated",
  yourOrder: "Your order",
  editCart: "Change items",
  topUp: "Top up",
  paying: "Placing your order",
  fixCart: "Some items in your cart cannot be ordered right now. Fix them in your cart first.",
  goToCart: "Go to cart",
  walkMin: (min: number) => `${min} min walk`,
} as const;

export const ORDERS_COPY = {
  active: "Active",
  past: "Past",
  myOrders: "My orders",
  noActive: "No orders in progress. Pick something from UC.",
  noPast: "No past orders yet. Finished orders show up here.",
  browse: "Browse the menu",
  pickupAtUc: "Pickup at UC",
  placedAt: "Placed",
} as const;

export const ORDER_DETAIL_COPY = {
  items: "Items",
  subtotal: "Subtotal",
  deliveryFee: "Delivery fee",
  total: "Total",
  paidFromWallet: "Paid from your wallet",
  cancel: "Cancel order",
  cancelTitle: "Cancel this order?",
  keep: "Keep order",
  confirmCancel: "Yes, cancel it",
  promised: "Promised time",
  dueNow: "Due now",
  runnerBuddy: "Runner buddy",
  staffDelivery: "QuickX staff",
  orderLabel: "Order",
  deliverTo: "Deliver to",
} as const;

export const UPDATES_COPY = {
  today: "Today",
  earlier: "Earlier",
  empty: "Nothing yet. Your order updates show up here.",
  unread: "Unread",
} as const;

/** The banner on a finished order that did not complete. Null for orders that did. */
export function endedBanner(order: Pick<Order, "id" | "sourceId" | "status" | "total">): { tone: "info" | "error"; text: string } | null {
  const source = getSource(order.sourceId).name;
  const money = formatRupees(order.total);
  if (order.status === "CANCELLED") return { tone: "info", text: `Cancelled. ${money} was refunded to your wallet.` };
  if (order.status === "REJECTED") return { tone: "error", text: `${source} could not make this order. ${money} was refunded to your wallet.` };
  if (order.status === "FAILED_LATE") return { tone: "error", text: `This order was not delivered in time. ${money} was refunded to your wallet.` };
  return null;
}
