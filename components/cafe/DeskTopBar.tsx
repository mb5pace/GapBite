"use client";

import { Scan } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { SOURCES, type Source } from "@/data/menu";
import { PillButton } from "@/components/ui/PillButton";
import { SOURCE_BG } from "@/components/student/sourceStyle";
import { POLL_MS } from "@/lib/config";
import type { HoursConfig, ServiceState } from "@/lib/hours-rules";
import { getJson, postJson } from "@/lib/http";
import { columnOf, type QueueColumnId } from "@/lib/order-types";
import { formatClock } from "@/lib/time";
import { useDesk } from "./DeskProvider";
import { useQueue } from "./QueueProvider";

interface HoursReply {
  hours: HoursConfig;
  service: ServiceState;
  now: number;
}

const TITLES: Record<string, string> = {
  "/cafe": CAFE_COPY.nav.queue,
  "/cafe/vending": CAFE_COPY.nav.vending,
  "/cafe/hours": CAFE_COPY.nav.hours,
  "/cafe/today": CAFE_COPY.nav.today,
};

const COLUMNS: QueueColumnId[] = ["new", "preparing", "ready", "out"];

/** One compact Open / Paused switch: the source's colour dot, its short name, a small track. Same setting as Hours and items. */
function PauseSwitch({ source, paused, busy, onChange }: { source: Source; paused: boolean; busy: boolean; onChange: (paused: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!paused}
      aria-label={CAFE_COPY.shell.pauseSwitch(source.name)}
      title={`${source.name}: ${paused ? CAFE_COPY.shell.paused : CAFE_COPY.hours.takingOrders}`}
      disabled={busy}
      onClick={() => onChange(!paused)}
      data-pause-switch={source.id}
      className="inline-flex h-12 shrink-0 items-center gap-2 rounded-pill bg-cream px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:cursor-wait"
    >
      <span className={`size-2 shrink-0 rounded-pill ${SOURCE_BG[source.id]}`} aria-hidden="true" />
      <span className={`text-secondary font-semibold ${paused ? "text-brick" : "text-espresso"}`}>
        {CAFE_COPY.sourceShort[source.id]}
        {paused ? <span className="font-medium"> · {CAFE_COPY.shell.paused}</span> : null}
      </span>
      <span className={`flex h-6 w-10 items-center rounded-pill px-1 transition-colors duration-150 ${paused ? "bg-sand" : "bg-maroon"}`} aria-hidden="true">
        <span className={`size-4 rounded-pill transition-transform duration-150 ${paused ? "translate-x-0 bg-taupe" : "translate-x-4 bg-cream"}`} />
      </span>
    </button>
  );
}

/**
 * The POS top bar on parchment (v1.0.0 Phase C1). First row: the page title and one Open / Paused switch per place
 * (the same Redis switches as Hours and items). Second row: live counts for each queue column and the alerts (each a
 * link to that column on the Queue), the clock, and Scan buyer QR.
 */
export function DeskTopBar() {
  const pathname = usePathname();
  const queue = useQueue();
  const desk = useDesk();
  const shell = CAFE_COPY.shell;
  const { data, mutate } = useSWR<HoursReply>("/api/cafe/hours", getJson, { refreshInterval: POLL_MS.cafe });
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function setPaused(source: Source, paused: boolean) {
    setBusy(source.id);
    setProblem(null);
    const res = await postJson<{ hours: HoursConfig }>("/api/cafe/hours", { action: "paused", sourceId: source.id, paused }, { method: "PUT" });
    setBusy(null);
    if (res.ok && res.data) await mutate((current) => (current ? { ...current, hours: res.data!.hours } : current), { revalidate: false });
    else setProblem(shell.switchFailed(source.name));
  }

  const shown = queue.orders.filter((o) => desk.filter === "all" || o.sourceId === desk.filter);
  const counts = Object.fromEntries(COLUMNS.map((c) => [c, shown.filter((o) => columnOf(o.status) === c).length])) as Record<QueueColumnId, number>;
  const alerts = queue.alerts.length;
  const chip =
    "inline-flex h-12 shrink-0 items-center gap-2 rounded-pill px-3 text-secondary font-semibold xl:px-4 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

  return (
    <header className="flex flex-col gap-3 bg-parchment px-6 py-3" data-desk-topbar="">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <h1 className="font-display text-title font-extrabold text-maroon">{TITLES[pathname] ?? CAFE_COPY.nav.queue}</h1>
        <div role="group" aria-label={shell.switchesLabel} className="ml-auto flex flex-wrap items-center gap-2">
          {SOURCES.map((source) => (
            <PauseSwitch
              key={source.id}
              source={source}
              paused={data?.hours.sources[source.id]?.paused ?? false}
              busy={!data || busy === source.id}
              onChange={(paused) => void setPaused(source, paused)}
            />
          ))}
        </div>
      </div>
      {problem ? (
        <p role="alert" className="text-secondary font-medium text-brick">
          {problem}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label={shell.countsLabel} className="flex flex-wrap items-center gap-2">
          {COLUMNS.map((column) => (
            <Link key={column} href={`/cafe#col-${column}`} className={`${chip} bg-cream text-espresso`} aria-label={shell.countLabel(CAFE_COPY.columns[column], counts[column])} data-count={column}>
              {CAFE_COPY.columns[column]}
              <span className="font-display text-section font-extrabold tabular-nums text-maroon">{counts[column]}</span>
            </Link>
          ))}
          <Link
            href="/cafe#alerts"
            className={`${chip} ${alerts > 0 ? "bg-brick text-cream" : "bg-cream text-espresso"}`}
            aria-label={shell.countLabel(shell.alerts, alerts)}
            data-count="alerts"
          >
            {shell.alerts}
            <span className={`font-display text-section font-extrabold tabular-nums ${alerts > 0 ? "text-cream" : "text-maroon"}`}>{alerts}</span>
          </Link>
        </nav>
        <span className="ml-auto flex items-center gap-4">
          <span className="font-display text-title font-extrabold tabular-nums text-espresso xl:text-greeting" role="timer" aria-label={`${CAFE_COPY.clockLabel}, IST`}>
            {formatClock(queue.now)}
          </span>
          <PillButton onClick={() => desk.openScan()} className="whitespace-nowrap">
            <Scan weight="regular" size={24} aria-hidden="true" />
            {shell.scanBuyer}
          </PillButton>
        </span>
      </div>
    </header>
  );
}
