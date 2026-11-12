/**
 * Wallet balance, integer rupees. Server-side only.
 * Phase 2 only reads the balance for the header chip. Credit, debit, the ledger
 * and the ₹50 rules arrive with the wallet in Phase 4.
 */
import { getRedis, key } from "./redis";

/** A user with no wallet key yet has ₹0. */
export async function getBalance(userId: string): Promise<number> {
  const raw = await getRedis().get<number>(key("wallet", userId));
  return typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 0;
}
