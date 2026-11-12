/**
 * Display helpers. Money is integer rupees everywhere (CLAUDE.md rule 2): these
 * only format. Safe to import from client and server code.
 */

const rupeeFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 1250 becomes "₹1,250". Negative amounts get a proper minus: "−₹30". No decimals, ever. */
export function formatRupees(amount: number): string {
  const whole = Math.round(amount);
  return `${whole < 0 ? "−" : ""}₹${rupeeFormat.format(Math.abs(whole))}`;
}

/** "Cold Coffee" becomes "CC". One word gives its first two letters: "Espresso" becomes "ES". */
export function initialsOf(name: string): string {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase("en-IN");
  return (words[0][0] + words[1][0]).toLocaleUpperCase("en-IN");
}
