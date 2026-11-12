"use client";

import { useEffect, useState } from "react";
import { UI_TICK_MS } from "@/lib/config";
import { formatMsLeft } from "@/lib/time";

/**
 * Counts down from a time-left the server measured. Only the time that passes
 * on this device is used (performance.now), never the device's wall clock, so a
 * wrong phone clock cannot change the answer. A new `msLeft` re-syncs it.
 */
export function useCountdown(msLeft: number): number {
  const [remaining, setRemaining] = useState(msLeft);

  useEffect(() => {
    const deadline = performance.now() + msLeft;
    const tick = () => setRemaining(Math.max(0, deadline - performance.now()));
    const id = window.setInterval(tick, UI_TICK_MS);
    return () => window.clearInterval(id);
  }, [msLeft]);

  return remaining;
}

export function Countdown({ msLeft, className = "" }: { msLeft: number; className?: string }) {
  const remaining = useCountdown(msLeft);
  return <span className={`tabular-nums ${className}`}>{formatMsLeft(remaining)}</span>;
}
