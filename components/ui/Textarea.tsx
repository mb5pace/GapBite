"use client";

import { useId, type ComponentProps } from "react";

interface TextareaProps extends Omit<ComponentProps<"textarea">, "value"> {
  label: string;
  value: string;
  hint?: string;
  error?: string;
}

/** Like Input: `sand`, no border, a visible label, a hint and an error line. With a maxLength it counts characters. */
export function Textarea({ label, value, hint, error, id, maxLength, className = "", ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="px-2 text-secondary font-medium text-mocha">
        {label}
      </label>
      <textarea
        id={fieldId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-32 w-full resize-y rounded-card bg-sand p-4 text-body text-espresso placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${className}`}
        {...rest}
      />
      <div className="flex items-start justify-between gap-3 px-2">
        <p id={hintId} className="text-caption text-mocha">
          {hint}
        </p>
        {maxLength ? (
          <p className="shrink-0 text-caption tabular-nums text-mocha" aria-hidden="true">
            {value.length}/{maxLength}
          </p>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="px-2 text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
    </div>
  );
}
