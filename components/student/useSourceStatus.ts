"use client";

import useSWR from "swr";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import type { SourceStatusReply } from "@/lib/source-status";

/**
 * Each place's "Ready in about N min", from /api/status: every 15 seconds, and not at all while the tab is hidden
 * (it catches up the moment the student comes back). Undefined until the first answer; the status words themselves come
 * from the live hours, so a tile is never blank.
 */
export function useSourceStatus(): SourceStatusReply | undefined {
  const { data } = useSWR<SourceStatusReply>("/api/status", getJson, {
    refreshInterval: POLL_MS.status,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  return data;
}
