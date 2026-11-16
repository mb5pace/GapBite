"use client";

import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import type { BagSlip } from "@/lib/cafe";
import { getJson } from "@/lib/http";
import { useDesk } from "./DeskProvider";
import { KitchenSlip } from "./KitchenSlip";

/**
 * Show slip: the kitchen slip on screen, in the same layout it prints in (KitchenSlip). Print sends it to the 80 mm
 * printer through the browser's print dialog.
 */
export function BagSlipDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { data, error } = useSWR<BagSlip>(orderId ? `/api/cafe/orders/${orderId}` : null, getJson);
  const { printSlip } = useDesk();
  const copy = CAFE_COPY.slip;

  return (
    <Sheet open={orderId !== null} onClose={onClose} title={copy.title} placement="center">
      {error ? <p role="alert" className="text-body text-brick">{copy.notFound}</p> : null}
      {!data && !error ? <div className="h-96 rounded-card bg-sand" aria-busy="true" /> : null}
      {data ? (
        <div className="flex justify-center rounded-card bg-cream p-5">
          <KitchenSlip slip={data} />
        </div>
      ) : null}
      <div className="mt-6 flex gap-3">
        <PillButton size="desk" disabled={!data} onClick={() => orderId && printSlip(orderId)}>
          {copy.print}
        </PillButton>
        <PillButton size="desk" variant="secondary" onClick={onClose}>
          {copy.close}
        </PillButton>
      </div>
    </Sheet>
  );
}
