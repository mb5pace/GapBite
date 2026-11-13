/**
 * Orders. Server-side only. Source: docs/FLOWS.md, docs/BUSINESS_RULES.md,
 * docs/ARCHITECTURE.md "Concurrency".
 *
 * Placing and cancelling are each ONE Lua script, so the wallet, the ledger, the
 * vending stock, the order and its indexes and the buyer's Update either all
 * change or none do. Two phones tapping Pay on the same last can both lose
 * nothing and win nothing twice.
 */
import { randomInt } from "node:crypto";
import { BREAK_SLOTS } from "@/data/breaks";
import { isBuildingId, type BuildingId } from "@/data/locations";
import { getItem, getSource } from "@/data/menu";
import { ORDER_COPY, cancelledUpdate, placedUpdate } from "@/data/order-copy";
import { refusalMessage } from "@/data/copy";
import { AppError } from "./api";
import {
  IDEMPOTENCY_TTL_SEC,
  LEDGER_KEEP,
  ORDERS_LIST_MAX,
  ORDER_ID_DIGITS,
  ORDER_ID_PREFIX,
  ORDER_ID_RETRIES,
  CODE_DIGITS,
  UPDATES_KEEP,
  WALLET_MIN_TO_USE,
} from "./config";
import { formatRupees } from "./format";
import { isMorningClosed } from "./menu-rules";
import { parseOrderRef } from "./order-ref";
import { estimatePromisedAt, feeFor, priceLines, slotAvailable, walkFor } from "./order-rules";
import { summarize, type Order, type OrderMode, type OrderStatus, type OrderSummary } from "./order-types";
import { getRedis, key } from "./redis";
import { ensureStock } from "./stock";
import { makeUpdate, unreadKey, updatesKey } from "./updates";
import { topUpNeeded } from "./wallet-rules";

export const orderKey = (id: string) => key("order", id);
export const activeKey = () => key("orders", "active");
export const doneKey = () => key("orders", "done");
export const byUserKey = (userId: string) => key("orders", "by", userId);
/** Orders of this buyer that are not finished yet (a set), so /api/me can tell if one is in progress with a single count. */
export const liveKey = (userId: string) => key("orders", "live", userId);
/** Orders this person is carrying right now (runner buddy or staff), and every order they have carried. */
export const runsLiveKey = (userId: string) => key("runs", "live", userId);
export const runsByKey = (userId: string) => key("runs", "by", userId);
const idemKey = (userId: string, token: string) => key("idem", userId, token);
const walletKey = (userId: string) => key("wallet", userId);
const ledgerKey = (userId: string) => key("ledger", userId);
const stockKey = () => key("stock");
const unavailableKey = () => key("unavailable");

/** "qx-4821" becomes "QX-4821", or null if it is not an order ID. A bag slip's "QX:ORDER:QX-4821" works too. */
export function normalizeOrderId(input: string): string | null {
  return parseOrderRef(input);
}

function newOrderId(): string {
  const low = 10 ** (ORDER_ID_DIGITS - 1);
  return `${ORDER_ID_PREFIX}${randomInt(low, low * 10)}`;
}

/** A 4-digit code whose digits differ from the order ID's, so the two are never mistaken for each other. */
function newCode(orderId: string): string {
  const idDigits = orderId.slice(ORDER_ID_PREFIX.length);
  for (;;) {
    const code = String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0");
    if (code !== idDigits) return code;
  }
}

// ---------------------------------------------------------------------------
// Place
// ---------------------------------------------------------------------------

/**
 * KEYS: 1 wallet, 2 ledger, 3 order, 4 active, 5 buyer's orders, 6 buyer's live set,
 *       7 stock, 8 unavailable set, 9 updates, 10 unread, 11 idempotency.
 * ARGV: 1 total, 2 floor (max(₹50, total)), 3 ledger size, 4 ledger entry, 5 order JSON,
 *       6 order id, 7 created at, 8 update JSON, 9 updates size, 10 idempotency ttl,
 *       11 item count, then per item: item id, vending slot or "", quantity.
 * Returns { 1, balanceAfter } placed, { 2, orderId } already placed by this request,
 * or { 0, reason, ... } with nothing changed.
 */
