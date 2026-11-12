/**
 * Access codes. Server-side only. Source: docs/ACCESS.md.
 *
 * Permanent codes live only in env QX_PERMANENT_CODES. The temporary pool lives
 * in the Redis hash qx:codes:temp (field = code, value = CodeRecord as JSON).
 *
 * Every status change goes through one Lua script, so it is all-or-nothing:
 * two devices typing the same unused code at once can never both get in.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import {
  ACCESS_CODE_ALPHABET,
  ACCESS_CODE_GROUP_SIZE,
  ACCESS_CODE_LENGTH,
  ACCESS_CODE_PATTERN,
  CODE_COLLISION_RETRIES,
  PERMANENT_CODE_COUNT,
  PERMANENT_CODE_MASK_VISIBLE,
  POOL_LOCK_TTL_SEC,
  SESSION_MIN,
  TEMP_POOL_SIZE,
} from "./config";
import { getRedis, key } from "./redis";

export type CodeStatus = "unused" | "active" | "burned" | "revoked";

export interface CodeRecord {
  code: string;
  status: CodeStatus;
  createdAt: number;
  usedAt?: number;
  /** AU number or staff ID. Known only after Identify, so it is filled in a moment after the burn. */
  usedBy?: string;
  sessionEndsAt?: number;
}

const tempKey = () => key("codes", "temp");
const poolLockKey = () => key("lock", "poolfill");

// ---------------------------------------------------------------------------
// Typing, comparing, formatting
// ---------------------------------------------------------------------------

/** Codes are typed without the dash, in any case. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function looksLikeTempCode(normalized: string): boolean {
  return ACCESS_CODE_PATTERN.test(normalized);
}

/** Compares two strings in constant time, whatever their lengths. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function generateCode(): string {
  let out = "";
  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
    out += ACCESS_CODE_ALPHABET[randomInt(ACCESS_CODE_ALPHABET.length)];
  }
  return out;
}

/** K7QM2X becomes K7Q-M2X. */
export function formatCode(code: string): string {
  const groups: string[] = [];
  for (let i = 0; i < code.length; i += ACCESS_CODE_GROUP_SIZE) {
    groups.push(code.slice(i, i + ACCESS_CODE_GROUP_SIZE));
  }
  return groups.join("-");
}

// ---------------------------------------------------------------------------
// Permanent codes (env only)
// ---------------------------------------------------------------------------

