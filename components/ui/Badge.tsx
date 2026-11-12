import type { ReactNode } from "react";

type Tone = "olive" | "amber" | "brick" | "taupe";

const DOT: Record<Tone, string> = {
  olive: "bg-olive",
  amber: "bg-amber",
  brick: "bg-brick",
  taupe: "bg-taupe",
};

/**
 * Status badge. The dot carries the status colour and always maps to a real
 * state; the words stay in `espresso`, so contrast is never a problem.
 */
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill bg-sand px-3 py-1 text-secondary font-medium text-espresso">
      <span className={`size-2 rounded-pill ${DOT[tone]}`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
