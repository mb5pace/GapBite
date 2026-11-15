"use client";

import { useState } from "react";
import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { DEFAULT_ITEM_WINDOWS, type ItemWindow } from "@/data/hours";
import { itemsBySource, SOURCES, type MenuItem, type SourceId } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { Toggle } from "@/components/ui/Toggle";
import { HOURS_STEP_MIN, POLL_MS } from "@/lib/config";
import { windowLabel, validateWindow, type HoursConfig } from "@/lib/hours-rules";
import { getJson, postJson } from "@/lib/http";
import { PillField } from "./PillField";

interface AvailabilityReply {
  unavailable: string[];
}

interface Draft {
  from: string;
  until: string;
}

const sameWindow = (a: ItemWindow | undefined, b: ItemWindow | undefined) => (a?.from ?? "") === (b?.from ?? "") && (a?.until ?? "") === (b?.until ?? "");

/** One item: its own time window (optional), and the "Available today" switch that used to be on the Menu page. */
function ItemRow({
  item,
  saved,
  available,
  onAvailable,
  change,
}: {
  item: MenuItem;
  saved: ItemWindow | undefined;
  available: boolean;
  onAvailable: (on: boolean) => void;
  change: (body: Record<string, unknown>, done: string) => Promise<string | null>;
}) {
  const copy = CAFE_COPY.hours;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const shown: Draft = draft ?? { from: saved?.from ?? "", until: saved?.until ?? "" };
  const dirty = draft !== null && (draft.from !== (saved?.from ?? "") || draft.until !== (saved?.until ?? ""));
  const isDefault = sameWindow(saved, DEFAULT_ITEM_WINDOWS[item.id]);
  const hasWindow = Boolean(saved?.from || saved?.until);

  function edit(patch: Partial<Draft>) {
    setProblem(null);
    setDraft({ ...shown, ...patch });
  }

  async function save() {
    const message = validateWindow(shown);
    if (message) {
      setProblem(message);
      return;
    }
    setBusy(true);
    const error = await change({ action: "item", itemId: item.id, from: shown.from || null, until: shown.until || null }, copy.windowSaved(item.name));
    setBusy(false);
    if (error) setProblem(error);
    else setDraft(null);
  }

  async function reset() {
    setBusy(true);
    setProblem(null);
    const error = await change({ action: "item-reset", itemId: item.id }, copy.windowReset(item.name));
    setBusy(false);
    if (error) setProblem(error);
    else setDraft(null);
  }

  return (
    <li className="flex flex-col gap-2 px-3 py-3" data-item={item.id}>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="min-w-48 flex-1">
          <p className="text-body font-medium text-espresso">{item.name}</p>
          <p className="text-secondary text-mocha">
            <Money amount={item.price} />
            {item.slot ? ` · Slot ${item.slot}` : ""}
          </p>
          <p className="text-secondary text-mocha" data-window-state={isDefault ? "default" : "changed"}>
            {hasWindow && saved ? windowLabel(item, saved) : copy.windowNone} · {isDefault ? copy.windowDefault : copy.windowChanged}
          </p>
        </div>
        <PillField label={copy.from} type="time" step={HOURS_STEP_MIN * 60} value={shown.from} onChange={(from) => edit({ from })} widthClass="w-32" />
        <PillField label={copy.until} type="time" step={HOURS_STEP_MIN * 60} value={shown.until} onChange={(until) => edit({ until })} widthClass="w-32" />
        <PillButton size="md" disabled={!dirty || busy} onClick={() => void save()}>
          {copy.saveWindow}
        </PillButton>
        {!isDefault && !dirty ? (
          <PillButton size="md" variant="secondary" disabled={busy} onClick={() => void reset()}>
            {copy.resetWindow}
          </PillButton>
        ) : null}
        <span className="flex shrink-0 items-center gap-3">
          <span className={`text-secondary font-medium ${available ? "text-espresso" : "text-brick"}`}>{available ? CAFE_COPY.menu.available : CAFE_COPY.menu.off}</span>
          <Toggle checked={available} label={CAFE_COPY.menu.switchLabel(item.name)} onChange={onAvailable} />
        </span>
      </div>
      {problem ? <Banner tone="error">{problem}</Banner> : null}
    </li>
  );
}

/** Items: pick a place, then set each item's own window and switch it off for the day when it has run out. */
export function ItemsSection({
  hours,
  change,
}: {
  hours: HoursConfig;
  change: (body: Record<string, unknown>, done: string) => Promise<string | null>;
}) {
  const copy = CAFE_COPY.hours;
  const [sourceId, setSourceId] = useState<SourceId>(SOURCES[0].id);
  const { data, error, mutate } = useSWR<AvailabilityReply>("/api/cafe/availability", getJson, { refreshInterval: POLL_MS.cafe });
  const [problem, setProblem] = useState<string | null>(null);
  const off = new Set(data?.unavailable ?? []);

  async function setAvailable(itemId: string, available: boolean) {
    setProblem(null);
    // The switch moves straight away. If the server says no, it moves back.
    const next = new Set(off);
    if (available) next.delete(itemId);
    else next.add(itemId);
    await mutate({ unavailable: [...next].sort() }, { revalidate: false });
    const res = await postJson<AvailabilityReply>("/api/cafe/availability", { itemId, available });
    if (res.ok && res.data) {
      await mutate(res.data, { revalidate: false });
    } else {
      setProblem(res.error ?? CAFE_COPY.errors.network);
      await mutate();
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="items-title">
      <div>
        <h2 id="items-title" className="font-display text-section font-bold text-maroon">
          {copy.itemsTitle}
        </h2>
        <p className="mt-1 text-body text-mocha">{copy.itemsIntro}</p>
        <p className="mt-1 text-body text-mocha">{CAFE_COPY.menu.intro}</p>
      </div>

      <div role="group" aria-label={copy.pick} className="flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <Chip key={source.id} selected={sourceId === source.id} onClick={() => setSourceId(source.id)}>
            {source.kind === "vending" ? "Vending" : source.name}
          </Chip>
        ))}
      </div>

      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {problem ? <Banner tone="error">{problem}</Banner> : null}

      <ul className="divide-y divide-sand rounded-card bg-parchment p-2">
        {itemsBySource(sourceId).map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            saved={hours.itemWindows[item.id]}
            available={!off.has(item.id)}
            onAvailable={(on) => void setAvailable(item.id, on)}
            change={change}
          />
        ))}
      </ul>
    </section>
  );
}