const PLACE_LUA = `
local previous = redis.call('GET', KEYS[11])
if previous then return { 2, previous } end
if redis.call('EXISTS', KEYS[3]) == 1 then return { 0, 'idtaken' } end

local balance = tonumber(redis.call('GET', KEYS[1]) or '0')
if balance < tonumber(ARGV[2]) then return { 0, 'balance', balance } end

local count = tonumber(ARGV[11])
for i = 0, count - 1 do
  local itemId = ARGV[12 + i * 3]
  local slot = ARGV[13 + i * 3]
  local qty = tonumber(ARGV[14 + i * 3])
  if redis.call('SISMEMBER', KEYS[8], itemId) == 1 then return { 0, 'unavailable', itemId } end
  if slot ~= '' then
    local left = tonumber(redis.call('HGET', KEYS[7], slot) or '0')
    if left < qty then return { 0, 'stock', itemId, left } end
  end
end

for i = 0, count - 1 do
  local slot = ARGV[13 + i * 3]
  if slot ~= '' then redis.call('HINCRBY', KEYS[7], slot, -tonumber(ARGV[14 + i * 3])) end
end

local after = balance - tonumber(ARGV[1])
redis.call('SET', KEYS[1], after)
local entry = cjson.decode(ARGV[4])
entry.balance = after
redis.call('LPUSH', KEYS[2], cjson.encode(entry))
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[3]) - 1)

redis.call('SET', KEYS[3], ARGV[5])
redis.call('ZADD', KEYS[4], tonumber(ARGV[7]), ARGV[6])
redis.call('ZADD', KEYS[5], tonumber(ARGV[7]), ARGV[6])
redis.call('SADD', KEYS[6], ARGV[6])

redis.call('LPUSH', KEYS[9], ARGV[8])
redis.call('LTRIM', KEYS[9], 0, tonumber(ARGV[9]) - 1)
redis.call('INCR', KEYS[10])

redis.call('SET', KEYS[11], ARGV[6], 'EX', tonumber(ARGV[10]))
return { 1, after }
`;

export interface PlaceInput {
  lines: { itemId: string; qty: number }[];
  mode: OrderMode;
  buildingId?: BuildingId;
  /** "asap" or a break slot like "11:50". */
  when: string;
  /** Made once per checkout screen. The same request never places two orders. */
  requestId: string;
}

export interface PlaceResult {
  order: Order;
  balance: number;
  /** True when this exact request had already been placed (a double tap or a retry). */
  duplicate: boolean;
}

