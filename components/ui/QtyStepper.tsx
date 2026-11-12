"use client";

import { Minus, Plus } from "@phosphor-icons/react";

/** [−] 2 [+] on a sand pill. Both buttons are 44 px. */
export function QtyStepper({
  name,
  qty,
  onInc,
  onDec,
  incDisabled = false,
}: {
  name: string;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  incDisabled?: boolean;
}) {
  const button =
    "flex size-11 items-center justify-center rounded-pill transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-sand p-0.5">
      <button type="button" aria-label={`Remove one ${name}`} onClick={onDec} className={`${button} bg-cream text-espresso`}>
        <Minus weight="bold" size={18} aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center font-display text-section font-bold tabular-nums text-espresso" aria-live="polite">
        <span className="sr-only">Quantity </span>
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Add one ${name}`}
        onClick={onInc}
        disabled={incDisabled}
        className={`${button} bg-maroon text-cream disabled:bg-sand disabled:text-taupe disabled:active:scale-100`}
      >
        <Plus weight="bold" size={18} aria-hidden="true" />
      </button>
    </span>
  );
}
