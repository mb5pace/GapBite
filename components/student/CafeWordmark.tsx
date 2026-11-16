/**
 * A place's wordmark on Home: a solid block in its source colour with a small spaced word above a larger spaced word,
 * framed by thin cream brackets. Drawn in CSS only (our own lettering, no logo files). `bgClass` is a full Tailwind
 * background class such as "bg-src-cafe-delice".
 */
export function CafeWordmark({ top, bottom, bgClass, className = "" }: { top: string; bottom: string; bgClass: string; className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-tile text-cream ${bgClass} ${className}`} aria-hidden="true">
      <span className="relative flex flex-col items-center px-3 py-2 leading-none">
        <span className="absolute inset-y-0 left-0 w-2 border-y border-l border-cream" />
        <span className="absolute inset-y-0 right-0 w-2 border-y border-r border-cream" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">{top}</span>
        <span className="mt-1 text-[15px] font-extrabold uppercase tracking-[0.2em]">{bottom}</span>
      </span>
    </span>
  );
}
