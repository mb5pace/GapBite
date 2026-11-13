/**
 * What can be ordered right now: the "Unavailable today" switches the cafes set
 * (Redis set qx:unavailable, written from the Cafe portal) and the
 * live vending stock. Server-side only. The menu itself is static data in
 * data/menu.ts.
 */
import { getRedis, key } from "./redis";
import type { MenuState } from "./menu-rules";
import { getStock } from "./stock";

export async function getMenuState(now: number): Promise<MenuState> {
  const [unavailable, stock] = await Promise.all([
    getRedis().smembers(key("unavailable")),
    getStock(),
  ]);
  return { now, unavailable: unavailable.map(String).sort(), stock };
}

/** Same as getMenuState, reading the server clock itself (for server components). */
export async function getMenuStateNow(): Promise<MenuState> {
  return getMenuState(Date.now());
}

/** Switches an item on or off for today. Off items cannot be ordered (the place-order script checks the same set). */
export async function setItemAvailable(itemId: string, available: boolean): Promise<void> {
  const redis = getRedis();
  if (available) await redis.srem(key("unavailable"), itemId);
  else await redis.sadd(key("unavailable"), itemId);
}
