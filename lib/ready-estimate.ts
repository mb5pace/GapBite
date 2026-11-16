/**
 * "Ready in about N min" for a cafe (docs/BUSINESS_RULES.md "Ready estimate"). Pure: the browser and the server both use it.
 *
 *   N = (median prep time of that place's items + QUEUE_MIN_PER_ORDER x its orders that are ACCEPTED or PREPARING),
 *       rounded up to a multiple of READY_EST_STEP_MIN, and never more than READY_EST_CAP.
 *
 * A place whose items need no cooking (the vending machine, prep 0) with nothing queued comes out as 0, which the
 * screens say as "Ready now".
 */
import { itemsBySource, type SourceId } from "@/data/menu";
import { QUEUE_MIN_PER_ORDER, READY_EST_CAP, READY_EST_STEP_MIN } from "./config";

/** The middle prep time of a list of items (the average of the two middle ones when there is an even number). */
export function medianPrepMin(prepTimes: readonly number[]): number {
  if (prepTimes.length === 0) return 0;
  const sorted = [...prepTimes].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The median prep time of everything a place sells. */
export function sourceMedianPrepMin(sourceId: SourceId): number {
  return medianPrepMin(itemsBySource(sourceId).map((item) => item.prepMin));
}

/** "Ready now" for 0, otherwise "Ready in about 10 min". */
export function readyPhrase(readyMin: number): string {
  return readyMin <= 0 ? "Ready now" : `Ready in about ${readyMin} min`;
}

/** The line under a cafe tile: the status, and while it is open the estimate. "Open now · Ready in about 10 min". */
export function statusLineText(label: { text: string; open: boolean }, readyMin: number | null | undefined): string {
  return label.open && readyMin !== null && readyMin !== undefined ? `${label.text} · ${readyPhrase(readyMin)}` : label.text;
}

/** Minutes until an order placed now would be ready: the formula above. */
export function readyEstimateMin(medianPrep: number, queued: number): number {
  const raw = Math.max(0, medianPrep) + QUEUE_MIN_PER_ORDER * Math.max(0, queued);
  return Math.min(READY_EST_CAP, Math.ceil(raw / READY_EST_STEP_MIN) * READY_EST_STEP_MIN);
}
