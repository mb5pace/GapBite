"use client";

import Link from "next/link";
import useSWR from "swr";
import { getSource } from "@/data/menu";
import { promisedLine } from "@/data/order-copy";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import { stepsFor, type OrderSummary } from "@/lib/order-types";
import type { OrdersReply } from "./OrdersView";
import { StatusBadge } from "./OrderParts";

/** A row of small bars, one per step, filled up to the step the order is on. */
function MiniStepper({ order }: { order: OrderSummary }) {
  const steps = stepsFor(order);
  const at = Math.max(0, steps.indexOf(order.status));
  return (
    <ol className="flex gap-1" aria-label={`Step ${at + 1} of ${steps.length}`}>
      {steps.map((step, i) => (
        <li key={step} className={`h-1.5 flex-1 rounded-pill ${i <= at ? "bg-maroon" : "bg-sand"}`} />
      ))}
    </ol>
  );
}

/**
 * On Home, one card for each order in progress: where from, its status, a mini
 * tracker and the promised time. Tap to open the order. Nothing shows without one.
 */
export function ActiveOrderStrip() {
  const { data } = useSWR<OrdersReply>("/api/orders", getJson, {
    refreshInterval: POLL_MS.student,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const active = data?.active ?? [];
  if (active.length === 0) return null;

  return (
    <ul className="flex flex-col gap-3" aria-label="Orders in progress">
      {active.slice(0, 2).map((order) => (
        <li key={order.id}>
          <Link
            href={`/o/${order.id}`}
            className="flex flex-col gap-3 rounded-card bg-parchment p-4 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 font-display text-section font-bold text-maroon">
                <SourceGlyph sourceId={order.sourceId} size={20} />
                <span>{getSource(order.sourceId).name}</span>
              </span>
              <StatusBadge order={order} />
            </span>
            <MiniStepper order={order} />
            <span className="text-secondary tabular-nums text-mocha">
              {promisedLine(order) ?? order.id}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
