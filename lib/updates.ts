/**
 * Updates: the in-app notification feed (docs/FLOWS.md section 6). Server-side only.
 * qx:updates:<userId> is a list, newest first, trimmed to UPDATES_KEEP. qx:unread:<userId>
 * counts how many of the newest entries have not been seen. "Read" is therefore
 * derived: an entry is unread if it is among the newest `unread` ones. Opening the
 * Updates tab resets the counter to 0.
 */
import { randomBytes } from "node:crypto";
import { UPDATES_KEEP } from "./config";
import { getRedis, key } from "./redis";

export type UpdateKind = "order" | "wallet" | "alert";

export interface UpdateRecord {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  body: string;
  kind: UpdateKind;
  /** Server time, epoch ms. */
  at: number;
}

export interface UpdateView extends UpdateRecord {
  read: boolean;
}

export const updatesKey = (userId: string) => key("updates", userId);
export const unreadKey = (userId: string) => key("unread", userId);

/** Builds an Update. Callers pass it to pushUpdate, or into an order script that files it atomically. */
export function makeUpdate(
  userId: string,
  fields: { title: string; body: string; kind: UpdateKind; orderId?: string },
  now: number,
): UpdateRecord {
  const record: UpdateRecord = {
    id: `${now.toString(36)}${randomBytes(3).toString("hex")}`,
    userId,
    title: fields.title,
    body: fields.body,
    kind: fields.kind,
    at: now,
  };
  if (fields.orderId) record.orderId = fields.orderId;
  return record;
}

const PUSH_LUA = `
redis.call('LPUSH', KEYS[1], ARGV[1])
redis.call('LTRIM', KEYS[1], 0, tonumber(ARGV[2]) - 1)
redis.call('INCR', KEYS[2])
return 1
`;

/** Adds an Update at the top of the user's feed and counts it as unread. */
export async function pushUpdate(update: UpdateRecord): Promise<void> {
  await getRedis().eval(PUSH_LUA, [updatesKey(update.userId), unreadKey(update.userId)], [
    JSON.stringify(update),
    UPDATES_KEEP,
  ]);
}

export async function getUnread(userId: string): Promise<number> {
  const raw = await getRedis().get<number>(unreadKey(userId));
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 0;
  return Math.max(0, Math.min(n, UPDATES_KEEP));
}

/** The feed, newest first, each with its derived read flag. */
export async function listUpdates(userId: string): Promise<{ updates: UpdateView[]; unread: number; now: number }> {
  const redis = getRedis();
  const [rows, unread] = await Promise.all([
    redis.lrange<UpdateRecord>(updatesKey(userId), 0, UPDATES_KEEP - 1),
    getUnread(userId),
  ]);
  const updates = rows
    .filter((row): row is UpdateRecord => typeof row === "object" && row !== null)
    .map((row, index) => ({ ...row, read: index >= unread }));
  return { updates, unread, now: Date.now() };
}

/** Opening the Updates tab: everything counts as read. */
export async function markAllRead(userId: string): Promise<void> {
  await getRedis().set(unreadKey(userId), 0);
}