/** Prices, checks and places an order. The client's prices, fees and totals are never read. */
export async function placeOrder(
  buyer: { id: string; name: string },
  input: PlaceInput,
  now: number,
): Promise<PlaceResult> {
  const priced = priceLines(input.lines);
  if (!priced.ok) {
    if (priced.reason === "too-many") throw new AppError(400, refusalMessage("limit", ""));
    if (priced.reason === "mixed-sources") throw new AppError(400, ORDER_COPY.oneSource);
    if (priced.reason === "unknown-item") throw new AppError(400, ORDER_COPY.badItem);
    throw new AppError(400, ORDER_COPY.emptyCart);
  }

  if (input.mode === "delivery" && !input.buildingId) throw new AppError(400, ORDER_COPY.needBuilding);
  const buildingId = input.mode === "delivery" ? input.buildingId : undefined;
  if (buildingId && !isBuildingId(buildingId)) throw new AppError(400, ORDER_COPY.needBuilding);

  // Morning items stop at 11:30, server time.
  if (isMorningClosed(now)) {
    const late = priced.items.find((line) => getItem(line.itemId)?.tags.includes("morning"));
    if (late) throw new AppError(409, refusalMessage("morning-closed", late.name));
  }

  const prepMin = priced.prepMin;
  const walkMin = walkFor(input.mode, buildingId);
  if (input.when !== "asap") {
    if (!BREAK_SLOTS.includes(input.when)) throw new AppError(400, ORDER_COPY.badBreak);
    if (!slotAvailable(input.when, now, prepMin, walkMin)) throw new AppError(409, ORDER_COPY.breakTooClose);
  }

  const fee = feeFor(input.mode, buildingId);
  const total = priced.subtotal + fee;
  const promisedAt = estimatePromisedAt({ mode: input.mode, when: input.when, nowMs: now, prepMin, walkMin });
  const redis = getRedis();

  await ensureStock(); // the vending stock hash must exist before the script reads it
  const slotOf = (itemId: string) => getItem(itemId)?.slot ?? "";
  const itemArgs = priced.items.flatMap((line) => [line.itemId, slotOf(line.itemId), line.qty]);
  const sourceName = getSource(priced.sourceId).name;

  for (let attempt = 0; attempt < ORDER_ID_RETRIES; attempt++) {
    const id = newOrderId();
    const order: Order = {
      id,
      buyerId: buyer.id,
      buyerName: buyer.name,
      sourceId: priced.sourceId,
      items: priced.items,
      mode: input.mode,
      ...(buildingId ? { buildingId } : {}),
      when: input.when,
      subtotal: priced.subtotal,
      fee,
      total,
      code: newCode(id),
      status: "PLACED",
      prepMin,
      walkMin,
      promisedAt,
      events: [{ at: now, status: "PLACED" }],
      createdAt: now,
      updatedAt: now,
    };
    const update = makeUpdate(buyer.id, { ...placedUpdate(order), kind: "order", orderId: id }, now);
    const ledgerEntry = { at: now, type: "order", amount: -total, orderId: id, note: sourceName };

    const result = (await redis.eval(
      PLACE_LUA,
      [
        walletKey(buyer.id),
        ledgerKey(buyer.id),
        orderKey(id),
        activeKey(),
        byUserKey(buyer.id),
        liveKey(buyer.id),
        stockKey(),
        unavailableKey(),
        updatesKey(buyer.id),
        unreadKey(buyer.id),
        idemKey(buyer.id, input.requestId),
      ],
      [
        total,
        Math.max(WALLET_MIN_TO_USE, total),
        LEDGER_KEEP,
        JSON.stringify(ledgerEntry),
        JSON.stringify(order),
        id,
        now,
        JSON.stringify(update),
        UPDATES_KEEP,
        IDEMPOTENCY_TTL_SEC,
        priced.items.length,
        ...itemArgs,
      ],
    )) as [number, string | number, (string | number)?, (string | number)?];

    const [code, a, b, c] = result;
    if (code === 1) return { order, balance: Number(a), duplicate: false };
    if (code === 2) {
      const existing = await getOrder(String(a));
      if (existing) {
        const balance = Number((await redis.get<number>(walletKey(buyer.id))) ?? 0);
        return { order: existing, balance, duplicate: true };
      }
      continue;
    }
    if (a === "idtaken") continue;
    if (a === "balance") {
      const need = topUpNeeded(Number(b), total);
      throw new AppError(409, `Top up ${formatRupees(need)} more to place this order.`);
    }
    if (a === "unavailable") {
      throw new AppError(409, refusalMessage("unavailable", getItem(String(b))?.name ?? "That item"));
    }
    if (a === "stock") {
      const name = getItem(String(b))?.name ?? "That item";
      const left = Number(c);
      throw new AppError(409, left > 0 ? refusalMessage("stock", name, left) : refusalMessage("sold-out", name));
    }
    throw new AppError(503, ORDER_COPY.tryAgain);
  }
  throw new AppError(503, ORDER_COPY.tryAgain);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getOrder(id: string): Promise<Order | null> {
  const normalized = normalizeOrderId(id);
  if (!normalized) return null;
  return getRedis().get<Order>(orderKey(normalized));
}

/** One order for its buyer, with the server's time. Null for anyone else, so a stranger sees what a missing order looks like. */
export async function getOrderForBuyer(id: string, buyerId: string): Promise<{ order: Order; now: number } | null> {
  const order = await getOrder(id);
  return order && order.buyerId === buyerId ? { order, now: Date.now() } : null;
}

/** The buyer's own orders, newest first, split into in progress and finished. Summaries only: no codes. */
export async function listOrdersFor(userId: string): Promise<{ active: OrderSummary[]; past: OrderSummary[]; now: number }> {
  const redis = getRedis();
  const ids = await redis.zrange<string[]>(byUserKey(userId), 0, ORDERS_LIST_MAX - 1, { rev: true });
  if (ids.length === 0) return { active: [], past: [], now: Date.now() };
  const orders = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  const summaries = orders.filter((o): o is Order => o !== null && typeof o === "object").map(summarize);
  const finished: OrderStatus[] = ["COLLECTED", "DELIVERED", "CANCELLED", "REJECTED", "FAILED_LATE"];
  return {
    active: summaries.filter((o) => !finished.includes(o.status)),
    past: summaries.filter((o) => finished.includes(o.status)),
    now: Date.now(),
  };
}

/** How many of this buyer's orders are still in progress. */
export async function countLiveOrders(userId: string): Promise<number> {
  return getRedis().scard(liveKey(userId));
}

// ---------------------------------------------------------------------------
// Close with a refund (cancel now; reject and fail-late reuse it later)
// ---------------------------------------------------------------------------

/**
 * KEYS: 1 order, 2 active, 3 done, 4 wallet, 5 ledger, 6 stock, 7 updates, 8 unread, 9 live set.
 * ARGV: 1 order id, 2 buyer id, 3 allowed current statuses (JSON), 4 new status, 5 now,
 *       6 event note, 7 ledger entry, 8 ledger size, 9 update JSON, 10 updates size,
 *       11 stock pairs count, then slot, quantity pairs.
 * Returns { 1, balance } or { 0, 'missing' } / { 0, 'status', current } with nothing changed.
 */
const REFUND_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)
if order.buyerId ~= ARGV[2] then return { 0, 'missing' } end

