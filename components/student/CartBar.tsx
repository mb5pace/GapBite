"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import { formatRupees } from "@/lib/format";
import { useCart } from "./CartProvider";

const HIDDEN_ON = ["/cart", "/checkout"];

/** True when the sticky cart bar is showing, so pages can leave room for it. */
export function useCartBarVisible(): boolean {
  const { count } = useCart();
  const pathname = usePathname();
  return count > 0 && !HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Empty space at the end of a page, so the sticky cart bar never covers the last row. */
export function CartBarSpacer() {
  return <div aria-hidden="true" className={useCartBarVisible() ? "h-20" : ""} />;
}

/** "3 items · ₹210 · View cart", above the bottom bar, whenever the cart has something in it. */
export function CartBar() {
  const { count, subtotal } = useCart();
  const visible = useCartBarVisible();
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30">
      <div className="mx-auto w-full max-w-[430px] px-5">
        <Link
          href="/cart"
          className="pointer-events-auto flex h-14 items-center justify-between rounded-pill bg-maroon pl-5 pr-2 font-display text-section font-bold text-cream transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          <span className="tabular-nums">
            {count} {count === 1 ? "item" : "items"} · {formatRupees(subtotal)}
          </span>
          <span className="flex items-center gap-2">
            {COPY.student.cart.viewCart}
            <span className="flex size-10 items-center justify-center rounded-pill bg-cream text-maroon" aria-hidden="true">
              <ArrowRight weight="bold" size={20} />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
