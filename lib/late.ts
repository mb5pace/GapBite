/**
 * Lazy lateness check (docs/FLOWS.md section 5). There is no background job on the free tier, so every
 * cafe queue poll, buyer and runner order poll and the Admin live-orders poll calls sweepLate first.
 * Server-side only.
 *
 * Settling an overdue order is ONE Lua script: the order's status and indexes, the buyer's refund and
 * ledger line, the holder's debit or earning and ledger line, vending stock, the Updates and the cafe
 * alert all change together or not at all. The script also takes the one-time penalty lock
 * (qx:penalty:<id>) and checks the order is still in the state the sweep saw, so three devices polling at
 * the same moment settle an order exactly once, and a handover that lands first simply wins.
 */
import { getBuilding } from "@/data/locations";
import { getItem } from "@/data/menu";
import {
  failedLateBuyerUpdate,
  noShowBuyerUpdate,
  noShowHolderUpdate,
  runnerPenaltyUpdate,
  staffReturnUpdate,
} from "@/data/order-copy";
import { logSafeMessage } from "./api";
import { CAFE_ORDERS_MAX, LEDGER_KEEP, RUNNER_EARN, SWEEP_MIN_INTERVAL_MS, UPDATES_KEEP } from "./config";
import { type LateOutcome, lateOutcome, noShowHoldEnd } from "./late-rules";
import { activeKey, alertsKey, doneKey, liveKey, orderKey, runsLiveKey } from "./orders";
import type { CafeAlert, Order } from "./order-types";
import { getRedis, key } from "./redis";
import { healRunIndexes } from "./runs";
import { makeUpdate, unreadKey, updatesKey } from "./updates";
import { LUA_MOVE_MONEY } from "./wallet";

const walletKey = (userId: string) => key("wallet", userId);
const ledgerKey = (userId: string) => key("ledger", userId);
const penaltyKey = (orderId: string) => key("penalty", orderId);

/**
 * KEYS: 1 order, 2 active, 3 done, 4 penalty lock, 5 buyer's live set, 6 buyer's wallet, 7 buyer's ledger,
 *       8 buyer's updates, 9 buyer's unread, 10 vending stock, 11 holder's live runs, 12 holder's wallet,
 *       13 holder's ledger, 14 holder's updates, 15 holder's unread, 16 cafe alerts.
 * ARGV: 1 order id, 2 status the sweep saw, 3 holder id it saw ("" for none), 4 arrivedAt it saw ("" for none),
 *       5 new status, 6 now, 7 "1" = refund the buyer, 8 the buyer's ledger entry (JSON), 9 the buyer's Update (JSON),
 *       10 vending stock to put back (JSON list of [slot, quantity]), 11 the holder's money change ("0" for none),
 *       12 the holder's ledger entry (JSON), 13 the holder's Update (JSON, "" for none), 14 the cafe alert (JSON),
 *       15 note for the order's history, 16 ledger size, 17 updates size.
 * Returns { 1 } settled, or { 0, "settled" | "missing" | "changed" } with nothing changed.
 */
