import type { ComponentProps } from "react";

interface ChipProps extends ComponentProps<"button"> {
  selected?: boolean;
  /**
   * pill: the standard chip. capsule: the tall capsule used for break-slot and
   * day pickers; the selected capsule is filled maroon so it stands out in a row.
   */
  variant?: "pill" | "capsule";
}

/** UI_UX_BIBLE.md section 4: `sand` by default, `blush` with `maroon` text when selected. */
export function Chip({
  selected = false,
  variant = "pill",
  type = "button",
  className = "",
  children,
  ...rest
}: ChipProps) {
  const shape =
    variant === "capsule"
      ? "min-h-16 min-w-16 flex-col gap-0.5 px-4 text-body"
      : "h-11 px-4 text-secondary";
  const colour = selected
    ? variant === "capsule"
      ? "bg-maroon text-cream"
      : "bg-blush text-maroon"
    : "bg-sand text-espresso disabled:text-taupe";

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-pill font-medium",
        "transition-transform duration-150 ease-out active:scale-[0.97] disabled:active:scale-100",
        "disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
        shape,
        colour,
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
