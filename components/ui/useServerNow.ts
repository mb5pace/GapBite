"use client";

import { useEffect, useRef, useState } from "react";
import { UI_TICK_MS } from "@/lib/config";

/**
 * The server's clock, ticking once a second between polls. Give it the `now` from the latest reply: it
 * counts forward with the time that passes on this device (performance.now), never the device's wall
 * clock, and starts again from the next reply's `now`.
 */
export function useServerNow(serverNow: number): number {
  const sync = useRef({ serverAt: serverNow, deviceAt: 0 });
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    sync.current = { serverAt: serverNow, deviceAt: performance.now() };
  }, [serverNow]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const { serverAt, deviceAt } = sync.current;
      setNow(serverAt + (performance.now() - deviceAt));
    }, UI_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Between ticks, a newer reply wins at once.
  return Math.max(now, serverNow);
}
