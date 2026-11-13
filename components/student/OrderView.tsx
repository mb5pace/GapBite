"use client";

import {
  Check,
  CookingPot,
  House,
  PersonSimpleWalk,
  Receipt,
  ShoppingBag,
  Storefront,
  X,
} from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import useSWR, { useSWRConfig } from "swr";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { ORDER_COPY, ORDER_DETAIL_COPY, codeInstruction, endedBanner, headline, promisedLine } from "@/data/order-copy";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { useCountdown } from "@/components/ui/Countdown";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { POLL_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getJson, postJson } from "@/lib/http";
import { isTerminal, stepsFor, type Order, type OrderStatus } from "@/lib/order-types";
import { formatClock, formatMsLeft } from "@/lib/time";

export interface OrderReply {
  order: Order;
  now: number;
}

type IconType = ComponentType<{ weight?: "regular"; size?: number; "aria-hidden"?: boolean }>;

const STEP_ICON: Record<OrderStatus, IconType> = {
  PLACED: Receipt,
  ACCEPTED: Check,
  PREPARING: CookingPot,
  READY: ShoppingBag,
  PICKED_UP: PersonSimpleWalk,
  DELIVERED: House,
  COLLECTED: Storefront,
  CANCELLED: X,
  REJECTED: X,
  FAILED_LATE: X,
};

const STEP_LABEL: Record<OrderStatus, string> = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  FAILED_LATE: "Failed late",
};

/** Builds the tracker: steps reached are done, the current one has the sun ring, an early end is a brick node. */
export function buildSteps(order: Order): StepperStep[] {
  const reached = new Map(order.events.map((event) => [event.status, event.at]));
  const planned = stepsFor(order);
  const iconFor = (status: OrderStatus) => {
    const Icon = STEP_ICON[status];
    return <Icon weight="regular" size={20} aria-hidden={true} />;
  };

  if (order.status === "CANCELLED" || order.status === "REJECTED" || order.status === "FAILED_LATE") {
    const steps: StepperStep[] = planned
      .filter((status) => reached.has(status))
      .map((status) => ({ label: STEP_LABEL[status], state: "done", time: formatClock(reached.get(status) as number), icon: iconFor(status) }));
    steps.push({ label: STEP_LABEL[order.status], state: "stopped", time: formatClock(order.updatedAt), icon: iconFor(order.status) });
    return steps;
  }

  const finished = isTerminal(order.status);
  return planned.map((status) => {
    const at = reached.get(status);
    const isCurrent = !finished && status === order.status;
    const state: StepperStep["state"] = isCurrent ? "current" : at !== undefined ? "done" : "upcoming";
    return { label: STEP_LABEL[status], state, time: at !== undefined ? formatClock(at) : undefined, icon: iconFor(status) };
  });
}

function PromisedTime({ order, now }: { order: Order; now: number }) {
  const msLeft = Math.max(0, (order.promisedAt ?? now) - now);
  const remaining = useCountdown(msLeft);
  const line = promisedLine(order);
  if (!line) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-card bg-parchment p-4">
      <div>
        <p className="text-secondary font-medium text-mocha">{ORDER_DETAIL_COPY.promised}</p>
        <p className="text-body font-medium text-espresso">{line}</p>
      </div>
      <p className="shrink-0 text-right font-display text-section font-bold tabular-nums text-maroon" aria-live="off">
        {remaining <= 0 ? ORDER_DETAIL_COPY.dueNow : formatMsLeft(remaining)}
      </p>
    </div>
  );
}

/**
 * Order Detail: status headline, the tracker, the 4-digit code (only for you, and
 * only while it still works), promised time, items and bill. Cancel is offered only
 * while the cafe has not accepted the order. Refreshes every few seconds until the order is over.
 */
