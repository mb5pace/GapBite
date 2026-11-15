"use client";

import Link from "next/link";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { ORDERS_COPY, statusWord } from "@/data/order-copy";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { isDue } from "@/lib/late-rules";
import type { OrderStatus, OrderSummary } from "@/lib/order-types";
import { formatDayTime } from "@/lib/time";

/** On the Orders tab: finished well olive, ended badly brick, a missed delivery amber, anything still in progress amber. */
export function ordersTone(status: OrderStatus): "olive" | "brick" | "amber" {
  if (status === "DELIVERED" || status === "COLLECTED") return "olive";
  if (status === "CANCELLED" || status === "REJECTED" || status === "FAILED_LATE") return "brick";
  return "amber";
}

/** "Delivered to GICT", "Delivery to GICT" (not there yet), "Pickup at counter", "Pickup at the vending machine". */
export function modeLine(order: Pick<OrderSummary, "mode" | "buildingId" | "status" | "sourceId">): string {
  if (order.mode === "delivery" && order.buildingId) {
    const short = getBuilding(order.buildingId).short;
    return order.status === "DELIVERED" ? ORDERS_COPY.deliveredTo(short) : ORDERS_COPY.deliveryTo(short);
  }
  return order.sourceId === "vending" ? ORDERS_COPY.pickupAtMachine : ORDERS_COPY.pickupAtCounter;
}

/**
 * One order on the Orders tab, in the style of a receipt: the place and the status, the cafe, when it was ordered and its
 * ID, each line with the total, and how it was handed over. The card opens the order. A finished order also has
 * "Share feedback" and "Order again".
 */
export function OrderListCard({
  order,
  now,
  onFeedback,
  onReorder,
}: {
  order: OrderSummary;
  now: number;
  onFeedback?: () => void;
  onReorder?: () => void;
}) {
  const due = isDue(order, now);
  return (
    <li data-order-card={order.id} data-due={due ? "" : undefined} className={`rounded-card bg-parchment p-4 ${due ? "ring-2 ring-amber" : ""}`}>
      <Link
        href={`/o/${order.id}`}
        className="flex flex-col gap-3 rounded-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-caption text-mocha">{ORDERS_COPY.place}</span>
          <Badge tone={ordersTone(order.status)}>{statusWord(order.status, order.mode)}</Badge>
        </span>
        <span className="font-display text-section font-bold text-maroon">{getSource(order.sourceId).name}</span>
        <span className="grid grid-cols-2 gap-3">
          <span>
            <span className="block text-caption text-mocha">{ORDERS_COPY.orderedOn}</span>
            <span className="block text-secondary font-medium tabular-nums text-espresso">{formatDayTime(order.createdAt, now)}</span>
          </span>
          <span className="text-right">
            <span className="block text-caption text-mocha">{ORDERS_COPY.orderId}</span>
            <span className="block text-secondary font-medium tabular-nums text-espresso">{order.id}</span>
          </span>
        </span>
        <span className="flex items-start justify-between gap-3 border-t border-sand pt-3">
          <span className="flex min-w-0 flex-col gap-1 text-secondary text-espresso">
            {order.items.map((line) => (
              <span key={line.itemId}>
                {line.qty} × {line.name}
              </span>
            ))}
          </span>
          <Money amount={order.total} className="shrink-0 font-display text-section font-bold tabular-nums text-maroon" />
        </span>
        <span className="text-secondary text-mocha">{modeLine(order)}</span>
      </Link>
      {onFeedback || onReorder ? (
        // Side by side when both labels fit on one line, stacked full width on narrow phones.
        <div className="mt-4 flex flex-wrap gap-3">
          {onFeedback ? (
            <PillButton
              variant="outline"
              size="md"
              onClick={onFeedback}
              aria-label={`${ORDERS_COPY.shareFeedback} ${order.id}`}
              className="flex-1 basis-0 whitespace-nowrap"
            >
              {ORDERS_COPY.shareFeedback}
            </PillButton>
          ) : null}
          {onReorder ? (
            <PillButton
              size="md"
              onClick={onReorder}
              aria-label={`${ORDERS_COPY.orderAgain} ${order.id}`}
              className="flex-1 basis-0 whitespace-nowrap"
            >
              {ORDERS_COPY.orderAgain}
            </PillButton>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
