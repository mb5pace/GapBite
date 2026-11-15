/**
 * What Home and the menu pages show for each place: its status ("Open now", "Opens at 12:00", "Closed today",
 * "Paused") and, while it is open, how long an order placed now would take. One answer for all five places, kept for a
 * few seconds so a crowd of students polling costs the database one read, not one each. Server-side only.
 */
import { SOURCES, type SourceId } from "@/data/menu";
import { STATUS_CACHE_MS } from "./config";
import { getHoursConfig, getService } from "./hours";
import { sourceLabel } from "./hours-rules";
import { activeKey, orderKey } from "./orders";
import type { Order } from "./order-types";
import { readyEstimateMin, sourceMedianPrepMin } from "./ready-estimate";
import { getRedis } from "./redis";

export interface SourceStatusEntry {
  /** The same words as the Home tile: "Open now", "Opens at 12:00", "Closed today (Diwali)", "Paused". */
  label: string;
  open: boolean;
  tone: "olive" | "amber" | "brick" | "taupe";
  /** Minutes ("Ready in about N min"), or null while the place is not taking orders. 0 means ready now. */
  readyMin: number | null;
}

export interface SourceStatusReply {
  now: number;
  sources: Record<SourceId, SourceStatusEntry>;
}

let cached: { at: number; value: SourceStatusReply } | null = null;

/** How many orders each place has accepted and not finished (ACCEPTED or PREPARING). */
async function queuedBySource(): Promise<Record<string, number>> {
  const redis = getRedis();
  const ids = await redis.zrange<string[]>(activeKey(), 0, -1);
  const counts: Record<string, number> = {};
  if (ids.length === 0) return counts;
  const found = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  for (const order of found) {
    if (order && typeof order === "object" && (order.status === "ACCEPTED" || order.status === "PREPARING")) {
      counts[order.sourceId] = (counts[order.sourceId] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getSourceStatus(now: number): Promise<SourceStatusReply> {
  if (cached && now - cached.at < STATUS_CACHE_MS && now >= cached.at) return cached.value;
  const [hours, service, queued] = await Promise.all([getHoursConfig(), getService(), queuedBySource()]);
  const sources = {} as Record<SourceId, SourceStatusEntry>;
  for (const source of SOURCES) {
    const label = sourceLabel(hours, service, source.id, now);
    sources[source.id] = {
      label: label.text,
      open: label.open,
      tone: label.tone,
      readyMin: label.open ? readyEstimateMin(sourceMedianPrepMin(source.id), queued[source.id] ?? 0) : null,
    };
  }
  const value = { now, sources };
  cached = { at: now, value };
  return value;
}
