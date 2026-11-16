"use client";

import { useState } from "react";
import { ITEM_IMAGES } from "@/data/itemImages";
import type { MenuItem } from "@/data/menu";
import { ItemTile } from "@/components/ui/ItemTile";

/**
 * The photo on a menu item card: a fixed rounded frame with the item's initials tile underneath as the placeholder. A
 * hotlinked photo (data/itemImages.ts) fades in over it once loaded; no entry or a failed load leaves the initials, so
 * the layout never moves. A plain <img>, not next/image, so nothing loads through our server. Unavailable items are
 * shown in greyscale and dimmed.
 */
export function ItemImage({ item, unavailable = false }: { item: MenuItem; unavailable?: boolean }) {
  const entry = ITEM_IMAGES[item.id];
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  return (
    <div className={`relative size-26 shrink-0 overflow-hidden rounded-field ${unavailable ? "opacity-60 grayscale" : ""}`}>
      <ItemTile name={item.name} sourceId={item.sourceId} fill />
      {entry && state !== "failed" ? (
        // eslint-disable-next-line @next/next/no-img-element -- hotlinked on purpose: not through the Next image optimiser
        <img
          src={entry.url}
          alt={entry.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-out motion-reduce:transition-none ${state === "loaded" ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: entry.objectPosition ?? "center" }}
        />
      ) : null}
    </div>
  );
}
