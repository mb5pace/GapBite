import { CAFE_COPY } from "@/data/cafe-copy";
import { QrCode } from "@/components/ui/QrCode";
import type { BagSlip } from "@/lib/cafe";
import { formatClock } from "@/lib/time";

/**
 * The kitchen slip (v1.0.0 Phase C1): the same layout in the Show slip dialog and on 80 mm thermal paper (72 mm
 * printable, one colour, no backgrounds; see the print rules in globals.css). "QuickX · UC", the order ID large, the
 * source, when it was placed, where it goes (or PICKUP), the items with large quantities, when it is promised, and for a
 * delivery the bag QR a runner scans. It never shows the buyer's code: the slip data does not carry it.
 */
export function KitchenSlip({ slip }: { slip: BagSlip }) {
  const copy = CAFE_COPY.slip;
  return (
    <div className="flex w-full max-w-[288px] flex-col gap-3 text-espresso" data-slip={slip.id}>
      <p className="text-secondary font-bold">{copy.brand}</p>
      <div>
        <p className="font-display text-greeting font-extrabold leading-tight tabular-nums">{slip.id}</p>
        <p className="font-display text-section font-bold">{slip.sourceName}</p>
        <p className="text-body tabular-nums">{copy.placed(formatClock(slip.placedAt))}</p>
      </div>
      <div>
        {slip.building ? (
          <>
            <p className="text-secondary font-semibold">{copy.destination}</p>
            <p className="font-display text-title font-extrabold leading-tight">
              {slip.building.short} · {slip.building.dropPoint}
            </p>
          </>
        ) : (
          <p className="font-display text-title font-extrabold">{copy.pickup}</p>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-dotted divide-espresso">
        {slip.items.map((line) => (
          <li key={line.name} className="flex items-baseline gap-3 py-1">
            <span className="shrink-0 font-display text-title font-extrabold tabular-nums">{line.qty} ×</span>
            <span className="text-section font-semibold">{line.name}</span>
          </li>
        ))}
      </ul>
      <div className="text-body tabular-nums">
        <p>
          {copy.when} {slip.when === "asap" ? CAFE_COPY.ticket.asap : CAFE_COPY.card.breakAt(slip.when)}
        </p>
        {slip.promisedAt !== undefined ? (
          <p className="font-bold">
            {copy.promised} {formatClock(slip.promisedAt)}
          </p>
        ) : null}
      </div>
      {slip.qr ? (
        <div className="flex flex-col items-center gap-1">
          <QrCode qr={slip.qr} label={copy.qrLabel} className="size-40" />
          <p className="text-center text-secondary">{copy.runnersScan}</p>
        </div>
      ) : null}
    </div>
  );
}