/** The codes exactly as written in env, trimmed. */
export function permanentCodes(): string[] {
  return (process.env.QX_PERMANENT_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

export function matchesPermanent(typed: string): boolean {
  const wanted = normalizeCode(typed);
  if (!wanted) return false;
  // Check every code, no early exit, so timing does not reveal which one was close.
  let matched = false;
  for (const code of permanentCodes()) {
    if (safeEqual(normalizeCode(code), wanted)) matched = true;
  }
  return matched;
}

/** K7Q-M2X becomes K7••••. */
export function maskCode(code: string): string {
  return code.slice(0, PERMANENT_CODE_MASK_VISIBLE) + "••••";
}

// ---------------------------------------------------------------------------
// Temporary pool (Redis)
// ---------------------------------------------------------------------------

/**
 * Moves one record from status `from` to `to` and merges `patch`, atomically.
 * Returns 0 if the code does not exist or is not in status `from`.
 */
const TRANSITION_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 0 end
local rec = cjson.decode(raw)
if rec.status ~= ARGV[2] then return 0 end
rec.status = ARGV[3]
local patch = cjson.decode(ARGV[4])
for k, v in pairs(patch) do rec[k] = v end
redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(rec))
return 1
`;

async function transition(
  code: string,
  from: CodeStatus,
  to: CodeStatus,
  patch: Partial<CodeRecord>,
): Promise<boolean> {
  const result = await getRedis().eval(
    TRANSITION_LUA,
    [tempKey()],
    [code, from, to, JSON.stringify(patch)],
  );
  return result === 1;
}

/** Adds one new unused code. Retries on the unlikely chance the random code already exists. */
async function addUnusedCode(now: number): Promise<string | null> {
  const redis = getRedis();
  for (let i = 0; i < CODE_COLLISION_RETRIES; i++) {
    const code = generateCode();
    const record: CodeRecord = { code, status: "unused", createdAt: now };
    const added = await redis.hsetnx(tempKey(), code, record);
    if (added === 1) return code;
  }
  return null;
}

async function readAll(): Promise<CodeRecord[]> {
  const all = await getRedis().hgetall<Record<string, CodeRecord>>(tempKey());
  return all ? Object.values(all) : [];
}

/** Makes sure the pool holds TEMP_POOL_SIZE unused codes. Safe to call from anywhere, any time. */
export async function fillPool(now: number): Promise<void> {
  const redis = getRedis();
  const gotLock = await redis.set(poolLockKey(), "1", { nx: true, ex: POOL_LOCK_TTL_SEC });
  if (!gotLock) return; // another request is already topping it up
  try {
    const unused = (await readAll()).filter((r) => r.status === "unused").length;
    for (let i = unused; i < TEMP_POOL_SIZE; i++) await addUnusedCode(now);
  } finally {
    await redis.del(poolLockKey());
  }
}

/**
 * Burns an unused code for a new session. First valid caller wins; everyone else gets null.
 * The session ends SESSION_MIN.temp minutes from now. A fresh code is added so the pool stays full.
 */
export async function burnTempCode(
  typed: string,
  now: number,
): Promise<{ code: string; sessionEndsAt: number } | null> {
  const code = normalizeCode(typed);
  if (!looksLikeTempCode(code)) return null;

  const sessionEndsAt = now + SESSION_MIN.temp * 60_000;
  const won = await transition(code, "unused", "active", { usedAt: now, sessionEndsAt });
  if (!won) return null;

  try {
    await addUnusedCode(now);
  } catch {
    // The login still counts. The next Admin visit tops the pool up.
  }
  return { code, sessionEndsAt };
}

/** True while the code's session is active and has not run out. */
export async function isTempSessionActive(code: string, now: number): Promise<boolean> {
  const record = await getRedis().hget<CodeRecord>(tempKey(), code);
  if (!record || record.status !== "active") return false;
  return typeof record.sessionEndsAt === "number" && record.sessionEndsAt > now;
}

/** Remembers who used the code, once Identify knows. */
export async function setTempCodeUser(code: string, userId: string): Promise<void> {
  await transition(code, "active", "active", { usedBy: userId });
}

/** Ends an active session now. The code stays burned. */
export async function endTempSession(code: string, now: number): Promise<boolean> {
  return transition(code, "active", "burned", { sessionEndsAt: now });
}

/** Admin: takes an unused code out of use and adds a replacement. */
export async function revokeTempCode(code: string, now: number): Promise<boolean> {
  const revoked = await transition(code, "unused", "revoked", {});
  if (revoked) await addUnusedCode(now);
  return revoked;
}

// ---------------------------------------------------------------------------
// Admin view
// ---------------------------------------------------------------------------

export interface TempCodeRow {
  code: string;
  display: string;
  /** "burned" also covers an active code whose 15 minutes have run out. */
  status: CodeStatus;
  usedBy?: string;
  usedAt?: number;
  /** Time left on an active session, measured on the server at the moment of this reply. */
  msLeft?: number;
}

export interface AdminCodesSnapshot {
  now: number;
  permanent: { expected: number; masked: string[] };
  temp: { poolSize: number; unused: number; rows: TempCodeRow[] };
}

const STATUS_ORDER: Record<CodeStatus, number> = { unused: 0, active: 1, burned: 2, revoked: 3 };

export async function adminSnapshot(now: number): Promise<AdminCodesSnapshot> {
  await fillPool(now);
  const records = await readAll();

  const sorted = records
    .map((r) => {
      const expired = r.status === "active" && (r.sessionEndsAt ?? 0) <= now;
      const status: CodeStatus = expired ? "burned" : r.status;
      const row: TempCodeRow = {
        code: r.code,
        display: formatCode(r.code),
        status,
        usedBy: r.usedBy,
        usedAt: r.usedAt,
        msLeft: status === "active" ? Math.max(0, (r.sessionEndsAt ?? now) - now) : undefined,
      };
      return { row, recency: r.usedAt ?? r.createdAt };
    })
    .sort((a, b) =>
      a.row.status !== b.row.status
        ? STATUS_ORDER[a.row.status] - STATUS_ORDER[b.row.status]
        : b.recency - a.recency,
    );

  const rows = sorted.map((s) => s.row);
  return {
    now,
    permanent: {
      expected: PERMANENT_CODE_COUNT,
      masked: permanentCodes().map(maskCode),
    },
    temp: {
      poolSize: TEMP_POOL_SIZE,
      unused: rows.filter((r) => r.status === "unused").length,
      rows,
    },
  };
}
