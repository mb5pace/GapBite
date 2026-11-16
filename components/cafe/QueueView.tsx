"use client";

import { useEffect, useState } from "react";
import { CAFE_COPY, type RejectReasonId } from "@/data/cafe-copy";
import { Banner } from "@/components/ui/Banner";
import { TOAST_MS } from "@/lib/config";
import { postJson } from "@/lib/http";
import { columnOf, type CafeCard, type QueueColumnId } from "@/lib/order-types";
import { AlertStrip } from "./AlertStrip";
import { BagSlipDialog } from "./BagSlipDialog";
import { useDesk } from "./DeskProvider";
import { OrderCard } from "./OrderCard";
import { useQueue } from "./QueueProvider";
import { RejectDialog } from "./RejectDialog";
import { StaffDialog } from "./StaffDialog";

const COLUMNS: QueueColumnId[] = ["new", "preparing", "ready", "out"];

/**
 * The queue (docs/SCREENS.md "Queue"): New, Preparing, Ready, Out for delivery, with
 * source tabs. The list itself is polled by the layout's QueueProvider.
 */
export function QueueView() {
  const queue = useQueue();
  const { filter, openScan, printSlip } = useDesk();
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

  /**
   * Mark ready. An order still only Accepted is started first, so the buyer hears both steps, as before. If someone
   * else already started it (409), that is fine: it goes straight on to ready.
   */
  async function markReady(id: string) {
    const status = queue.orders.find((o) => o.id === id)?.status;
    if (status === "ACCEPTED") {
      setBusyId(id);
      const started = await postJson<{ order: CafeCard }>(`/api/cafe/orders/${id}`, { action: "start" });
      setBusyId(null);
      if (!started.ok && started.status !== 409) {
        setErrors((e) => ({ ...e, [id]: { text: started.error ?? CAFE_COPY.errors.network, status: "ACCEPTED" } }));
        return;
      }
    }
    const done = await run(id, { action: "ready" });
    if (done) setSlipId(id); // the slip appears when an order is Ready
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
    <div className="flex h-full min-h-0 flex-col gap-3">
      {queue.stale ? <Banner tone="warning">{CAFE_COPY.queueError}</Banner> : null}
      {notice ? <Banner>{notice}</Banner> : null}
      <AlertStrip />

      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3" aria-busy={queue.loading}>
        {COLUMNS.map((column) => {
          const cards = visible.filter((o) => columnOf(o.status) === column);
          return (
            <section key={column} id={`col-${column}`} aria-label={CAFE_COPY.columns[column]} className="flex min-h-0 flex-col rounded-card bg-parchment">
              <h2 className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-3 font-display text-section font-bold text-maroon">
                {CAFE_COPY.columns[column]}
                <span
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-pill bg-cream px-2 text-body font-extrabold tabular-nums text-maroon"
                  aria-label={`${cards.length} orders`}
                >
                  {cards.length}
                </span>
              </h2>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 pt-1" data-column-list="">
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
                      print: () => printSlip(card.id),
                      collect: () => openScan({ orderId: card.id }),
                    }}
                  />
                ))
              )}
              </div>
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
