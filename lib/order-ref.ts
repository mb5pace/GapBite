/**
 * Reads an order ID from what a person typed or what a bag slip QR says.
 * "QX-4821", "qx-4821 " and "QX:ORDER:QX-4821" all give "QX-4821". Pure: safe in the browser and on the server.
 */
import { COLLECT_QR_PREFIX, ORDER_ID_DIGITS, ORDER_ID_PREFIX, SLIP_QR_PREFIX } from "./config";

const ORDER_ID_PATTERN = new RegExp(`^${ORDER_ID_PREFIX}\\d{${ORDER_ID_DIGITS}}$`);

/** The order ID, or null if the text is neither an order ID nor a QuickX bag slip. */
export function parseOrderRef(input: string): string | null {
  let text = input.trim().toUpperCase();
  if (text.startsWith(SLIP_QR_PREFIX.toUpperCase())) text = text.slice(SLIP_QR_PREFIX.length).trim();
  return ORDER_ID_PATTERN.test(text) ? text : null;
}

const CODE_PATTERN = /^\d{4}$/;

/** The text in a pickup order's collect QR: "QX:COLLECT:QX-4821:0357". Only ever made for the buyer's own order. */
export function collectQrText(orderId: string, code: string): string {
  return `${COLLECT_QR_PREFIX}${orderId}:${code}`;
}

/**
 * Reads a collect QR (the cafe's scanner in Phase C): the order ID and the 4-digit code, or null if the text is not
 * a QuickX collect QR. "QX:ORDER:..." bag slips are not collect QRs.
 */
export function parseCollectQr(input: string): { orderId: string; code: string } | null {
  const text = input.trim().toUpperCase();
  if (!text.startsWith(COLLECT_QR_PREFIX)) return null;
  const [orderId, code, ...rest] = text.slice(COLLECT_QR_PREFIX.length).split(":");
  if (rest.length > 0 || !orderId || !code) return null;
  return ORDER_ID_PATTERN.test(orderId) && CODE_PATTERN.test(code) ? { orderId, code } : null;
}
