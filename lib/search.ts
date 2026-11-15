/**
 * Menu search across all five sources. Plain substring matching on the static
 * menu data: every word typed must appear somewhere in the item's name,
 * description, category, cafe name or vending slot. Safe in the browser and on the server.
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

function queryWords(query: string): string[] {
  return normalise(query).split(" ").filter(Boolean);
}

/** Does the item match every word typed? Name, description, category, cafe name and vending slot are all searched. */
function itemMatches(item: MenuItem, words: readonly string[]): boolean {
  const haystack = normalise(`${item.name} ${item.description ?? ""} ${item.category} ${getSource(item.sourceId).name} ${item.slot ?? ""}`);
  return words.every((word) => haystack.includes(word));
}

/** Matching items grouped by source, in the order of the Home tiles. Empty query returns nothing. */
export function searchMenu(query: string): SearchGroup[] {
  const words = queryWords(query);
  if (words.length === 0) return [];

  const groups: SearchGroup[] = [];
  for (const source of SOURCES) {
    const items = MENU_ITEMS.filter((item) => item.sourceId === source.id && itemMatches(item, words));
    if (items.length > 0) groups.push({ source, items });
  }
  return groups;
}

/** The same search inside one cafe's menu: the items that match, in menu order. An empty query keeps them all. */
export function filterItems(items: readonly MenuItem[], query: string): MenuItem[] {
  const words = queryWords(query);
  return words.length === 0 ? [...items] : items.filter((item) => itemMatches(item, words));
}
