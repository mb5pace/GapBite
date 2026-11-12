import { formatRupees } from "@/lib/format";

/**
 * ₹240, no decimals, Indian digit grouping (₹1,250). With tone="signed",
 * credits read +₹40 in olive and debits read −₹40 in brick.
 */
export function Money({
  amount,
  tone = "plain",
  className = "",
}: {
  amount: number;
  tone?: "plain" | "signed";
  className?: string;
}) {
  const whole = Math.round(amount);
  let text = formatRupees(whole);
  let colour = "";
  if (tone === "signed" && whole > 0) {
    text = `+${text}`;
    colour = "text-olive";
  } else if (tone === "signed" && whole < 0) {
    colour = "text-brick";
  }
  return <span className={`tabular-nums ${colour} ${className}`}>{text}</span>;
}
