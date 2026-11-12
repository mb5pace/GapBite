"use client";

import Image from "next/image";
import { useState } from "react";
import type { SourceId } from "@/data/menu";
import { initialsOf } from "@/lib/format";
import { hasPhoto } from "@/lib/photos";
import { SourceGlyph } from "./SourceGlyph";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { box: string; text: string; glyph: number; corner: string }> = {
  sm: { box: "size-14", text: "text-section", glyph: 12, corner: "bottom-1 right-1" },
  md: { box: "size-20", text: "text-title", glyph: 16, corner: "bottom-2 right-2" },
  lg: { box: "size-28", text: "text-greeting", glyph: 16, corner: "bottom-2 right-2" },
};

/**
 * Item picture. Until the team adds real photos, every item shows its initials
 * ("CC" for Cold Coffee) on a `sand` square with a tiny source glyph in the
 * corner. If `public/food/<itemId>.jpg` existed at build time (lib/photos.ts) it
 * covers the tile; otherwise nothing is requested and the tile stays. No
 * AI-generated images (CLAUDE.md rule 10).
 *
 * `fill` makes the tile take the size and shape of its parent, for the arch card.
 */
export function ItemTile({
  itemId,
  name,
  sourceId,
  size = "md",
  fill = false,
}: {
  itemId?: string;
  name: string;
  sourceId: SourceId;
  size?: Size;
  fill?: boolean;
}) {
  const listed = itemId !== undefined && hasPhoto(itemId);
  const [photo, setPhoto] = useState<"pending" | "loaded" | "missing">(listed ? "pending" : "missing");
  const dims = fill ? "h-full w-full" : `${SIZE[size].box} rounded-tile`;

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-sand ${dims}`}>
      <span
        className={`font-display font-extrabold text-maroon ${fill ? "text-greeting" : SIZE[size].text}`}
        aria-hidden="true"
      >
        {initialsOf(name)}
      </span>
      {photo !== "loaded" ? (
        <SourceGlyph
          sourceId={sourceId}
          size={fill ? SIZE.lg.glyph : SIZE[size].glyph}
          className={`absolute text-mocha ${fill ? SIZE.lg.corner : SIZE[size].corner}`}
        />
      ) : null}
      {listed && photo !== "missing" ? (
        <Image
          src={`/food/${itemId}.jpg`}
          alt={name}
          fill
          unoptimized
          sizes="112px"
          className="object-cover"
          onLoad={() => setPhoto("loaded")}
          onError={() => setPhoto("missing")}
        />
      ) : null}
    </div>
  );
}
