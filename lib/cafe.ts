/**
 * What the cafe desk does to orders. Server-side only. Source: docs/FLOWS.md
 * sections 2, 3a and 3c, docs/BUSINESS_RULES.md.
 *
 * Every change is ONE Lua script that checks the order's status first, moves it,
 * writes the buyer's Updates and fixes the indexes together. Two laptops tapping
 * Accept on the same order: one wins, the other is told it has moved on. Reject
 * reuses refundOrder, so the wallet, ledger and vending stock change in the same step.
 */
import { getBuilding } from "@/data/locations";
import { getItem, getSource } from "@/data/menu";
import { CAFE_COPY, rejectReason } from "@/data/cafe-copy";
import {
  ORDER_COPY,
  acceptedUpdate,
  collectedUpdate,
  preparingUpdate,
  readyUpdate,
  rejectedUpdate,
  staffPickedUpUpdate,
} from "@/data/order-copy";
import { AppError } from "./api";
import { CAFE_ORDERS_MAX, KIOSK_RATE_LIMIT, SLIP_QR_PREFIX, UPDATES_KEEP } from "./config";
import { activeKey, doneKey, getOrder, liveKey, orderKey, refundOrder, runsByKey, runsLiveKey } from "./orders";
import { estimatePromisedAt } from "./order-rules";
import { isTerminal, toCafeCard, type CafeCard, type Order, type OrderStatus } from "./order-types";
import { qrPath, type QrPath } from "./qr";
import { getRedis, key } from "./redis";
import { makeUpdate, unreadKey, updatesKey } from "./updates";
import { getUser, normalizeStaffId } from "./users";

/**
 * KEYS: 1 order, 2 active, 3 done, 4 buyer's live set, 5 buyer's updates, 6 buyer's unread,
 *       7 and 8 the new holder's live runs and run history (unused unless ARGV 10 is set).
 * ARGV: 1 order id, 2 allowed current statuses (JSON), 3 "1" = only if nobody holds it,
 *       4 now, 5 fields to set (JSON), 6 steps to record (JSON: status, note?), 7 "1" = the last
 *       step ends the order, 8 Updates (JSON array of ready-made JSON strings), 9 updates size,
 *       10 the new holder's id, so the order shows in their My runs ("" for none).
 * Returns { 1, orderJson } or { 0, reason } with nothing changed.
 */
const ADVANCE_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)

local allowed = false
for _, status in ipairs(cjson.decode(ARGV[2])) do
  if order.status == status then allowed = true end
end
if not allowed then return { 0, 'status', order.status } end
if ARGV[3] == '1' and order.holder then return { 0, 'holder' } end

local now = tonumber(ARGV[4])
for field, value in pairs(cjson.decode(ARGV[5])) do order[field] = value end
for _, step in ipairs(cjson.decode(ARGV[6])) do
  local event = { at = now, status = step.status }
  if step.note then event.note = step.note end
  table.insert(order.events, event)
  order.status = step.status
end
order.updatedAt = now
redis.call('SET', KEYS[1], cjson.encode(order))

if ARGV[7] == '1' then
  redis.call('ZREM', KEYS[2], ARGV[1])
  redis.call('ZADD', KEYS[3], now, ARGV[1])
  redis.call('SREM', KEYS[4], ARGV[1])
end

