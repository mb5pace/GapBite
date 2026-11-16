"use client";

import { useState } from "react";
import { RUN_COPY } from "@/data/order-copy";
import { Banner } from "@/components/ui/Banner";
import { useMe } from "@/components/student/useMe";
import { WALLET_MIN_TO_USE } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import type { ReadyBag } from "@/lib/ready-bags";
import { useReadyBags } from "./useReadyBags";

/**
 * "Ready to deliver (N)" under the camera: bags waiting for a runner, grouped by building (near zone first, oldest bag
 * first). Read only: a row only says where to go ("Scan this bag at the Cafe Delice counter to take it."). There is
 * nothing to accept here; a bag is taken by scanning it.
 */
export function ReadyList() {
  const bags = useReadyBags();
  const me = useMe();
  const [open, setOpen] = useState<string | null>(null);
  const lowBalance = me.user.role !== "staff" && me.balance < WALLET_MIN_TO_USE;

  const groups: { buildingId: string; title: string; bags: ReadyBag[] }[] = [];
  for (const bag of bags) {
    let group = groups.find((g) => g.buildingId === bag.buildingId);
    if (!group) {
      group = { buildingId: bag.buildingId, title: `${bag.buildingShort} · ${bag.dropPoint}`, bags: [] };
      groups.push(group);
    }
    group.bags.push(bag);
  }

  return (
    <section aria-labelledby="ready-title" className="flex flex-col gap-3" data-ready-list="">
      <h3 id="ready-title" className="font-display text-section font-bold text-maroon">
        {RUN_COPY.readyTitle(bags.length)}
      </h3>
      {lowBalance ? <Banner tone="warning">{RUN_COPY.readyTopUp(formatRupees(WALLET_MIN_TO_USE))}</Banner> : null}
      {bags.length === 0 ? <p className="text-secondary text-mocha">{RUN_COPY.readyNone}</p> : null}
      {groups.map((group) => (
        <div key={group.buildingId} className="flex flex-col gap-1" data-ready-group={group.buildingId}>
          <p className="text-secondary font-semibold text-espresso">{group.title}</p>
          <ul className="divide-y divide-sand">
            {group.bags.map((bag) => {
              const expanded = open === bag.key;
              return (
                <li key={bag.key}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : bag.key)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                  >
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-espresso">{bag.sourceName}</span>
                      <span className="block text-secondary text-mocha">
                        {RUN_COPY.readyItems(bag.itemCount)} · {RUN_COPY.readyFor(bag.minutesSinceReady)}
                      </span>
                    </span>
                    <span className="shrink-0 text-secondary font-semibold text-espresso">
                      {bag.earning === null ? RUN_COPY.staffDelivery : formatRupees(bag.earning)}
                    </span>
                  </button>
                  {expanded ? <p className="pb-2 text-secondary text-espresso">{RUN_COPY.readyHint(bag.sourceName)}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
