"use client";

import { Clock } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import { getBuilding } from "@/data/locations";
import { slowestPrepMin } from "@/data/menu";
import { DEFAULT_PREP_MIN } from "@/lib/config";
import { nextBreak } from "@/lib/menu-rules";
import { formatClock } from "@/lib/time";
import { useCart } from "./CartProvider";
import { useMe } from "./useMe";

/**
 * "Next break 11:50 · order by 11:38 for GICT". The order-by time is the break
 * minus prep + walk + a 5-minute buffer. Prep is the slowest item of the source
 * in your cart, or 5 minutes if the cart is empty. The building is the default
 * one from Account › Preferences (GICT until you save one). With pickup as the default way to get it there is
 * no walk and the strip says "for pickup". Time is the server's, not the phone's.
 */
export function NextBreakStrip() {
  const { cart, menu } = useCart();
  const { prefs } = useMe();
  const building = getBuilding(prefs.defaultBuilding);
  const pickup = prefs.defaultMode === "pickup";
  const prep = cart.sourceId ? slowestPrepMin(cart.sourceId) : DEFAULT_PREP_MIN;
  const next = nextBreak(menu.now, prep, pickup ? null : building.id);

  return (
    <div className="flex items-center gap-3 rounded-card bg-parchment p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        <Clock weight="regular" size={22} />
      </span>
      <p className="text-secondary text-espresso">
        {next ? (
          <>
            <span className="font-bold">Next break {next.slot}</span>
            <span aria-hidden="true"> · </span>
            <span> order by <span className="tabular-nums">{formatClock(next.orderByMs)}</span> for {pickup ? COPY.student.home.forPickup : building.short}</span>
          </>
        ) : (
          COPY.student.home.noMoreBreaks
        )}
      </p>
    </div>
  );
}
