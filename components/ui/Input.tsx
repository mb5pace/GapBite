"use client";

import { useId, type ComponentProps } from "react";

interface InputProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
  error?: string;
  /** "code" is the large letter-spaced field used for access codes. */
  variant?: "default" | "code";
}

/** Pill input on `sand` with a visible label, a hint and an error line. No borders. */
export function Input({
  label,
  hint,
  error,
  variant = "default",
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
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          "w-full rounded-pill bg-sand px-5 text-espresso placeholder:text-taupe",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
          field,
          className,
        ].join(" ")}
        {...rest}
      />
      {hint && !error ? (
        <p id={hintId} className="px-2 text-secondary text-taupe">
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
