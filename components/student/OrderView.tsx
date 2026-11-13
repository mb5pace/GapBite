"use client";

import {
  Check,
  CookingPot,
  House,
  PersonSimpleWalk,
  Receipt,
  ShoppingBag,
  Storefront,
  Warning,
  X,
} from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import useSWR, { useSWRConfig } from "swr";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { ORDER_COPY, ORDER_DETAIL_COPY, RUN_COPY, codeInstruction, endedBanner, headline, promisedLine } from "@/data/order-copy";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { useServerNow } from "@/components/ui/useServerNow";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { POLL_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getJson, postJson } from "@/lib/http";
import { isDue, noShowHold } from "@/lib/late-rules";
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
  NO_SHOW: X,
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
  NO_SHOW: "Missed delivery",
};

/** Builds the tracker: steps reached are done, the current one has the sun ring, an early end is a brick node. */
export function buildSteps(order: Order): StepperStep[] {
  const reached = new Map(order.events.map((event) => [event.status, event.at]));
  const planned = stepsFor(order);
  const iconFor = (status: OrderStatus) => {
    const Icon = STEP_ICON[status];
    return <Icon weight="regular" size={20} aria-hidden={true} />;
  };

  if (order.status === "CANCELLED" || order.status === "REJECTED" || order.status === "FAILED_LATE" || order.status === "NO_SHOW") {
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
  // `now` is the server's clock, already ticking once a second (useServerNow), so the countdown reads it directly.
  const remaining = Math.max(0, (order.promisedAt ?? now) - now);
  const line = promisedLine(order);
  if (!line) return null;
  // Amber ring (a full border) and an amber icon from the promised time until grace ends. Past that it has failed.
  const due = remaining <= 0 && isDue(order, now);
  return (
    <div data-due={due ? "" : undefined} className={`flex items-start justify-between gap-3 rounded-card bg-parchment p-4 ${due ? "ring-2 ring-amber" : ""}`}>
      <div>
        <p className="text-secondary font-medium text-mocha">{ORDER_DETAIL_COPY.promised}</p>
        <p className="text-body font-medium text-espresso">{line}</p>
      </div>
      <p className="flex shrink-0 items-center gap-2 text-right font-display text-section font-bold tabular-nums text-maroon" aria-live="off">
        {due ? <Warning size={20} weight="regular" className="text-amber" aria-hidden={true} /> : null}
        {remaining <= 0 ? ORDER_DETAIL_COPY.dueNow : formatMsLeft(remaining)}
      </p>
    </div>
  );
}

/**
 * How often to ask again. A finished order needs no more polling, except a no-show the buyer can still collect (the
 * cafe may hand it over). This lives outside the component on purpose: SWR restarts its timer whenever the function
 * it is given is a new one, and this page re-renders every second to keep the clock, so an inline function would
 * restart the timer before it ever fired.
 */
function pollEvery(latest?: OrderReply): number {
  if (!latest) return POLL_MS.student;
  const finished = isTerminal(latest.order.status);
  return finished && noShowHold(latest.order, latest.now)?.open !== true ? 0 : POLL_MS.student;
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
    refreshInterval: pollEvery,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const { order, now: replyNow } = data ?? initial;
  const now = useServerNow(replyNow);
  const source = getSource(order.sourceId);
  const ended = endedBanner(order);
  // A missed delivery: the buyer can still collect at the counter with the same code until the hold ends.
  const hold = noShowHold(order, now);
  const showCode = !isTerminal(order.status) || hold?.open === true;

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

      {hold ? (
        <Banner tone={hold.open ? "warning" : "info"}>
          {order.collectedAt !== undefined
            ? ORDER_DETAIL_COPY.noShowCollected
            : hold.open
              ? `${ORDER_DETAIL_COPY.noShowCollect(order.id, source.name)} ${ORDER_DETAIL_COPY.holdUntil(formatClock(hold.until))}.`
              : ORDER_DETAIL_COPY.noShowHoldEnded(order.id)}
        </Banner>
      ) : null}

      {order.status === "PICKED_UP" && order.arrivedAt !== undefined && order.buildingId ? (
        <Banner>{RUN_COPY.runnerWaiting(getBuilding(order.buildingId).dropPoint)}</Banner>
      ) : null}

      <Stepper steps={buildSteps(order)} />

      {showCode ? (
        <Card className="flex flex-col items-center gap-3 p-5">
          <p className="text-body font-medium text-espresso">{hold ? ORDER_DETAIL_COPY.noShowCode : codeInstruction(order)}</p>
          <CodeBoxes value={order.code} label={order.mode === "delivery" && !hold ? "Handover code" : "Collect code"} />
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
