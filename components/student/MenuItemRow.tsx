"use client";

import { Plus } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import type { MenuItem } from "@/data/menu";
import { IconButton } from "@/components/ui/IconButton";
import { ItemTile } from "@/components/ui/ItemTile";
import { Money } from "@/components/ui/Money";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { itemStatus } from "@/lib/menu-rules";
import { useCart } from "./CartProvider";
import { itemStateText } from "./itemState";

export function prepLabel(prepMin: number): string {
  return prepMin <= 0 ? COPY.student.menu.readyNow : `~${prepMin} min`;
}

/** One menu item: tile, name, one-line description, price, prep time, and the add control for its state. */
export function MenuItemRow({ item }: { item: MenuItem }) {
  const cart = useCart();
  const status = itemStatus(item, cart.menu);
  const qty = cart.qtyOf(item.id);
  const state = itemStateText(item, cart.menu);
  // A time window gets its reason under the item (the row's right side is too small for it). A closed place says so once, in a sheet and a line above the list, not on every row.
  const reasonUnder = status === "window" ? state : null;

  return (
    <li id={`item-${item.id}`} className="flex scroll-mt-40 items-center gap-3 py-3">
      <ItemTile itemId={item.id} name={item.name} sourceId={item.sourceId} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className="text-body font-bold text-espresso">{item.name}</h3>
        {item.description ? <p className="text-secondary text-mocha">{item.description}</p> : null}
        <p className="mt-0.5 flex items-center gap-2 text-secondary text-mocha">
          <Money amount={item.price} className="font-display text-section font-bold text-maroon" />
          <span aria-hidden="true">·</span>
          <span>{item.slot ? `Slot ${item.slot}` : prepLabel(item.prepMin)}</span>
        </p>
        {reasonUnder ? <p className="mt-1 text-secondary font-medium text-espresso">{reasonUnder}</p> : null}
      </div>
      {status === "unavailable" || status === "sold-out" ? (
        <span className="shrink-0 rounded-pill bg-sand px-3 py-1.5 text-secondary font-medium text-mocha">{state}</span>
      ) : status === "closed" || status === "window" ? (
        <IconButton label={`Add ${item.name}`} disabled aria-disabled="true" title={state ?? undefined}>
          <Plus weight="bold" size={20} aria-hidden="true" />
        </IconButton>
      ) : qty > 0 ? (
        <QtyStepper
          name={item.name}
          qty={qty}
          onInc={() => cart.add(item.id)}
          onDec={() => cart.setQty(item.id, qty - 1)}
        />
      ) : (
        <IconButton label={`Add ${item.name}`} onClick={() => cart.add(item.id)}>
          <Plus weight="bold" size={20} aria-hidden="true" />
        </IconButton>
      )}
    </li>
  );
}
