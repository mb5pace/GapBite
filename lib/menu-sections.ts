/**
 * How a cafe's menu page is laid out: one section for each category, in the order the categories first appear in
 * data/menu.ts, then an "Unavailable" section last, only if something is unavailable. Pure: the page and the tests use it.
 */
import type { MenuItem } from "@/data/menu";

export const UNAVAILABLE_SECTION_ID = "unavailable";
export const UNAVAILABLE_LABEL = "Unavailable";

export interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
  /** True only for the Unavailable section. */
  unavailable: boolean;
}

/** "Meals and Combos" -> "meals-and-combos" */
export function sectionId(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Categories with no available item are left out; each tab is a section that has something in it. */
export function menuSections(items: readonly MenuItem[], isUnavailable: (item: MenuItem) => boolean): MenuSection[] {
  const sections: MenuSection[] = [];
  const unavailable: MenuItem[] = [];
  for (const item of items) {
    if (isUnavailable(item)) {
      unavailable.push(item);
      continue;
    }
    const id = sectionId(item.category);
    let section = sections.find((s) => s.id === id);
    if (!section) {
      section = { id, label: item.category, items: [], unavailable: false };
      sections.push(section);
    }
    section.items.push(item);
  }
  if (unavailable.length > 0) sections.push({ id: UNAVAILABLE_SECTION_ID, label: UNAVAILABLE_LABEL, items: unavailable, unavailable: true });
  return sections;
}
