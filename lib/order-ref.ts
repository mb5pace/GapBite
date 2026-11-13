/**
 * Reads an order ID from what a person typed or what a bag slip QR says.
 * "QX-4821", "qx-4821 " and "QX:ORDER:QX-4821" all give "QX-4821". Pure: safe in the browser and on the server.
 */
import { ORDER_ID_DIGITS, ORDER_ID_PREFIX, SLIP_QR_PREFIX } from "./config";

const ORDER_ID_PATTERN = new RegExp(`^${ORDER_ID_PREFIX}\\d{${ORDER_ID_DIGITS}}$`);

/** The order ID, or null if the text is neither an order ID nor a QuickX bag slip. */
export function parseOrderRef(input: string): string | null {
  let text = input.trim().toUpperCase();
  if (text.startsWith(SLIP_QR_PREFIX.toUpperCase())) text = text.slice(SLIP_QR_PREFIX.length).trim();
  return ORDER_ID_PATTERN.test(text) ? text : null;
}
