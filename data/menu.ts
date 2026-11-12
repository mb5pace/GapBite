/**
 * Menu and vending machine. Source: docs/MENU.md.
 * Correct any name or price here and nowhere else. Prices are whole rupees.
 * `prepMin` is minutes from Accepted to Ready; an order's prep time is the
 * highest prepMin among its items. Where MENU.md lists a detail in brackets or
 * after a comma (for example "(3 chapati)"), it is kept as `description`.
 * "Unavailable today" lives in Redis, not here. Vending stock lives in Redis
 * and starts from `startStock`.
 */

export type SourceId =
  | "truly-indian"
  | "global-bistro"
  | "cafe-delice"
  | "greens-grains"
  | "vending";

export interface Source {
  id: SourceId;
  name: string;
  tagline: string;
  kind: "cafe" | "vending";
}

export interface MenuItem {
  id: string;
  sourceId: SourceId;
  name: string;
  /** Integer rupees */
  price: number;
  prepMin: number;
  /** morning = only orderable before 11:30. bestseller = shown under "Popular at UC". */
  tags: ("morning" | "bestseller")[];
  /** Vending only, e.g. "B2" */
  slot?: string;
  /** Vending only */
  startStock?: number;
  /** One short line, optional */
  description?: string;
}

/** Order matches the tiles on Home: four cafes, then the vending machine. */
export const SOURCES: readonly Source[] = [
  {
    id: "truly-indian",
    name: "Truly Indian",
    tagline: "Home-style Gujarati and North Indian",
    kind: "cafe",
  },
  {
    id: "global-bistro",
    name: "Global Bistro",
    tagline: "Biryani, Indo-Chinese, pasta, burgers",
    kind: "cafe",
  },
  {
    id: "cafe-delice",
    name: "Cafe Delice",
    tagline: "Coffee, sandwiches, pancakes, juices",
    kind: "cafe",
  },
  {
    id: "greens-grains",
    name: "Greens and Grains",
    tagline: "Bowls, salads, smoothies, light snacks",
    kind: "cafe",
  },
  {
    id: "vending",
    name: "UC Vending Machine",
    tagline: "Paper Boat, cold drinks and chips",
    kind: "vending",
  },
];

const trulyIndian: MenuItem[] = [
  { id: "ti-thali", sourceId: "truly-indian", name: "Gujarati Thali", description: "2 sabzi, dal, rice, 3 rotli, salad", price: 65, prepMin: 6, tags: ["bestseller"] },
  { id: "ti-combo-paneer", sourceId: "truly-indian", name: "Chapati + Paneer Sabzi combo", description: "3 chapati", price: 80, prepMin: 5, tags: [] },
  { id: "ti-combo-mixveg", sourceId: "truly-indian", name: "Chapati + Mix Veg combo", description: "3 chapati", price: 70, prepMin: 5, tags: [] },
  { id: "ti-sev-tameta", sourceId: "truly-indian", name: "Sev Tameta Sabzi with 2 rotli", price: 55, prepMin: 5, tags: [] },
  { id: "ti-dal-rice", sourceId: "truly-indian", name: "Dal Rice", price: 60, prepMin: 4, tags: [] },
  { id: "ti-aloo-paratha", sourceId: "truly-indian", name: "Aloo Paratha with curd", price: 50, prepMin: 6, tags: [] },
  { id: "ti-paneer-paratha", sourceId: "truly-indian", name: "Paneer Paratha with curd", price: 60, prepMin: 6, tags: [] },
  { id: "ti-thepla", sourceId: "truly-indian", name: "Methi Thepla with chhundo", description: "3 thepla", price: 45, prepMin: 3, tags: ["morning"] },
  { id: "ti-poha", sourceId: "truly-indian", name: "Kanda Poha", price: 40, prepMin: 3, tags: ["morning", "bestseller"] },
  { id: "ti-upma", sourceId: "truly-indian", name: "Upma", price: 40, prepMin: 3, tags: ["morning"] },
  { id: "ti-khaman", sourceId: "truly-indian", name: "Khaman", description: "One plate", price: 35, prepMin: 2, tags: [] },
  { id: "ti-roti", sourceId: "truly-indian", name: "Extra Rotli", description: "2 rotli", price: 15, prepMin: 2, tags: [] },
  { id: "ti-chaas", sourceId: "truly-indian", name: "Masala Chaas", description: "Buttermilk", price: 20, prepMin: 1, tags: [] },
  { id: "ti-chai", sourceId: "truly-indian", name: "Masala Chai", price: 15, prepMin: 2, tags: [] },
];

