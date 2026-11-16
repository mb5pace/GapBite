"use client";

import useSWR from "swr";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import type { ReadyBag } from "@/lib/ready-bags";

/** The "Ready to deliver" list, every 10 seconds, and not at all while the tab is hidden. `enabled: false` asks nothing. */
export function useReadyBags(enabled = true): ReadyBag[] {
  const { data } = useSWR<{ bags: ReadyBag[]; now: number }>(enabled ? "/api/runs/ready" : null, getJson, {
    refreshInterval: POLL_MS.ready,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  return data?.bags ?? [];
}
