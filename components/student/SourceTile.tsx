"use client";

import Link from "next/link";
import type { Source } from "@/data/menu";
import { CafeWordmark } from "./CafeWordmark";
import { SOURCE_BG } from "./sourceStyle";
import { StatusLine } from "./StatusLine";
import { VendingArt } from "./VendingArt";

/**
 * A place on Home: a 4:3 tile in its source colour with its bracket-framed wordmark (our own lettering, not anyone's
 * logo), then the name and one status line underneath. Vending spans the full width
 * at the bottom with its name on the left and a drawn vending scene on the right.
 */
export function SourceTile({ source, wide = false }: { source: Source; wide?: boolean }) {
  return (
    <Link
      href={`/s/${source.id}`}
      className={`flex flex-col gap-2 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon ${wide ? "col-span-full" : ""}`}
    >
      {wide ? (
        <span className={`@container flex min-h-40 items-center gap-2 rounded-tile p-4 text-cream ${SOURCE_BG[source.id]}`} aria-hidden="true">
          <span className="flex w-full flex-row items-center gap-2 @max-[300px]:flex-col @max-[300px]:items-start">
            <span className="min-w-0 flex-1 font-display text-title font-extrabold leading-tight">{source.name}</span>
            <VendingArt className="h-32 w-auto shrink-0 @max-[300px]:self-end" />
          </span>
        </span>
      ) : (
        <span className={`@container flex aspect-[4/3] items-center justify-center rounded-tile p-4 ${SOURCE_BG[source.id]}`} aria-hidden="true">
          <CafeWordmark top={source.wordmark.top} bottom={source.wordmark.bottom} />
        </span>
      )}
      <span className="flex flex-col gap-1 px-1">
        <span className="text-body font-semibold text-espresso">{source.name}</span>
        <StatusLine sourceId={source.id} />
      </span>
    </Link>
  );
}