const cafeDelice: MenuItem[] = [
  { id: "cd-espresso", sourceId: "cafe-delice", name: "Espresso", price: 60, prepMin: 2, tags: [] },
  { id: "cd-eye-opener", sourceId: "cafe-delice", name: "Eye Opener", price: 70, prepMin: 3, tags: [] },
  { id: "cd-double-eye", sourceId: "cafe-delice", name: "Double Eye Opener", price: 90, prepMin: 3, tags: [] },
  { id: "cd-cappuccino", sourceId: "cafe-delice", name: "Cappuccino", price: 80, prepMin: 3, tags: ["bestseller"] },
  { id: "cd-black-coffee", sourceId: "cafe-delice", name: "Black Coffee", price: 60, prepMin: 2, tags: [] },
  { id: "cd-cold-coffee", sourceId: "cafe-delice", name: "Cold Coffee", price: 90, prepMin: 3, tags: ["bestseller"] },
  { id: "cd-tea", sourceId: "cafe-delice", name: "Tea", price: 20, prepMin: 2, tags: [] },
  { id: "cd-cg-sandwich", sourceId: "cafe-delice", name: "Chilli Garlic Cheese Sandwich", price: 90, prepMin: 5, tags: [] },
  { id: "cd-ctc-sandwich", sourceId: "cafe-delice", name: "CTC Sandwich", price: 100, prepMin: 5, tags: [] },
  { id: "cd-veg-sandwich", sourceId: "cafe-delice", name: "Veg Grilled Sandwich", price: 80, prepMin: 5, tags: [] },
  { id: "cd-pancakes", sourceId: "cafe-delice", name: "Pancakes with honey", description: "3 pancakes", price: 90, prepMin: 6, tags: [] },
  { id: "cd-lemonade", sourceId: "cafe-delice", name: "Fresh Lemonade", price: 50, prepMin: 2, tags: [] },
  { id: "cd-juice", sourceId: "cafe-delice", name: "Fresh Juice of the Day", price: 60, prepMin: 3, tags: [] },
  { id: "cd-fruit-bowl", sourceId: "cafe-delice", name: "Seasonal Fruit Bowl", price: 60, prepMin: 2, tags: [] },
];

const globalBistro: MenuItem[] = [
  { id: "gb-veg-biryani", sourceId: "global-bistro", name: "Veg Dum Biryani with raita", price: 100, prepMin: 6, tags: ["bestseller"] },
  { id: "gb-paneer-biryani", sourceId: "global-bistro", name: "Paneer Biryani with raita", price: 120, prepMin: 6, tags: [] },
  { id: "gb-hakka", sourceId: "global-bistro", name: "Veg Hakka Noodles", price: 90, prepMin: 6, tags: [] },
  { id: "gb-schezwan-rice", sourceId: "global-bistro", name: "Schezwan Fried Rice", price: 90, prepMin: 6, tags: [] },
  { id: "gb-manchurian", sourceId: "global-bistro", name: "Veg Manchurian", description: "Dry", price: 90, prepMin: 6, tags: [] },
  { id: "gb-penne", sourceId: "global-bistro", name: "Penne Arrabbiata", price: 110, prepMin: 7, tags: [] },
  { id: "gb-burger", sourceId: "global-bistro", name: "Veg Burger", price: 70, prepMin: 5, tags: [] },
  { id: "gb-fries", sourceId: "global-bistro", name: "French Fries", price: 60, prepMin: 4, tags: [] },
  { id: "gb-peri-fries", sourceId: "global-bistro", name: "Peri Peri Fries", price: 70, prepMin: 4, tags: [] },
  { id: "gb-tikka-wrap", sourceId: "global-bistro", name: "Paneer Tikka Wrap", price: 90, prepMin: 5, tags: ["bestseller"] },
];

