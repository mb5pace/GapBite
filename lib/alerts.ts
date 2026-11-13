/**
 * The cards pinned above the cafe queue (docs/FLOWS.md section 5, docs/SCREENS.md "Alerts"). Server-side only.
 * One per settled order, in the hash qx:alerts (order ID -> alert). They stay until a staff member acts:
 *   failed        red, "Seen"
 *   staff-return  red, "Returned" (the bag is back at the counter)
 *   no-show       amber, the buyer's code ("Collect") until the hold ends, then "Seen"
 * Each action is one Lua script, so two laptops tapping at once act once.
 */
import { CAFE_COPY } from "@/data/cafe-copy";
import { collectedUpdate } from "@/data/order-copy";
import { AppError } from "./api";
import { UPDATES_KEEP } from "./config";
import { alertsKey, getOrder, orderKey } from "./orders";
import type { CafeAlert } from "./order-types";
import { getRedis } from "./redis";
import { formatClock } from "./time";
import { makeUpdate, unreadKey, updatesKey } from "./updates";

/** Every alert still open, oldest first. */
export async function listAlerts(): Promise<CafeAlert[]> {
  const all = (await getRedis().hgetall<Record<string, CafeAlert>>(alertsKey())) ?? {};
  return Object.values(all)
    .filter((alert): alert is CafeAlert => typeof alert === "object" && alert !== null)
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}

export type AlertAction = "seen" | "returned" | "collect";

/**
 * KEYS: 1 alerts, 2 the order, 3 buyer's updates, 4 buyer's unread.
 * ARGV: 1 alert id, 2 action, 3 now, 4 the code typed (collect), 5 the buyer's Update (JSON, collect), 6 updates size.
 * Returns { 1 } or { 0, reason [, holdUntil] } with nothing changed.
 */
const ALERT_LUA = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return { 0, 'gone' } end
local alert = cjson.decode(raw)
local now = tonumber(ARGV[3])
local action = ARGV[2]

if action == 'seen' then
  if alert.kind == 'staff-return' then return { 0, 'kind' } end
  if alert.kind == 'no-show' and now < alert.holdUntil then return { 0, 'hold', alert.holdUntil } end
  redis.call('HDEL', KEYS[1], ARGV[1])
  return { 1 }
end

if action == 'returned' then
  if alert.kind ~= 'staff-return' then return { 0, 'kind' } end
  local order = cjson.decode(redis.call('GET', KEYS[2]))
  table.insert(order.events, { at = now, status = order.status, note = 'Bag returned to the counter' })
  order.updatedAt = now
  redis.call('SET', KEYS[2], cjson.encode(order))
  redis.call('HDEL', KEYS[1], ARGV[1])
  return { 1 }
end

if action == 'collect' then
  if alert.kind ~= 'no-show' then return { 0, 'kind' } end
  if now >= alert.holdUntil then return { 0, 'ended' } end
  local order = cjson.decode(redis.call('GET', KEYS[2]))
  if order.status ~= 'NO_SHOW' or order.collectedAt then return { 0, 'gone' } end
  if order.code ~= ARGV[4] then return { 0, 'code' } end
  order.collectedAt = now
  table.insert(order.events, { at = now, status = 'NO_SHOW', note = 'Collected at the counter' })
  order.updatedAt = now
  redis.call('SET', KEYS[2], cjson.encode(order))
  redis.call('HDEL', KEYS[1], ARGV[1])
  redis.call('LPUSH', KEYS[3], ARGV[5])
  redis.call('LTRIM', KEYS[3], 0, tonumber(ARGV[6]) - 1)
  redis.call('INCR', KEYS[4])
  return { 1 }
end
return { 0, 'kind' }
`;

/** Acts on one alert. A wrong code changes nothing. */
export async function resolveAlert(id: string, action: AlertAction, code: string | undefined, now: number): Promise<void> {
  const order = await getOrder(id);
  if (!order) throw new AppError(409, CAFE_COPY.alerts.gone);
  const update = makeUpdate(order.buyerId, { ...collectedUpdate(), kind: "order", orderId: order.id }, now);
  const result = (await getRedis().eval(
    ALERT_LUA,
    [alertsKey(), orderKey(order.id), updatesKey(order.buyerId), unreadKey(order.buyerId)],
    [order.id, action, now, code ?? "", JSON.stringify(update), UPDATES_KEEP],
  )) as [number, string?, number?];
  if (result[0] === 1) return;
  switch (result[1]) {
    case "gone":
      throw new AppError(409, CAFE_COPY.alerts.gone);
    case "kind":
      throw new AppError(400, CAFE_COPY.alerts.wrongKind);
    case "hold":
      throw new AppError(409, CAFE_COPY.alerts.notYet(formatClock(Number(result[2]))));
    case "ended":
      throw new AppError(409, CAFE_COPY.alerts.holdEnded);
    case "code":
      throw new AppError(400, CAFE_COPY.errors.codeMismatch);
    default:
      throw new AppError(503, CAFE_COPY.errors.network);
  }
}
