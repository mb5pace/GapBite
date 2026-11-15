"use client";

import { COPY } from "@/data/copy";
import { getSource, itemsBySource, type SourceId } from "@/data/menu";
import { itemStatus } from "@/lib/menu-rules";
import { MenuItemRow } from "./MenuItemRow";
import { ClosedSource, SourceBadge } from "./SourceStatus";
import { useCart } from "./CartProvider";
import { useMenuState } from "./menu-state";
import { useScrollToItem } from "./useScrollToItem";

/**
 * A cafe's menu: tagline, what the place is doing right now, and every item with its add control. Items outside their
 * own time window (breakfast after 11:00) are listed at the bottom under "Unavailable now", each with its reason.
 */
export function SourceMenu({ sourceId }: { sourceId: SourceId }) {
  const source = getSource(sourceId);
  const { menu } = useCart();
  useMenuState(); // refreshes "Not today", hours and windows when you arrive
  useScrollToItem(); // a search result opens its item

  const items = itemsBySource(sourceId);
  const outsideWindow = items.filter((item) => itemStatus(item, menu) === "window");
  const rest = items.filter((item) => itemStatus(item, menu) !== "window");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-body text-mocha">{source.tagline}</p>
        <SourceBadge sourceId={sourceId} />
      </div>
      <ClosedSource sourceId={sourceId} />
      <ul className="divide-y divide-sand">
        {rest.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
      {outsideWindow.length > 0 ? (
        <section aria-labelledby="unavailable-now" className="mt-4" data-unavailable-now="">
          <h2 id="unavailable-now" className="font-display text-section font-bold text-maroon">
            {COPY.student.closed.unavailableNow}
          </h2>
          <ul className="divide-y divide-sand">
            {outsideWindow.map((item) => (
              <MenuItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
