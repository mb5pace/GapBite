"use client";

import { ShoppingBag } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { BUILDINGS, getBuilding, type BuildingId } from "@/data/locations";
import { getSource } from "@/data/menu";
import { CHECKOUT_COPY, ORDERS_COPY, ORDER_COPY, promisedLine } from "@/data/order-copy";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import { PillButton, PillLink } from "@/components/ui/PillButton";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { DEFAULT_BUILDING, DEFAULT_MODE } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { postJson } from "@/lib/http";
import { estimatePromisedAt, feeFor, priceLines, slotAvailable, slotsLeftToday, walkFor } from "@/lib/order-rules";
import type { PlaceResult } from "@/lib/orders";
import type { OrderMode } from "@/lib/order-types";
import { topUpNeeded } from "@/lib/wallet-rules";
import { useCart } from "./CartProvider";
import { TopUpSheet } from "./TopUpSheet";
import { useMe } from "./useMe";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-section font-bold text-maroon">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Checkout: pickup or delivery, the building, when, the bill, your wallet before
 * and after, and Pay. The numbers here come from the same rules the server uses to
 * price the real order, and the server recalculates everything: nothing on this
 * screen can change what you are charged.
 */
export function CheckoutView() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const cart = useCart();
  const me = useMe();

  const [mode, setMode] = useState<OrderMode>(DEFAULT_MODE);
  const [buildingId, setBuildingId] = useState<BuildingId>(DEFAULT_BUILDING);
  const [when, setWhen] = useState("asap");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  // One id per visit to this screen: tapping Pay twice, or retrying after a bad connection, places one order.
  const [requestId] = useState(() => crypto.randomUUID());

  const priced = priceLines(cart.cart.lines);

  if (!priced.ok) {
    return (
      <EmptyState
        icon={<ShoppingBag weight="regular" size={40} />}
        action={
          <PillLink href="/home" variant="secondary">
            {ORDERS_COPY.browse}
          </PillLink>
        }
      >
        {ORDER_COPY.emptyCart}
      </EmptyState>
    );
  }

  const now = cart.menu.now;
  const source = getSource(priced.sourceId);
  const walk = walkFor(mode, mode === "delivery" ? buildingId : undefined);
  const fee = feeFor(mode, mode === "delivery" ? buildingId : undefined);
  const total = priced.subtotal + fee;
  const need = topUpNeeded(me.balance, total);
  const slots = slotsLeftToday(now);
  const slotOk = (slot: string) => slotAvailable(slot, now, priced.prepMin, walk);
  const slotProblem = when !== "asap" && !slotOk(when);
  const cartProblem = Object.keys(cart.issues).length > 0;

  const estimate = estimatePromisedAt({ mode, when, nowMs: now, prepMin: priced.prepMin, walkMin: walk });
  const estimateText = promisedLine({
    sourceId: priced.sourceId,
    mode,
    buildingId: mode === "delivery" ? buildingId : undefined,
    promisedAt: estimate,
  });

  const blockedReason = cartProblem
    ? CHECKOUT_COPY.fixCart
    : slotProblem
      ? ORDER_COPY.breakTooClose
      : need > 0
        ? `Top up ${formatRupees(need)} more to place this order.`
        : "";
  const after = me.balance - total;

  async function pay() {
    if (busy || blockedReason) return;
    setBusy(true);
    setError("");
    const res = await postJson<PlaceResult>("/api/orders", {
      requestId,
      mode,
      ...(mode === "delivery" ? { buildingId } : {}),
      when,
      items: cart.cart.lines,
    });
    if (res.ok && res.data) {
      cart.clear();
      void mutate("/api/me");
      void mutate("/api/wallet");
      router.replace(`/o/${res.data.order.id}`);
      return; // stay busy until the order page loads
    }
    setError(res.error ?? ORDER_COPY.tryAgain);
    void mutate("/api/menu"); // stock or availability may be why
    void mutate("/api/me");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Section title={CHECKOUT_COPY.yourOrder}>
        <div className="flex items-start justify-between gap-3 rounded-card bg-parchment p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display text-section font-bold text-maroon">
              <SourceGlyph sourceId={source.id} size={20} />
              {source.name}
            </p>
            <ul className="mt-1 text-secondary text-mocha">
              {priced.items.map((line) => (
                <li key={line.itemId}>
                  {line.qty} × {line.name}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/cart" className="inline-flex min-h-11 shrink-0 items-center text-secondary font-medium text-maroon underline underline-offset-2">
            {CHECKOUT_COPY.editCart}
          </Link>
        </div>
      </Section>

      <Section title={CHECKOUT_COPY.modeLabel}>
        <div role="radiogroup" aria-label={CHECKOUT_COPY.modeLabel} className="flex rounded-pill bg-sand p-1">
          {(["pickup", "delivery"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => {
                setMode(value);
                setError("");
              }}
              className={[
                "h-12 flex-1 rounded-pill px-3 font-display text-secondary font-bold transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                mode === value ? "bg-maroon text-cream" : "text-espresso",
              ].join(" ")}
            >
              {value === "pickup" ? CHECKOUT_COPY.pickup : CHECKOUT_COPY.delivery}
            </button>
          ))}
        </div>
      </Section>

      {mode === "delivery" ? (
        <Section title={CHECKOUT_COPY.buildingLabel}>
          <div role="radiogroup" aria-label={CHECKOUT_COPY.buildingLabel} className="flex flex-col gap-2">
            {BUILDINGS.map((building) => {
              const selected = buildingId === building.id;
              return (
                <button
                  key={building.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setBuildingId(building.id);
                    setError("");
                  }}
                  className={[
                    "flex items-center justify-between gap-3 rounded-card px-4 py-3 text-left",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                    selected ? "bg-blush" : "bg-parchment",
                  ].join(" ")}
                >
                  <span className="min-w-0">
                    <span className="block text-body font-bold text-espresso">{building.short}</span>
                    <span className="block text-secondary text-mocha">
                      {building.dropPoint} · {CHECKOUT_COPY.walkMin(building.walkMin)}
                    </span>
                  </span>
                  <Money amount={feeFor("delivery", building.id)} className="font-display text-section font-bold text-maroon" />
                </button>
              );
            })}
          </div>
        </Section>
      ) : null}

      <Section title={CHECKOUT_COPY.whenLabel}>
        <div className="flex flex-col gap-3">
          <div>
            <Chip selected={when === "asap"} onClick={() => setWhen("asap")}>
              {CHECKOUT_COPY.asap}
            </Chip>
          </div>
          {slots.length > 0 ? (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Break times">
              {slots.map((slot) => {
                const open = slotOk(slot);
                return (
                  <Chip
                    key={slot}
                    variant="capsule"
                    selected={when === slot}
                    disabled={!open}
                    onClick={() => setWhen(slot)}
                    aria-label={open ? `Break at ${slot}` : `Break at ${slot}, too late`}
                  >
                    <span className="font-display font-bold tabular-nums">{slot}</span>
                    <span className="text-caption">{open ? CHECKOUT_COPY.breakCaption : CHECKOUT_COPY.tooLate}</span>
                  </Chip>
                );
              })}
            </div>
          ) : null}
        </div>
      </Section>

      <Section title={CHECKOUT_COPY.billLabel}>
        <dl className="flex flex-col gap-2 rounded-card bg-parchment p-4 text-body text-espresso">
          <div className="flex items-center justify-between">
            <dt>{CHECKOUT_COPY.subtotal}</dt>
            <dd><Money amount={priced.subtotal} /></dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{mode === "delivery" ? `${CHECKOUT_COPY.deliveryFee} (${getBuilding(buildingId).short})` : CHECKOUT_COPY.pickupFee}</dt>
            <dd><Money amount={fee} /></dd>
          </div>
          <div className="flex items-center justify-between border-t border-sand pt-2 font-bold">
            <dt>{CHECKOUT_COPY.total}</dt>
            <dd><Money amount={total} className="font-display text-title font-bold text-maroon" /></dd>
          </div>
        </dl>
      </Section>

      <Section title={CHECKOUT_COPY.walletLabel}>
        <dl className="flex flex-col gap-2 rounded-card bg-parchment p-4 text-body text-espresso">
          <div className="flex items-center justify-between">
            <dt>{CHECKOUT_COPY.walletNow}</dt>
            <dd><Money amount={me.balance} /></dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{CHECKOUT_COPY.walletAfter}</dt>
            <dd><Money amount={after} className={after < 0 ? "text-brick" : ""} /></dd>
          </div>
        </dl>
      </Section>

      {estimateText ? (
        <p className="text-body text-espresso">
          <span className="font-bold">{CHECKOUT_COPY.estimateLabel}.</span> {estimateText}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {blockedReason ? (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-body font-medium text-brick">{blockedReason}</p>
            {cartProblem ? (
              <PillLink href="/cart" variant="secondary" size="md">{CHECKOUT_COPY.goToCart}</PillLink>
            ) : need > 0 && !slotProblem ? (
              <PillButton variant="secondary" size="md" onClick={() => setTopUpOpen(true)}>
                {CHECKOUT_COPY.topUp}
              </PillButton>
            ) : null}
          </div>
        ) : null}
        {error ? <Banner tone="error">{error}</Banner> : null}
        <PillButton arrow full disabled={busy || blockedReason !== ""} aria-busy={busy} onClick={pay}>
          {busy ? CHECKOUT_COPY.paying : `Pay ${formatRupees(total)} from wallet`}
        </PillButton>
      </div>

      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}
