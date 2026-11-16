"use client";

import { CAFE_COPY } from "@/data/cafe-copy";
import { SOURCES } from "@/data/menu";
import { SOURCE_BG } from "@/components/student/sourceStyle";
import { useDesk, type SourceFilter } from "./DeskProvider";
import { useQueue } from "./QueueProvider";

/**
 * The source filter under the top bar on the Queue (v1.0.0 Phase C1): a segmented control, All and the five places,
 * each with how many of its orders are on the queue. The open segment is filled maroon.
 */
export function SourceFilterBar() {
  const { orders } = useQueue();
  const { filter, setFilter } = useDesk();
  const options: { id: SourceFilter; label: string; count: number }[] = [
    { id: "all", label: CAFE_COPY.all, count: orders.length },
    ...SOURCES.map((source) => ({
      id: source.id,
      label: source.kind === "vending" ? CAFE_COPY.nav.vending : source.name,
      count: orders.filter((o) => o.sourceId === source.id).length,
    })),
  ];

  return (
    <div className="px-6 pt-3">
      <div role="group" aria-label={CAFE_COPY.filterLabel} className="inline-flex max-w-full flex-wrap gap-1 rounded-pill bg-sand p-1" data-source-filter="">
        {options.map((option) => {
          const on = filter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(option.id)}
              className={`inline-flex h-12 items-center gap-2 rounded-pill px-4 text-secondary font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${
                on ? "bg-maroon text-cream" : "text-espresso"
              }`}
            >
              {option.id !== "all" ? <span className={`size-2 shrink-0 rounded-pill ${SOURCE_BG[option.id]}`} aria-hidden="true" /> : null}
              {option.label}
              <span className={`tabular-nums ${on ? "text-cream" : "text-mocha"}`}>{option.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
