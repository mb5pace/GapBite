import { CookingPot } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";

/** Each wisp starts a little after the one before it, so the three never rise together. */
const WISP_DELAYS = ["", "[animation-delay:1s]", "[animation-delay:2s]"] as const;

function Wisp({ delay }: { delay: string }) {
  return (
    <svg
      viewBox="0 0 6 18"
      aria-hidden="true"
      className={`h-[18px] w-1.5 animate-steam text-taupe motion-reduce:animate-none ${delay}`}
    >
      <path d="M3 1C0.5 5 5.5 9 3 13C2.2 14.8 2.4 16 3 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * What QuickX shows while something is actually loading: a cooking pot with three thin lines of steam that rise and
 * fade in a slow loop, and one line under it. Drawn from the Phosphor CookingPot icon (its own three vent marks are cut
 * off at the top so the moving steam is the only steam). With "reduce motion" on, the steam is still. The fade is part of the
 * motion only: there is no see-through colour at rest (UI_UX_BIBLE.md "Colour consistency").
 * `overlay` covers the whole window (the gate and Identify show it once a code is accepted, until the first page of the
 * app arrives); `fullScreen` is a full-height page of its own; the default fills the page area inside a portal's
 * header; `compact` is just the pot and the line, for a gallery or a small panel.
 */
export function LoadingView({ overlay = false, fullScreen = false, compact = false }: { overlay?: boolean; fullScreen?: boolean; compact?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-loading-view=""
      className={[
        "flex flex-col items-center justify-center gap-4 bg-cream px-6 text-center",
        overlay ? "fixed inset-0 z-50 min-h-dvh" : fullScreen ? "min-h-dvh" : compact ? "py-10" : "min-h-[60dvh]",
      ].join(" ")}
    >
      <div className="relative size-14" aria-hidden="true">
        <CookingPot weight="regular" size={56} className="text-maroon [clip-path:inset(25%_0_0_0)]" />
        <span className="absolute inset-x-0 bottom-[78%] flex justify-center gap-2">
          {WISP_DELAYS.map((delay) => (
            <Wisp key={delay} delay={delay} />
          ))}
        </span>
      </div>
      <p className="text-body text-mocha">{COPY.common.loading}</p>
    </div>
  );
}
