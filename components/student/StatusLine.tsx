"use client";

import type { SourceId } from "@/data/menu";
import { sourceLabel } from "@/lib/hours-rules";
import { statusLineText } from "@/lib/ready-estimate";
import { useCart } from "./CartProvider";
import { useSourceStatus } from "./useSourceStatus";

const DOT = { olive: "bg-olive", amber: "bg-amber", brick: "bg-brick", taupe: "bg-taupe" } as const;

/**
 * One status line for a place, with a coloured dot: "Open now · Ready in about 10 min" (olive), "Opens at 12:00"
 * (amber), "Closed today" or "Paused" (brick). The words follow the live hours, so they never disagree with the Add
 * buttons; the estimate comes from /api/status.
 */
export function StatusLine({ sourceId, className = "" }: { sourceId: SourceId; className?: string }) {
  const { menu } = useCart();
  const status = useSourceStatus();
  const label = sourceLabel(menu.hours, menu.service, sourceId, menu.now);
  return (
    <span className={`flex items-start gap-2 text-secondary text-espresso ${className}`} data-source-status={sourceId}>
      <span className="flex h-5 shrink-0 items-center" aria-hidden="true">
        <span className={`size-2 rounded-pill ${DOT[label.tone]}`} />
      </span>
      <span>{statusLineText(label, status?.sources[sourceId]?.readyMin)}</span>
    </span>
  );
}
