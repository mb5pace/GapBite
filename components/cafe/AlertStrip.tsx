"use client";

import { useState, type FormEvent } from "react";
import { ArrowUUpLeft, Warning, WarningCircle } from "@phosphor-icons/react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { getSource } from "@/data/menu";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { CODE_DIGITS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { postJson } from "@/lib/http";
import type { CafeAlert } from "@/lib/order-types";
import { formatClock, formatMsLeft } from "@/lib/time";
import { useQueue } from "./QueueProvider";

type AlertAction = "seen" | "returned" | "collect";

/** The action buttons on the brick bar: cream pills with brick words, 48 px tall. */
const BAR_BUTTON =
  "inline-flex h-12 shrink-0 items-center justify-center rounded-pill bg-cream px-5 text-body font-bold text-brick " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream disabled:bg-sand disabled:text-taupe";

/** What the card says, as one sentence. */
function alertText(alert: CafeAlert): string {
  const copy = CAFE_COPY.alerts;
  const amount = formatRupees(alert.total);
  if (alert.kind === "staff-return") return copy.staffReturning(alert.orderId, getSource(alert.sourceId).name);
  if (alert.kind === "no-show") return copy.noShow(alert.orderId);
  if (alert.why === "runner") return copy.failedRunner(alert.orderId, alert.holderName ?? "The runner", amount);
  return copy.failedBefore(alert.orderId, amount);
}

/** The Collect box on a no-show card: the buyer's 4 digits, then Collect. */
function CollectBox({ id, busy, onCollect }: { id: string; busy: boolean; onCollect: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== CODE_DIGITS) return;
    const right = await onCollect(code);
    if (!right) setCode("");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <p className="text-secondary text-cream">{CAFE_COPY.alerts.collectHint}</p>
      <span className="flex flex-wrap items-center gap-3">
        <CodeBoxes value={code} onChange={setCode} label={`${CAFE_COPY.alerts.collect} ${id}`} size="sm" />
        <button type="submit" disabled={busy || code.length !== CODE_DIGITS} aria-label={`${CAFE_COPY.alerts.collect} ${id}`} className={BAR_BUTTON}>
          {CAFE_COPY.alerts.collect}
        </button>
      </span>
    </form>
  );
}

/**
 * One alert (docs/SCREENS.md "Alerts") as a row of the brick alert bar: an icon, what kind it is, the sentence, the hold
 * time for a no-show, and its action. It stays until someone acts on it.
 */
function AlertCard({
  alert,
  now,
  busy,
  error,
  onAct,
}: {
  alert: CafeAlert;
  now: number;
  busy: boolean;
  error?: string;
  onAct: (action: AlertAction, code?: string) => Promise<boolean>;
}) {
  const copy = CAFE_COPY.alerts;
  const noShow = alert.kind === "no-show";
  const holding = noShow && alert.holdUntil !== undefined && now < alert.holdUntil;
  const label = noShow ? copy.noShowLabel : alert.kind === "staff-return" ? copy.staffLabel : copy.failedLabel;
  const Icon = noShow ? Warning : alert.kind === "staff-return" ? ArrowUUpLeft : WarningCircle;

  return (
    <article aria-label={`${label}: ${alert.orderId}`} data-alert={alert.kind} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
      <span className="shrink-0" aria-hidden="true">
        <Icon size={24} weight="regular" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-cream">
          <span className="font-bold">{label}</span> · {alertText(alert)}
        </p>
        {alert.kind === "staff-return" && alert.holderName ? <p className="text-secondary text-cream">{copy.staffCarrier(alert.holderName)}</p> : null}
        {noShow && alert.holdUntil !== undefined ? (
          <p className="text-secondary tabular-nums text-cream">
            {holding ? (
              <>
                {copy.holdUntil(formatClock(alert.holdUntil))} · {formatMsLeft(alert.holdUntil - now)} {copy.holdLeft}
              </>
            ) : (
              copy.holdEnded
            )}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-1 inline-block rounded-pill bg-cream px-3 py-1 text-secondary font-medium text-brick">
            {error}
          </p>
        ) : null}
      </div>

      {holding ? (
        <CollectBox id={alert.orderId} busy={busy} onCollect={(code) => onAct("collect", code)} />
      ) : (
        <button
          type="button"
          className={BAR_BUTTON}
          disabled={busy}
          onClick={() => void onAct(alert.kind === "staff-return" ? "returned" : "seen")}
          aria-label={`${alert.kind === "staff-return" ? copy.returned : copy.seen} ${alert.orderId}`}
        >
          {alert.kind === "staff-return" ? copy.returned : copy.seen}
        </button>
      )}
    </article>
  );
}

/**
 * The cards pinned above the four columns. Each one stays until a staff member acts on it; the next poll
 * (and the refresh right after an action) makes it go.
 */
export function AlertStrip() {
  const queue = useQueue();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (queue.alerts.length === 0) return null;

  async function act(id: string, action: AlertAction, code?: string): Promise<boolean> {
    setBusyId(id);
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
    const res = await postJson<{ done: boolean }>("/api/cafe/alerts", { action, id, ...(code !== undefined ? { code } : {}) });
    setBusyId(null);
    if (res.ok) {
      await queue.refresh();
      return true;
    }
    if (res.status === 409 && res.error === CAFE_COPY.alerts.gone) await queue.refresh(); // someone else dealt with it
    setErrors((current) => ({ ...current, [id]: res.error ?? CAFE_COPY.errors.network }));
    return false;
  }

  return (
    <section
      id="alerts"
      aria-label={CAFE_COPY.alerts.sectionLabel}
      className="flex max-h-60 shrink-0 flex-col divide-y divide-cream overflow-y-auto rounded-card bg-brick text-cream"
    >
      {queue.alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          now={queue.now}
          busy={busyId === alert.id}
          error={errors[alert.id]}
          onAct={(action, code) => act(alert.id, action, code)}
        />
      ))}
    </section>
  );
}
