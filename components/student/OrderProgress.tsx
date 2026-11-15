import { PersonSimpleWalk } from "@phosphor-icons/react/ssr";
import { orderProgress, progressPercent, type ProgressInput } from "@/lib/order-progress";

/**
 * Four equal segments with 4 px gaps (sand track, maroon fill) tied to the real status, the small labels under them, and
 * a little walker at the end of the fill that bobs 2 px every 600 ms (still under reduced motion). The fill only ever
 * follows what has happened: see lib/order-progress.ts.
 */
export function OrderProgress({ order, now }: { order: ProgressInput; now: number }) {
  const { labels, fills, current } = orderProgress(order, now);
  return (
    <div data-order-progress="" data-current={current}>
      <div className="relative pt-6">
        <span
          className="absolute top-0 -translate-x-1/2 text-maroon transition-[left] duration-1000 ease-linear"
          style={{ left: `${progressPercent(fills)}%` }}
          aria-hidden="true"
        >
          <PersonSimpleWalk weight="regular" size={20} className="animate-bob motion-reduce:animate-none" />
        </span>
        <ol className="flex gap-1" aria-label={`Step ${current + 1} of ${labels.length}: ${labels[current]}`}>
          {fills.map((fill, i) => (
            <li key={labels[i]} className="h-2 flex-1 overflow-hidden rounded-pill bg-sand" data-fill={fill}>
              <span className="block h-full rounded-pill bg-maroon transition-[width] duration-1000 ease-linear" style={{ width: `${fill * 100}%` }} />
            </li>
          ))}
        </ol>
      </div>
      <ol className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
        {labels.map((label, i) => (
          <li key={label} className={`text-caption leading-tight ${i === current ? "font-semibold text-espresso" : "text-mocha"}`}>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
