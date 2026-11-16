"use client";

import { CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { Source } from "@/data/menu";
import { CafeWordmark } from "./CafeWordmark";
import { SOURCE_BG } from "./sourceStyle";
import { StatusLine } from "./StatusLine";

/**
 * A place on Home: one wide row. On the left its wordmark block in the source colour, on the right its name in bold
 * capitals with the live status line underneath. The whole row opens the menu.
 */
export function SourceTile({ source }: { source: Source }) {
  return (
    <Link
      href={`/s/${source.id}`}
      className="flex min-h-11 items-center gap-4 rounded-card bg-parchment p-3 transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
    >
      <CafeWordmark top={source.wordmark.top} bottom={source.wordmark.bottom} bgClass={SOURCE_BG[source.id]} className="h-20 w-28 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-display text-body font-extrabold uppercase tracking-wide text-espresso">{source.name}</span>
        <StatusLine sourceId={source.id} className="text-caption uppercase tracking-wide" />
      </span>
      <CaretRight size={20} className="shrink-0 text-mocha" aria-hidden="true" />
    </Link>
  );
}
