/**
 * Opening hours, open days, pauses, item windows and holidays (one Redis hash, `hours`) and the service-wide switch (a
 * second hash, `service`). Server-side only. The rules and the defaults live in hours-rules.ts and data/hours.ts; this
 * file only reads and writes what the Cafe and Admin changed.
 *
 * Every setting is its own field in the hash, so two people editing different things at once never overwrite each
 * other: `s:<source>` open, close and days; `p:<source>` paused; `i:<item>` an item's window; `h:<date>` a holiday.
 */
import type { Holiday, ItemWindow, Weekday } from "@/data/hours";
import { SERVICE_MESSAGE_MAX, HOLIDAY_NOTE_MAX } from "./config";
import {
  HOURS_ERRORS,
  cleanDays,
  mergeHours,
  mergeService,
  validateHoliday,
  validateSourceHours,
  validateWindow,
  type HoursConfig,
  type ServiceState,
} from "./hours-rules";
import { AppError } from "./api";
import { SOURCES, getItem, type SourceId } from "@/data/menu";
import { getRedis, key } from "./redis";

const hoursKey = () => key("hours");
const serviceKey = () => key("service");

export async function getHoursConfig(): Promise<HoursConfig> {
  return mergeHours(await getRedis().hgetall<Record<string, unknown>>(hoursKey()));
}

export async function getService(): Promise<ServiceState> {
  return mergeService(await getRedis().hgetall<Record<string, unknown>>(serviceKey()));
}

function knownSource(id: string): SourceId {
  if (!SOURCES.some((s) => s.id === id)) throw new AppError(400, HOURS_ERRORS.unknownSource);
  return id as SourceId;
}

/** Opening and closing time and the open days for one source. */
export async function saveSourceHours(sourceId: string, v: { open: string; close: string; days: number[] }): Promise<HoursConfig> {
  const id = knownSource(sourceId);
  const problem = validateSourceHours(v);
  if (problem) throw new AppError(400, problem);
  await getRedis().hset(hoursKey(), { [`s:${id}`]: { open: v.open, close: v.close, days: cleanDays(v.days) as Weekday[] } });
  return getHoursConfig();
}

/** "Taking orders / Paused" for one source. Orders already placed are not touched. */
export async function savePaused(sourceId: string, paused: boolean): Promise<HoursConfig> {
  const id = knownSource(sourceId);
  await getRedis().hset(hoursKey(), { [`p:${id}`]: paused });
  return getHoursConfig();
}

/**
 * An item's own window. `null` puts the default back (the breakfast items go back to "until 11:00"); an empty window
 * ("no limit") is stored as one so it overrides the default.
 */
export async function saveItemWindow(itemId: string, w: ItemWindow | null): Promise<HoursConfig> {
  if (!getItem(itemId)) throw new AppError(400, HOURS_ERRORS.unknownItem);
  const redis = getRedis();
  if (w === null) {
    await redis.hdel(hoursKey(), `i:${itemId}`);
  } else {
    const problem = validateWindow(w);
    if (problem) throw new AppError(400, problem);
    const clean: ItemWindow = {};
    if (w.from) clean.from = w.from;
    if (w.until) clean.until = w.until;
    await redis.hset(hoursKey(), { [`i:${itemId}`]: clean });
  }
  return getHoursConfig();
}

export async function addHoliday(date: string, note: string): Promise<HoursConfig> {
  const current = await getHoursConfig();
  const problem = validateHoliday(date, note, current.holidays.filter((h) => h.date !== date).length);
  if (problem) throw new AppError(400, problem);
  await getRedis().hset(hoursKey(), { [`h:${date}`]: note.trim().slice(0, HOLIDAY_NOTE_MAX) });
  return getHoursConfig();
}

export async function removeHoliday(date: string): Promise<HoursConfig> {
  await getRedis().hdel(hoursKey(), `h:${date}`);
  return getHoursConfig();
}

/** Admin › Service: the switch for the whole service, and what students read while it is off. */
export async function saveService(available: boolean, message: string): Promise<ServiceState> {
  const text = message.trim().slice(0, SERVICE_MESSAGE_MAX);
  await getRedis().hset(serviceKey(), { available, message: text });
  return getService();
}

export type { Holiday };