export function OrderView({ initial }: { initial: OrderReply }) {
  const { mutate } = useSWRConfig();
  const { data, mutate: refresh } = useSWR<OrderReply>(`/api/orders/${initial.order.id}`, getJson, {
    fallbackData: initial,
    refreshInterval: (latest) => (latest && isTerminal(latest.order.status) ? 0 : POLL_MS.student),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const { order, now } = data ?? initial;
  const source = getSource(order.sourceId);
  const ended = endedBanner(order);
  const showCode = !isTerminal(order.status);

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setBusy(true);
    setError("");
    const res = await postJson<{ order: Order; balance: number }>(`/api/orders/${order.id}/cancel`, {});
    if (res.ok) {
      setConfirming(false);
      await Promise.all([refresh(), mutate("/api/me"), mutate("/api/wallet"), mutate("/api/orders"), mutate("/api/menu")]);
    } else {
      setError(res.error ?? ORDER_COPY.tryAgain);
      await refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <p className="flex items-center gap-2 text-secondary font-medium text-mocha">
          <SourceGlyph sourceId={source.id} size={16} />
          {source.name}
        </p>
        <h2 className="font-display text-greeting font-extrabold tabular-nums text-maroon">{order.id}</h2>
        <p className="mt-1 text-section font-medium text-espresso">{headline(order)}</p>
      </div>

      {ended ? <Banner tone={ended.tone}>{ended.text}</Banner> : null}

      <Stepper steps={buildSteps(order)} />

      {showCode ? (
        <Card className="flex flex-col items-center gap-3 p-5">
          <p className="text-body font-medium text-espresso">{codeInstruction(order)}</p>
          <CodeBoxes value={order.code} label={order.mode === "delivery" ? "Handover code" : "Collect code"} />
        </Card>
      ) : null}

      {order.holder ? (
        <p className="text-body text-espresso">
          <span className="font-bold">
            {order.holder.kind === "runner" ? ORDER_DETAIL_COPY.runnerBuddy : ORDER_DETAIL_COPY.staffDelivery}
          </span>
          {order.holder.kind === "runner" ? `: ${order.holder.name}` : ""}
        </p>
      ) : null}

      {!isTerminal(order.status) ? <PromisedTime order={order} now={now} /> : null}

      {order.mode === "delivery" && order.buildingId ? (
        <p className="text-body text-espresso">
          <span className="font-bold">{ORDER_DETAIL_COPY.deliverTo}</span> {getBuilding(order.buildingId).short},{" "}
          {getBuilding(order.buildingId).dropPoint.toLowerCase()}
        </p>
      ) : null}

      <section aria-labelledby="order-items" className="flex flex-col gap-3">
        <h3 id="order-items" className="font-display text-section font-bold text-maroon">
          {ORDER_DETAIL_COPY.items}
        </h3>
        <ul className="divide-y divide-sand">
          {order.items.map((line) => (
            <li key={line.itemId} className="flex items-center justify-between gap-3 py-2 text-body text-espresso">
              <span>
                {line.qty} × {line.name}
              </span>
              <Money amount={line.price * line.qty} />
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 rounded-card bg-parchment p-4 text-body text-espresso">
          <div className="flex items-center justify-between">
            <dt>{ORDER_DETAIL_COPY.subtotal}</dt>
            <dd><Money amount={order.subtotal} /></dd>
          </div>
          {order.mode === "delivery" ? (
            <div className="flex items-center justify-between">
              <dt>{ORDER_DETAIL_COPY.deliveryFee}</dt>
              <dd><Money amount={order.fee} /></dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-sand pt-2 font-bold">
            <dt>{ORDER_DETAIL_COPY.total}</dt>
            <dd><Money amount={order.total} className="font-display text-title font-bold text-maroon" /></dd>
          </div>
          <p className="text-secondary text-mocha">{ORDER_DETAIL_COPY.paidFromWallet}</p>
        </dl>
      </section>

      {order.status === "PLACED" ? (
        <div className="flex flex-col gap-3">
          {error ? <Banner tone="error">{error}</Banner> : null}
          <PillButton variant="outline" onClick={() => setConfirming(true)}>
            {ORDER_DETAIL_COPY.cancel}
          </PillButton>
        </div>
      ) : null}

      <Sheet open={confirming} onClose={() => setConfirming(false)} title={ORDER_DETAIL_COPY.cancelTitle}>
        <p className="text-body text-espresso">
          {formatRupees(order.total)} will go back to your wallet.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <PillButton full arrow onClick={cancel} disabled={busy} aria-busy={busy}>
            {ORDER_DETAIL_COPY.confirmCancel}
          </PillButton>
          <PillButton full variant="secondary" onClick={() => setConfirming(false)}>
            {ORDER_DETAIL_COPY.keep}
          </PillButton>
        </div>
      </Sheet>
    </div>
  );
}
