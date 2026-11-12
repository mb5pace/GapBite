/**
 * User records and Identify. Server-side only. Source: docs/ACCESS.md.
 * There is no password on the AU number: the access code is the security.
 * Staff IDs must already exist (Admin › Staff creates them, built in Phase 6).
 */
import {
  AU_NUMBER_PATTERN,
  FIRST_NAME_MAX,
  FIRST_NAME_MIN,
  STAFF_ID_PATTERN,
} from "./config";
import { AppError } from "./api";
import { COPY } from "@/data/copy";
import { getRedis, key } from "./redis";

export interface UserRecord {
  id: string;
  name: string;
  role: "student" | "staff";
  createdAt: number;
}

const NAME_PATTERN = new RegExp(`^\\p{L}{${FIRST_NAME_MIN},${FIRST_NAME_MAX}}$`, "u");

/** "au2340101 " becomes "AU2340101", or null if it is not an AU number. */
export function normalizeStudentId(input: string): string | null {
  const id = input.trim().toUpperCase();
  return AU_NUMBER_PATTERN.test(id) ? id : null;
}

export function normalizeStaffId(input: string): string | null {
  const id = input.trim().toUpperCase();
  return STAFF_ID_PATTERN.test(id) ? id : null;
}

/** "riya" becomes "Riya". Letters only, 2 to 20 of them. */
export function cleanFirstName(input: string): string | null {
  const name = input.trim();
  if (!NAME_PATTERN.test(name)) return null;
  return name.charAt(0).toLocaleUpperCase("en-IN") + name.slice(1).toLocaleLowerCase("en-IN");
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