local updates = cjson.decode(ARGV[8])
for _, update in ipairs(updates) do redis.call('LPUSH', KEYS[5], update) end
if #updates > 0 then
  redis.call('LTRIM', KEYS[5], 0, tonumber(ARGV[9]) - 1)
  redis.call('INCRBY', KEYS[6], #updates)
end
if ARGV[10] ~= '' then
  redis.call('SADD', KEYS[7], ARGV[1])
  redis.call('ZADD', KEYS[8], now, ARGV[1])
end
return { 1, cjson.encode(order) }
`;

interface Advance {
  expected: OrderStatus[];
  steps: { status: OrderStatus; note?: string }[];
  /** Fields to set on the order, such as the fixed promised time or the holder. */
  patch?: Record<string, unknown>;
  updates: { title: string; body: string }[];
  noHolder?: boolean;
  /** The person who now carries the order, so it appears in their Orders › My runs. */
  runHolderId?: string;
}

/** Runs the script. Null means the order was not in an allowed status any more (someone else got there first). */
async function tryAdvance(order: Order, change: Advance, now: number): Promise<Order | null> {
  const last = change.steps[change.steps.length - 1].status;
  const updates = change.updates.map((text) =>
    JSON.stringify(makeUpdate(order.buyerId, { ...text, kind: "order", orderId: order.id }, now)),
  );
  const result = (await getRedis().eval(
    ADVANCE_LUA,
    [
      orderKey(order.id),
      activeKey(),
      doneKey(),
      liveKey(order.buyerId),
      updatesKey(order.buyerId),
      unreadKey(order.buyerId),
      runsLiveKey(change.runHolderId ?? order.buyerId),
      runsByKey(change.runHolderId ?? order.buyerId),
    ],
    [
      order.id,
      JSON.stringify(change.expected),
      change.noHolder ? "1" : "0",
      now,
      JSON.stringify(change.patch ?? {}),
      JSON.stringify(change.steps),
      isTerminal(last) ? "1" : "0",
      JSON.stringify(updates),
      UPDATES_KEEP,
      change.runHolderId ?? "",
    ],
  )) as [number, (string | Order)?];
  if (result[0] !== 1) return null;
  // @upstash/redis turns JSON text in a reply into an object by itself; accept either.
  const moved = result[1];
  return (typeof moved === "string" ? JSON.parse(moved) : moved) as Order;
}

async function advance(order: Order, change: Advance, now: number): Promise<Order> {
  const moved = await tryAdvance(order, change, now);
  if (!moved) throw new AppError(409, CAFE_COPY.moved);
  return moved;
}

async function load(id: string): Promise<Order> {
  const order = await getOrder(id);
  if (!order) throw new AppError(404, ORDER_COPY.noSuchOrder);
  return order;
}

// ---------------------------------------------------------------------------
// The queue
// ---------------------------------------------------------------------------

/** Every order still in progress, oldest first. No codes, no buyers, no prices. */
export async function listQueue(now: number): Promise<{ orders: CafeCard[]; now: number }> {
  const redis = getRedis();
  const ids = await redis.zrange<string[]>(activeKey(), 0, CAFE_ORDERS_MAX - 1);
  if (ids.length === 0) return { orders: [], now };
  const found = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  const orders = found
    .filter((order): order is Order => order !== null && typeof order === "object")
    .map(toCafeCard)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return { orders, now };
}

// ---------------------------------------------------------------------------
// Accept, reject, start, ready
// ---------------------------------------------------------------------------

/**
 * Accept fixes the promised time (an ASAP promise is worked out from this moment, a break
 * slot keeps its slot time). Vending has nothing to cook, so Accept goes straight to READY.
 */
export async function acceptOrder(id: string, now: number): Promise<Order> {
  const order = await load(id);
  if (order.status !== "PLACED") throw new AppError(409, CAFE_COPY.moved);
  const promisedAt = estimatePromisedAt({
    mode: order.mode,
    when: order.when,
    nowMs: now,
    prepMin: order.prepMin,
    walkMin: order.walkMin,
  });
  if (order.sourceId === "vending") {
    return advance(
      order,
      {
        expected: ["PLACED"],
        steps: [{ status: "ACCEPTED" }, { status: "READY" }],
        patch: { promisedAt },
        updates: [acceptedUpdate(order), readyUpdate(order)],
      },
      now,
    );
  }
  return advance(
    order,
    { expected: ["PLACED"], steps: [{ status: "ACCEPTED" }], patch: { promisedAt }, updates: [acceptedUpdate(order)] },
    now,
  );
}

/** Turns a new order down. Full refund, vending stock back, the buyer is told why. */
export async function rejectOrder(id: string, reasonId: string, now: number): Promise<Order> {
  const reason = rejectReason(reasonId);
  if (!reason) throw new AppError(400, CAFE_COPY.errors.badReason);
  const order = await load(id);
  if (order.status !== "PLACED") throw new AppError(409, CAFE_COPY.moved);
  const result = await refundOrder(
    order,
    {
      expected: ["PLACED"],
      newStatus: "REJECTED",
      eventNote: reason.label,
      ledgerNote: "Order rejected",
      update: rejectedUpdate(order, reason.buyerText),
    },
    now,
  );
  if (!result) throw new AppError(409, CAFE_COPY.moved);
  return load(id);
}

export async function startOrder(id: string, now: number): Promise<Order> {
  const order = await load(id);
  return advance(order, { expected: ["ACCEPTED"], steps: [{ status: "PREPARING" }], updates: [preparingUpdate()] }, now);
}

export async function readyOrder(id: string, now: number): Promise<Order> {
  const order = await load(id);
  return advance(order, { expected: ["PREPARING"], steps: [{ status: "READY" }], updates: [readyUpdate(order)] }, now);
}

// ---------------------------------------------------------------------------
// Collect at the counter, send with staff
// ---------------------------------------------------------------------------

/** The buyer shows their 4-digit code at the counter. A wrong code changes nothing and has no penalty. */
export async function collectOrder(id: string, code: string, now: number): Promise<Order> {
  const order = await load(id);
  if (order.mode !== "pickup") throw new AppError(400, CAFE_COPY.errors.notPickup);
  if (order.sourceId === "vending") throw new AppError(400, CAFE_COPY.errors.vendingAtKiosk);
  if (order.status !== "READY") throw new AppError(409, CAFE_COPY.moved);
  if (code !== order.code) throw new AppError(400, CAFE_COPY.errors.codeMismatch);
  return advance(order, { expected: ["READY"], steps: [{ status: "COLLECTED" }], updates: [collectedUpdate()] }, now);
}

/** Counter staff hand a Ready delivery bag to an existing staff member. Same result as a staff scan. */
export async function sendWithStaff(id: string, staffId: string, now: number): Promise<Order> {
  const order = await load(id);
  if (order.mode !== "delivery") throw new AppError(400, CAFE_COPY.errors.notDelivery);
  if (order.status !== "READY") throw new AppError(409, CAFE_COPY.moved);
  const normalized = normalizeStaffId(staffId);
  const staff = normalized ? await getUser(normalized) : null;
  if (!staff || staff.role !== "staff") throw new AppError(404, CAFE_COPY.errors.staffUnknown);
  return advance(
    order,
    {
      expected: ["READY"],
      noHolder: true,
      steps: [{ status: "PICKED_UP" }],
      patch: { holder: { kind: "staff", id: staff.id, name: staff.name } },
      updates: [staffPickedUpUpdate()],
      runHolderId: staff.id,
    },
    now,
  );
}

// ---------------------------------------------------------------------------
// Bag slip
// ---------------------------------------------------------------------------

export interface BagSlip {
  id: string;
  sourceName: string;
  items: { name: string; qty: number }[];
  mode: "pickup" | "delivery";
  /** "GICT, ground floor lobby" for delivery. Empty for pickup. */
  destination: string;
  promisedAt?: number;
  qr: QrPath;
}

export async function getBagSlip(id: string): Promise<BagSlip> {
  const order = await load(id);
  const building = order.buildingId ? getBuilding(order.buildingId) : null;
  return {
    id: order.id,
    sourceName: getSource(order.sourceId).name,
    items: order.items.map((line) => ({ name: line.name, qty: line.qty })),
    mode: order.mode,
    destination: building ? `${building.short}, ${building.dropPoint.toLowerCase()}` : "",
    promisedAt: order.promisedAt,
    qr: qrPath(`${SLIP_QR_PREFIX}${order.id}`),
  };
}

// ---------------------------------------------------------------------------
// Vending kiosk
// ---------------------------------------------------------------------------

const kioskWrongKey = () => key("kiosk", "wrong");

export interface KioskResult {
  orderId: string;
  /** What the machine releases, slot by slot. */
  slots: { slot: string; name: string; qty: number }[];
}

/**
 * The buyer types the 4-digit code on the kiosk beside the machine. If two ready vending pickups
 * happen to share a code, the older one is dispensed first. After a few wrong codes the kiosk
 * locks for a minute; while it is locked even a right code is refused.
 */
export async function kioskCollect(code: string, now: number): Promise<KioskResult> {
  const redis = getRedis();
  const wrong = Number((await redis.get<number>(kioskWrongKey())) ?? 0);
  if (wrong >= KIOSK_RATE_LIMIT.maxWrongTries) throw new AppError(429, CAFE_COPY.kiosk.locked);

  const { orders } = await listQueue(now);
  const candidates = orders
    .filter((card) => card.sourceId === "vending" && card.mode === "pickup" && card.status === "READY")
    .map((card) => card.id);

  for (const id of candidates) {
    const order = await getOrder(id);
    if (!order || order.code !== code || order.status !== "READY") continue;
    const done = await tryAdvance(order, { expected: ["READY"], steps: [{ status: "COLLECTED" }], updates: [collectedUpdate()] }, now);
    if (!done) continue;
    return {
      orderId: done.id,
      slots: done.items.map((line) => ({ slot: getItem(line.itemId)?.slot ?? "", name: line.name, qty: line.qty })),
    };
  }

  // The expiry is set first, so a counter can never be left without one.
  await redis.set(kioskWrongKey(), 0, { nx: true, ex: KIOSK_RATE_LIMIT.windowSec });
  await redis.incr(kioskWrongKey());
  throw new AppError(404, CAFE_COPY.kiosk.notFound);
}
