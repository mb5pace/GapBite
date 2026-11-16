"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { DeskSidebar } from "./DeskSidebar";
import { DeskTopBar } from "./DeskTopBar";
import { PrintSlipRoot } from "./PrintSlipRoot";
import { ScanCollectDialog } from "./ScanCollectDialog";
import { useQueue } from "./QueueProvider";
import { SourceFilterBar } from "./SourceFilterBar";

/**
 * The POS frame around every Cafe desk page (v1.0.0 Phase C1, laptop-first at 1280 px, usable at 1024): the sidebar on
 * the left, the top bar, the source filter on the Queue, and the page, which scrolls on its own so the bars stay put.
 */
export function CafeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { announcement, stale } = useQueue();
  return (
    <div className="flex h-dvh overflow-hidden">
      <DeskSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DeskTopBar />
        {pathname === "/cafe" ? <SourceFilterBar /> : null}
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-4" data-desk-main="">
          {children}
        </main>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {stale ? <p className="sr-only" role="alert">{CAFE_COPY.queueError}</p> : null}
      <ScanCollectDialog />
      <PrintSlipRoot />
    </div>
  );
}
