"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { CODE_DIGITS } from "@/lib/config";

const BOX =
  "flex h-16 w-14 items-center justify-center rounded-field border-[1.5px] bg-cream font-display text-greeting font-bold text-espresso";

/**
 * Four separate rounded boxes (UI_UX_BIBLE.md section 4): Grandstander 32, 1.5 px
 * outline. Without `onChange` it just shows a code (the buyer's handover code).
 * With `onChange` it is the entry field (the runner types the buyer's code): one
 * digit per box, focus moves on as you type, Backspace steps back, a pasted code
 * fills all the boxes.
 */
export function CodeBoxes({
  value,
  onChange,
  label,
  invalid = false,
  length = CODE_DIGITS,
}: {
  value: string;
  onChange?: (value: string) => void;
  /** Read out by screen readers, for example "Handover code". */
  label: string;
  invalid?: boolean;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const border = invalid ? "border-brick" : "border-espresso";
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  if (!onChange) {
    return (
      <div role="group" aria-label={`${label}: ${digits.join(" ")}`} className="flex gap-3">
        {digits.map((digit, i) => (
          <span key={i} className={`${BOX} ${border}`} aria-hidden="true">
            {digit}
          </span>
        ))}
      </div>
    );
  }

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange?.(next.join("").slice(0, length));
  }

  function handleInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) {
      setDigit(index, "");
      return;
    }
    setDigit(index, typed[typed.length - 1]);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigit(index - 1, "");
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < length; i++) next[index + i] = pasted[i];
    onChange?.(next.join(""));
    refs.current[Math.min(index + pasted.length, length - 1)]?.focus();
  }

  return (
    <div role="group" aria-label={label} className="flex gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${label}, digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={`${BOX} ${border} text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon`}
        />
      ))}
    </div>
  );
}
