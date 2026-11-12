/**
 * Identifier formats. Order IDs and 4-digit codes arrive with the ordering phases.
 * Pure helpers, safe anywhere.
 */
import { STAFF_ID_DIGITS, STAFF_ID_PREFIX } from "./config";

/** 1 becomes QX-STF-01. */
export function staffIdFromNumber(n: number): string {
  return STAFF_ID_PREFIX + String(n).padStart(STAFF_ID_DIGITS, "0");
}
