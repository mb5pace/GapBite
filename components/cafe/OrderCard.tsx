"use client";

import { useState, type FormEvent } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { PillButton } from "@/components/ui/PillButton";
import { CODE_DIGITS } from "@/lib/config";
import type { CafeCard } from "@/lib/order-types";
import { formatClock, formatMsLeft } from "@/lib/time";

export interface CardActions {
  accept: () => void;
  reject: () => void;
  start: () => void;
  ready: () => void;
  slip: () => void;
  staff: () => void;
  /** Resolves true when the code was right. */
  collect: (code: string) => Promise<boolean>;
}

/** The Collect box on a Ready pickup card: the buyer's 4 digits, then Collect. */
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
      <p className="text-secondary text-mocha">{CAFE_COPY.actions.codeHint}</p>
      <CodeBoxes value={code} onChange={setCode} label={`${CAFE_COPY.actions.collectLabel} for ${id}`} size="sm" />
      <PillButton type="submit" size="md" disabled={busy || code.length !== CODE_DIGITS} aria-label={`${CAFE_COPY.actions.collect} ${id}`}>
        {CAFE_COPY.actions.collect}
      </PillButton>
    </form>
  );
}

/**
 * One order on the queue: ID, source, items, mode, when, promised time with a live
 * countdown, age, and the buttons for its column (docs/SCREENS.md "Queue").
 */
export function OrderCard({
  card,
  now,
  fresh,
  busy,
  error,
  actions,
}: {
  card: CafeCard;
  now: number;
  fresh: boolean;
  busy: boolean;
  error?: string;
  actions: CardActions;
}) {
  const copy = CAFE_COPY.card;
  const source = getSource(card.sourceId);
  const vending = source.kind === "vending";
  const where = card.mode === "pickup" ? copy.pickup : getBuilding(card.buildingId ?? "gict").short;
  const minutes = Math.max(0, Math.floor((now - card.createdAt) / 60_000));
  const label = (text: string) => `${text} ${card.id}`;

  let buttons: React.ReactNode = null;
  switch (card.status) {
    case "PLACED":
      buttons = (
        <div className="flex gap-2">
          <PillButton size="md" disabled={busy} onClick={actions.accept} aria-label={label(vending ? CAFE_COPY.actions.acceptAndReady : CAFE_COPY.actions.accept)}>
            {vending ? CAFE_COPY.actions.acceptAndReady : CAFE_COPY.actions.accept}
          </PillButton>
          <PillButton size="md" variant="outline" disabled={busy} onClick={actions.reject} aria-label={label(CAFE_COPY.actions.reject)}>
            {CAFE_COPY.actions.reject}
          </PillButton>
        </div>
      );
      break;
    case "ACCEPTED":
      buttons = (
        <PillButton size="md" disabled={busy} onClick={actions.start} aria-label={label(CAFE_COPY.actions.start)}>
          {CAFE_COPY.actions.start}
        </PillButton>
      );
      break;
    case "PREPARING":
      buttons = (
        <PillButton size="md" disabled={busy} onClick={actions.ready} aria-label={label(CAFE_COPY.actions.ready)}>
          {CAFE_COPY.actions.ready}
        </PillButton>
      );
      break;
    case "READY":
      if (card.mode === "delivery") {
        buttons = (
          <div className="flex flex-wrap gap-2">
            <PillButton size="md" variant="secondary" disabled={busy} onClick={actions.slip} aria-label={label(CAFE_COPY.actions.slip)}>
              {CAFE_COPY.actions.slip}
            </PillButton>
            <PillButton size="md" disabled={busy} onClick={actions.staff} aria-label={label(CAFE_COPY.actions.staff)}>
              {CAFE_COPY.actions.staff}
            </PillButton>
          </div>
        );
      } else if (vending) {
        buttons = <p className="text-secondary text-mocha">{copy.atKiosk}</p>;
      } else {
        buttons = <CollectBox id={card.id} busy={busy} onCollect={actions.collect} />;
      }
      break;
    case "PICKED_UP":
      buttons = card.holder ? (
        <p className="text-secondary text-espresso">
          <span className="text-mocha">{copy.heldBy} </span>
          <span className="font-bold">{card.holder.name}</span>
          <span className="text-mocha"> · {card.holder.kind === "staff" ? copy.staff : copy.runnerBuddy}</span>
        </p>
      ) : null;
      break;
    default:
      break;
  }

  return (
    <article
      aria-label={`Order ${card.id}, ${source.name}`}
      className={`flex flex-col gap-3 rounded-card p-3 transition-colors duration-200 ${fresh ? "bg-blush" : "bg-cream"}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-section font-bold text-maroon">{card.id}</h3>
          <p className="text-secondary text-mocha">{source.name}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-sand px-3 py-1 text-secondary font-medium text-espresso">
          <span className="sr-only">{card.mode === "pickup" ? "" : "Deliver to "}</span>
          {where}
        </span>
      </header>

      <ul className="flex flex-col text-body text-espresso">
        {card.items.map((line) => (
          <li key={line.name} className="flex gap-2">
            <span className="shrink-0 font-bold tabular-nums">{line.qty} ×</span>
            <span className="min-w-0">{line.name}</span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-0.5 text-secondary text-mocha">
        <div className="flex gap-1">
          <dt className="sr-only">When</dt>
          <dd>{card.when === "asap" ? copy.asap : copy.breakAt(card.when)}</dd>
        </div>
        {card.promisedAt !== undefined ? (
          <div className="flex gap-1">
            <dt>{copy.promised}</dt>
            <dd className="tabular-nums text-espresso">
              {formatClock(card.promisedAt)} · {formatMsLeft(card.promisedAt - now)} left
            </dd>
          </div>
        ) : null}
        <div className="flex gap-1">
          <dt className="sr-only">{copy.placed}</dt>
          <dd>{minutes === 0 ? `${copy.placed} ${copy.justNow}` : `${copy.placed} ${copy.minutesAgo(minutes)}`}</dd>
        </div>
      </dl>

      {card.status === "ACCEPTED" ? (
        <p className="text-secondary font-medium text-espresso">{copy.accepted}</p>
      ) : null}

      {buttons}
      {error ? (
        <p role="alert" className="text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
    </article>
  );
}
