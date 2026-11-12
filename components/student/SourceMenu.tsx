"use client";

import { COPY } from "@/data/copy";
import { getSource, itemsBySource, type SourceId } from "@/data/menu";
import { Badge } from "@/components/ui/Badge";
import { MenuItemRow } from "./MenuItemRow";
import { useMenuState } from "./menu-state";

/** A cafe's menu: tagline, open state, and every item with its add control. */
export function SourceMenu({ sourceId }: { sourceId: SourceId }) {
  const source = getSource(sourceId);
  useMenuState(); // refreshes "Not today" and the 11:30 cutoff when you arrive

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-mocha">{source.tagline}</p>
        <Badge tone="olive">{COPY.student.home.open}</Badge>
      </div>
      <ul className="divide-y divide-sand">
        {itemsBySource(sourceId).map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
