import { COPY } from "@/data/copy";
import type { MenuItem } from "@/data/menu";
import { itemNote, itemStatus, type MenuState } from "@/lib/menu-rules";

/**
 * The short words on a menu row or card that cannot be added right now, or null when it can: "Not today" (the cafe
 * switched it off), "Sold out", "Opens at 12:00" or "Paused" (its place is not taking orders) or "Breakfast, until
 * 11:00" (outside its time window).
 */
export function itemStateText(item: MenuItem, menu: MenuState): string | null {
  switch (itemStatus(item, menu)) {
    case "ok":
      return null;
    case "unavailable":
      return COPY.student.menu.notToday;
    case "sold-out":
      return COPY.student.menu.soldOut;
    default:
      return itemNote(item, menu);
  }
}
