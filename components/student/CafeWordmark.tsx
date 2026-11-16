/**
 * A cafe's wordmark inside its Home tile: a small letter-spaced top word above a larger letter-spaced bottom word,
 * framed on both sides by thin off-white brackets. CSS only (our own lettering, no image files). Sizes follow the tile's
 * width (container query units), so it scales down cleanly on small tiles. The tile must be an `@container`.
 */
export function CafeWordmark({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="relative flex flex-col items-center px-[6cqw] py-[3.5cqw] leading-none text-cream" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 w-[3.5cqw] border-y border-l border-cream" />
      <span className="absolute inset-y-0 right-0 w-[3.5cqw] border-y border-r border-cream" />
      <span className="whitespace-nowrap text-[6cqw] font-semibold uppercase tracking-[0.32em] [margin-right:-0.32em]">{top}</span>
      <span className="mt-[2.5cqw] whitespace-nowrap text-[9.5cqw] font-extrabold uppercase tracking-[0.2em] [margin-right:-0.2em]">{bottom}</span>
    </span>
  );
}
