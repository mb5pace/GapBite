"use client";

import { ClockCounterClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import useSWR from "swr";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { OrderCard } from "@/components/student/OrdersView";
import type { HistoryReply, RunHistoryItem, RunOutcome } from "@/lib/history-types";
import { getJson } from "@/lib/http";
import { formatDayTime } from "@/lib/time";

type Filter = "all" | "orders" | "runs";

const TONE: Record<RunOutcome, "olive" | "brick" | "amber"> = { delivered: "olive", "failed-late": "brick", "no-show": "amber" };

/** One finished run: where it went, how it ended and what it did to the wallet. Not a link: the order page is the buyer's. */
function RunRow({ run, now }: { run: RunHistoryItem; now: number }) {
  const copy = ACCOUNT_COPY.history;
  const building = getBuilding(run.buildingId);
  const money =
    run.kind === "staff"
      ? copy.noEarning
      : run.amount === null || run.amount === 0
        ? null
        : run.amount > 0
          ? copy.earned(run.amount)
          : copy.charged(-run.amount);
  return (
    <li className="flex flex-col gap-2 rounded-card bg-parchment p-4" data-run="">
      <span className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 font-display text-section font-bold text-maroon">
          <SourceGlyph sourceId={run.sourceId} size={20} />
          <span>{copy.runTitle(building.short)}</span>
        </span>
        <Badge tone={TONE[run.outcome]}>{copy.outcome[run.outcome]}</Badge>
      </span>
      <span className="text-secondary text-mocha">
        <span className="font-medium tabular-nums text-espresso">{run.id}</span> · {getSource(run.sourceId).name} ·{" "}
        {run.kind === "staff" ? copy.runKindStaff : copy.runKindRunner}
      </span>
      <span className="flex items-center justify-between gap-3 text-secondary tabular-nums text-mocha">
        <span>{formatDayTime(run.at, now)}</span>
        {money ? <span className="font-medium text-espresso">{money}</span> : null}
      </span>
    </li>
  );
}

/** Account › Order History: the same finished orders as Orders › Past, plus finished runs, with All / Orders / Runs. */
export function HistoryView() {
  const copy = ACCOUNT_COPY.history;
  const { data, error } = useSWR<HistoryReply>("/api/history", getJson, { revalidateOnFocus: true });
  const [filter, setFilter] = useState<Filter>("all");

  const orders = data?.orders ?? [];
  const runs = data?.runs ?? [];
  const items = [
    ...(filter !== "runs" ? orders.map((order) => ({ at: order.updatedAt, kind: "order" as const, order })) : []),
    ...(filter !== "orders" ? runs.map((run) => ({ at: run.at, kind: "run" as const, run })) : []),
  ].sort((a, b) => b.at - a.at);
  const empty = filter === "orders" ? copy.emptyOrders : filter === "runs" ? copy.emptyRuns : copy.emptyAll;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-body text-espresso">{copy.intro}</p>
      <div role="group" aria-label={copy.filterLabel} className="flex gap-2">
        {(["all", "orders", "runs"] as const).map((f) => (
          <Chip key={f} selected={filter === f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {copy.filters[f]}
          </Chip>
        ))}
      </div>
      {error && !data ? <Banner tone="error">{copy.loadFailed}</Banner> : null}
      {!data && !error ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="h-24 rounded-card bg-sand" />
          <div className="h-24 rounded-card bg-sand" />
        </div>
      ) : null}
      {data && items.length === 0 ? <EmptyState icon={<ClockCounterClockwise weight="regular" size={40} />}>{empty}</EmptyState> : null}
      {data && items.length > 0 ? (
        <ul className="flex flex-col gap-3" aria-label="History">
          {items.map((item) => (item.kind === "order" ? <OrderCard key={`o-${item.order.id}`} order={item.order} now={data.now} /> : <RunRow key={`r-${item.run.id}`} run={item.run} now={data.now} />))}
        </ul>
      ) : null}
    </div>
  );
}
