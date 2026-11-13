"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { getJson } from "@/lib/http";
import { CLOCK_TICK_MS, POLL_MS } from "@/lib/config";
import type { MenuState } from "@/lib/menu-rules";

const MENU_URL = "/api/menu";

/**
 * What can be ordered right now. The student layout seeds the first value from
 * the server, so there is no loading state. `live` polls every few seconds (the
 * vending page); otherwise it refreshes when you arrive on a page or return to
 * the tab. `now` is the server's time at the last read, moved forward by the
 * time that has passed on this device, never by the device's own clock.
 */
export function useMenuState(options: { live?: boolean } = {}): MenuState {
  const { data } = useSWR<MenuState>(MENU_URL, getJson, {
    refreshInterval: options.live ? POLL_MS.student : 0,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const menu = data as MenuState;

  const [ticked, setTicked] = useState({ forNow: menu.now, elapsed: 0 });
  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setTicked({ forNow: menu.now, elapsed: performance.now() - start }), CLOCK_TICK_MS);
    return () => window.clearInterval(id);
  }, [menu.now]);
  const elapsed = ticked.forNow === menu.now ? ticked.elapsed : 0;

  return useMemo(() => ({ ...menu, now: menu.now + elapsed }), [menu, elapsed]);
}