const SETTLE_LUA =
  LUA_MOVE_MONEY +
  `
if redis.call('EXISTS', KEYS[4]) == 1 then return { 0, 'settled' } end
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)
if order.status ~= ARGV[2] then return { 0, 'changed' } end
local holderId = ''
if order.holder then holderId = order.holder.id end
if holderId ~= ARGV[3] then return { 0, 'changed' } end
if ARGV[4] == '' then
  if order.arrivedAt then return { 0, 'changed' } end
else
  if order.arrivedAt ~= tonumber(ARGV[4]) then return { 0, 'changed' } end
end

local now = tonumber(ARGV[6])
redis.call('SET', KEYS[4], ARGV[6])
order.status = ARGV[5]
table.insert(order.events, { at = now, status = ARGV[5], note = ARGV[15] })
order.updatedAt = now
redis.call('SET', KEYS[1], cjson.encode(order))
redis.call('ZREM', KEYS[2], ARGV[1])
redis.call('ZADD', KEYS[3], now, ARGV[1])
redis.call('SREM', KEYS[5], ARGV[1])
if holderId ~= '' then redis.call('SREM', KEYS[11], ARGV[1]) end

if ARGV[7] == '1' then
  move_money(KEYS[6], KEYS[7], order.total, ARGV[8], ARGV[16], '')
  for _, pair in ipairs(cjson.decode(ARGV[10])) do
    redis.call('HINCRBY', KEYS[10], pair[1], tonumber(pair[2]))
  end
end
redis.call('LPUSH', KEYS[8], ARGV[9])
redis.call('LTRIM', KEYS[8], 0, tonumber(ARGV[17]) - 1)
redis.call('INCR', KEYS[9])

if ARGV[11] ~= '0' then
  move_money(KEYS[12], KEYS[13], ARGV[11], ARGV[12], ARGV[16], '')
end
if ARGV[13] ~= '' then
  redis.call('LPUSH', KEYS[14], ARGV[13])
  redis.call('LTRIM', KEYS[14], 0, tonumber(ARGV[17]) - 1)
  redis.call('INCR', KEYS[15])
end

local alert = cjson.decode(ARGV[14])
redis.call('HSET', KEYS[16], alert.id, ARGV[14])
return { 1 }
`;

interface Plan {
  newStatus: "FAILED_LATE" | "NO_SHOW";
  refundBuyer: boolean;
  returnStock: boolean;
  holderDelta: number;
  holderLedger: Record<string, unknown> | null;
  holderUpdate: { title: string; body: string } | null;
  buyerUpdate: { title: string; body: string; kind: "order" | "alert" };
  alert: CafeAlert;
  note: string;
}

/** What each of the four outcomes does (docs/BUSINESS_RULES.md "When grace ends"). */
function planFor(order: Order, outcome: LateOutcome, now: number): Plan {
  const holder = order.holder;
  const alertBase = {
    id: order.id,
    orderId: order.id,
    at: now,
    sourceId: order.sourceId,
    buildingId: order.buildingId,
    total: order.total,
  };
  const failedBuyer = { ...failedLateBuyerUpdate(order), kind: "alert" as const };

  if (outcome === "no-show") {
    const earn = holder?.kind === "runner" && order.buildingId ? RUNNER_EARN[getBuilding(order.buildingId).zone] : 0;
    return {
      newStatus: "NO_SHOW",
      refundBuyer: false,
      returnStock: false,
      holderDelta: earn,
      holderLedger: earn > 0 ? { at: now, type: "earning", amount: earn, orderId: order.id, note: "Buyer did not show up" } : null,
      holderUpdate: noShowHolderUpdate(order, earn),
      buyerUpdate: { ...noShowBuyerUpdate(order), kind: "order" },
      alert: { ...alertBase, kind: "no-show", holderName: holder?.name, holderKind: holder?.kind, holdUntil: noShowHoldEnd(now) },
      note: "Buyer did not show up",
    };
  }
  if (outcome === "failed-runner") {
    return {
      newStatus: "FAILED_LATE",
      refundBuyer: true,
      returnStock: false, // the runner keeps the food: they paid for it
      holderDelta: -order.total,
      holderLedger: { at: now, type: "penalty", amount: -order.total, orderId: order.id, note: `Late delivery ${order.id}` },
      holderUpdate: runnerPenaltyUpdate(order),
      buyerUpdate: failedBuyer,
      alert: { ...alertBase, kind: "failed", why: "runner", holderName: holder?.name, holderKind: "runner" },
      note: "Grace ended",
    };
  }
  if (outcome === "failed-staff") {
    return {
      newStatus: "FAILED_LATE",
      refundBuyer: true,
      returnStock: true,
      holderDelta: 0,
      holderLedger: null,
      holderUpdate: staffReturnUpdate(order),
      buyerUpdate: failedBuyer,
      alert: { ...alertBase, kind: "staff-return", holderName: holder?.name, holderKind: "staff" },
      note: "Grace ended",
    };
  }
  return {
    newStatus: "FAILED_LATE",
    refundBuyer: true,
    returnStock: true,
    holderDelta: 0,
    holderLedger: null,
    holderUpdate: null,
    buyerUpdate: failedBuyer,
    alert: { ...alertBase, kind: "failed", why: "before-pickup" },
    note: "Grace ended",
  };
}

