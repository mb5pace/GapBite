/**
 * User records and Identify. Server-side only. Source: docs/ACCESS.md.
 * There is no password on the AU number: the access code is the security.
 * Staff IDs must already exist: Admin › Staff creates them (QX-STF-01, QX-STF-02, ...).
 */
import {
  AU_NUMBER_PATTERN,
  FIRST_NAME_MAX,
  FIRST_NAME_MIN,
  STAFF_ID_PATTERN,
  STAFF_MAX,
} from "./config";
import { AppError } from "./api";
import { COPY } from "@/data/copy";
import { staffIdFromNumber } from "./ids";
import { getRedis, key } from "./redis";

export interface UserRecord {
  id: string;
  name: string;
  role: "student" | "staff";
  createdAt: number;
}

/** Letters, spaces, apostrophes and hyphens. Starts with a letter. */
const NAME_PATTERN = /^\p{L}[\p{L} '-]*$/u;

/** "au2340101 " becomes "AU2340101", or null if it is not an AU number. */
export function normalizeStudentId(input: string): string | null {
  const id = input.trim().toUpperCase();
  return AU_NUMBER_PATTERN.test(id) ? id : null;
}

export function normalizeStaffId(input: string): string | null {
  const id = input.trim().toUpperCase();
  return STAFF_ID_PATTERN.test(id) ? id : null;
}

/**
 * First name: letters, spaces, apostrophes and hyphens, 2 to 20 characters.
 * "riya" becomes "Riya", "mary  ann" becomes "Mary Ann", "d'souza" becomes "D'Souza".
 */
export function cleanFirstName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ").replace(/\u2019/g, "'");
  if (name.length < FIRST_NAME_MIN || name.length > FIRST_NAME_MAX) return null;
  if (!NAME_PATTERN.test(name)) return null;
  if ((name.match(/\p{L}/gu) ?? []).length < FIRST_NAME_MIN) return null;
  return name
    .toLocaleLowerCase("en-IN")
    .replace(/(^|[ '-])(\p{L})/gu, (_all, sep: string, letter: string) => sep + letter.toLocaleUpperCase("en-IN"));
}

export async function getUser(id: string): Promise<UserRecord | null> {
  return getRedis().get<UserRecord>(key("user", id));
}

/** Creates the student if the AU number is new. If two devices race, the first one wins and both get that record. */
async function createStudent(id: string, name: string, now: number): Promise<UserRecord> {
  const redis = getRedis();
  const record: UserRecord = { id, name, role: "student", createdAt: now };
  const created = await redis.set(key("user", id), record, { nx: true });
  if (created) {
    await redis.sadd(key("users"), id);
    return record;
  }
  const existing = await getUser(id);
  if (!existing) throw new AppError(503, COPY.gate.cannotCheck);
  return existing;
}

export type IdentifyInput =
  | { kind: "student"; id: string; name?: string }
  | { kind: "staff"; id: string };

export type IdentifyResult =
  | { status: "needs-name" }
  | { status: "ok"; user: UserRecord };

/**
 * Student: known AU number signs straight in. A new one needs a first name, asked once.
 * Staff: the ID must already exist.
 */
export async function identifyUser(input: IdentifyInput, now: number): Promise<IdentifyResult> {
  if (input.kind === "staff") {
    const id = normalizeStaffId(input.id);
    if (!id) throw new AppError(400, COPY.identify.badStaffId);
    const user = await getUser(id);
    if (!user || user.role !== "staff") throw new AppError(404, COPY.identify.staffUnknown);
    return { status: "ok", user };
  }

  const id = normalizeStudentId(input.id);
  if (!id) throw new AppError(400, COPY.identify.badAu);

  const existing = await getUser(id);
  if (existing) return { status: "ok", user: existing };

  if (input.name === undefined || input.name.trim() === "") return { status: "needs-name" };
  const name = cleanFirstName(input.name);
  if (!name) throw new AppError(400, COPY.identify.badName);
  return { status: "ok", user: await createStudent(id, name, now) };
}

// ---------------------------------------------------------------------------
// Staff accounts (Admin › Staff)
// ---------------------------------------------------------------------------

/** Creates the next staff account: QX-STF-01, QX-STF-02 and so on, from the atomic counter qx:staff:seq. */
export async function createStaff(name: string, now: number): Promise<UserRecord> {
  const clean = cleanFirstName(name);
  if (!clean) throw new AppError(400, COPY.admin.staff.badName);

  const redis = getRedis();
  const seq = key("staff", "seq");
  const n = await redis.incr(seq);
  if (n > STAFF_MAX) {
    await redis.decr(seq);
    throw new AppError(409, COPY.admin.staff.full);
  }

  const record: UserRecord = { id: staffIdFromNumber(n), name: clean, role: "staff", createdAt: now };
  await redis.set(key("user", record.id), record);
  await redis.sadd(key("users"), record.id);
  return record;
}

/** All staff accounts, in ID order. */
export async function listStaff(): Promise<UserRecord[]> {
  const redis = getRedis();
  const last = Math.min(Number((await redis.get<number>(key("staff", "seq"))) ?? 0), STAFF_MAX);
  if (last < 1) return [];
  const keys = Array.from({ length: last }, (_, i) => key("user", staffIdFromNumber(i + 1)));
  const found = await redis.mget<(UserRecord | null)[]>(...keys);
  return found.filter((u): u is UserRecord => u !== null && u.role === "staff");
}
