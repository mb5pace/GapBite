/**
 * The wallet. Server-side only. Source: docs/BUSINESS_RULES.md "Wallet".
 *
 * Money is whole rupees. Every change is one Lua script that moves the balance
 * (qx:wallet:<id>) and writes the ledger entry (qx:ledger:<id>) together, so a
 * crash or two simultaneous requests can never leave them disagreeing
 * (docs/ARCHITECTURE.md "Concurrency"). The ledger keeps the latest LEDGER_KEEP entries.
 */
import { LEDGER_KEEP } from "./config";
import { getRedis, key } from "./redis";

export type LedgerType = "topup" | "order" | "refund" | "earning" | "penalty" | "adjustment";

export interface LedgerEntry {
  /** Server time, epoch ms. */
  at: number;
  type: LedgerType;
  /** Signed whole rupees: credits positive, debits negative. */
  amount: number;
  /** The wallet balance right after this change. */
  balance: number;
  orderId?: string;
  note?: string;
}

const balanceKey = (userId: string) => key("wallet", userId);
const ledgerKey = (userId: string) => key("ledger", userId);

/**
 * KEYS: balance, ledger. ARGV: delta, entry JSON, ledger size, floor ("" for none).
 * With a floor, a debit that would leave the balance under it changes nothing.
 * Returns { 1, newBalance } on success and { 0, currentBalance } when refused.
 */
const MOVE_LUA = `
local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
local delta = tonumber(ARGV[1])
local after = bal + delta
if ARGV[4] ~= '' and delta < 0 and after < tonumber(ARGV[4]) then
  return { 0, bal }
end
redis.call('SET', KEYS[1], after)
local entry = cjson.decode(ARGV[2])
entry.balance = after
redis.call('LPUSH', KEYS[2], cjson.encode(entry))
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[3]) - 1)
return { 1, after }
`;

export interface MoveResult {
  ok: boolean;
  /** The balance after the change, or the unchanged balance when it was refused. */
  balance: number;
}

/**
 * Adds `amount` (negative to take money out) and writes the ledger entry, all at once.
 * `floor` is the lowest balance a debit may leave behind. Penalties pass none.
 */
export async function moveMoney(
  userId: string,
  amount: number,
  entry: { type: LedgerType; orderId?: string; note?: string },
  now: number,
  options: { floor?: number } = {},
): Promise<MoveResult> {
  if (!Number.isInteger(amount) || amount === 0) throw new Error("Wallet amounts are whole, non-zero rupees.");

  const record: Omit<LedgerEntry, "balance"> = { at: now, type: entry.type, amount };
  if (entry.orderId) (record as LedgerEntry).orderId = entry.orderId;
  if (entry.note) (record as LedgerEntry).note = entry.note;

  const result = (await getRedis().eval(
    MOVE_LUA,
    [balanceKey(userId), ledgerKey(userId)],
    [amount, JSON.stringify(record), LEDGER_KEEP, options.floor === undefined ? "" : options.floor],
  )) as [number, number];

  return { ok: result[0] === 1, balance: Number(result[1]) };
}

/** A user with no wallet key yet has ₹0. */
export async function getBalance(userId: string): Promise<number> {
  const raw = await getRedis().get<number>(balanceKey(userId));
  return typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 0;
}

/** Newest first. */
export async function getLedger(userId: string, limit = LEDGER_KEEP): Promise<LedgerEntry[]> {
  const rows = await getRedis().lrange<LedgerEntry>(ledgerKey(userId), 0, Math.max(0, limit - 1));
  return rows.filter((row): row is LedgerEntry => typeof row === "object" && row !== null);
}

/** Balances for many users at once, in the same order as `userIds`. */
export async function getBalances(userIds: string[]): Promise<number[]> {
  if (userIds.length === 0) return [];
  const raw = await getRedis().mget<(number | null)[]>(...userIds.map(balanceKey));
  return raw.map((value) => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0));
}

/** Mock UPI top-up: always succeeds, adds `amount` and writes a "topup" entry. */
export function topUp(userId: string, amount: number, now: number): Promise<MoveResult> {
  return moveMoney(userId, amount, { type: "topup", note: "Mock UPI top-up" }, now);
}

/**
 * Admin adjustment, positive or negative, with the note the admin typed. A wallet
 * can only go negative through a late-delivery penalty (rule 7), so an adjustment
 * may not take the balance under ₹0.
 */
export function adjust(userId: string, amount: number, note: string, now: number): Promise<MoveResult> {
  return moveMoney(userId, amount, { type: "adjustment", note }, now, { floor: 0 });
}

export interface WalletSnapshot {
  balance: number;
  ledger: LedgerEntry[];
  /** Server time, epoch ms, for "Today 14:05" labels. */
  now: number;
}

/** Balance and ledger together, read on the server for the wallet page and /api/wallet. */
export async function getWalletSnapshot(userId: string): Promise<WalletSnapshot> {
  const [balance, ledger] = await Promise.all([getBalance(userId), getLedger(userId)]);
  return { balance, ledger, now: Date.now() };
}
