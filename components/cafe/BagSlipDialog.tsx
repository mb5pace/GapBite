"use client";

import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import type { BagSlip } from "@/lib/cafe";
import { QR_QUIET_MODULES } from "@/lib/config";
import { getJson } from "@/lib/http";
import { formatClock } from "@/lib/time";

/**
 * The bag slip: a big QR (it says QX:ORDER:<id>, which a runner scans), the order ID,
 * the source, the items, where it goes and when. Print uses the browser's print dialog;
 * the print stylesheet in globals.css prints only this dialog.
 */
export function BagSlipDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { data, error } = useSWR<BagSlip>(orderId ? `/api/cafe/orders/${orderId}` : null, getJson);
  const copy = CAFE_COPY.slip;
  const box = data ? data.qr.size + QR_QUIET_MODULES * 2 : 0;

  return (
    <Sheet open={orderId !== null} onClose={onClose} title={copy.title} placement="center" wide printArea>
      {error ? <p role="alert" className="text-body text-brick">{copy.notFound}</p> : null}
      {!data && !error ? <div className="h-60 rounded-card bg-sand" aria-busy="true" /> : null}
      {data ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <svg
              role="img"
              aria-label={copy.qrLabel}
              viewBox={`${-QR_QUIET_MODULES} ${-QR_QUIET_MODULES} ${box} ${box}`}
              shapeRendering="crispEdges"
              className="size-56 rounded-card bg-cream text-espresso"
            >
              <path d={data.qr.path} fill="currentColor" />
            </svg>
            <p className="no-print max-w-56 text-center text-secondary text-mocha">{copy.scanHint}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <p className="font-display text-greeting font-extrabold leading-none text-maroon">{data.id}</p>
            <p className="font-display text-section font-bold text-espresso">{data.sourceName}</p>
            <ul className="text-body text-espresso">
              {data.items.map((line) => (
                <li key={line.name} className="flex gap-2 py-0.5">
                  <span className="tabular-nums">{line.qty} ×</span>
                  <span>{line.name}</span>
                </li>
              ))}
            </ul>
            <p className="font-display text-title font-bold text-maroon">
              {data.mode === "pickup" ? copy.pickup : `${copy.destination} ${data.destination}`}
            </p>
            {data.promisedAt !== undefined ? (
              <p className="text-body tabular-nums text-espresso">
                {copy.promised} {formatClock(data.promisedAt)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="no-print mt-6 flex gap-3">
        <PillButton size="md" disabled={!data} onClick={() => window.print()}>
          {copy.print}
        </PillButton>
        <PillButton size="md" variant="secondary" onClick={onClose}>
          {copy.close}
        </PillButton>
      </div>
    </Sheet>
  );
}