local allowed = false
for _, status in ipairs(cjson.decode(ARGV[3])) do
  if order.status == status then allowed = true end
end
if not allowed then return { 0, 'status', order.status } end

local balance = tonumber(redis.call('GET', KEYS[4]) or '0') + tonumber(order.total)
redis.call('SET', KEYS[4], balance)
local entry = cjson.decode(ARGV[7])
entry.balance = balance
redis.call('LPUSH', KEYS[5], cjson.encode(entry))
redis.call('LTRIM', KEYS[5], 0, tonumber(ARGV[8]) - 1)

local pairsCount = tonumber(ARGV[11])
for i = 0, pairsCount - 1 do
  redis.call('HINCRBY', KEYS[6], ARGV[12 + i * 2], tonumber(ARGV[13 + i * 2]))
end

order.status = ARGV[4]
order.updatedAt = tonumber(ARGV[5])
local event = { at = tonumber(ARGV[5]), status = ARGV[4] }
if ARGV[6] ~= '' then event.note = ARGV[6] end
table.insert(order.events, event)
redis.call('SET', KEYS[1], cjson.encode(order))

redis.call('ZREM', KEYS[2], ARGV[1])
redis.call('ZADD', KEYS[3], tonumber(ARGV[5]), ARGV[1])
redis.call('SREM', KEYS[9], ARGV[1])

redis.call('LPUSH', KEYS[7], ARGV[9])
redis.call('LTRIM', KEYS[7], 0, tonumber(ARGV[10]) - 1)
redis.call('INCR', KEYS[8])
return { 1, balance }
`;

export interface RefundOptions {
  /** The order may only be closed from these statuses. */
  expected: OrderStatus[];
  newStatus: OrderStatus;
  eventNote?: string;
  ledgerNote: string;
  update: { title: string; body: string; kind?: "order" | "alert" };
}

/**
 * Closes the order, refunds the buyer in full, returns vending stock, and files
 * the Update, all at once. Returns null if the order is not in an allowed status
 * any more (someone else got there first), so a refund can never happen twice.
 */
export async function refundOrder(order: Order, options: RefundOptions, now: number): Promise<{ balance: number } | null> {
  const stockPairs = order.items.flatMap((line) => {
    const slot = getItem(line.itemId)?.slot;
    return slot ? [slot, line.qty] : [];
  });
  const update = makeUpdate(
    order.buyerId,
    { title: options.update.title, body: options.update.body, kind: options.update.kind ?? "order", orderId: order.id },
    now,
  );
  const ledgerEntry = { at: now, type: "refund", amount: order.total, orderId: order.id, note: options.ledgerNote };

  const result = (await getRedis().eval(
    REFUND_LUA,
    [
      orderKey(order.id),
      activeKey(),
      doneKey(),
      walletKey(order.buyerId),
      ledgerKey(order.buyerId),
      stockKey(),
      updatesKey(order.buyerId),
      unreadKey(order.buyerId),
      liveKey(order.buyerId),
    ],
    [
      order.id,
      order.buyerId,
      JSON.stringify(options.expected),
      options.newStatus,
      now,
      options.eventNote ?? "",
      JSON.stringify(ledgerEntry),
      LEDGER_KEEP,
      JSON.stringify(update),
      UPDATES_KEEP,
      stockPairs.length / 2,
      ...stockPairs,
    ],
  )) as [number, string | number];

  return result[0] === 1 ? { balance: Number(result[1]) } : null;
}

/** The buyer cancels their own order. Only while it is still PLACED: full refund, vending stock returned. */
export async function cancelOrder(orderId: string, buyerId: string, now: number): Promise<{ order: Order; balance: number }> {
  const order = await getOrder(orderId);
  if (!order || order.buyerId !== buyerId) throw new AppError(404, ORDER_COPY.noSuchOrder);
  if (order.status !== "PLACED") throw new AppError(409, ORDER_COPY.cancelTooLate);

  const text = cancelledUpdate(order);
  const result = await refundOrder(
    order,
    { expected: ["PLACED"], newStatus: "CANCELLED", eventNote: "Cancelled by buyer", ledgerNote: "Order cancelled", update: text },
    now,
  );
  if (!result) throw new AppError(409, ORDER_COPY.cancelTooLate);

  const updated = (await getOrder(orderId)) as Order;
  return { order: updated, balance: result.balance };
}
