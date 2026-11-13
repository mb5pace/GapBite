"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { COPY } from "@/data/copy";
import { MENU_ITEMS, SOURCES } from "@/data/menu";
import { ArchCard } from "@/components/ui/ArchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemTile } from "@/components/ui/ItemTile";
import { PillButton } from "@/components/ui/PillButton";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { itemStatus } from "@/lib/menu-rules";
import { searchMenu } from "@/lib/search";
import { useCart } from "./CartProvider";
import { MenuItemRow } from "./MenuItemRow";
import { ActiveOrderStrip } from "./ActiveOrderStrip";
import { NextBreakStrip } from "./NextBreakStrip";
import { SearchField } from "./SearchField";
import { SourceTile } from "./SourceTile";
import { WalletBanner } from "./WalletBanner";

const STATUS_TEXT = {
  "morning-closed": COPY.student.menu.morningOnly,
  unavailable: COPY.student.menu.notToday,
  "sold-out": COPY.student.menu.soldOut,
} as const;

const POPULAR = MENU_ITEMS.filter((item) => item.tags.includes("bestseller"));

/** Home: search, the five sources, the next break, and what is popular at UC. */
export function HomeView() {
  const cart = useCart();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => searchMenu(query), [query]);
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-6 pt-2">
      <WalletBanner />
      <ActiveOrderStrip />
      <SearchField value={query} onChange={setQuery} />

      {searching ? (
        groups.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass weight="regular" size={40} />}
            action={
              <PillButton variant="secondary" onClick={() => setQuery("")}>
                {COPY.student.home.searchClear}
              </PillButton>
            }
          >
            {COPY.student.home.noResults}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-6" aria-live="polite">
            {groups.map(({ source, items }) => (
              <section key={source.id} aria-labelledby={`results-${source.id}`}>
                <h2
                  id={`results-${source.id}`}
                  className="flex items-center gap-2 font-display text-section font-bold text-maroon"
                >
                  <SourceGlyph sourceId={source.id} size={20} />
                  {source.name}
                </h2>
                <ul className="divide-y divide-sand">
                  {items.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <>
          <section aria-labelledby="order-from">
            <h2 id="order-from" className="mb-3 font-display text-section font-bold text-maroon">
              {COPY.student.home.orderFrom}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SOURCES.map((source) => (
                <SourceTile key={source.id} source={source} wide={source.kind === "vending"} />
              ))}
            </div>
          </section>

          <NextBreakStrip />

          <section aria-labelledby="popular">
            <h2 id="popular" className="mb-3 font-display text-section font-bold text-maroon">
              {COPY.student.home.popular}
            </h2>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
              {POPULAR.map((item) => {
                const status = itemStatus(item, cart.menu);
                return (
                  <ArchCard
                    key={item.id}
                    title={item.name}
                    tag={COPY.student.home.bestseller}
                    price={item.price}
                    media={<ItemTile fill itemId={item.id} name={item.name} sourceId={item.sourceId} />}
                    status={status === "ok" ? undefined : STATUS_TEXT[status]}
                    inCart={cart.qtyOf(item.id)}
                    onAdd={() => cart.add(item.id)}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
