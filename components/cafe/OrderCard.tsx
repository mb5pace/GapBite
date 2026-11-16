"use client";

import { Printer } from "@phosphor-icons/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { IconButton } from "@/components/ui/IconButton";
import { PillButton } from "@/components/ui/PillButton";
import { SOURCE_BG } from "@/components/student/sourceStyle";
import { CODE_DIGITS } from "@/lib/config";
import { isDue, isUnclaimed } from "@/lib/late-rules";
import type { CafeCard } from "@/lib/order-types";
import { ticketLook, type TicketOutline } from "@/lib/ticket-age";
import { formatClock, formatMsLeft } from "@/lib/time";

export interface CardActions {
  accept: () => void;
  reject: () => void;
  start: () => void;
  /** Mark ready. On an Accepted ticket it starts preparing first, then marks it ready. */
  ready: () => void;
  slip: () => void;
  staff: () => void;
  print: () => void;
  /** Resolves true when the code was right. */
  collect: (code: string) => Promise<boolean>;
}

/** No side stripes: the outline goes all the way round (UI_UX_BIBLE.md "POS tickets"). */
const OUTLINE: Record<TicketOutline, string> = {
  none: "",
  amber: "outline-2 outline-amber",
  brick: "outline-3 outline-brick",
};

/** The small text button under the big one (Reject, Start preparing, Send with staff). 48 px tall. */
function SecondaryAction({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-12 items-center justify-center rounded-pill px-4 text-secondary font-semibold text-espresso underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:text-taupe"
    >
      {children}
    </button>
  );
}

/** Collect on a Ready pickup: the buyer's 4 digits, typed on the ticket. */
function CollectForm({ id, busy, onCollect, onCancel }: { id: string; busy: boolean; onCollect: (code: string) => Promise<boolean>; onCancel: () => void }) {
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
      <PillButton type="submit" full size="ticket" disabled={busy || code.length !== CODE_DIGITS} aria-label={`${CAFE_COPY.actions.collect} ${id}`}>
        {CAFE_COPY.ticket.confirmCode}
      </PillButton>
      <SecondaryAction onClick={onCancel} disabled={busy} label={`${CAFE_COPY.ticket.cancelCode} ${id}`}>
        {CAFE_COPY.ticket.cancelCode}
      </SecondaryAction>
    </form>
  );
}

