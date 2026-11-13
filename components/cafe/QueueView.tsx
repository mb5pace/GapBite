"use client";

import { useEffect, useState } from "react";
import { CAFE_COPY, type RejectReasonId } from "@/data/cafe-copy";
import { SOURCES, type SourceId } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { TOAST_MS } from "@/lib/config";
import { postJson } from "@/lib/http";
import { columnOf, type CafeCard, type QueueColumnId } from "@/lib/order-types";
import { BagSlipDialog } from "./BagSlipDialog";
import { OrderCard } from "./OrderCard";
import { useQueue } from "./QueueProvider";
import { RejectDialog } from "./RejectDialog";
import { StaffDialog } from "./StaffDialog";

const COLUMNS: QueueColumnId[] = ["new", "preparing", "ready", "out"];

type Filter = "all" | SourceId;

/**
 * The queue (docs/SCREENS.md "Queue"): New, Preparing, Ready, Out for delivery, with
 * source tabs. The list itself is polled by the layout's QueueProvider.
 */
export function QueueView() {
  const queue = useQueue();
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  /** The words, and the status the order was in when it failed. The error goes when the order moves. */
  const [errors, setErrors] = useState<Record<string, { text: string; status: string }>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [slipId, setSlipId] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const visible = queue.orders.filter((o) => filter === "all" || o.sourceId === filter);

  /** Sends one change to the server. Returns the order on success. */
  async function run(id: string, body: Record<string, unknown>): Promise<CafeCard | null> {
    setBusyId(id);
    const startedIn = queue.orders.find((o) => o.id === id)?.status ?? "";
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([orderId]) => orderId !== id)));
    const res = await postJson<{ order: CafeCard }>(`/api/cafe/orders/${id}`, body);
    setBusyId(null);
    if (res.ok && res.data) {
      queue.apply(res.data.order);
      return res.data.order;
    }
    if (res.status === 409) {
      // Someone else moved it first. Say so once, and show what it looks like now.
      setNotice(CAFE_COPY.movedNotice(id));
      await queue.refresh();
      return null;
    }
    setErrors((e) => ({ ...e, [id]: { text: res.error ?? CAFE_COPY.errors.network, status: startedIn } }));
    return null;
  }

  async function markReady(id: string) {
    const done = await run(id, { action: "ready" });
    if (done) setSlipId(id); // the bag slip appears when an order is Ready
  }

  async function reject(id: string, reason: RejectReasonId) {
    const done = await run(id, { action: "reject", reason });
    if (done) setRejectId(null);
  }

  async function sendWithStaff(id: string, staff: string) {
    const done = await run(id, { action: "staff", staffId: staff });
    if (done) setStaffId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">{CAFE_COPY.nav.queue}</h1>
      <div role="group" aria-label={CAFE_COPY.filterLabel} className="flex flex-wrap gap-2">
        <Chip selected={filter === "all"} onClick={() => setFilter("all")}>
          {CAFE_COPY.all}
        </Chip>
        {SOURCES.map((source) => (
          <Chip key={source.id} selected={filter === source.id} onClick={() => setFilter(source.id)}>
            {source.kind === "vending" ? "Vending" : source.name}
          </Chip>
        ))}
      </div>

      {queue.stale ? <Banner tone="warning">{CAFE_COPY.queueError}</Banner> : null}
      {notice ? <Banner>{notice}</Banner> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-busy={queue.loading}>
        {COLUMNS.map((column) => {
          const cards = visible.filter((o) => columnOf(o.status) === column);
          return (
            <section key={column} aria-label={CAFE_COPY.columns[column]} className="flex min-h-48 flex-col gap-3 rounded-card bg-parchment p-3">
              <h2 className="flex items-baseline justify-between px-1 font-display text-section font-bold text-maroon">
                {CAFE_COPY.columns[column]}
                <span className="text-secondary font-medium tabular-nums text-mocha" aria-label={`${cards.length} orders`}>
                  {cards.length}
                </span>
              </h2>
              {queue.loading ? (
                <>
                  <div className="h-40 rounded-card bg-sand" aria-label={CAFE_COPY.queueLoading} />
                  <div className="h-28 rounded-card bg-sand" />
                </>
              ) : cards.length === 0 ? (
                <p className="px-1 text-secondary text-mocha">{CAFE_COPY.emptyColumn[column]}</p>
              ) : (
                cards.map((card) => (
                  <OrderCard
                    key={card.id}
                    card={card}
                    now={queue.now}
                    fresh={queue.fresh.has(card.id)}
                    busy={busyId === card.id}
                    error={errors[card.id]?.status === card.status ? errors[card.id].text : undefined}
                    actions={{
                      accept: () => void run(card.id, { action: "accept" }),
                      reject: () => setRejectId(card.id),
                      start: () => void run(card.id, { action: "start" }),
                      ready: () => void markReady(card.id),
                      slip: () => setSlipId(card.id),
                      staff: () => setStaffId(card.id),
                      collect: async (code) => (await run(card.id, { action: "collect", code })) !== null,
                    }}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>

      <RejectDialog orderId={rejectId} busy={busyId !== null} onConfirm={(reason) => rejectId && void reject(rejectId, reason)} onClose={() => setRejectId(null)} />
      <StaffDialog orderId={staffId} busy={busyId !== null} onPick={(person) => staffId && void sendWithStaff(staffId, person)} onClose={() => setStaffId(null)} />
      <BagSlipDialog orderId={slipId} onClose={() => setSlipId(null)} />
    </div>
  );
}
