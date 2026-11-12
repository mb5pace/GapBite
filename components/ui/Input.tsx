"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

interface InputProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
  error?: string;
  /** "code" is the large letter-spaced field used for access codes. */
  variant?: "default" | "code";
  /** A small control inside the right end of the field, for example a show/hide button. */
  trailing?: ReactNode;
}

/** Pill input on `sand` with a visible label, a hint and an error line. No borders. */
export function Input({
  label,
  hint,
  error,
  variant = "default",
  trailing,
  id,
  className = "",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  const field =
    variant === "code"
      ? "h-16 text-center font-display text-title font-bold tracking-code placeholder:font-sans placeholder:text-body placeholder:font-normal placeholder:tracking-normal"
      : "h-14 text-body";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="px-2 text-secondary font-medium text-mocha">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "w-full rounded-pill bg-sand text-espresso placeholder:text-taupe",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
            // With a trailing control, pad both sides equally so centred text stays centred.
            trailing ? "px-14" : "px-5",
            field,
            className,
          ].join(" ")}
          {...rest}
        />
        {trailing ? <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="px-2 text-secondary text-mocha">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="px-2 text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
    </div>
  );
}
