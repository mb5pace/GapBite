import type { ComponentProps } from "react";

/** `parchment` on `cream`, radius 24. Depth comes from colour, never from a shadow. */
export function Card({ className = "", ...rest }: ComponentProps<"div">) {
  return <div className={`rounded-card bg-parchment p-4 ${className}`} {...rest} />;
}
