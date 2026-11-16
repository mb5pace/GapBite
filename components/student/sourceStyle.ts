import type { SourceId } from "@/data/menu";

/** Each place's source colour as a background class (UI_UX_BIBLE.md "Source colours"). Full class names, so Tailwind sees them. */
export const SOURCE_BG: Record<SourceId, string> = {
  "truly-indian": "bg-src-truly-indian",
  "global-bistro": "bg-src-global-bistro",
  "cafe-delice": "bg-src-cafe-delice",
  "greens-grains": "bg-src-greens-grains",
  vending: "bg-src-vending",
};
