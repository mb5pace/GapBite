"use client";

import { Smiley, SmileyAngry, SmileyMeh, SmileySad, SmileyWink } from "@phosphor-icons/react";
import { useRef, type ComponentType, type KeyboardEvent } from "react";

type FaceIcon = ComponentType<{ weight?: "regular" | "fill"; size?: number; "aria-hidden"?: boolean }>;

/** Worst to best. */
const FACES: readonly FaceIcon[] = [SmileyAngry, SmileySad, SmileyMeh, Smiley, SmileyWink];

/**
 * A 1 to 5 face rating. One tab stop; the arrow keys move between faces. The chosen face is filled and turns
 * `blush`, so the choice does not depend on colour alone. Each face is 56 px.
 */
export function FaceRating({
  value,
  onChange,
  label,
  words,
  describe,
  disabled = false,
}: {
  /** 0 means nothing chosen yet. */
  value: number;
  onChange: (rating: number) => void;
  /** What is being rated, read out for the group. */
  label: string;
  /** The five words, worst to best ("Very bad" ... "Great"). */
  words: readonly string[];
  /** "3 of 5, Okay" */
  describe: (rating: number, word: string) => string;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step === 0 || disabled) return;
    event.preventDefault();
    const current = value === 0 ? (step === 1 ? 0 : 6) : value;
    const next = Math.min(5, Math.max(1, current + step));
    onChange(next);
    refs.current[next - 1]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="flex justify-between gap-2">
      {FACES.map((Face, index) => {
        const rating = index + 1;
        const selected = value === rating;
        return (
          <button
            key={rating}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={describe(rating, words[index])}
            tabIndex={selected || (value === 0 && rating === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(rating)}
            className={`flex size-14 shrink-0 items-center justify-center rounded-pill transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:text-taupe ${
              selected ? "bg-blush text-maroon" : "bg-sand text-espresso"
            }`}
          >
            <Face weight={selected ? "fill" : "regular"} size={32} aria-hidden={true} />
          </button>
        );
      })}
    </div>
  );
}
