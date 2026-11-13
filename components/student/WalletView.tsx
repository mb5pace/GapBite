"use client";

import {
  ArrowDown,
  ArrowUUpLeft,
  PersonSimpleWalk,
  ShoppingBag,
  Sliders,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, type ComponentType } from "react";
import useSWR from "swr";
import { WALLET_COPY } from "@/data/copy";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { getJson } from "@/lib/http";
import { formatDayTime } from "@/lib/time";
import type { LedgerEntry, LedgerType, WalletSnapshot } from "@/lib/wallet";
import { TopUpSheet } from "./TopUpSheet";

const ICON: Record<LedgerType, ComponentType<{ weight?: "regular"; size?: number }>> = {
  topup: ArrowDown,
  order: ShoppingBag,
  refund: ArrowUUpLeft,
  earning: PersonSimpleWalk,
  penalty: WarningCircle,
  adjustment: Sliders,
};

/** One ledger line. A line about an order is a link to that order, so the whole row is the tap target. */
function LedgerRow({ entry, now }: { entry: LedgerEntry; now: number }) {
  const Icon = ICON[entry.type];
  const inner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        <Icon weight="regular" size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-bold text-espresso">{WALLET_COPY.types[entry.type]}</p>
        <p className="text-secondary text-mocha">
          {entry.orderId ? <span className="font-medium tabular-nums text-maroon">{entry.orderId}</span> : null}
          {entry.orderId && entry.note ? " · " : null}
          {entry.note}
        </p>
        <p className="text-caption tabular-nums text-mocha">{formatDayTime(entry.at, now)}</p>
      </div>
      <Money amount={entry.amount} tone="signed" className="font-display text-section font-bold" />
    </>
  );
  const className = "flex items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
  return (
    <li>
      {entry.orderId ? (
        <Link href={`/o/${entry.orderId}`} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}

/** Account › Wallet: your balance, Top up, and every change to it, newest first. */
export function WalletView({ initial }: { initial: WalletSnapshot }) {
  const { data } = useSWR<WalletSnapshot>("/api/wallet", getJson, {
    fallbackData: initial,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const wallet = data ?? initial;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <p className="text-secondary font-medium text-mocha">{WALLET_COPY.balanceLabel}</p>
          <Money
            amount={wallet.balance}
            className={`font-display text-display font-extrabold ${wallet.balance < 0 ? "text-brick" : "text-maroon"}`}
          />
        </div>
        <PillButton arrow full onClick={() => setOpen(true)}>
          {WALLET_COPY.topUp}
        </PillButton>
      </Card>

      <section aria-labelledby="wallet-activity">
        <h2 id="wallet-activity" className="font-display text-section font-bold text-maroon">
          {WALLET_COPY.activity}
        </h2>
        {wallet.ledger.length === 0 ? (
          <EmptyState
            icon={<Wallet weight="regular" size={40} />}
            action={
              <PillButton variant="secondary" onClick={() => setOpen(true)}>
                {WALLET_COPY.topUp}
              </PillButton>
            }
          >
            {WALLET_COPY.emptyLedger}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-sand">
            {wallet.ledger.map((entry, i) => (
              <LedgerRow key={`${entry.at}-${i}`} entry={entry} now={wallet.now} />
            ))}
          </ul>
        )}
      </section>

      <TopUpSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
