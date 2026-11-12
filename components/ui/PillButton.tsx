"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline";
type Size = "lg" | "md";

interface PillOptions {
  variant?: Variant;
  /** lg is the 56 px primary action. md is 44 px, for rows and headers. */
  size?: Size;
  /** Round cream circle with a maroon arrow at the right end (primary only). */
  arrow?: boolean;
  full?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-maroon text-cream aria-disabled:bg-sand aria-disabled:text-taupe disabled:bg-sand disabled:text-taupe",
  secondary: "bg-sand text-espresso disabled:text-taupe",
  outline: "border-[1.5px] border-espresso text-espresso disabled:border-taupe disabled:text-taupe",
};

const SIZE: Record<Size, string> = {
  lg: "h-14 px-6 text-section",
  md: "h-11 px-4 text-secondary",
};

function pillClass({ variant = "primary", size = "lg", arrow = false, full = false }: PillOptions, extra: string) {
  return [
    "group inline-flex items-center justify-center gap-3 rounded-pill font-display font-bold",
    "transition-transform duration-150 ease-out active:scale-[0.97] disabled:active:scale-100",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
    VARIANT[variant],
    SIZE[size],
    full ? "w-full" : "",
    arrow && variant === "primary" ? "justify-between pr-2" : "",
    extra,
  ].join(" ");
}

function ArrowCircle() {
  return (
    <span className="flex size-10 items-center justify-center rounded-pill bg-cream text-maroon group-disabled:text-taupe">
      <ArrowRight weight="bold" size={20} aria-hidden="true" />
    </span>
  );
}

/** UI_UX_BIBLE.md section 4: primary and secondary pill buttons. */
export function PillButton({
  variant,
  size,
  arrow = false,
  full,
  className = "",
  type = "button",
  children,
  ...rest
}: PillOptions & ComponentProps<"button">) {
  return (
    <button type={type} className={pillClass({ variant, size, arrow, full }, className)} {...rest}>
      <span className="flex items-center gap-2">{children}</span>
      {arrow && (variant ?? "primary") === "primary" ? <ArrowCircle /> : null}
    </button>
  );
}

/** The same pill, as a link. For moving between pages. */
export function PillLink({
  variant,
  size,
  arrow = false,
  full,
  className = "",
  children,
  ...rest
}: PillOptions & ComponentProps<typeof Link>) {
  return (
    <Link className={pillClass({ variant, size, arrow, full }, className)} {...rest}>
      <span className="flex items-center gap-2">{children}</span>
      {arrow && (variant ?? "primary") === "primary" ? <ArrowCircle /> : null}
    </Link>
  );
}
