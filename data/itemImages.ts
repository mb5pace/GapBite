/**
 * Hotlinked photos for menu item cards, keyed by menu item id (data/menu.ts). Nothing is downloaded or committed: the
 * browser loads each URL directly. An item with no entry, or whose photo fails to load, shows its initials tile.
 */
export interface ItemImageEntry {
  url: string;
  /** CSS object-position for the crop's focal point, e.g. "center 40%". Default centre. */
  objectPosition?: string;
  alt: string;
}

export const ITEM_IMAGES: Record<string, ItemImageEntry> = {};
