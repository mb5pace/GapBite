"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TEMP_COUNTDOWN_CHIP_MIN } from "@/lib/config";
import { useCountdown } from "@/components/ui/Countdown";
import { formatMsLeft } from "@/lib/time";

/**
 * "2:41 left". Shown only for temp-code sessions, and only in their last
 * TEMP_COUNTDOWN_CHIP_MIN minutes. At zero the session is over: back to the gate.
 */
export function SessionChip({ msLeft }: { msLeft: number }) {
  const router = useRouter();
  const remaining = useCountdown(msLeft);

  useEffect(() => {
    if (remaining <= 0) router.replace("/?ended=1");
  }, [remaining, router]);

  if (remaining > TEMP_COUNTDOWN_CHIP_MIN * 60_000) return null;

  return (
    <div className="mt-2 flex justify-end">
      <span
        role="timer"
        className="inline-flex h-9 items-center gap-2 rounded-pill bg-sand px-3 text-secondary font-medium text-espresso tabular-nums"
      >
        <span className="size-2 rounded-pill bg-amber" aria-hidden="true" />
        {formatMsLeft(remaining)} left
      </span>
    </div>
  );
}
