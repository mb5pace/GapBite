"use client";

import { useState } from "react";
import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { itemsBySource, SOURCES, type SourceId } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { Toggle } from "@/components/ui/Toggle";
import { POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";

interface AvailabilityReply {
  unavailable: string[];
}

/** Menu availability: every item of the chosen source with an "Available today" switch (docs/SCREENS.md). */
export function MenuAvailabilityView() {
  const copy = CAFE_COPY.menu;
  const [sourceId, setSourceId] = useState<SourceId>(SOURCES[0].id);
  const { data, error, mutate } = useSWR<AvailabilityReply>("/api/cafe/availability", getJson, { refreshInterval: POLL_MS.cafe });
  const [problem, setProblem] = useState<string | null>(null);
  const items = itemsBySource(sourceId);
  const off = new Set(data?.unavailable ?? []);

  async function set(itemId: string, available: boolean) {
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
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="font-display text-title font-bold text-maroon">{copy.title}</h1>
        <p className="mt-1 max-w-xl text-body text-mocha">{copy.intro}</p>
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

      <ul className="divide-y divide-sand rounded-card bg-parchment p-3">
        {items.map((item) => {
          const available = !off.has(item.id);
          return (
            <li key={item.id} className="flex items-center justify-between gap-4 px-3 py-2">
              <div className="min-w-0">
                <p className="text-body font-medium text-espresso">{item.name}</p>
                <p className="text-secondary text-mocha">
                  <Money amount={item.price} />
                  {item.slot ? ` · Slot ${item.slot}` : ""}
                  {item.tags.includes("morning") ? ` · ${copy.morningOnly}` : ""}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`text-secondary font-medium ${available ? "text-espresso" : "text-brick"}`}>
                  {available ? copy.available : copy.off}
                </span>
                <Toggle checked={available} label={copy.switchLabel(item.name)} onChange={(on) => void set(item.id, on)} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
