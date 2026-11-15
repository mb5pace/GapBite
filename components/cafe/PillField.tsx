"use client";

import { useId, type ComponentProps } from "react";

interface PillFieldProps extends Omit<ComponentProps<"input">, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Width of the field. The label sits above it. */
  widthClass?: string;
}

/**
 * A compact pill field for the Cafe portal's forms: a time, a date or a few words, with a visible label above it.
 * `sand` pill, no border, the same focus ring as every other control. (Input is the tall 56 px field for the student app.)
 */
export function PillField({ label, value, onChange, widthClass = "w-36", className = "", ...rest }: PillFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="px-2 text-secondary font-medium text-mocha">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={[
          "h-11 rounded-pill bg-sand px-4 text-body tabular-nums text-espresso placeholder:text-taupe",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
          widthClass,
          className,
        ].join(" ")}
        {...rest}
      />
    </div>
  );
}
