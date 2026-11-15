/**
 * Default opening hours, open days, item time windows and holidays. Source: docs/BUSINESS_RULES.md "Opening hours,
 * holidays and pauses". These are the starting values: the live values are kept in Redis (one hash, `hours`) and the
 * Cafe portal (Hours and items) edits them, so a change there does not need a deploy. Anything the Cafe has not changed
 * falls back to what is written here. Every time is IST, "HH:MM", on 5-minute steps, and the server's clock decides.
 *
 * A time window is half-open: "open 08:00 to 19:00" accepts orders from 08:00:00 up to 18:59:59, and "until 11:00"
 * stops at 11:00:00.
 */
import type { SourceId } from "./menu";

/** 0 is Sunday, 6 is Saturday, in IST. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES: readonly string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAY_SHORT: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface SourceHours {
  /** "08:00". Orders are accepted from this time. */
  open: string;
  /** "19:00". Orders stop at this time. */
  close: string;
  days: Weekday[];
}

/** An item's own window. Missing `from` means from the source's opening, missing `until` means until it closes. */
export interface ItemWindow {
  from?: string;
  until?: string;
}

/** A day on which every source is closed. `date` is "YYYY-MM-DD" in IST. */
export interface Holiday {
  date: string;
  note: string;
}

const OPEN = "08:00";
const CLOSE = "19:00";
/** Monday to Saturday. */
const WORKING_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6];

/** Every source opens 08:00 to 19:00, Monday to Saturday, except Global Bistro (12:00 to 19:00). */
export const DEFAULT_SOURCE_HOURS: Record<SourceId, SourceHours> = {
  "truly-indian": { open: OPEN, close: CLOSE, days: WORKING_DAYS },
  "cafe-delice": { open: OPEN, close: CLOSE, days: WORKING_DAYS },
  "greens-grains": { open: OPEN, close: CLOSE, days: WORKING_DAYS },
  vending: { open: OPEN, close: CLOSE, days: WORKING_DAYS },
  "global-bistro": { open: "12:00", close: CLOSE, days: WORKING_DAYS },
};

/** Breakfast is available from opening until this time ("Breakfast, until 11:00"). */
export const BREAKFAST_UNTIL = "11:00";

const BREAKFAST: ItemWindow = { until: BREAKFAST_UNTIL };

export const DEFAULT_ITEM_WINDOWS: Record<string, ItemWindow> = {
  "ti-thepla": BREAKFAST,
  "ti-poha": BREAKFAST,
  "ti-upma": BREAKFAST,
  "ti-aloo-paratha": BREAKFAST,
  "ti-paneer-paratha": BREAKFAST,
  "ti-matar-paneer-paratha": BREAKFAST,
};

/** None to start with. The Cafe adds them (for example Diwali) in Hours and items. */
export const DEFAULT_HOLIDAYS: readonly Holiday[] = [];
