"use client";

import { useState } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { WEEKDAY_NAMES, WEEKDAY_SHORT, type Weekday } from "@/data/hours";
import type { Source } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/PillButton";
import { Toggle } from "@/components/ui/Toggle";
import { HOURS_STEP_MIN } from "@/lib/config";
import { validateSourceHours, type SourceConfig } from "@/lib/hours-rules";
import { PillField } from "./PillField";

/** Monday first, Sunday last: the order students think of the week in. (The stored numbers are 0 = Sunday.) */
const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

interface Draft {
  open: string;
  close: string;
  days: Weekday[];
}

/** One place on the Hours page: when it opens and closes, which days, and the Taking orders switch. */
export function PlaceHoursCard({
  source,
  config,
  statusNow,
  change,
}: {
  source: Source;
  config: SourceConfig;
  /** What students see on the Home tile right now, e.g. "Open now" or "Closed today (Diwali)". */
  statusNow: string;
  /** Sends one change to the server. Returns an error sentence, or null when it was saved. */
  change: (body: Record<string, unknown>, done: string) => Promise<string | null>;
}) {
  const copy = CAFE_COPY.hours;
  // null = nothing typed yet, so the fields show what is saved. Once a field is touched the draft is the Cafe's.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const saved: Draft = { open: config.open, close: config.close, days: config.days };
  const shown = draft ?? saved;
  const dirty = draft !== null && (draft.open !== saved.open || draft.close !== saved.close || draft.days.join() !== saved.days.join());

  function edit(patch: Partial<Draft>) {
    setProblem(null);
    setDraft({ ...shown, ...patch });
  }

  function toggleDay(day: Weekday) {
    const days = shown.days.includes(day) ? shown.days.filter((d) => d !== day) : [...shown.days, day];
    edit({ days: [...days].sort((a, b) => a - b) });
  }

  async function save() {
    const message = validateSourceHours(shown);
    if (message) {
      setProblem(message);
      return;
    }
    setBusy(true);
    const error = await change({ action: "source", sourceId: source.id, open: shown.open, close: shown.close, days: shown.days }, copy.saved(source.name));
    setBusy(false);
    if (error) setProblem(error);
    else setDraft(null);
  }

  async function setPaused(paused: boolean) {
    setBusy(true);
    setProblem(null);
    const error = await change({ action: "paused", sourceId: source.id, paused }, paused ? copy.pausedNow(source.name) : copy.resumedNow(source.name));
    setBusy(false);
    if (error) setProblem(error);
  }

  return (
    <section className="flex flex-col gap-4 rounded-card bg-parchment p-5" aria-label={source.name} data-place={source.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-section font-bold text-maroon">{source.name}</h3>
          <p className="text-secondary text-mocha">
            {copy.nowLabel}: <span className="font-medium text-espresso">{statusNow}</span>
          </p>
        </div>
        <span className="flex items-center gap-3">
          <span className={`text-secondary font-medium ${config.paused ? "text-brick" : "text-espresso"}`}>{config.paused ? copy.pausedLabel : copy.takingOrders}</span>
          <Toggle size="desk" checked={!config.paused} disabled={busy} label={copy.pauseSwitch(source.name)} onChange={(on) => void setPaused(!on)} />
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <PillField label={copy.opens} type="time" step={HOURS_STEP_MIN * 60} value={shown.open} onChange={(open) => edit({ open })} />
        <PillField label={copy.closes} type="time" step={HOURS_STEP_MIN * 60} value={shown.close} onChange={(close) => edit({ close })} />
        <div role="group" aria-label={copy.days} className="flex flex-col gap-1">
          <span className="px-2 text-secondary font-medium text-mocha">{copy.days}</span>
          <span className="flex flex-wrap gap-2">
            {WEEK_ORDER.map((day) => (
              <Chip size="desk" key={day} selected={shown.days.includes(day)} aria-label={WEEKDAY_NAMES[day]} onClick={() => toggleDay(day)}>
                {WEEKDAY_SHORT[day]}
              </Chip>
            ))}
          </span>
        </div>
      </div>

      {problem ? <Banner tone="error">{problem}</Banner> : null}

      <div className="flex flex-wrap items-center gap-3">
        <PillButton size="desk" disabled={!dirty || busy} onClick={() => void save()}>
          {busy ? copy.saving : copy.saveHours}
        </PillButton>
        {dirty ? <span className="text-secondary text-mocha">{copy.unsaved}</span> : null}
      </div>
      {config.paused ? <p className="text-secondary text-mocha">{copy.pauseHint}</p> : null}
    </section>
  );
}
