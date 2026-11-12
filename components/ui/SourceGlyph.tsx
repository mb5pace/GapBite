"use client";

import { Coffee, CookingPot, Cookie, Hamburger, Leaf } from "@phosphor-icons/react";
import type { SourceId } from "@/data/menu";

const GLYPH = {
  "truly-indian": CookingPot,
  "global-bistro": Hamburger,
  "cafe-delice": Coffee,
  "greens-grains": Leaf,
  vending: Cookie,
} as const;

/** A tiny line icon for each of the five sources. Decorative: the source name is always written next to it. */
export function SourceGlyph({ sourceId, size = 16, className = "" }: { sourceId: SourceId; size?: number; className?: string }) {
  const Icon = GLYPH[sourceId];
  return (
    <span className={className} aria-hidden="true">
      <Icon weight="regular" size={size} />
    </span>
  );
}
