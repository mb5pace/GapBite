/**
 * Which items have a real photo in public/food/<item-id>.jpg. The list is made
 * at build time (next.config.ts), so nothing asks the CDN for a photo that does
 * not exist. Safe on the server and in the browser.
 */
const PHOTO_IDS = new Set((process.env.NEXT_PUBLIC_FOOD_PHOTOS ?? "").split(",").filter(Boolean));

export function hasPhoto(itemId: string): boolean {
  return PHOTO_IDS.has(itemId);
}
