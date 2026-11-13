"use client";

import { ArrowsOut, Backspace } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { VENDING_SLOTS } from "@/data/menu";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { CODE_DIGITS, KIOSK_RESET_MS, KIOSK_SLOT_STEP_MS } from "@/lib/config";
import { postJson } from "@/lib/http";
import type { KioskResult } from "@/lib/cafe";

type Phase =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "error"; message: string }
  | { kind: "dispensing"; slots: KioskResult["slots"]; index: number }
  | { kind: "done" };

/** The machine's slots, one row per shelf: A, B, C. */
const SHELVES = Object.entries(
  VENDING_SLOTS.reduce<Record<string, string[]>>((rows, slot) => {
    (rows[slot[0]] ??= []).push(slot);
    return rows;
  }, {}),
);

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const KEY_CLASS =
  "flex size-16 items-center justify-center rounded-pill bg-cream font-display font-bold text-maroon " +
  "transition-transform duration-150 ease-out active:scale-[0.97] disabled:bg-blush " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream";

/**
 * The kiosk (docs/SCREENS.md "Kiosk"): a full-screen machine face for the laptop beside the
 * vending machine. Type the 4-digit code, watch each slot light up as it is released, then
 * "Collect below". The one deliberately dark screen (UI_UX_BIBLE.md section 7).
 */
export function KioskView() {
  const copy = CAFE_COPY.kiosk;
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const typing = phase.kind === "idle" || phase.kind === "error";

  const submit = useCallback(async (digits: string) => {
    setPhase({ kind: "checking" });
    const res = await postJson<KioskResult>("/api/cafe/kiosk", { code: digits });
    if (res.ok && res.data) {
      setPhase({ kind: "dispensing", slots: res.data.slots, index: 0 });
    } else {
      setPhase({ kind: "error", message: res.error ?? CAFE_COPY.errors.network });
      setCode("");
    }
  }, []);

  const press = useCallback(
    (digit: string) => {
      if (!typing) return;
      const next = (phase.kind === "error" ? digit : code + digit).slice(0, CODE_DIGITS);
      setCode(next);
      setPhase({ kind: "idle" });
      if (next.length === CODE_DIGITS) void submit(next);
    },
    [typing, phase.kind, code, submit],
  );

  const erase = useCallback(() => {
    if (!typing) return;
    setCode((c) => c.slice(0, -1));
    setPhase({ kind: "idle" });
  }, [typing]);

  const clear = useCallback(() => {
    if (!typing) return;
    setCode("");
    setPhase({ kind: "idle" });
  }, [typing]);

  // The physical keyboard works too.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === "Backspace") erase();
      else if (event.key === "Escape") clear();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, erase, clear]);

  // Each slot stays lit for a moment, then the next; then "Collect below"; then back to the keypad.
  useEffect(() => {
    if (phase.kind === "dispensing") {
      const id = window.setTimeout(() => {
        setPhase(phase.index + 1 < phase.slots.length ? { ...phase, index: phase.index + 1 } : { kind: "done" });
      }, KIOSK_SLOT_STEP_MS);
      return () => window.clearTimeout(id);
    }
    if (phase.kind === "done") {
      const id = window.setTimeout(() => {
        setCode("");
        setPhase({ kind: "idle" });
      }, KIOSK_RESET_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  function fullScreen() {
    try {
      void document.documentElement.requestFullscreen();
    } catch {
      // Some browsers refuse. The page already fills the window.
    }
  }

  const lit = phase.kind === "dispensing" ? phase.slots[phase.index] : null;
  const typingView = phase.kind !== "dispensing" && phase.kind !== "done";

  return (
    <main className="fixed inset-0 overflow-y-auto bg-maroon text-cream">
      <Link
        href="/cafe/vending"
        className="absolute left-6 top-6 inline-flex h-11 items-center rounded-pill px-4 text-secondary font-medium text-cream underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
      >
        {copy.exit}
      </Link>
      <button
        type="button"
        onClick={fullScreen}
        aria-label="Full screen"
        className="absolute right-6 top-6 inline-flex size-11 items-center justify-center rounded-pill text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
      >
        <ArrowsOut weight="regular" size={24} aria-hidden="true" />
      </button>

      {/* min-h-full + centring inside, so a short window scrolls instead of cutting off the top. */}
      <div className="mx-auto grid min-h-full max-w-[1100px] grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16">
        {/* The machine face: every slot, with the one being released lit. */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col gap-3" aria-label="Vending machine slots" role="group">
            {SHELVES.map(([shelf, slots]) => (
              <div key={shelf} className="flex justify-center gap-3">
                {slots.map((slot) => {
                  const on = lit?.slot === slot;
                  return (
                    <span
                      key={slot}
                      aria-current={on ? "true" : undefined}
                      className={`flex h-14 w-16 items-center justify-center rounded-field font-display text-body font-bold transition-colors duration-150 ${
                        on ? "bg-cream text-maroon" : "bg-espresso text-cream"
                      }`}
                    >
                      {slot}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          {phase.kind === "dispensing" && lit ? (
            <p role="status" className="text-center text-section font-medium">
              {copy.slotReleased(lit.slot)} · {lit.qty > 1 ? `${lit.qty} × ` : ""}
              {lit.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-5">
          <h1 className="text-center font-display text-greeting font-extrabold">
            {phase.kind === "done" ? copy.done : phase.kind === "dispensing" ? copy.dispensing : copy.title}
          </h1>
          {phase.kind === "done" ? (
            <p role="status" className="text-center font-display text-title font-bold">
              {copy.thanks}
            </p>
          ) : null}
          {typingView ? (
            <>
              <p className="text-center text-body">{copy.hint}</p>
              <CodeBoxes value={code} label="Your code" invalid={phase.kind === "error"} />
              <p
                role="alert"
                className={`min-h-11 rounded-pill bg-cream px-5 py-2 text-body font-medium text-brick ${phase.kind === "error" ? "" : "invisible"}`}
              >
                {phase.kind === "error" ? phase.message : "\u00a0"}
              </p>
              <div className="grid grid-cols-3 gap-3" role="group" aria-label="Keypad">
                {KEYS.map((digit) => (
                  <button key={digit} type="button" className={`${KEY_CLASS} text-title`} disabled={phase.kind === "checking"} onClick={() => press(digit)} aria-label={digit}>
                    {digit}
                  </button>
                ))}
                <button type="button" className={`${KEY_CLASS} text-body`} onClick={clear} disabled={phase.kind === "checking"}>
                  {copy.clear}
                </button>
                <button type="button" className={`${KEY_CLASS} text-title`} disabled={phase.kind === "checking"} onClick={() => press("0")} aria-label="0">
                  0
                </button>
                <button type="button" className={`${KEY_CLASS} text-title`} onClick={erase} disabled={phase.kind === "checking"} aria-label={copy.back}>
                  <Backspace weight="regular" size={28} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
