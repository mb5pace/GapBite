"use client";

import { Plus } from "@phosphor-icons/react";
import type { MenuItem } from "@/data/menu";
import { IconButton } from "@/components/ui/IconButton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { itemStatus } from "@/lib/menu-rules";
import { useCart } from "./CartProvider";
import { itemStateText } from "./itemState";

/**
 * The add control for one item: a round + while it can be ordered, a stepper once it is in the cart, and a disabled +
 * (titled with the reason) when it cannot be added right now. The reason itself is shown by the row that uses this.
 * `outlined` is the menu card's version: an outlined "Add" pill (a - 1 + stepper once added) that overlaps the picture.
 */
export function ItemAddControl({ item, outlined = false }: { item: MenuItem; outlined?: boolean }) {
  const cart = useCart();
  const qty = cart.qtyOf(item.id);
  const ok = itemStatus(item, cart.menu) === "ok";
  const pill =
    "inline-flex h-11 min-w-20 items-center justify-center rounded-pill border-[1.5px] px-5 text-secondary font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

  if (!ok) {
    const reason = itemStateText(item, cart.menu) ?? undefined;
    return outlined ? (
      <button type="button" aria-label={`Add ${item.name}`} disabled aria-disabled="true" title={reason} className={`${pill} cursor-not-allowed border-taupe bg-cream text-taupe`}>
        Add
      </button>
    ) : (
      <IconButton label={`Add ${item.name}`} disabled aria-disabled="true" title={reason}>
        <Plus weight="bold" size={20} aria-hidden="true" />
      </IconButton>
    );
  }
  if (qty > 0) {
    return <QtyStepper name={item.name} qty={qty} onInc={() => cart.add(item.id)} onDec={() => cart.setQty(item.id, qty - 1)} />;
  }
  return outlined ? (
    <button
      type="button"
      aria-label={`Add ${item.name}`}
      onClick={() => cart.add(item.id)}
      className={`${pill} border-maroon bg-cream text-maroon transition-transform duration-150 ease-out active:scale-[0.97]`}
    >
      Add
    </button>
  ) : (
    <IconButton label={`Add ${item.name}`} onClick={() => cart.add(item.id)}>
      <Plus weight="bold" size={20} aria-hidden="true" />
    </IconButton>
  );
}
