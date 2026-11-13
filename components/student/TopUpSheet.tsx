"use client";

import { Bank, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { WALLET_COPY } from "@/data/copy";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { TOPUP_CHIPS, TOPUP_DEFAULT, TOPUP_MAX, TOPUP_PROCESSING_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { postJson } from "@/lib/http";
import { isValidTopUp } from "@/lib/wallet-rules";

type Phase = { kind: "choose" } | { kind: "processing"; amount: number; paying: boolean } | { kind: "done"; amount: number; balance: number };

/**
 * Inside the sheet, so its state starts fresh every time the sheet opens.
 * Mock UPI: after a short fake "processing" step the server adds the money.
 * Closing the sheet during the fake step cancels it and nothing is added.
 */
function TopUpContent({ onClose }: { onClose: () => void }) {
  const { mutate } = useSWRConfig();
  const [chip, setChip] = useState<number | null>(TOPUP_DEFAULT);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "choose" });
  const timer = useRef<number | undefined>(undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const amount = custom !== "" ? Number(custom) : chip;
  const valid = amount !== null && isValidTopUp(amount);

  function pay() {
    if (!valid || amount === null) return;
    setError("");
    setPhase({ kind: "processing", amount, paying: false });
    timer.current = window.setTimeout(async () => {
      setPhase({ kind: "processing", amount, paying: true });
      const res = await postJson<{ balance: number; added: number }>("/api/wallet/topup", { amount });
      if (!alive.current) return;
      if (res.ok && res.data) {
        setPhase({ kind: "done", amount: res.data.added, balance: res.data.balance });
        void mutate("/api/me");
        void mutate("/api/wallet");
      } else {
        setError(res.error ?? WALLET_COPY.badAmount);
        setPhase({ kind: "choose" });
      }
    }, TOPUP_PROCESSING_MS);
  }

  if (phase.kind === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center" role="status" aria-busy="true">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
          <Bank weight="regular" size={44} />
        </span>
        <p className="font-display text-section font-bold text-maroon">{WALLET_COPY.processing}</p>
        <p className="text-secondary text-mocha">
          {formatRupees(phase.amount)}. {WALLET_COPY.processingHint}
        </p>
        {phase.paying ? null : (
          <PillButton variant="secondary" size="md" onClick={onClose}>
            {WALLET_COPY.cancel}
          </PillButton>
        )}
      </div>
    );
  }

  if (phase.kind === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-olive" aria-hidden="true">
          <Check weight="bold" size={44} />
        </span>
        <p className="font-display text-title font-extrabold text-maroon">{formatRupees(phase.amount)} added</p>
        <p className="text-body text-espresso">Your balance is {formatRupees(phase.balance)}.</p>
        <div className="mt-3 w-full">
          <PillButton full onClick={onClose}>
            {WALLET_COPY.done}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        pay();
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Amount">
        {TOPUP_CHIPS.map((value) => (
          <Chip
            key={value}
            selected={custom === "" && chip === value}
            onClick={() => {
              setChip(value);
              setCustom("");
              setError("");
            }}
          >
            <Money amount={value} />
          </Chip>
        ))}
      </div>
      <Input
        label={WALLET_COPY.otherAmount}
        inputMode="numeric"
        pattern="[0-9]*"
        value={custom}
        maxLength={String(TOPUP_MAX).length}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setCustom(digits);
          setError("");
        }}
        error={error || (custom !== "" && !valid ? WALLET_COPY.badAmount : "")}
        autoComplete="off"
        name="topup-amount"
      />
      <PillButton type="submit" arrow full disabled={!valid}>
        {valid && amount !== null ? `Pay ${formatRupees(amount)} with UPI` : "Pay with UPI"}
      </PillButton>
      <p className="text-center text-secondary text-mocha">{WALLET_COPY.prototypeNote}</p>
    </form>
  );
}

/** The mock UPI top-up sheet: amount chips, a custom amount, a short fake processing step, then success. */
export function TopUpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Top up your wallet">
      <TopUpContent onClose={onClose} />
    </Sheet>
  );
}