/** Settles one overdue order. Returns true if this call settled it, false if someone else already had or the order changed. */
export async function settleOrder(order: Order, outcome: LateOutcome, now: number): Promise<boolean> {
  const plan = planFor(order, outcome, now);
  const holder = order.holder;
  // When nobody holds it, the holder keys are the buyer's own: they are named but never touched.
  const holderId = holder?.id ?? order.buyerId;
  const stockPairs = plan.returnStock
    ? order.items.flatMap((line) => {
        const slot = getItem(line.itemId)?.slot;
        return slot ? [[slot, line.qty]] : [];
      })
    : [];
  const buyerUpdate = makeUpdate(order.buyerId, { ...plan.buyerUpdate, orderId: order.id }, now);
  const holderUpdate = plan.holderUpdate && holder ? makeUpdate(holder.id, { ...plan.holderUpdate, kind: "alert" }, now) : null;
  const buyerLedger = { at: now, type: "refund", amount: order.total, orderId: order.id, note: "Delivery failed late" };

  const result = (await getRedis().eval(
    SETTLE_LUA,
    [
      orderKey(order.id),
      activeKey(),
      doneKey(),
      penaltyKey(order.id),
      liveKey(order.buyerId),
      walletKey(order.buyerId),
      ledgerKey(order.buyerId),
      updatesKey(order.buyerId),
      unreadKey(order.buyerId),
      key("stock"),
      runsLiveKey(holderId),
      walletKey(holderId),
      ledgerKey(holderId),
      updatesKey(holderId),
      unreadKey(holderId),
      alertsKey(),
    ],
    [
      order.id,
      order.status,
      holder?.id ?? "",
      order.arrivedAt === undefined ? "" : String(order.arrivedAt),
      plan.newStatus,
      now,
      plan.refundBuyer ? "1" : "0",
      JSON.stringify(buyerLedger),
      JSON.stringify(buyerUpdate),
      JSON.stringify(stockPairs),
      String(plan.holderDelta),
      plan.holderLedger ? JSON.stringify(plan.holderLedger) : "",
      holderUpdate ? JSON.stringify(holderUpdate) : "",
      JSON.stringify(plan.alert),
      plan.note,
      LEDGER_KEEP,
      UPDATES_KEEP,
    ],
  )) as [number, string?];
  return result[0] === 1;
}

/**
 * Checks every delivery order in progress and settles the ones whose grace has ended. Runs at most once a
 * second however many screens are polling. One order failing to settle never stops the rest.
 */
export async function sweepLate(now: number): Promise<void> {
  const redis = getRedis();
  // Orders the cafe gave to staff before runs existed are added to My runs. This has its own short throttle, so it
  // is asked first: a poll that the once-a-second sweep throttle turns away must still find them.
  await healRunIndexes();
  if (!(await redis.set(key("sweep"), "1", { nx: true, px: SWEEP_MIN_INTERVAL_MS }))) return;
  const ids = await redis.zrange<string[]>(activeKey(), 0, CAFE_ORDERS_MAX - 1);
  if (ids.length === 0) return;
  const found = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  for (const order of found) {
    if (!order || typeof order !== "object") continue;
    const outcome = lateOutcome(order, now);
    if (!outcome) continue;
    try {
      await settleOrder(order, outcome, now);
    } catch (err) {
      console.error("Late settlement error:", logSafeMessage(err));
    }
  }
}
