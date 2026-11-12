"use client";

import { COPY } from "@/data/copy";
import { itemsBySource, type MenuItem } from "@/data/menu";
import { Money } from "@/components/ui/Money";
import { itemStatus } from "@/lib/menu-rules";
import { formatRupees } from "@/lib/format";
import { useCart } from "./CartProvider";
import { useMenuState } from "./menu-state";

const SHELVES = ["A", "B", "C"] as const;
const ITEMS = itemsBySource("vending");

function Cell({ item }: { item: MenuItem }) {
  const cart = useCart();
  const status = itemStatus(item, cart.menu);
  const left = cart.menu.stock[item.slot as string] ?? item.startStock ?? 0;
  const qty = cart.qtyOf(item.id);
  const out = status !== "ok";
  const stockText = left <= 0 ? COPY.student.menu.soldOut : `${left} left`;

  return (
    <button
      type="button"
      disabled={out}
      onClick={() => cart.add(item.id)}
      aria-label={
        out
          ? `${item.slot}, ${item.name}, ${formatRupees(item.price)}, ${stockText}`
          : `${item.slot}, ${item.name}, ${formatRupees(item.price)}, ${stockText}${qty > 0 ? `, ${qty} in cart` : ""}. Add one`
      }
      className={[
        "relative flex min-h-36 flex-col items-start justify-between gap-1 rounded-field p-3 text-left",
        "transition-transform duration-150 ease-out active:scale-[0.97] disabled:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
        out ? "bg-sand" : qty > 0 ? "bg-blush" : "bg-cream",
      ].join(" ")}
    >
      <span className="font-display text-secondary font-bold text-mocha">{item.slot}</span>
      <span className="line-clamp-3 text-secondary font-medium leading-snug text-espresso">{item.name}</span>
      <span className="flex w-full flex-col">
        <Money amount={item.price} className="font-display text-section font-bold text-maroon" />
        <span className={`text-caption font-medium ${left <= 0 ? "text-brick" : "text-mocha"}`}>{stockText}</span>
      </span>
      {qty > 0 ? (
        <span
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-pill bg-maroon font-display text-secondary font-bold text-cream"
          aria-hidden="true"
        >
          {qty}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The UC vending machine: a parchment panel with three shelves (A, B, C), each
 * cell showing slot, name, price and live stock. Tap a cell to add one. Stock is
 * refreshed every few seconds so two people never fight over the last can.
 */
export function VendingMachine() {
  useMenuState({ live: true });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-mocha">{COPY.student.menu.vendingLine}</p>
      <div className="flex flex-col gap-4 rounded-card bg-parchment p-3">
        {SHELVES.map((shelf) => (
          <section key={shelf} aria-label={`Shelf ${shelf}`} className="flex flex-col gap-2">
            <h2 className="px-1 font-display text-secondary font-bold text-maroon">Shelf {shelf}</h2>
            <div className="grid grid-cols-3 gap-2">
              {ITEMS.filter((item) => item.slot?.startsWith(shelf)).map((item) => (
                <Cell key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
