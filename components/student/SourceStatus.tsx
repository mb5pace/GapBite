"use client";

import { useState } from "react";
import { COPY } from "@/data/copy";
import type { SourceId } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { Badge } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { closedInfo, sourceLabel } from "@/lib/hours-rules";
import { useCart } from "./CartProvider";

/** The badge on a source page: what the place is doing right now, from the live hours. */
export function SourceBadge({ sourceId }: { sourceId: SourceId }) {
  const { menu } = useCart();
  const label = sourceLabel(menu.hours, menu.service, sourceId, menu.now);
  return (
    <Badge tone={label.tone} wrap>
      {label.text}
    </Badge>
  );
}

/**
 * When a place is closed or paused: a small sheet on arrival with the reason and when it opens, and the same words in
 * a line above the menu once the sheet is closed. The menu can still be browsed; the Add buttons are off. Nothing shows
 * while the place is taking orders, and nothing while the whole service is off (the banner at the top says that).
 * If the place opens while the sheet is up, the sheet goes away on the next refresh.
 */
export function ClosedSource({ sourceId }: { sourceId: SourceId }) {
  const { menu } = useCart();
  const info = closedInfo(menu.hours, menu.service, sourceId, menu.now);
  const [dismissed, setDismissed] = useState(false);
  if (!info) return null;
  const paused = menu.hours.sources[sourceId].paused;

  return (
    <>
      <div data-closed-line="">
        <Banner>
          {info.reason} {paused ? COPY.student.closed.pausedLineAbove : COPY.student.closed.lineAbove}
        </Banner>
      </div>
      <Sheet open={!dismissed} onClose={() => setDismissed(true)} title={info.title}>
        <p className="text-body text-espresso">{info.reason}</p>
        {info.opens ? <p className="mt-2 text-body font-medium text-espresso">{info.opens}</p> : null}
        <p className="mt-2 text-secondary text-mocha">{COPY.student.closed.browseHint}</p>
        <div className="mt-6">
          <PillButton full onClick={() => setDismissed(true)}>
            {COPY.student.closed.browse}
          </PillButton>
        </div>
      </Sheet>
    </>
  );
}
