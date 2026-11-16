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

/** The machine's shelves in order (A, B, C), each with its slots in order, as the machine shows them. */
const SHELVES = Object.entries(
  SLOTS.reduce<Record<string, typeof SLOTS>>((rows, item) => {
    (rows[(item.slot as string)[0]] ??= []).push(item);
    return rows;
  }, {}),
).sort(([a], [b]) => a.localeCompare(b));

/**
 * Vending (docs/SCREENS.md "Vending", v1.0.0 Phase C1): the stock as the machine's slot grid, one row per shelf (A, B,
 * C), each slot large with its item, price, how many are left and 48 px minus and plus buttons; Refill all; and the
 * kiosk button.
 */
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-body text-mocha">{copy.intro}</p>
        <div className="flex flex-wrap items-center gap-3">
          <PillButton variant="secondary" disabled={pending !== null} onClick={() => void send(null, { action: "refill" })}>
            {copy.refill}
          </PillButton>
          <PillLink href="/cafe/kiosk">{copy.kiosk}</PillLink>
        </div>
      </div>

      {error && !data ? <Banner tone="error">{error.message}</Banner> : null}
      {problem ? <Banner tone="error">{problem}</Banner> : null}
      {note ? <Banner>{note}</Banner> : null}

      <div className="flex flex-col gap-4" role="group" aria-label={copy.title}>
        {SHELVES.map(([shelf, items]) => (
          <section key={shelf} aria-label={copy.shelf(shelf)} className="flex flex-col gap-3 rounded-card bg-parchment p-4">
            <h2 className="font-display text-section font-bold text-maroon">{copy.shelf(shelf)}</h2>
            <ul className="grid grid-cols-3 gap-3 xl:grid-cols-6">
              {items.map((item) => {
                const slot = item.slot as string;
                const left = data?.stock[slot] ?? 0;
                return (
                  <li key={item.id} className="flex flex-col gap-2 rounded-card bg-cream p-3" data-slot={slot}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-title font-extrabold text-maroon">{slot}</span>
                      <Money amount={item.price} className="text-secondary text-mocha" />
                    </div>
                    <p className="min-h-10 text-secondary font-medium leading-tight text-espresso">{item.name}</p>
                    {isLoading && !data ? (
                      <div className="h-9 rounded-pill bg-sand" />
                    ) : (
                      <p className={`font-display text-title font-extrabold tabular-nums ${left === 0 ? "text-brick" : "text-espresso"}`} aria-label={`${copy.left}: ${left === 0 ? copy.soldOut : left}`}>
                        {left === 0 ? copy.soldOut : copy.leftCount(left)}
                      </p>
                    )}
                    <span className="flex justify-between gap-2">
                      <IconButton
                        variant="secondary"
                        size="lg"
                        label={copy.minus(item.name)}
                        disabled={pending !== null || left === 0}
                        onClick={() => void send(slot, { action: "adjust", slot, delta: -1 })}
                      >
                        <Minus weight="bold" size={24} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        variant="secondary"
                        size="lg"
                        label={copy.plus(item.name)}
                        disabled={pending !== null}
                        onClick={() => void send(slot, { action: "adjust", slot, delta: 1 })}
                      >
                        <Plus weight="bold" size={24} aria-hidden="true" />
                      </IconButton>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
