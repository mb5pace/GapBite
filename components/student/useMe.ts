"use client";

import useSWR from "swr";
import { POLL_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import type { MeData } from "@/lib/me";

/**
 * Your name, wallet balance and the two tab-bar dots, refreshed every few
 * seconds. The student layout seeds the first value from the server, so the
 * header never flashes empty. A top-up or an Admin adjustment shows up here by itself.
 */
export function useMe(): MeData {
  const { data } = useSWR<MeData>("/api/me", getJson, {
    refreshInterval: POLL_MS.student,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  return data as MeData;
}
