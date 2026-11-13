"use client";

import { Eye, EyeSlash, Receipt } from "@phosphor-icons/react";
import { useState } from "react";
import useSWR from "swr";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { statusWord } from "@/data/order-copy";
import { StatusBadge } from "@/components/student/OrderParts";
import { Banner } from "@/components/ui/Banner";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillButton } from "@/components/ui/PillButton";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { useServerNow } from "@/components/ui/useServerNow";
import { POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";
import { formatClock, formatMsLeft } from "@/lib/time";
import type { LiveOrderRow } from "@/lib/admin-live";
import { CopyButton } from "./CopyButton";

interface LiveReply {
  orders: LiveOrderRow[];
  now: number;
}

const COPY = {
  title: "Live orders",
  intro: "Every order in progress, refreshed every 5 seconds. Reveal code is a demo tool: it shows one order's 4-digit code to this admin session only.",
  empty: "No orders in progress. Orders placed from the student app show up here.",
  noHolder: "No runner yet",
  pickup: "Pickup at UC",
  promised: "Promised",
  left: "left",
  arrived: "At the drop point since",
  reveal: "Reveal code",
  hide: "Hide code",
  copy: "Copy order ID",
  runnerBuddy: "Runner buddy",
  staff: "QuickX staff",
} as const;

function Row({ order, now, code, onToggle, busy }: { order: LiveOrderRow; now: number; code?: string; onToggle: () => void; busy: boolean }) {
  const source = getSource(order.sourceId);
  const building = order.buildingId ? getBuilding(order.buildingId) : null;
  const msLeft = order.promisedAt !== undefined ? order.promisedAt - now : null;
  return (
    <li className="flex flex-col gap-3 rounded-card bg-parchment p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-44">
          <p className="font-display text-greeting font-extrabold tabular-nums text-maroon">{order.id}</p>
          <p className="flex items-center gap-2 text-secondary text-mocha">
            <SourceGlyph sourceId={order.sourceId} size={16} />
            {source.name}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1">
          <StatusBadge order={order} />
          <p className="text-secondary text-espresso">
            {building ? `Deliver to ${building.short}, ${building.dropPoint.toLowerCase()}` : COPY.pickup}
          </p>
        </div>
        <div className="min-w-44 text-secondary text-espresso">
          {order.holder ? (
            <p>
              <span className="font-bold">{order.holder.name}</span>
              <span className="text-mocha"> · {order.holder.kind === "staff" ? COPY.staff : COPY.runnerBuddy}</span>
            </p>
          ) : order.mode === "delivery" ? (
            <p className="text-mocha">{COPY.noHolder}</p>
          ) : null}
          {order.arrivedAt !== undefined ? (
            <p className="text-mocha">
              {COPY.arrived} <span className="tabular-nums">{formatClock(order.arrivedAt)}</span>
            </p>
          ) : null}
        </div>
        {order.promisedAt !== undefined && msLeft !== null ? (
          <p className="text-secondary text-espresso">
            <span className="text-mocha">{COPY.promised} </span>
            <span className="tabular-nums">{formatClock(order.promisedAt)}</span>
            <span className="text-mocha"> · </span>
            <span className="tabular-nums">{formatMsLeft(Math.max(0, msLeft))}</span> {COPY.left}
          </p>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <CopyButton label={COPY.copy} name={`${COPY.copy} ${order.id}`} getText={async () => order.id} />
          <PillButton variant="secondary" size="md" disabled={busy} aria-label={`${code ? COPY.hide : COPY.reveal} ${order.id}`} onClick={onToggle}>
            {code ? <EyeSlash weight="regular" size={18} aria-hidden="true" /> : <Eye weight="regular" size={18} aria-hidden="true" />}
            {code ? COPY.hide : COPY.reveal}
          </PillButton>
        </span>
      </div>
      {code ? (
        <div className="flex items-center gap-4">
          <CodeBoxes value={code} label={`4-digit code for ${order.id}`} size="sm" />
          <p className="text-secondary text-mocha">{statusWord(order.status, order.mode)}</p>
        </div>
      ) : null}
    </li>
  );
}

/** Admin › Live orders: every active order, polled every 5 seconds. Each row can copy its ID or reveal its code. */
export function LiveOrdersPanel() {
  const { data, error } = useSWR<LiveReply>("/api/admin/live", getJson, { refreshInterval: POLL_MS.admin, keepPreviousData: true });
  const now = useServerNow(data?.now ?? 0);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState("");

  async function toggle(orderId: string) {
    if (codes[orderId]) {
      setCodes(({ [orderId]: _hidden, ...rest }) => {
        void _hidden;
        return rest;
      });
      return;
    }
    setBusyId(orderId);
    setProblem("");
    const res = await postJson<{ id: string; code: string }>("/api/admin/live", { action: "reveal", orderId });
    if (res.ok && res.data) setCodes((current) => ({ ...current, [orderId]: res.data?.code ?? "" }));
    else setProblem(res.error ?? "Could not get that code. Try again.");
    setBusyId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">{COPY.title}</h1>
        <p className="mt-1 max-w-3xl text-body text-mocha">{COPY.intro}</p>
      </div>
      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {problem ? <Banner tone="error">{problem}</Banner> : null}
      {!data && !error ? <div className="h-48 rounded-card bg-sand" aria-busy="true" /> : null}
      {data && data.orders.length === 0 ? <EmptyState icon={<Receipt weight="regular" size={40} />}>{COPY.empty}</EmptyState> : null}
      {data && data.orders.length > 0 ? (
        <ul className="flex flex-col gap-3" aria-label={COPY.title}>
          {data.orders.map((order) => (
            <Row key={order.id} order={order} now={now} code={codes[order.id]} busy={busyId === order.id} onToggle={() => void toggle(order.id)} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
