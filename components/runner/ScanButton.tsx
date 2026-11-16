"use client";

import { Scan } from "@phosphor-icons/react";
import { RUN_COPY } from "@/data/order-copy";
import { IconButton } from "@/components/ui/IconButton";
import { useRunner } from "./RunnerProvider";
import { useReadyBags } from "./useReadyBags";

/**
 * The Scan button that sits in every student header. It opens the runner sheet. A small count on it (sun, espresso
 * digits) says how many delivery bags are ready and waiting for a runner; it is hidden at 0. `fixedCount` is only for
 * the /kit gallery (an admin page): it shows that number and asks the server nothing.
 */
export function ScanButton({ fixedCount }: { fixedCount?: number }) {
  const { openScan } = useRunner();
  const live = useReadyBags(fixedCount === undefined);
  const count = fixedCount ?? live.length;
  return (
    <span className="relative inline-flex">
      <IconButton label={count > 0 ? RUN_COPY.scanLabelWithCount(count) : RUN_COPY.scanLabel} onClick={openScan}>
        <Scan weight="regular" size={24} aria-hidden="true" />
      </IconButton>
      {count > 0 ? (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-sun px-1 text-caption font-bold tabular-nums text-espresso"
          aria-hidden="true"
          data-ready-count={count}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}
