/** One short message that sits above the cart bar for a few seconds. Announced to screen readers. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-40"
    >
      <div className="mx-auto w-full max-w-[430px] px-5">
        {message ? (
          <p className="rounded-card bg-espresso px-4 py-3 text-secondary font-medium text-cream shadow-float">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