const greensGrains: MenuItem[] = [
  { id: "gg-quinoa", sourceId: "greens-grains", name: "Quinoa Veg Bowl", price: 110, prepMin: 4, tags: [] },
  { id: "gg-paneer-bowl", sourceId: "greens-grains", name: "Paneer Salad Bowl", price: 110, prepMin: 4, tags: ["bestseller"] },
  { id: "gg-greek", sourceId: "greens-grains", name: "Greek Salad", price: 100, prepMin: 3, tags: [] },
  { id: "gg-millet", sourceId: "greens-grains", name: "Millet Khichdi Bowl", price: 90, prepMin: 4, tags: [] },
  { id: "gg-sprouts", sourceId: "greens-grains", name: "Sprouts Chaat", price: 50, prepMin: 2, tags: [] },
  { id: "gg-hummus", sourceId: "greens-grains", name: "Hummus with Veg Sticks", price: 90, prepMin: 2, tags: [] },
  { id: "gg-parfait", sourceId: "greens-grains", name: "Fruit Yogurt Parfait", price: 80, prepMin: 2, tags: [] },
  { id: "gg-smoothie", sourceId: "greens-grains", name: "Banana Oat Smoothie", price: 90, prepMin: 3, tags: [] },
  { id: "gg-cooler", sourceId: "greens-grains", name: "Mint Cucumber Cooler", price: 60, prepMin: 2, tags: [] },
  { id: "gg-chikki", sourceId: "greens-grains", name: "Peanut Chikki Bar", price: 20, prepMin: 0, tags: [] },
];

/** Prep is 0 for every vending item. Snack names should match what is loaded in the machine. */
const vending: MenuItem[] = [
  { id: "v-pb-aamras", sourceId: "vending", slot: "A1", name: "Paper Boat Aamras", price: 25, prepMin: 0, startStock: 8, tags: [] },
  { id: "v-pb-jaljeera", sourceId: "vending", slot: "A2", name: "Paper Boat Jaljeera", price: 25, prepMin: 0, startStock: 8, tags: [] },
  { id: "v-pb-kokum", sourceId: "vending", slot: "A3", name: "Paper Boat Kokum", price: 25, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-pb-aampanna", sourceId: "vending", slot: "A4", name: "Paper Boat Aam Panna", price: 25, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-pb-kalakhatta", sourceId: "vending", slot: "A5", name: "Paper Boat Jamun Kala Khatta", price: 25, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-pb-anar", sourceId: "vending", slot: "A6", name: "Paper Boat Anar", price: 25, prepMin: 0, startStock: 5, tags: [] },
  { id: "v-coke", sourceId: "vending", slot: "B1", name: "Coca-Cola", description: "Tin", price: 50, prepMin: 0, startStock: 10, tags: [] },
  { id: "v-sprite", sourceId: "vending", slot: "B2", name: "Sprite", description: "Tin", price: 50, prepMin: 0, startStock: 10, tags: [] },
  { id: "v-fanta", sourceId: "vending", slot: "B3", name: "Fanta", description: "Tin", price: 50, prepMin: 0, startStock: 10, tags: [] },
  { id: "v-ty-karare", sourceId: "vending", slot: "C1", name: "Too Yumm Karare", description: "Masala", price: 20, prepMin: 0, startStock: 8, tags: [] },
  { id: "v-ty-multigrain", sourceId: "vending", slot: "C2", name: "Too Yumm Multigrain Chips", description: "Classic Salted", price: 20, prepMin: 0, startStock: 8, tags: [] },
  { id: "v-ty-veggie", sourceId: "vending", slot: "C3", name: "Too Yumm Veggie Stix", price: 20, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-ty-bhoot", sourceId: "vending", slot: "C4", name: "Too Yumm Bhoot Chips", price: 20, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-ty-rings", sourceId: "vending", slot: "C5", name: "Too Yumm Rings", description: "Cheese", price: 20, prepMin: 0, startStock: 6, tags: [] },
  { id: "v-ty-makhana", sourceId: "vending", slot: "C6", name: "Too Yumm Makhana", description: "Peri Peri", price: 20, prepMin: 0, startStock: 5, tags: [] },
];

export const MENU_ITEMS: readonly MenuItem[] = [
  ...trulyIndian,
  ...globalBistro,
  ...cafeDelice,
  ...greensGrains,
  ...vending,
];

export const SOURCE_IDS: readonly SourceId[] = SOURCES.map((s) => s.id);

export function getSource(id: SourceId): Source {
  const source = SOURCES.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

export function isSourceId(value: string): value is SourceId {
  return SOURCES.some((s) => s.id === value);
}

export function getItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function itemsBySource(sourceId: SourceId): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.sourceId === sourceId);
}

/** The slowest item on a source's menu, in minutes. Used for the Next break estimate. */
export function slowestPrepMin(sourceId: SourceId): number {
  return Math.max(0, ...itemsBySource(sourceId).map((item) => item.prepMin));
}

/** Vending slots in machine order (A1..A6, B1..B3, C1..C6). */
export const VENDING_SLOTS: readonly string[] = vending.map((item) => item.slot as string);
