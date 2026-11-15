"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** How long the item a search result pointed at stays highlighted, in milliseconds. */
const FLASH_MS = 1800;

/**
 * A search result links to `/s/<place>?item=<id>`. On arrival the menu scrolls that item into the middle of the screen
 * and highlights it for a moment, so the student sees which one they asked for. Items carry id="item-<id>".
 */
export function useScrollToItem(): void {
  const itemId = useSearchParams().get("item");
  useEffect(() => {
    if (!itemId) return;
    const el = document.getElementById(`item-${itemId}`);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    el.setAttribute("data-flash", "");
    const timer = window.setTimeout(() => el.removeAttribute("data-flash"), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [itemId]);
}
