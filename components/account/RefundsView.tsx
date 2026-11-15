"use client";

import { ArrowUUpLeft } from "@phosphor-icons/react";
import Link from "next/link";
import useSWR from "swr";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { getSource } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import type { RefundsReply } from "@/lib/history-types";
import { getJson } from "@/lib/http";
import { formatDayTime } from "@/lib/time";

/** Account › Refund Status: every refund, with why it happened and where the money went. */
export function RefundsView() {
  const copy = ACCOUNT_COPY.refunds;
  const { data, error } = useSWR<RefundsReply>("/api/refunds", getJson, { revalidateOnFocus: true });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-body text-espresso">{copy.intro}</p>
      {error && !data ? <Banner tone="error">{copy.loadFailed}</Banner> : null}
      {!data && !error ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="h-20 rounded-card bg-sand" />
          <div className="h-20 rounded-card bg-sand" />
        </div>
      ) : null}
      {data ? (
        <>
          <section aria-label={copy.totalLabel} className="flex items-center justify-between gap-3 rounded-card bg-parchment p-4">
            <p className="text-secondary font-medium text-mocha">{copy.totalLabel}</p>
            <Money amount={data.total} className="font-display text-title font-extrabold text-maroon" />
          </section>
          {data.refunds.length === 0 ? <EmptyState icon={<ArrowUUpLeft weight="regular" size={40} />}>{copy.empty}</EmptyState> : null}
          {data.refunds.length > 0 ? (
            <ul className="flex flex-col gap-3" aria-label="Refunds">
              {data.refunds.map((refund) => (
                <li key={refund.orderId}>
                  <Link
                    href={`/o/${refund.orderId}`}
                    className="flex flex-col gap-2 rounded-card bg-parchment p-4 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 font-display text-section font-bold text-maroon">
                        <SourceGlyph sourceId={refund.sourceId} size={20} />
                        <span>{getSource(refund.sourceId).name}</span>
                      </span>
                      <Money amount={refund.amount} tone="signed" className="font-display text-section font-bold" />
                    </span>
                    <span className="text-secondary text-mocha">
                      <span className="font-medium tabular-nums text-espresso">{refund.orderId}</span> · {copy.reason[refund.reason]}
                    </span>
                    <span className="flex items-center justify-between gap-3 text-secondary text-mocha">
                      <span className="font-medium text-espresso">{copy.state}</span>
                      <span className="tabular-nums">{formatDayTime(refund.at, data.now)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-secondary text-mocha">{copy.noShowNote}</p>
        </>
      ) : null}
    </div>
  );
}
