/**
 * Words for orders: status headlines, code instructions, Update texts, errors.
 * Plain, short, specific to campus (UI_UX_BIBLE.md section 8). Pure, safe anywhere.
 */
import { getBuilding, type BuildingId } from "@/data/locations";
import { getSource } from "@/data/menu";
import { MAX_ACTIVE_RUNS, WALLET_MIN_TO_USE } from "@/lib/config";
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
    case "NO_SHOW":
      return "Missed delivery";
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
    case "NO_SHOW":
      return `You missed your runner at ${building}`;
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

/** Buyer Updates for what the cafe does. The wording is FLOWS.md sections 2, 3a and 3c. */
export function acceptedUpdate(order: Pick<Order, "sourceId">): { title: string; body: string } {
  return { title: "Order accepted", body: `${getSource(order.sourceId).name} accepted your order.` };
}

export function preparingUpdate(): { title: string; body: string } {
  return { title: "Preparing", body: "Your order is being prepared." };
}

export function readyUpdate(order: Pick<Order, "sourceId" | "mode">): { title: string; body: string } {
  if (order.mode === "delivery") return { title: "Order ready", body: "Your order is ready." };
  const where = order.sourceId === "vending" ? "the vending machine" : `the ${getSource(order.sourceId).name} counter`;
  return { title: "Order ready", body: `Ready at ${where}.` };
}

export function collectedUpdate(): { title: string; body: string } {
  return { title: "Order collected", body: "Collected. Enjoy!" };
}

export function staffPickedUpUpdate(): { title: string; body: string } {
  return { title: "On the way", body: "Picked up by QuickX staff." };
}

export function rejectedUpdate(order: Pick<Order, "id" | "sourceId" | "total">, reasonText: string): { title: string; body: string } {
  return {
    title: "Order rejected",
    body: `${getSource(order.sourceId).name} could not make order ${order.id} because ${reasonText}. ${formatRupees(order.total)} has been refunded to your wallet.`,
  };
}

/** The Updates for a late or missed delivery, in the words of docs/BUSINESS_RULES.md "When grace ends". */
export function failedLateBuyerUpdate(order: Pick<Order, "total" | "buildingId">): { title: string; body: string } {
  const where = order.buildingId ? getBuilding(order.buildingId).short : "you";
  return { title: "Order failed", body: `Your order could not reach ${where} in time. ${formatRupees(order.total)} has been refunded to your wallet.` };
}

export function runnerPenaltyUpdate(order: Pick<Order, "id" | "total">): { title: string; body: string } {
  return {
    title: "Run not delivered in time",
    body: `Run ${order.id} was not delivered in time. ${formatRupees(order.total)} has been deducted from your wallet. The food is yours to keep.`,
  };
}

export function staffReturnUpdate(order: Pick<Order, "id" | "sourceId">): { title: string; body: string } {
  return { title: "Bring the bag back", body: `${order.id} ran out of time. Please bring it back to ${getSource(order.sourceId).name}.` };
}

export function noShowBuyerUpdate(order: Pick<Order, "id" | "sourceId" | "buildingId">): { title: string; body: string } {
  const where = order.buildingId ? getBuilding(order.buildingId).short : "the drop point";
  return {
    title: "You missed your runner",
    body: `You missed your runner at ${where}. Collect ${order.id} at the ${getSource(order.sourceId).name} counter with your code.`,
  };
}

/** To whoever carried it: the buyer did not show. A student runner still earns; staff do not. */
export function noShowHolderUpdate(order: Pick<Order, "id" | "sourceId">, earned: number): { title: string; body: string } {
  const source = getSource(order.sourceId).name;
  return {
    title: "Buyer did not show up",
    body:
      earned > 0
        ? `Buyer did not show up for ${order.id}. ${formatRupees(earned)} has been added to your wallet. Please bring the bag back to ${source}.`
        : `Buyer did not show up for ${order.id}. Please bring the bag back to ${source}.`,
  };
}

export function topUpUpdate(amount: number, balance: number): { title: string; body: string } {
  return { title: "Wallet topped up", body: `${formatRupees(amount)} added to your wallet. Balance ${formatRupees(balance)}.` };
}

export function adjustmentUpdate(amount: number, note: string, balance: number): { title: string; body: string } {
  const verb = amount > 0 ? `${formatRupees(amount)} added` : `${formatRupees(Math.abs(amount))} taken`;
  return { title: "Wallet adjusted by QuickX", body: `${verb}: ${note}. Balance ${formatRupees(balance)}.` };
}

