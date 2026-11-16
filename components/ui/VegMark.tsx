/** The vegetarian mark: an olive square outline with an olive dot. Every item at UC is vegetarian (docs/MENU.md). */
export function VegMark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Vegetarian"
      className={`inline-flex size-4 shrink-0 items-center justify-center border-[1.5px] border-olive ${className}`}
    >
      <span className="size-2 rounded-pill bg-olive" aria-hidden="true" />
    </span>
  );
}
