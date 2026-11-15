"use client";

import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import type { MenuItem } from "@/data/menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemTile } from "@/components/ui/ItemTile";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import type { SearchGroup } from "@/lib/search";
import { useCart } from "./CartProvider";
import { ItemAddControl } from "./ItemAddControl";
import { itemStateText } from "./itemState";

/** One search hit: tap the name to open that item on its cafe's menu; the + adds it from here. A closed or unavailable item says why. */
function ResultRow({ item }: { item: MenuItem }) {
  const { menu } = useCart();
  const reason = itemStateText(item, menu);
  return (
    <li className="flex items-center gap-3 py-3" data-result={item.id}>
      <Link
        href={`/s/${item.sourceId}?item=${item.id}`}
        aria-label={COPY.student.home.openItem(item.name)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        <ItemTile itemId={item.id} name={item.name} sourceId={item.sourceId} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-bold text-espresso">{item.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-secondary text-mocha">
            <Money amount={item.price} className="font-display text-section font-bold text-maroon" />
            <span aria-hidden="true">·</span>
            <span>{item.category}</span>
          </span>
          {reason ? <span className="mt-1 block text-secondary font-medium text-espresso">{reason}</span> : null}
        </span>
      </Link>
      <ItemAddControl item={item} />
    </li>
  );
}

/** The Home search results, grouped by cafe, or the empty state with a way to clear the search. */
export function SearchResults({ groups, onClear }: { groups: SearchGroup[]; onClear: () => void }) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<MagnifyingGlass weight="regular" size={40} />}
        action={
          <PillButton variant="secondary" onClick={onClear}>
            {COPY.student.home.searchClear}
          </PillButton>
        }
      >
        {COPY.student.home.noResults}
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      {groups.map(({ source, items }) => (
        <section key={source.id} aria-labelledby={`results-${source.id}`}>
          <h2 id={`results-${source.id}`} className="flex items-center gap-2 font-display text-section font-bold text-maroon">
            <SourceGlyph sourceId={source.id} size={20} />
            {source.name}
          </h2>
          <ul className="divide-y divide-sand">
            {items.map((item) => (
              <ResultRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
