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
 */
export function ItemAddControl({ item }: { item: MenuItem }) {
  const cart = useCart();
  const qty = cart.qtyOf(item.id);
  const ok = itemStatus(item, cart.menu) === "ok";

  if (!ok) {
    return (
      <IconButton label={`Add ${item.name}`} disabled aria-disabled="true" title={itemStateText(item, cart.menu) ?? undefined}>
        <Plus weight="bold" size={20} aria-hidden="true" />
      </IconButton>
    );
  }
  if (qty > 0) {
    return <QtyStepper name={item.name} qty={qty} onInc={() => cart.add(item.id)} onDec={() => cart.setQty(item.id, qty - 1)} />;
  }
  return (
    <IconButton label={`Add ${item.name}`} onClick={() => cart.add(item.id)}>
      <Plus weight="bold" size={20} aria-hidden="true" />
    </IconButton>
  );
}