/** "GICT ground floor lobby": the drop point, as a runner reads it. */
export function dropLine(buildingId: BuildingId): string {
  const building = getBuilding(buildingId);
  return `${building.short} ${building.dropPoint.toLowerCase()}`;
}

/** Why a scan or a run step is refused. One line each, the words from docs/FLOWS.md sections 3b and 4. */
export const RUN_ERRORS = {
  notFound: "We could not find that order.",
  notSlip: "That is not a QuickX bag slip. Scan the QR code on the bag, or type the order ID.",
  taken: "Already taken by someone else",
  notReady: "Not ready yet",
  own: "This is your own order",
  lowBalance: `Top up to at least ${formatRupees(WALLET_MIN_TO_USE)} to run`,
  tooMany: `You already have ${MAX_ACTIVE_RUNS} active runs`,
  pickup: "This order is for pickup at UC",
  closed: "That order is closed.",
  notHolder: "You are not carrying this order.",
  notOut: "This order is not out for delivery.",
  badCode: "Code does not match",
  needDigits: "Enter the 4 digits.",
  locked: "Too many wrong codes. Try again in a minute.",
} as const;

/** The Updates for the run, in the words of docs/FLOWS.md sections 3b and 4. */
export function pickedUpUpdate(holder: { kind: "runner" | "staff"; name: string }, buildingId: BuildingId): { title: string; body: string } {
  if (holder.kind === "staff") return { title: "On the way", body: "Picked up by QuickX staff." };
  return { title: "On the way", body: `Picked up by runner buddy ${holder.name}. On the way to ${getBuilding(buildingId).short}.` };
}

export function runnerArrivedUpdate(buildingId: BuildingId): { title: string; body: string } {
  return { title: "Your runner is here", body: `Your runner is at ${dropLine(buildingId)}. Show your code.` };
}

export function deliveredUpdate(buildingId: BuildingId): { title: string; body: string } {
  return { title: "Delivered", body: `Delivered at ${getBuilding(buildingId).short}. Enjoy!` };
}

export function runnerEarnedUpdate(amount: number): { title: string; body: string } {
  return { title: "Delivery done", body: `Delivered. ${formatRupees(amount)} added to your wallet.` };
}

/** The runner sheet: scanning, preview, accepted, handover. */
export const RUN_COPY = {
  scanLabel: "Scan a bag",
  scanTitle: "Scan a bag",
  scanHint: "Point the camera at the QR code on the bag slip.",
  typeInstead: "Type order ID instead",
  useCamera: "Use the camera",
  cameraOff: "The camera is not available. Type the order ID instead.",
  orderIdLabel: "Order ID",
  orderIdHint: "QX- and 4 digits, like QX-4821. It is on the bag slip.",
  lookUp: "Look up",
  looking: "Looking",
  previewTitle: "Take this bag?",
  items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
  deliverTo: "Deliver to",
  promised: "Deliver by",
  youEarn: (amount: number) => `You earn ${formatRupees(amount)}`,
  noEarn: "Staff deliveries earn nothing",
  accept: "Accept run",
  acceptStaff: "Accept as staff delivery",
  accepting: "Accepting",
  back: "Back",
  acceptedTitle: "Run accepted",
  acceptedLine: (where: string, time: string) => `Run accepted. Take it to ${where} by ${time}.`,
  scanAnother: "Scan another bag",
  close: "Close",
  errorTitle: "Cannot take this bag",
  tryAgain: "Try again",
  // My runs
  myRuns: "My runs",
  forBuyer: (name: string) => `For ${name}`,
  fromSource: (source: string) => `From ${source}`,
  imHere: "I'm here",
  arrived: "Arrived",
  arrivedAt: (time: string) => `Arrived ${time}`,
  enterCode: "Enter code",
  dueNow: "Due now",
  left: "left",
  // Handover
  handoverTitle: "Enter handover code",
  handoverHint: "Ask the buyer to show their 4-digit code, then type it.",
  confirm: "Confirm delivery",
  confirming: "Checking",
  deliveredTitle: "Delivered",
  deliveredEarned: (amount: number) => `Delivered. ${formatRupees(amount)} added to your wallet.`,
  deliveredStaff: "Delivered.",
  runnerWaiting: (dropPoint: string) => `Runner is waiting at ${dropPoint}`,
} as const;

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
  holdUntil: (time: string) => `Hold until ${time}`,
  noShowCollect: (id: string, source: string) => `Collect ${id} at the ${source} counter with your code.`,
  noShowHoldEnded: (id: string) => `The hold on ${id} has ended. Nothing was refunded.`,
  noShowCollected: "Collected at the counter. Enjoy!",
  noShowCode: "Show this code at the counter",
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
