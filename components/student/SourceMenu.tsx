"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { COPY } from "@/data/copy";
import { getSource, itemsBySource, type SourceId } from "@/data/menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillButton } from "@/components/ui/PillButton";
import { sourceInfoLine } from "@/lib/hours-rules";
import { isUnavailableItem } from "@/lib/menu-rules";
import { menuSections } from "@/lib/menu-sections";
import { filterItems } from "@/lib/search";
import { useCart } from "./CartProvider";
import { CategoryTabs } from "./CategoryTabs";
import { ItemCard } from "./ItemCard";
import { SearchField } from "./SearchField";
import { SOURCE_BG } from "./sourceStyle";
import { ClosedSource } from "./SourceStatus";
import { useMenuState } from "./menu-state";
import { useScrollToItem } from "./useScrollToItem";
import { useSourceStatus } from "./useSourceStatus";

/**
 * A cafe's menu page: a header in the cafe's colour with its hours and "Ready in about N min" (or why it is closed), a
 * search inside the cafe, sticky category tabs, and a section for each category. Anything switched off, outside its time
 * or sold out is gathered under "Unavailable" at the end, only when there is something to show.
 */
export function SourceMenu({ sourceId }: { sourceId: SourceId }) {
  const source = getSource(sourceId);
  const { menu } = useCart();
  const status = useSourceStatus();
  const [query, setQuery] = useState("");
  useMenuState(); // refreshes "Not today", hours and windows when you arrive
  useScrollToItem(); // a search result opens its item

  const sections = useMemo(
    () => menuSections(filterItems(itemsBySource(sourceId), query), (item) => isUnavailableItem(item, menu)),
    [sourceId, query, menu],
  );
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <section className={`rounded-tile p-4 text-cream ${SOURCE_BG[sourceId]}`} data-menu-header="">
        <p className="text-secondary">{source.tagline}</p>
        <p className="mt-1 text-body font-semibold" data-menu-info="">
          {sourceInfoLine(menu.hours, menu.service, sourceId, menu.now, status?.sources[sourceId]?.readyMin)}
        </p>
      </section>
      <ClosedSource sourceId={sourceId} line={false} />
      <SearchField value={query} onChange={setQuery} label={COPY.student.menu.searchIn(source.name)} placeholder={COPY.student.menu.searchIn(source.name)} />
      <CategoryTabs sections={sections.map(({ id, label }) => ({ id, label }))} />

      {sections.length === 0 && searching ? (
        <EmptyState
          icon={<MagnifyingGlass weight="regular" size={40} />}
          action={
            <PillButton variant="secondary" onClick={() => setQuery("")}>
              {COPY.student.home.searchClear}
            </PillButton>
          }
        >
          {COPY.student.menu.noMatch}
        </EmptyState>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.id}
          id={`section-${section.id}`}
          aria-labelledby={`heading-${section.id}`}
          style={{ scrollMarginTop: "var(--sticky-offset, 10rem)" }}
          data-unavailable-section={section.unavailable ? "" : undefined}
        >
          <h2 id={`heading-${section.id}`} className="font-display text-section font-bold text-maroon">
            {section.label}
          </h2>
          <ul className="divide-y divide-sand">
            {section.items.map((item) => (
              <ItemCard key={item.id} item={item} unavailable={section.unavailable} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
