/**
 * The QuickX mark: a cream "Q" (a ring and a tail at 45 degrees) on a maroon rounded square, the same drawing as the
 * home-screen icon (lib/app-icon.tsx). Decorative: the text beside it names the place.
 */
export function QuickXMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" className="fill-maroon" />
      <circle cx="20" cy="20" r="10.4" strokeWidth="4" fill="none" className="stroke-cream" />
      <line x1="23.5" y1="23.5" x2="31.2" y2="31.2" strokeWidth="4" strokeLinecap="round" className="stroke-cream" />
    </svg>
  );
}
