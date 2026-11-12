import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

interface IconButtonProps extends ComponentProps<"button"> {
  /** What the button does. Icon buttons have no visible text, so this is required. */
  label: string;
  /** primary: maroon with a cream icon. secondary: sand with an espresso icon. */
  variant?: Variant;
  /** md is 44 px, lg is 48 px. */
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-maroon text-cream disabled:bg-sand disabled:text-taupe",
  secondary: "bg-sand text-espresso disabled:text-taupe",
};
const SIZE: Record<Size, string> = { md: "size-11", lg: "size-12" };

/** UI_UX_BIBLE.md section 4: 44 px circle with an icon. */
export function IconButton({
  label,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-pill",
        "transition-transform duration-150 ease-out active:scale-[0.97] disabled:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
