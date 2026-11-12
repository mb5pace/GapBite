"use client";

import { ArrowRight } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";
type Size = "lg" | "md";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** lg is the 56 px primary action. md is 44 px, for rows and headers. */
  size?: Size;
  /** Round cream circle with a maroon arrow at the right end (primary only). */
  arrow?: boolean;
  full?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-maroon text-cream disabled:bg-sand disabled:text-taupe",
  secondary: "bg-sand text-espresso disabled:text-taupe",
  outline: "border-[1.5px] border-espresso text-espresso disabled:border-taupe disabled:text-taupe",
};

const SIZE: Record<Size, string> = {
  lg: "h-14 px-6 text-section",
  md: "h-11 px-4 text-secondary",
};

/** UI_UX_BIBLE.md section 4: primary and secondary pill buttons. */
export function PillButton({
  variant = "primary",
  size = "lg",
  arrow = false,
  full = false,
  className = "",
  type = "button",
  children,
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={[
        "group inline-flex items-center justify-center gap-3 rounded-pill font-display font-bold",
        "transition-transform duration-150 ease-out active:scale-[0.97] disabled:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
        VARIANT[variant],
        SIZE[size],
        full ? "w-full" : "",
        arrow && variant === "primary" ? "justify-between pr-2" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      <span className="flex items-center gap-2">{children}</span>
      {arrow && variant === "primary" ? (
        <span className="flex size-10 items-center justify-center rounded-pill bg-cream text-maroon group-disabled:text-taupe">
          <ArrowRight weight="bold" size={20} aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
