/**
 * Vending stock. Server-side only. The hash qx:stock maps slot -> units left.
 * It is created from each item's startStock the first time anyone reads it, so
 * the atomic decrement and refund in Phase 5 always find a number there.
 */
import { MENU_ITEMS } from "@/data/menu";
import { getRedis, key } from "./redis";

const stockKey = () => key("stock");

/** HSETNX every slot: only slots that do not exist yet are created. */
export async function ensureStock(): Promise<void> {
  const redis = getRedis();
  if ((await redis.exists(stockKey())) === 1) return;
  const pipeline = redis.pipeline();
  for (const item of MENU_ITEMS) {
    if (item.slot !== undefined) pipeline.hsetnx(stockKey(), item.slot, item.startStock ?? 0);
  }
  await pipeline.exec();
}

/** Slot -> units left, for all 15 slots. */
export async function getStock(): Promise<Record<string, number>> {
  await ensureStock();
  const raw = (await getRedis().hgetall<Record<string, number>>(stockKey())) ?? {};
  const stock: Record<string, number> = {};
  for (const item of MENU_ITEMS) {
    if (item.slot === undefined) continue;
    const value = Number(raw[item.slot]);
    stock[item.slot] = Number.isFinite(value) ? value : item.startStock ?? 0;
  }
  return stock;
}

const ADJUST_LUA = `
local current = tonumber(redis.call('HGET', KEYS[1], ARGV[1]) or '0')
local next = current + tonumber(ARGV[2])
if next < 0 then next = 0 end
redis.call('HSET', KEYS[1], ARGV[1], next)
return next
`;

/** Adds or removes units from one slot. Never goes below 0. Returns the new count. */
export async function adjustStock(slot: string, delta: number): Promise<number> {
  await ensureStock();
  return Number(await getRedis().eval(ADJUST_LUA, [stockKey()], [slot, delta]));
}

/** Every slot back to its full count (the machine has just been loaded). */
export async function refillAll(): Promise<void> {
  const pipeline = getRedis().pipeline();
  for (const item of MENU_ITEMS) {
    if (item.slot !== undefined) pipeline.hset(stockKey(), { [item.slot]: item.startStock ?? 0 });
  }
  await pipeline.exec();
}
