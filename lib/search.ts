/**
 * Menu search across all five sources. Plain substring matching on the static
 * menu data: every word typed must appear somewhere in the item's name,
 * description, source name or vending slot. Safe in the browser and on the server.
 */
import { MENU_ITEMS, SOURCES, getSource, type MenuItem, type Source } from "@/data/menu";

function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9₹ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SearchGroup {
  source: Source;
  items: MenuItem[];
}

/** Matching items grouped by source, in the order of the Home tiles. Empty query returns nothing. */
export function searchMenu(query: string): SearchGroup[] {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];

  const groups: SearchGroup[] = [];
  for (const source of SOURCES) {
    const items = MENU_ITEMS.filter((item) => {
      if (item.sourceId !== source.id) return false;
      const haystack = normalise(`${item.name} ${item.description ?? ""} ${getSource(item.sourceId).name} ${item.slot ?? ""}`);
      return words.every((word) => haystack.includes(word));
    });
    if (items.length > 0) groups.push({ source, items });
  }
  return groups;
}
