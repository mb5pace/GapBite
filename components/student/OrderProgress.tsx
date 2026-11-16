import { orderProgress, type ProgressInput } from "@/lib/order-progress";
import { TrackerStudent } from "./TrackerStudent";

/**
 * Four equal segments with 4 px gaps (sand track, maroon fill) tied to the real status, the small labels under them, and
 * the little student (TrackerStudent) standing over the current stage's label. On a stage change the student slides
 * there and the fill grows, both over 600 ms ease-out, using transforms only. The fill only ever follows what has
 * happened: see lib/order-progress.ts.
 */
export function OrderProgress({ order, now }: { order: ProgressInput; now: number }) {
  const { labels, fills, current } = orderProgress(order, now);
  const GAPS = (labels.length - 1) * 4;
  return (
    <div data-order-progress="" data-current={current}>
      <div className="relative pt-7">
        <span
          className="absolute inset-x-0 top-0 block transition-transform duration-[600ms] ease-out motion-reduce:transition-none"
          // The centre of the current label's cell: cells are equal with 4 px gaps between them.
          style={{ transform: `translateX(calc(${current} * ((100% - ${GAPS}px) / ${labels.length} + 4px) + (100% - ${GAPS}px) / ${labels.length * 2}))` }}
          aria-hidden="true"
        >
          <span className="absolute left-0 top-0 -translate-x-1/2">
            <TrackerStudent stage={current} />
          </span>
        </span>
        <ol className="flex gap-1" aria-label={`Step ${current + 1} of ${labels.length}: ${labels[current]}`}>
          {fills.map((fill, i) => (
            <li key={labels[i]} className="h-2 flex-1 overflow-hidden rounded-pill bg-sand" data-fill={fill}>
              <span className="block h-full rounded-pill bg-maroon transition-transform duration-[600ms] ease-out motion-reduce:transition-none" style={{ transform: `translateX(${(fill - 1) * 100}%)`, opacity: fill > 0 ? 1 : 0 }} />
            </li>
          ))}
        </ol>
      </div>
      <ol className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
        {labels.map((label, i) => (
          <li key={label} className={`text-center text-caption leading-tight ${i === current ? "font-semibold text-espresso" : "text-mocha"}`}>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
