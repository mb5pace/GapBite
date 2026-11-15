"use client";

import Link from "next/link";
import type { Source } from "@/data/menu";
import { Badge } from "@/components/ui/Badge";
import { SourceGlyph } from "@/components/ui/SourceGlyph";
import { sourceLabel } from "@/lib/hours-rules";
import { useCart } from "./CartProvider";

/**
 * One of the five places that sell. The line drawing is a Phosphor icon in a
 * sand circle until the Open Peeps illustrations are added. The badge says what the place is doing right now, from
 * the live hours: "Open now", "Opens at 12:00", "Closed today", "Closed today (Diwali)" or "Paused".
 */
export function SourceTile({ source, wide = false }: { source: Source; wide?: boolean }) {
  const { menu } = useCart();
  const label = sourceLabel(menu.hours, menu.service, source.id, menu.now);
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
  const press = "transition-transform duration-150 ease-out active:scale-[0.98]";
  const glyph = (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
      <SourceGlyph sourceId={source.id} size={26} />
    </span>
  );
  const words = (
    <span className="min-w-0 flex-1">
      <span className="block font-display text-section font-bold text-maroon">{source.name}</span>
      <span className="mt-0.5 block text-secondary text-mocha">{source.tagline}</span>
      <span className="mt-2 block" data-source-status={source.id}>
        <Badge tone={label.tone} wrap>
          {label.text}
        </Badge>
      </span>
    </span>
  );

  // The full-width tile (vending) lays out in one row; the cafe tiles stack. The status sits under the name in both:
  // a long one ("Closed today (Diwali)") does not fit beside the icon on a 360 px phone.
  if (wide) {
    return (
      <Link href={`/s/${source.id}`} className={`col-span-2 flex items-center gap-3 rounded-card bg-parchment p-4 ${press} ${focus}`}>
        {glyph}
        {words}
      </Link>
    );
  }

  return (
    <Link href={`/s/${source.id}`} className={`flex min-h-40 flex-col justify-between gap-4 rounded-card bg-parchment p-4 ${press} ${focus}`}>
      {glyph}
      {words}
    </Link>
  );
}
