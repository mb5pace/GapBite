"use client";

import { Receipt, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { ORDERS_COPY, RUN_COPY, promisedLine } from "@/data/order-copy";
import { Chip } from "@/components/ui/Chip";
import { useCountdown } from "@/components/ui/Countdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { PillButton, PillLink } from "@/components/ui/PillButton";
import { useRunner } from "@/components/runner/RunnerProvider";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { POLL_MS } from "@/lib/config";
import { isDue } from "@/lib/late-rules";
import { getJson, postJson } from "@/lib/http";
import { isTerminal, type OrderSummary, type RunCard } from "@/lib/order-types";
import { formatClock, formatDayTime, formatMsLeft } from "@/lib/time";
import { StatusBadge, orderPlaceLine } from "./OrderParts";

export interface OrdersReply {
  active: OrderSummary[];
  past: OrderSummary[];
  /** Orders this person is carrying for someone else (runner buddy or staff). */
  runs: RunCard[];
  now: number;
}

/** A run you are carrying: where it goes, who it is for, a countdown, "I'm here" and "Enter code". */
function RunItem({ run, now }: { run: RunCard; now: number }) {
  const { openHandover } = useRunner();
  const { mutate } = useSWRConfig();
  const building = getBuilding(run.buildingId);
  const remaining = useCountdown(run.promisedAt !== undefined ? Math.max(0, run.promisedAt - now) : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const arrived = run.arrivedAt !== undefined;
  const due = run.promisedAt !== undefined && remaining <= 0;

  async function arrive() {
    setBusy(true);
    setError("");
    const res = await postJson<{ run: RunCard }>("/api/runs/arrive", { orderId: run.id });
    if (!res.ok) setError(res.error ?? "");
    await Promise.all([mutate("/api/orders"), mutate("/api/runs")]);
    setBusy(false);
  }

  return (
    <li data-due={due ? "" : undefined} className={`flex flex-col gap-3 rounded-card bg-parchment p-4 ${due ? "ring-2 ring-amber" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-section font-bold text-maroon">
            {building.short}, {building.dropPoint.toLowerCase()}
          </p>
          <p className="text-secondary text-mocha">
            {RUN_COPY.forBuyer(run.buyerName)} · {RUN_COPY.fromSource(getSource(run.sourceId).name)} ·{" "}
            <span className="tabular-nums">{run.id}</span>
          </p>
        </div>
        {run.promisedAt !== undefined ? (
          <p className="flex shrink-0 flex-col items-end text-right font-display text-section font-bold tabular-nums text-maroon">
            <span className="flex items-center gap-2">
              {due ? <Warning size={20} weight="regular" className="text-amber" aria-hidden={true} /> : null}
              {due ? RUN_COPY.dueNow : formatMsLeft(remaining)}
            </span>
            <span className="block font-sans text-caption font-medium text-mocha">{due ? "" : RUN_COPY.left}</span>
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PillButton variant="secondary" size="md" disabled={arrived || busy} aria-busy={busy} onClick={arrive} aria-label={`${arrived ? RUN_COPY.arrived : RUN_COPY.imHere} ${run.id}`}>
          {arrived ? RUN_COPY.arrivedAt(formatClock(run.arrivedAt as number)) : RUN_COPY.imHere}
        </PillButton>
        <PillButton size="md" onClick={() => openHandover(run)} aria-label={`${RUN_COPY.enterCode} ${run.id}`}>
          {RUN_COPY.enterCode}
        </PillButton>
      </div>
      {error ? (
        <p role="alert" className="text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
    </li>
  );
}

export function OrderCard({ order, now }: { order: OrderSummary; now: number }) {
  const promised = isTerminal(order.status) ? null : promisedLine(order);
  const due = isDue(order, now);
  return (
    <li>
      <Link
        href={`/o/${order.id}`}
        data-due={due ? "" : undefined}
        className={`flex flex-col gap-2 rounded-card bg-parchment p-4 ${due ? "ring-2 ring-amber" : ""} transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon`}
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
  const runs = tab === "active" ? orders.runs : [];

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
            {value === "active" && orders.active.length + orders.runs.length > 0 ? ` (${orders.active.length + orders.runs.length})` : ""}
          </Chip>
        ))}
      </div>

      {runs.length > 0 ? (
        <section aria-labelledby="runs-heading">
          <h2 id="runs-heading" className="mb-3 font-display text-section font-bold text-maroon">
            {RUN_COPY.myRuns}
          </h2>
          <ul className="flex flex-col gap-3">
            {runs.map((run) => (
              <RunItem key={run.id} run={run} now={orders.now} />
            ))}
          </ul>
        </section>
      ) : null}

      {list.length === 0 && runs.length === 0 ? (
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
      ) : list.length === 0 ? null : (
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
