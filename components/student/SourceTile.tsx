"use client";

import { Coffee, CookingPot, Hamburger, Leaf, Storefront, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { Source, SourceId } from "@/data/menu";
import { StatusLine } from "./StatusLine";

/** Each place's own icon and its source colour (UI_UX_BIBLE.md "Source colours"). Full class names, so Tailwind sees them. */
const ICON: Record<SourceId, Icon> = {
  "truly-indian": CookingPot,
  "global-bistro": Hamburger,
  "cafe-delice": Coffee,
  "greens-grains": Leaf,
  vending: Storefront,
};
const TILE_BG: Record<SourceId, string> = {
  "truly-indian": "bg-src-truly-indian",
  "global-bistro": "bg-src-global-bistro",
  "cafe-delice": "bg-src-cafe-delice",
  "greens-grains": "bg-src-greens-grains",
  vending: "bg-src-vending",
};

/**
 * A place on Home: a square tile in its source colour with a small icon and its name set in cream as a wordmark
 * (our own lettering, not anyone's logo), then the name and one status line underneath. Vending spans the full width
 * at the bottom, so its tile is twice as wide as it is tall.
 */
export function SourceTile({ source, wide = false }: { source: Source; wide?: boolean }) {
  const PlaceIcon = ICON[source.id];
  return (
    <Link
      href={`/s/${source.id}`}
      className={`flex flex-col gap-2 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${wide ? "col-span-2" : ""}`}
    >
      <span className={`flex flex-col justify-between rounded-tile p-4 text-cream ${wide ? "aspect-[2/1]" : "aspect-square"} ${TILE_BG[source.id]}`} aria-hidden="true">
        <PlaceIcon weight="regular" size={wide ? 36 : 30} />
        <span className="font-display text-title font-extrabold leading-none">{source.name}</span>
      </span>
      <span className="flex flex-col gap-1 px-1">
        <span className="text-body font-semibold text-espresso">{source.name}</span>
        <StatusLine sourceId={source.id} />
      </span>
    </Link>
  );
}
