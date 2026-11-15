"use client";

import Link from "next/link";
import useSWR from "swr";
import { getSource } from "@/data/menu";
import { progressLine } from "@/data/order-copy";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import { mostUrgent } from "@/lib/order-progress";
import { useCart } from "./CartProvider";
import type { OrdersReply } from "./OrdersView";
import { OrderProgress } from "./OrderProgress";

/**
 * On Home, one card for the order that needs attention first (the earliest promised time): where from, a four-step
 * progress line tied to its real status, and one line saying what is happening and by when. Any others are a
 * "+1 more" link to Orders. Nothing shows without an order in progress. Tap the card to open the order.
 */
export function ActiveOrderStrip() {
  const { menu } = useCart();
  const { data } = useSWR<OrdersReply>("/api/orders", getJson, {
    refreshInterval: POLL_MS.student,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const active = data?.active ?? [];
  const order = mostUrgent(active);
  if (!order) return null;
  const more = active.length - 1;

  return (
    <section aria-label="Order in progress" className="flex flex-col gap-2" data-active-order="">
      <Link
        href={`/o/${order.id}`}
        className="flex flex-col gap-3 rounded-card bg-parchment p-4 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 font-display text-section font-bold text-maroon">
            <SourceGlyph sourceId={order.sourceId} size={20} />
            <span>{getSource(order.sourceId).name}</span>
          </span>
          <span className="text-secondary tabular-nums text-mocha">{order.id}</span>
        </span>
        <OrderProgress order={order} now={menu.now} />
        <span className="text-secondary tabular-nums text-espresso">{progressLine(order)}</span>
      </Link>
      {more > 0 ? (
        <Link
          href="/orders"
          className="inline-flex h-11 items-center self-end rounded-pill px-3 text-secondary font-semibold text-maroon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          +{more} more
        </Link>
      ) : null}
    </section>
  );
}
