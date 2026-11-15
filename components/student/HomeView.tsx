"use client";

import { useMemo, useState } from "react";
import { COPY } from "@/data/copy";
import { MENU_ITEMS, SOURCES } from "@/data/menu";
import { ArchCard } from "@/components/ui/ArchCard";
import { ItemTile } from "@/components/ui/ItemTile";
import { searchMenu } from "@/lib/search";
import { greetingFor } from "@/lib/time";
import { useCart } from "./CartProvider";
import { ActiveOrderStrip } from "./ActiveOrderStrip";
import { ClosedNotice } from "./ClosedNotice";
import { NextBreakStrip } from "./NextBreakStrip";
import { itemStateText } from "./itemState";
import { SearchField } from "./SearchField";
import { SearchResults } from "./SearchResults";
import { ServiceBanner } from "./ServiceBanner";
import { SourceTile } from "./SourceTile";
import { useMe } from "./useMe";
import { WalletBanner } from "./WalletBanner";

const POPULAR = MENU_ITEMS.filter((item) => item.tags.includes("bestseller"));

/** Home: the greeting and search, what needs attention, the five places, the next break, and what is popular at UC. */
export function HomeView() {
  const cart = useCart();
  const me = useMe();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => searchMenu(query), [query]);
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="flex items-center gap-2 font-display text-title font-bold leading-tight text-maroon">
            <span className="line-clamp-2 break-words">{COPY.student.home.greeting(greetingFor(cart.menu.now), me.user.name)}</span>
            {me.user.role === "staff" ? (
              <span className="shrink-0 rounded-pill bg-blush px-2 py-0.5 font-sans text-caption font-bold text-maroon">{COPY.student.staffBadge}</span>
            ) : null}
          </h1>
        </header>
        <SearchField value={query} onChange={setQuery} />
        <ServiceBanner placement="home" />
        <WalletBanner />
        <ClosedNotice />
      </div>
      <ActiveOrderStrip />

      {searching ? (
        <SearchResults groups={groups} onClear={() => setQuery("")} />
      ) : (
        <>
          <section aria-labelledby="cafes">
            <h2 id="cafes" className="font-display text-section font-bold text-maroon">
              {COPY.student.home.cafesTitle}
            </h2>
            <p className="mb-4 text-secondary text-mocha">{COPY.student.home.cafesSubtitle}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
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
                const state = itemStateText(item, cart.menu);
                return (
                  <ArchCard
                    key={item.id}
                    title={item.name}
                    tag={COPY.student.home.bestseller}
                    price={item.price}
                    media={<ItemTile fill itemId={item.id} name={item.name} sourceId={item.sourceId} />}
                    status={state ?? undefined}
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
