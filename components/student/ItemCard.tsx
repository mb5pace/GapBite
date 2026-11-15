"use client";

import { Timer } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import type { MenuItem } from "@/data/menu";
import { ItemTile } from "@/components/ui/ItemTile";
import { Money } from "@/components/ui/Money";
import { VegMark } from "@/components/ui/VegMark";
import { useCart } from "./CartProvider";
import { ItemAddControl } from "./ItemAddControl";
import { itemStateText } from "./itemState";

/**
 * One item on a cafe's menu page. Left: the veg mark, name, a one-line description, the price and a small prep badge.
 * Right: a 96 px picture (the item's photo if there is one, else its initials) with an outlined Add button overlapping its
 * bottom edge. In the Unavailable section the text is taupe, the reason sits in a chip and Add is off.
 */
export function ItemCard({ item, unavailable = false }: { item: MenuItem; unavailable?: boolean }) {
  const { menu } = useCart();
  const reason = unavailable ? itemStateText(item, menu) : null;
  const ink = unavailable ? "text-taupe" : "text-espresso";

  return (
    <li id={`item-${item.id}`} className="flex gap-4 py-4" style={{ scrollMarginTop: "var(--sticky-offset, 10rem)" }} data-unavailable={unavailable ? "" : undefined}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <VegMark className="mt-1" />
          <h3 className={`text-body font-semibold ${ink}`}>{item.name}</h3>
        </div>
        {item.description ? <p className={`line-clamp-1 text-secondary ${unavailable ? "text-taupe" : "text-mocha"}`}>{item.description}</p> : null}
        <Money amount={item.price} className={`font-display text-section font-bold tabular-nums ${unavailable ? "text-taupe" : "text-espresso"}`} />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-pill bg-sand px-2 py-0.5 text-caption font-medium text-mocha">
            <Timer weight="regular" size={14} aria-hidden="true" />
            {COPY.student.menu.prep(item.prepMin)}
          </span>
          {reason ? <span className="rounded-pill bg-sand px-3 py-0.5 text-caption font-semibold text-espresso">{reason}</span> : null}
        </div>
      </div>
      <div className="relative w-24 shrink-0 self-start pb-6">
        <ItemTile itemId={item.id} name={item.name} sourceId={item.sourceId} size="xl" />
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <ItemAddControl item={item} outlined />
        </div>
      </div>
    </li>
  );
}
