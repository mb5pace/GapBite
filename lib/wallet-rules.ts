/**
 * Wallet rules as pure functions on whole rupees. Source: docs/BUSINESS_RULES.md
 * "Wallet". Safe in the browser and on the server.
 */
import { TOPUP_MAX, TOPUP_MIN, WALLET_MIN_TO_USE, WALLET_SUGGESTED } from "./config";

/**
 * blocked: under the ₹50 floor, cannot order or take a run.
 * low: ₹50 to ₹99, can use the wallet but should top up.
 * ok: ₹100 or more.
 */
export type WalletStatus = "blocked" | "low" | "ok";

export function walletStatus(balance: number): WalletStatus {
  if (balance < WALLET_MIN_TO_USE) return "blocked";
  if (balance < WALLET_SUGGESTED) return "low";
  return "ok";
}

/** Can this balance place an order or accept a run at all? */
export function canUseWallet(balance: number): boolean {
  return balance >= WALLET_MIN_TO_USE;
}

/**
 * Rupees to add before an order of `total` can be placed: the balance must be at
 * least ₹50 and at least the total. 0 means it can be placed now.
 */
export function topUpNeeded(balance: number, total: number): number {
  return Math.max(0, Math.max(WALLET_MIN_TO_USE, total) - balance);
}

/** A whole number of rupees from TOPUP_MIN to TOPUP_MAX. */
export function isValidTopUp(amount: number): boolean {
  return Number.isInteger(amount) && amount >= TOPUP_MIN && amount <= TOPUP_MAX;
}
