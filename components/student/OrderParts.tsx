import { Badge } from "@/components/ui/Badge";
import { ORDERS_COPY, statusWord } from "@/data/order-copy";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import type { OrderStatus, OrderSummary } from "@/lib/order-types";

type Tone = "olive" | "amber" | "brick" | "taupe" | "maroon";

/** olive: done well. brick: failed or rejected. taupe: cancelled. amber: a missed delivery. maroon: in progress. */
export function statusTone(status: OrderStatus): Tone {
  if (status === "DELIVERED" || status === "COLLECTED") return "olive";
  if (status === "REJECTED" || status === "FAILED_LATE") return "brick";
  if (status === "CANCELLED") return "taupe";
  if (status === "NO_SHOW") return "amber";
  return "maroon";
}

export function StatusBadge({ order }: { order: Pick<OrderSummary, "status" | "mode"> }) {
  return <Badge tone={statusTone(order.status)}>{statusWord(order.status, order.mode)}</Badge>;
}

/** "Cafe Delice · To GICT" or "Cafe Delice · Pickup at UC". */
export function orderPlaceLine(order: Pick<OrderSummary, "sourceId" | "mode" | "buildingId">): string {
  const source = getSource(order.sourceId).name;
  const where = order.mode === "delivery" && order.buildingId ? `To ${getBuilding(order.buildingId).short}` : ORDERS_COPY.pickupAtUc;
  return `${source} · ${where}`;
}
