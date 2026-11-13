"use client";

import { useState, type FormEvent } from "react";
import { ArrowUUpLeft, Warning, WarningCircle } from "@phosphor-icons/react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { getSource } from "@/data/menu";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { PillButton } from "@/components/ui/PillButton";
import { CODE_DIGITS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { postJson } from "@/lib/http";
import type { CafeAlert } from "@/lib/order-types";
import { formatClock, formatMsLeft } from "@/lib/time";
import { useQueue } from "./QueueProvider";

type AlertAction = "seen" | "returned" | "collect";

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
      <p className="text-secondary text-mocha">{CAFE_COPY.alerts.collectHint}</p>
      <CodeBoxes value={code} onChange={setCode} label={`${CAFE_COPY.alerts.collect} ${id}`} size="sm" />
      <PillButton type="submit" size="md" disabled={busy || code.length !== CODE_DIGITS} aria-label={`${CAFE_COPY.alerts.collect} ${id}`}>
        {CAFE_COPY.alerts.collect}
      </PillButton>
    </form>
  );
}

/**
 * One alert (docs/SCREENS.md "Alerts"). Red: a failed order, or a bag the staff are bringing back. Amber: a
 * buyer who did not show up, whose bag is held at the counter. The colour is the ring and the icon; the words
 * stay in espresso, so contrast is never a problem. It stays until someone acts on it.
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
    <article
      aria-label={`${label}: ${alert.orderId}`}
      data-alert={alert.kind}
      className={`flex flex-col gap-3 rounded-card bg-cream p-4 ring-2 ${noShow ? "ring-amber" : "ring-brick"}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${noShow ? "text-amber" : "text-brick"}`}>
          <Icon size={24} weight="regular" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-secondary font-bold text-espresso">{label}</p>
          <p className="text-body text-espresso">{alertText(alert)}</p>
          {alert.kind === "staff-return" && alert.holderName ? (
            <p className="text-secondary text-mocha">{copy.staffCarrier(alert.holderName)}</p>
          ) : null}
          {noShow && alert.holdUntil !== undefined ? (
            <p className="text-secondary tabular-nums text-mocha">
              {holding ? (
                <>
                  {copy.holdUntil(formatClock(alert.holdUntil))} · {formatMsLeft(alert.holdUntil - now)} {copy.holdLeft}
                </>
              ) : (
                copy.holdEnded
              )}
            </p>
          ) : null}
        </div>
      </div>

      {holding ? (
        <CollectBox id={alert.orderId} busy={busy} onCollect={(code) => onAct("collect", code)} />
      ) : (
        <div>
          <PillButton
            size="md"
            disabled={busy}
            onClick={() => void onAct(alert.kind === "staff-return" ? "returned" : "seen")}
            aria-label={`${alert.kind === "staff-return" ? copy.returned : copy.seen} ${alert.orderId}`}
          >
            {alert.kind === "staff-return" ? copy.returned : copy.seen}
          </PillButton>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
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
    <section aria-label={CAFE_COPY.alerts.sectionLabel} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
