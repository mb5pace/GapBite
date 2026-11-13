"use client";

import { Receipt } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ORDERS_COPY, promisedLine } from "@/data/order-copy";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { PillLink } from "@/components/ui/PillButton";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import type { OrderSummary } from "@/lib/order-types";
import { formatDayTime } from "@/lib/time";
import { StatusBadge, orderPlaceLine } from "./OrderParts";
import { getSource } from "@/data/menu";

export interface OrdersReply {
  active: OrderSummary[];
  past: OrderSummary[];
  now: number;
}

function OrderCard({ order, now }: { order: OrderSummary; now: number }) {
  const active = order.status !== "DELIVERED" && order.status !== "COLLECTED" && order.status !== "CANCELLED" && order.status !== "REJECTED" && order.status !== "FAILED_LATE";
  const promised = active ? promisedLine({ ...order, promisedAt: order.promisedAt }) : null;
  return (
    <li>
      <Link
        href={`/o/${order.id}`}
        className="flex flex-col gap-2 rounded-card bg-parchment p-4 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 font-display text-section font-bold text-maroon">
            <SourceGlyph sourceId={order.sourceId} size={20} />
            <span>{getSource(order.sourceId).name}</span>
          </span>
          <StatusBadge order={order} />
        </span>
        <span className="text-secondary text-mocha">
          <span className="font-medium tabular-nums text-espresso">{order.id}</span> · {order.units} {order.units === 1 ? "item" : "items"} ·{" "}
          {orderPlaceLine(order).split(" · ")[1]}
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="text-secondary tabular-nums text-mocha">
            {promised ?? `${ORDERS_COPY.placedAt} ${formatDayTime(order.createdAt, now)}`}
          </span>
          <Money amount={order.total} className="font-display text-section font-bold text-maroon" />
        </span>
      </Link>
    </li>
  );
}

/**
 * The Orders tab: Active and Past. "My runs" (orders you are carrying for someone
 * else) is added next to "My orders" when the runner feature arrives in Phase 7.
 */
export function OrdersView({ initial }: { initial: OrdersReply }) {
  const { data } = useSWR<OrdersReply>("/api/orders", getJson, {
    fallbackData: initial,
    refreshInterval: POLL_MS.student,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const orders = data ?? initial;
  const [tab, setTab] = useState<"active" | "past">("active");
  const list = tab === "active" ? orders.active : orders.past;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div role="tablist" aria-label="Orders" className="flex gap-2">
        {(["active", "past"] as const).map((value) => (
          <Chip
            key={value}
            role="tab"
            aria-selected={tab === value}
            aria-pressed={undefined}
            selected={tab === value}
            onClick={() => setTab(value)}
          >
            {value === "active" ? ORDERS_COPY.active : ORDERS_COPY.past}
            {value === "active" && orders.active.length > 0 ? ` (${orders.active.length})` : ""}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Receipt weight="regular" size={40} />}
          action={
            tab === "active" ? (
              <PillLink href="/home" variant="secondary">
                {ORDERS_COPY.browse}
              </PillLink>
            ) : undefined
          }
        >
          {tab === "active" ? ORDERS_COPY.noActive : ORDERS_COPY.noPast}
        </EmptyState>
      ) : (
        <section aria-labelledby="orders-heading">
          {tab === "active" ? (
            <h2 id="orders-heading" className="mb-3 font-display text-section font-bold text-maroon">
              {ORDERS_COPY.myOrders}
            </h2>
          ) : (
            <h2 id="orders-heading" className="sr-only">
              {ORDERS_COPY.past}
            </h2>
          )}
          <ul className="flex flex-col gap-3">
            {list.map((order) => (
              <OrderCard key={order.id} order={order} now={orders.now} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
