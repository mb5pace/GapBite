"use client";

import { Plus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { IconButton } from "./IconButton";
import { Money } from "./Money";

/**
 * The arch-topped item card of "Popular at UC" (UI_UX_BIBLE.md section 3.3).
 * Fixed 160 px wide so the top corners can be exactly half the width (80 px),
 * which is what makes the arch. Pass an <ItemTile fill /> as `media`.
 */
export function ArchCard({
  media,
  title,
  tag,
  price,
  onAdd,
  status,
  inCart = 0,
}: {
  media: ReactNode;
  title: string;
  /** For example "Bestseller". */
  tag?: string;
  /** Integer rupees. */
  price: number;
  /** Shows the round "+" button when given. */
  onAdd?: () => void;
  /** When the item cannot be ordered right now ("Not today", "Morning only", "Sold out"), shown instead of the "+". */
  status?: string;
  /** Units of this item already in the cart. */
  inCart?: number;
}) {
  return (
    <article className="flex w-40 shrink-0 flex-col rounded-t-[80px] rounded-b-card bg-parchment pb-3">
      <div className="mx-3 mt-3 aspect-square overflow-hidden rounded-t-[68px] rounded-b-tile">{media}</div>
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3">
        {tag ? (
          <span className="w-fit rounded-pill bg-blush px-2 py-0.5 text-caption font-bold text-maroon">{tag}</span>
        ) : null}
        <h3 className="line-clamp-2 min-h-10 text-secondary font-bold text-espresso">{title}</h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="flex flex-col">
            <Money amount={price} className="font-display text-section font-bold text-maroon" />
            {inCart > 0 ? <span className="text-caption text-mocha">{inCart} in cart</span> : null}
          </span>
          {status ? (
            <span className="rounded-pill bg-sand px-3 py-1 text-caption font-bold text-mocha">{status}</span>
          ) : onAdd ? (
            <IconButton label={`Add ${title}`} onClick={onAdd}>
              <Plus weight="bold" size={20} aria-hidden="true" />
            </IconButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}
