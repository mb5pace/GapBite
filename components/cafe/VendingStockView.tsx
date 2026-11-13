"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { itemsBySource } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { IconButton } from "@/components/ui/IconButton";
import { Money } from "@/components/ui/Money";
import { PillButton, PillLink } from "@/components/ui/PillButton";
import { POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";

interface StockReply {
  stock: Record<string, number>;
}

const SLOTS = itemsBySource("vending");

/** Vending: the stock table with + and −, Refill all, and the kiosk button (docs/SCREENS.md "Vending"). */
export function VendingStockView() {
  const copy = CAFE_COPY.stock;
  const { data, error, mutate, isLoading } = useSWR<StockReply>("/api/cafe/stock", getJson, { refreshInterval: POLL_MS.cafe });
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function send(slot: string | null, body: Record<string, unknown>) {
    setPending(slot ?? "all");
    setNote(null);
    setProblem(null);
    const res = await postJson<StockReply>("/api/cafe/stock", body);
    setPending(null);
    if (res.ok && res.data) {
      await mutate(res.data, { revalidate: false });
      if (body.action === "refill") setNote(copy.refillDone);
    } else {
      setProblem(res.error ?? CAFE_COPY.errors.network);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-title font-bold text-maroon">{copy.title}</h1>
          <p className="mt-1 max-w-xl text-body text-mocha">{copy.intro}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PillLink href="/cafe/kiosk" size="md">
            {copy.kiosk}
          </PillLink>
          <p className="text-caption text-mocha">{copy.kioskHint}</p>
        </div>
      </div>

      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {problem ? <Banner tone="error">{problem}</Banner> : null}
      {note ? <Banner>{note}</Banner> : null}

      <div className="rounded-card bg-parchment p-3">
        <table className="w-full text-left">
          <caption className="sr-only">{copy.title}</caption>
          <thead>
            <tr className="text-secondary text-mocha">
              <th scope="col" className="px-3 py-2 font-medium">{copy.slot}</th>
              <th scope="col" className="px-3 py-2 font-medium">{copy.item}</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{copy.left}</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">Change stock</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {isLoading && !data
              ? SLOTS.map((item) => (
                  <tr key={item.id}>
                    <td colSpan={4} className="px-3 py-2">
                      <div className="h-11 rounded-pill bg-sand" />
                    </td>
                  </tr>
                ))
              : SLOTS.map((item) => {
                  const slot = item.slot as string;
                  const left = data?.stock[slot] ?? 0;
                  return (
                    <tr key={item.id}>
                      <th scope="row" className="px-3 py-2 font-display text-section font-bold text-maroon">{slot}</th>
                      <td className="px-3 py-2 text-body text-espresso">
                        {item.name} <Money amount={item.price} className="text-secondary text-mocha" />
                      </td>
                      <td className={`px-3 py-2 text-right text-body font-bold tabular-nums ${left === 0 ? "text-brick" : "text-espresso"}`}>
                        {left === 0 ? copy.soldOut : left}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex justify-end gap-2">
                          <IconButton
                            variant="secondary"
                            label={copy.minus(item.name)}
                            disabled={pending !== null || left === 0}
                            onClick={() => void send(slot, { action: "adjust", slot, delta: -1 })}
                          >
                            <Minus weight="bold" size={18} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            variant="secondary"
                            label={copy.plus(item.name)}
                            disabled={pending !== null}
                            onClick={() => void send(slot, { action: "adjust", slot, delta: 1 })}
                          >
                            <Plus weight="bold" size={18} aria-hidden="true" />
                          </IconButton>
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <div>
        <PillButton variant="secondary" size="md" disabled={pending !== null} onClick={() => void send(null, { action: "refill" })}>
          {copy.refill}
        </PillButton>
      </div>
    </div>
  );
}
