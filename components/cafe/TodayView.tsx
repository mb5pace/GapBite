"use client";

import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { Banner } from "@/components/ui/Banner";
import { Money } from "@/components/ui/Money";
import { POLL_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getJson } from "@/lib/http";
import type { TodayTotals } from "@/lib/cafe-today";

/**
 * Today (docs/SCREENS.md "Today", v1.0.0 Phase C1): five large number tiles on top (orders placed, delivered, collected,
 * failed late, revenue), then revenue by source and the other totals. No charts.
 */
export function TodayView() {
  const copy = CAFE_COPY.today;
  const { data, error, isLoading } = useSWR<TodayTotals>("/api/cafe/today", getJson, { refreshInterval: POLL_MS.cafe });

  const tiles = data
    ? [
        { label: copy.ordersPlaced, value: String(data.placed), id: "placed" },
        { label: copy.delivered, value: String(data.delivered), id: "delivered" },
        { label: copy.collected, value: String(data.collected), id: "collected" },
        { label: copy.failed, value: String(data.failed), id: "failed" },
        { label: copy.revenueTile, value: formatRupees(data.revenueTotal), id: "revenue" },
      ]
    : [];
  const rows = data
    ? [
        [copy.inProgress, String(data.inProgress)],
        [copy.noShow, String(data.noShow)],
        [copy.closedEarly, String(data.closedEarly)],
        [copy.refunds, copy.refundLine(data.refundCount, formatRupees(data.refundTotal))],
        [copy.feesKept, formatRupees(data.feesKept)],
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-body text-mocha">{copy.intro}</p>

      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {isLoading && !data ? <div className="h-72 rounded-card bg-sand" aria-busy="true" /> : null}

      {data ? (
        <>
          <dl className="grid grid-cols-5 gap-3" data-today-tiles="">
            {tiles.map((tile) => (
              <div key={tile.id} className="flex flex-col gap-1 rounded-card bg-parchment p-5" data-tile={tile.id}>
                <dt className="text-secondary font-semibold text-mocha">{tile.label}</dt>
                <dd className="font-display text-greeting font-extrabold leading-tight tabular-nums text-maroon">{tile.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid items-start gap-6 xl:grid-cols-2">
            <section aria-labelledby="revenue-heading">
              <h2 id="revenue-heading" className="mb-2 font-display text-section font-bold text-maroon">
                {copy.revenueBySource}
              </h2>
              <table className="w-full rounded-card bg-parchment text-left">
                <thead>
                  <tr className="text-secondary text-mocha">
                    <th scope="col" className="px-4 py-2 font-medium">{copy.source}</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">{copy.finished}</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">{copy.revenue}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {data.bySource.map((row) => (
                    <tr key={row.sourceId}>
                      <th scope="row" className="px-4 py-2 text-body font-medium text-espresso">{row.name}</th>
                      <td className="px-4 py-2 text-right text-body tabular-nums text-espresso">{row.finished}</td>
                      <td className="px-4 py-2 text-right text-body text-espresso"><Money amount={row.revenue} /></td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="px-4 py-2 text-body font-bold text-espresso">{copy.total}</th>
                    <td className="px-4 py-2 text-right text-body font-bold tabular-nums text-espresso">
                      {data.bySource.reduce((sum, row) => sum + row.finished, 0)}
                    </td>
                    <td className="px-4 py-2 text-right text-body font-bold text-espresso"><Money amount={data.revenueTotal} /></td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section aria-labelledby="more-heading">
              <h2 id="more-heading" className="mb-2 font-display text-section font-bold text-maroon">
                {copy.moreTitle}
              </h2>
              <table className="w-full rounded-card bg-parchment text-left">
                <caption className="sr-only">{copy.moreTitle}</caption>
                <tbody className="divide-y divide-sand">
                  {rows.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row" className="px-4 py-2 text-body font-medium text-espresso">{label}</th>
                      <td className="px-4 py-2 text-right text-body tabular-nums text-espresso">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