/**
 * One order on the Queue as a kitchen ticket (docs/SCREENS.md "Queue", v1.0.0 Phase C1): a header strip in the
 * source's colour with the order ID, the source, the time placed and its age; the mode; large item lines; when it is
 * wanted and the promised time; and one big action for its column, with a smaller second action under it.
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
  const copy = CAFE_COPY.ticket;
  const source = getSource(card.sourceId);
  const vending = source.kind === "vending";
  const building = card.buildingId ? getBuilding(card.buildingId) : null;
  const look = ticketLook(card, now);
  const due = isDue(card, now);
  const unclaimed = isUnclaimed(card, now);
  const label = (text: string) => `${text} ${card.id}`;
  const [collecting, setCollecting] = useState(false);

  let primary: ReactNode = null;
  let secondary: ReactNode = null;
  switch (card.status) {
    case "PLACED": {
      const word = vending ? CAFE_COPY.actions.acceptAndReady : CAFE_COPY.actions.accept;
      primary = (
        <PillButton full size="ticket" disabled={busy} onClick={actions.accept} aria-label={label(word)}>
          {word}
        </PillButton>
      );
      secondary = (
        <SecondaryAction onClick={actions.reject} disabled={busy} label={label(CAFE_COPY.actions.reject)}>
          {CAFE_COPY.actions.reject}
        </SecondaryAction>
      );
      break;
    }
    case "ACCEPTED":
    case "PREPARING":
      primary = (
        <PillButton full size="ticket" disabled={busy} onClick={actions.ready} aria-label={label(CAFE_COPY.actions.ready)}>
          {CAFE_COPY.actions.ready}
        </PillButton>
      );
      if (card.status === "ACCEPTED") {
        secondary = (
          <SecondaryAction onClick={actions.start} disabled={busy} label={label(CAFE_COPY.actions.start)}>
            {CAFE_COPY.actions.start}
          </SecondaryAction>
        );
      }
      break;
    case "READY":
      if (card.mode === "delivery") {
        primary = (
          <PillButton full size="ticket" disabled={busy} onClick={actions.slip} aria-label={label(CAFE_COPY.actions.slip)}>
            {copy.showSlip}
          </PillButton>
        );
        secondary = (
          <SecondaryAction onClick={actions.staff} disabled={busy} label={label(CAFE_COPY.actions.staff)}>
            {CAFE_COPY.actions.staff}
          </SecondaryAction>
        );
      } else if (vending) {
        primary = <p className="rounded-pill bg-sand px-4 py-3 text-center text-body font-semibold text-espresso">{copy.atKiosk}</p>;
      } else if (collecting) {
        primary = <CollectForm id={card.id} busy={busy} onCollect={actions.collect} onCancel={() => setCollecting(false)} />;
      } else {
        primary = (
          <PillButton full size="ticket" disabled={busy} onClick={() => setCollecting(true)} aria-label={label(CAFE_COPY.actions.collect)}>
            {CAFE_COPY.actions.collect}
          </PillButton>
        );
      }
      break;
    default:
      break;
  }

  return (
    <article
      aria-label={`Order ${card.id}, ${source.name}`}
      data-due={due ? "" : undefined}
      data-unclaimed={unclaimed ? "" : undefined}
      data-outline={look.outline === "none" ? undefined : look.outline}
      data-ticket={card.id}
      className={`flex shrink-0 flex-col overflow-hidden rounded-card transition-colors duration-200 ${fresh ? "bg-blush" : "bg-cream"} ${OUTLINE[look.outline]}`}
    >
      <header className={`flex flex-col gap-1 px-4 py-3 text-cream ${SOURCE_BG[card.sourceId]}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="whitespace-nowrap font-display text-title font-extrabold leading-tight tabular-nums">{card.id}</h3>
          <p className="shrink-0 text-body font-bold tabular-nums" aria-label={copy.placedAt(formatClock(card.createdAt))}>
            {formatClock(card.createdAt)}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-secondary font-medium">{source.name}</p>
          <p className="shrink-0 text-secondary font-medium tabular-nums" data-age="">
            {copy.age(look.ageMin)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-pill bg-sand px-3 py-1 text-secondary font-semibold text-espresso">
            <span className="sr-only">{card.mode === "pickup" ? "" : "Deliver to "}</span>
            {building ? copy.deliverTo(building.short, building.dropPoint) : copy.pickup}
          </span>
          {look.waiting ? <span className="rounded-pill bg-brick px-3 py-1 text-secondary font-bold text-cream">{copy.waiting}</span> : null}
          {card.status === "ACCEPTED" ? <span className="rounded-pill bg-blush px-3 py-1 text-secondary font-semibold text-maroon">{copy.accepted}</span> : null}
        </div>

        <ul className="flex flex-col divide-y divide-dotted divide-taupe">
          {card.items.map((line) => (
            <li key={line.name} className="flex gap-2 py-2 text-section font-semibold text-espresso">
              <span className="shrink-0 tabular-nums">{line.qty} ×</span>
              <span className="min-w-0">{line.name}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between gap-2">
          <dl className="flex min-w-0 flex-col gap-1 text-secondary text-mocha">
            <div className="flex gap-1">
              <dt>{copy.when}</dt>
              <dd className="font-semibold text-espresso">{card.when === "asap" ? copy.asap : CAFE_COPY.card.breakAt(card.when)}</dd>
            </div>
            {card.promisedAt !== undefined ? (
              <div className="flex flex-wrap gap-x-1">
                <dt>{copy.promised}</dt>
                <dd className="tabular-nums text-espresso">
                  <span className="font-semibold">{formatClock(card.promisedAt)}</span> ·{" "}
                  {due ? <span className="font-bold">{CAFE_COPY.due}</span> : copy.left(formatMsLeft(card.promisedAt - now))}
                </dd>
              </div>
            ) : null}
            {card.status === "PICKED_UP" && card.holder ? (
              <div className="flex flex-col">
                <dt className="sr-only">{CAFE_COPY.card.heldBy}</dt>
                <dd className="font-semibold text-espresso">
                  {copy.carriedBy(card.holder.name, card.holder.kind === "staff" ? CAFE_COPY.card.staff : CAFE_COPY.card.runnerBuddy)}
                </dd>
                {card.arrivedAt !== undefined && building ? (
                  <dd className="font-bold text-espresso">{copy.holderAt(card.holder.kind, building.short)}</dd>
                ) : null}
              </div>
            ) : null}
          </dl>
          <IconButton variant="secondary" size="lg" label={copy.print(card.id)} onClick={actions.print}>
            <Printer weight="regular" size={24} aria-hidden="true" />
          </IconButton>
        </div>

        {unclaimed ? <p className="text-secondary font-bold text-espresso">{CAFE_COPY.noRunner}</p> : null}

        {primary || secondary ? (
          <div className="flex flex-col items-stretch gap-1">
            {primary}
            {secondary}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-secondary font-medium text-brick">
            {error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
