"use client";

import type { ComponentProps } from "react";

/**
 * An on/off switch. The tap area is 44 px high; the track inside is 32 px.
 * On = maroon track with a cream knob. Off = sand track with a taupe knob.
 * The label is read out by screen readers, so it must say what the switch controls.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  ...rest
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
} & Omit<ComponentProps<"button">, "onChange" | "role" | "aria-checked" | "aria-label">) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "group inline-flex h-11 w-16 shrink-0 items-center justify-center rounded-pill",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
        "disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      {...rest}
    >
      <span
        className={`flex h-8 w-14 items-center rounded-pill px-1 transition-colors duration-150 ${checked ? "bg-maroon" : "bg-sand"} ${disabled ? "opacity-50" : ""}`}
        aria-hidden="true"
      >
        <span
          className={`size-6 rounded-pill transition-transform duration-150 ${checked ? "translate-x-6 bg-cream" : "translate-x-0 bg-taupe"}`}
        />
      </span>
    </button>
  );
}
