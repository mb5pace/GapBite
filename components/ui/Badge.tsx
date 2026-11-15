import type { ReactNode } from "react";

type Tone = "olive" | "amber" | "brick" | "taupe" | "maroon";

const DOT: Record<Tone, string> = {
  olive: "bg-olive",
  amber: "bg-amber",
  brick: "bg-brick",
  taupe: "bg-taupe",
  maroon: "bg-maroon",
};

/**
 * Status badge. The dot carries the status colour and always maps to a real
 * state; the words stay in `espresso`, so contrast is never a problem.
 * `wrap` lets a long status ("Closed today (Diwali)") break onto a second line instead of running out of a narrow tile.
 */
export function Badge({ tone, children, wrap = false }: { tone: Tone; children: ReactNode; wrap?: boolean }) {
  return (
    <span
      className={[
        "inline-flex bg-sand py-1 text-secondary font-medium text-espresso",
        // A badge that may wrap is a soft rounded rectangle, so two or three lines do not turn into a bubble.
        wrap ? "min-w-0 items-start gap-1.5 rounded-field px-2.5" : "shrink-0 items-center gap-2 whitespace-nowrap rounded-pill px-3",
      ].join(" ")}
    >
      <span className={`size-2 shrink-0 rounded-pill ${DOT[tone]} ${wrap ? "mt-2" : ""}`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
