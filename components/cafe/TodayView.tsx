"use client";

import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { Banner } from "@/components/ui/Banner";
import { Money } from "@/components/ui/Money";
import { POLL_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getJson } from "@/lib/http";
import type { TodayTotals } from "@/lib/cafe-today";

/** Today: plain tables, no charts (docs/SCREENS.md "Today"). */
export function TodayView() {
  const copy = CAFE_COPY.today;
  const { data, error, isLoading } = useSWR<TodayTotals>("/api/cafe/today", getJson, { refreshInterval: POLL_MS.cafe });

  const rows = data
    ? [
        [copy.ordersPlaced, String(data.placed)],
        [copy.inProgress, String(data.inProgress)],
        [copy.delivered, String(data.delivered)],
        [copy.collected, String(data.collected)],
        [copy.failed, String(data.failed)],
        [copy.closedEarly, String(data.closedEarly)],
        [copy.refunds, copy.refundLine(data.refundCount, formatRupees(data.refundTotal))],
        [copy.feesKept, formatRupees(data.feesKept)],
      ]
    : [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-title font-bold text-maroon">{copy.title}</h1>
        <p className="mt-1 max-w-xl text-body text-mocha">{copy.intro}</p>
      </div>

      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {isLoading && !data ? <div className="h-72 rounded-card bg-sand" aria-busy="true" /> : null}

      {data ? (
        <>
          <table className="w-full rounded-card bg-parchment text-left">
            <caption className="sr-only">{copy.title}</caption>
            <tbody className="divide-y divide-sand">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" className="px-4 py-2 text-body font-medium text-espresso">{label}</th>
                  <td className="px-4 py-2 text-right text-body tabular-nums text-espresso">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </>
      ) : null}
    </div>
  );
}
