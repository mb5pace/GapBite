/**
 * Vending stock. Server-side only. The hash qx:stock maps slot -> units left.
 * It is created from each item's startStock the first time anyone reads it, so
 * the atomic decrement and refund in Phase 5 always find a number there.
 */
import { MENU_ITEMS } from "@/data/menu";
import { getRedis, key } from "./redis";

const stockKey = () => key("stock");

/** HSETNX every slot: only slots that do not exist yet are created. */
async function ensureStock(): Promise<void> {
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
