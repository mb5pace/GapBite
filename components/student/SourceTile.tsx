import Link from "next/link";
import { COPY } from "@/data/copy";
import type { Source } from "@/data/menu";
import { Badge } from "@/components/ui/Badge";
import { SourceGlyph } from "@/components/ui/SourceGlyph";

/**
 * One of the five places that sell. The line drawing is a Phosphor icon in a
 * sand circle until the Open Peeps illustrations are added. Always "Open" in the prototype.
 */
export function SourceTile({ source, wide = false }: { source: Source; wide?: boolean }) {
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
  const press = "transition-transform duration-150 ease-out active:scale-[0.98]";
  const glyph = (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
      <SourceGlyph sourceId={source.id} size={26} />
    </span>
  );

  // The full-width tile (vending) lays out in one row; the cafe tiles stack.
  if (wide) {
    return (
      <Link
        href={`/s/${source.id}`}
        className={`col-span-2 flex items-center gap-3 rounded-card bg-parchment p-4 ${press} ${focus}`}
      >
        {glyph}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-section font-bold text-maroon">{source.name}</span>
          <span className="mt-0.5 block text-secondary text-mocha">{source.tagline}</span>
        </span>
        <Badge tone="olive">{COPY.student.home.open}</Badge>
      </Link>
    );
  }

  return (
    <Link
      href={`/s/${source.id}`}
      className={`flex min-h-40 flex-col justify-between gap-4 rounded-card bg-parchment p-4 ${press} ${focus}`}
    >
      <span className="flex items-start justify-between gap-2">
        {glyph}
        <Badge tone="olive">{COPY.student.home.open}</Badge>
      </span>
      <span>
        <span className="block font-display text-section font-bold text-maroon">{source.name}</span>
        <span className="mt-0.5 block text-secondary text-mocha">{source.tagline}</span>
      </span>
    </Link>
  );
}
