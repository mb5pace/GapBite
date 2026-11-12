"use client";

import { ShoppingBag } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import { getItem, getSource } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemTile } from "@/components/ui/ItemTile";
import { Money } from "@/components/ui/Money";
import { PillButton, PillLink } from "@/components/ui/PillButton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { MORNING_CUTOFF } from "@/lib/config";
import { maxQtyFor, type MenuState } from "@/lib/menu-rules";
import type { LineIssue } from "@/lib/cart";
import { useCart } from "./CartProvider";
import { useMenuState } from "./menu-state";

function issueText(issue: LineIssue, left: number): string {
  switch (issue) {
    case "morning-closed":
      return `Morning only. Morning items stop at ${MORNING_CUTOFF.hour}:${String(MORNING_CUTOFF.minute).padStart(2, "0")}.`;
    case "unavailable":
      return "Not available today.";
    case "sold-out":
      return COPY.student.menu.soldOut + ".";
    case "over-stock":
      return `Only ${left} left.`;
    default:
      return "";
  }
}

/** The cart: items with steppers, subtotal, and a Checkout button that waits until every line can be ordered. */
export function CartView() {
  const cart = useCart();
  useMenuState(); // refreshes on arrival, so the issues below are current
  const lines = cart.cart.lines;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag weight="regular" size={40} />}
        action={
          <PillLink href="/home" variant="secondary">
            {COPY.student.cart.browse}
          </PillLink>
        }
      >
        {COPY.student.cart.empty}
      </EmptyState>
    );
  }

  const source = getSource(cart.cart.sourceId as NonNullable<typeof cart.cart.sourceId>);
  const blocked = Object.keys(cart.issues).length > 0;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h2 className="flex items-center gap-2 font-display text-section font-bold text-maroon">
        <SourceGlyph sourceId={source.id} size={20} />
        {source.name}
      </h2>

      {blocked ? <Banner tone="warning">{COPY.student.cart.fixFirst}</Banner> : null}

      <ul className="divide-y divide-sand">
        {lines.map((line) => {
          const item = getItem(line.itemId);
          if (!item) return null;
          const issue = cart.issues[line.itemId];
          const left = maxQtyFor(item, cart.menu as MenuState);
          return (
            <li key={line.itemId} className="flex flex-col gap-2 py-3">
              <div className="flex items-center gap-3">
                <ItemTile itemId={item.id} name={item.name} sourceId={item.sourceId} size="sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-body font-bold text-espresso">{item.name}</h3>
                  <p className="text-secondary text-mocha">
                    <Money amount={item.price} /> each
                  </p>
                </div>
                <Money amount={item.price * line.qty} className="font-display text-section font-bold text-maroon" />
              </div>
              {issue ? (
                <p className="flex items-center gap-2 text-secondary font-medium text-brick" role="alert">
                  {issueText(issue, left)}
                </p>
              ) : null}
              <div className="flex items-center justify-between">
                <PillButton variant="outline" size="md" onClick={() => cart.remove(line.itemId)}>
                  {COPY.student.cart.remove}
                </PillButton>
                {issue && issue !== "over-stock" ? null : (
                  <QtyStepper
                    name={item.name}
                    qty={line.qty}
                    onInc={() => cart.add(item.id)}
                    onDec={() => cart.setQty(item.id, line.qty - 1)}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <PillLink href={`/s/${source.id}`} variant="secondary" className="self-start">
        {COPY.student.cart.addMore}
      </PillLink>

      <div className="flex items-center justify-between border-t border-sand pt-4">
        <span className="text-body font-medium text-espresso">{COPY.student.cart.subtotal}</span>
        <Money amount={cart.subtotal} className="font-display text-title font-bold text-maroon" />
      </div>

      {blocked ? (
        <PillButton arrow full disabled>
          {COPY.student.cart.checkout}
        </PillButton>
      ) : (
        <PillLink href="/checkout" arrow full>
          {COPY.student.cart.checkout}
        </PillLink>
      )}
    </div>
  );
}
