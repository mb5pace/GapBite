/**
 * Runs: a runner buddy or a staff member carrying someone else's order. Server-side only.
 * Source: docs/FLOWS.md sections 3b and 4, docs/BUSINESS_RULES.md "Runner buddy rules" and "Staff delivery".
 *
 * Accepting, arriving and handing over are each ONE Lua script that checks the order's state first.
 * Two runners scanning the same bag: one wins. The handover also credits the runner's wallet in the
 * same script, through the same Lua money-move function `moveMoney` uses, so an order can never be
 * Delivered without the earning, or the earning paid without the delivery.
 */
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import {
  ORDER_COPY,
  RUN_ERRORS,
  deliveredUpdate,
  pickedUpUpdate,
  runnerArrivedUpdate,
  runnerEarnedUpdate,
} from "@/data/order-copy";
import { AppError } from "./api";
import {
  HANDOVER_RATE_LIMIT,
  LEDGER_KEEP,
  MAX_ACTIVE_RUNS,
  RUN_HEAL_MIN_INTERVAL_MS,
  RUNNER_EARN,
  UPDATES_KEEP,
  WALLET_MIN_TO_USE,
} from "./config";
import { activeKey, doneKey, getOrder, listOrdersFor, liveKey, orderKey, runsByKey, runsLiveKey } from "./orders";
import { toRunCard, type Order, type OrderSummary, type RunCard, type RunPreview } from "./order-types";
import { getRedis, key } from "./redis";
import { makeUpdate, unreadKey, updatesKey } from "./updates";
import { LUA_MOVE_MONEY, getBalance } from "./wallet";

export type RunnerKind = "runner" | "staff";
export interface RunUser {
  id: string;
  name: string;
  role: "student" | "staff";
}

const kindOf = (user: RunUser): RunnerKind => (user.role === "staff" ? "staff" : "runner");
const walletKey = (userId: string) => key("wallet", userId);
const ledgerKey = (userId: string) => key("ledger", userId);
const handoverWrongKey = (orderId: string) => key("handover", "wrong", orderId);

/** What a runner earns for this order's zone. Staff earn nothing. */
function earnFor(order: Order, kind: RunnerKind): number {
  if (kind === "staff" || !order.buildingId) return 0;
  return RUNNER_EARN[getBuilding(order.buildingId).zone];
}

// ---------------------------------------------------------------------------
// Keeping "who is carrying what" right
// ---------------------------------------------------------------------------

/**
 * The run lists (qx:runs:live:<id>) are filled when a run starts and emptied when it ends. This
 * walks the orders in progress and adds any held order the list is missing (for example one the
 * cafe gave to staff before runs existed). Safe to call any time, as often as you like.
 */
export async function healRunIndexes(): Promise<void> {
  const redis = getRedis();
  // At most once every couple of seconds, however many screens are polling.
  if (!(await redis.set(key("heal"), "1", { nx: true, px: RUN_HEAL_MIN_INTERVAL_MS }))) return;
  const ids = await redis.zrange<string[]>(activeKey(), 0, -1);
  if (ids.length === 0) return;
  const found = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  const pipeline = redis.pipeline();
  let work = 0;
  for (const order of found) {
    if (!order || typeof order !== "object" || order.status !== "PICKED_UP" || !order.holder) continue;
    pipeline.sadd(runsLiveKey(order.holder.id), order.id);
    pipeline.zadd(runsByKey(order.holder.id), { score: order.updatedAt, member: order.id });
    work++;
  }
  if (work > 0) await pipeline.exec();
}

/** The runs this person is carrying now, soonest promised time first. Stale list entries are dropped. */
export async function listRuns(userId: string): Promise<RunCard[]> {
  const redis = getRedis();
  const ids = (await redis.smembers(runsLiveKey(userId))).map(String);
  if (ids.length === 0) return [];
  const found = await redis.mget<(Order | null)[]>(...ids.map(orderKey));
  const runs: RunCard[] = [];
  const stale: string[] = [];
  found.forEach((order, i) => {
    if (order && typeof order === "object" && order.status === "PICKED_UP" && order.holder?.id === userId && order.buildingId) {
      runs.push(toRunCard(order));
    } else {
      stale.push(ids[i]);
    }
  });
  if (stale.length > 0) await redis.srem(runsLiveKey(userId), ...stale);
  return runs.sort((a, b) => (a.promisedAt ?? Infinity) - (b.promisedAt ?? Infinity) || a.id.localeCompare(b.id));
}

/** The Orders tab's data: my orders (active and past) and the runs I am carrying. */
export async function listOrdersAndRuns(
  userId: string,
): Promise<{ active: OrderSummary[]; past: OrderSummary[]; runs: RunCard[]; now: number }> {
  const [orders, runs] = await Promise.all([listOrdersFor(userId), listRuns(userId)]);
  return { ...orders, runs };
}

/** How many runs this person is carrying right now (the number the 3-run limit counts). */
export async function countRuns(userId: string): Promise<number> {
  return getRedis().scard(runsLiveKey(userId));
}

// ---------------------------------------------------------------------------
// Preview and accept
// ---------------------------------------------------------------------------

/** The message for an order that cannot be taken, by what is wrong with it. Used by preview and by the accept script. */
function refusal(reason: string): AppError {
  switch (reason) {
    case "missing":
      return new AppError(404, RUN_ERRORS.notFound);
    case "pickup":
      return new AppError(409, RUN_ERRORS.pickup);
    case "own":
      return new AppError(409, RUN_ERRORS.own);
    case "taken":
      return new AppError(409, RUN_ERRORS.taken);
    case "notready":
      return new AppError(409, RUN_ERRORS.notReady);
    case "closed":
      return new AppError(409, RUN_ERRORS.closed);
    case "balance":
      return new AppError(409, RUN_ERRORS.lowBalance);
    case "runs":
      return new AppError(409, RUN_ERRORS.tooMany);
    default:
      return new AppError(503, ORDER_COPY.tryAgain);
  }
}

/** Why this order cannot be taken by this person right now, or null if it can. Same order of checks as the accept script. */
function whyNot(order: Order, user: RunUser): string | null {
  if (order.mode !== "delivery") return "pickup";
  if (order.buyerId === user.id) return "own";
  if (order.status !== "READY" || order.holder) {
    if (order.status === "PLACED" || order.status === "ACCEPTED" || order.status === "PREPARING") return "notready";
    // A finished order keeps its holder, so the status decides: out for delivery is taken, anything else is closed.
    if (order.status === "PICKED_UP" || order.status === "READY") return "taken";
    return "closed";
  }
  return null;
}

/** What the runner sees before accepting. Nothing changes. The same refusals as accepting, so a bad scan says why at once. */
export async function previewRun(user: RunUser, orderId: string): Promise<RunPreview> {
  const order = await getOrder(orderId);
  if (!order) throw refusal("missing");
  const bad = whyNot(order, user);
  if (bad) throw refusal(bad);
  const kind = kindOf(user);
  if (kind === "runner") {
    if ((await getBalance(user.id)) < WALLET_MIN_TO_USE) throw refusal("balance");
    await listRuns(user.id); // drops stale entries so the count is true
    if ((await countRuns(user.id)) >= MAX_ACTIVE_RUNS) throw refusal("runs");
  }
  return {
    id: order.id,
    sourceName: getSource(order.sourceId).name,
    units: order.items.reduce((sum, line) => sum + line.qty, 0),
    buildingId: order.buildingId as RunPreview["buildingId"],
    promisedAt: order.promisedAt,
    earn: earnFor(order, kind),
    staff: kind === "staff",
  };
}

/**
 * KEYS: 1 order, 2 scanner's wallet, 3 scanner's live runs, 4 scanner's run history, 5 buyer's updates, 6 buyer's unread.
 * ARGV: 1 order id, 2 scanner id, 3 scanner name, 4 "runner" or "staff", 5 now, 6 lowest balance a student may run
 *       with, 7 most runs a student may carry, 8 the buyer's Update (JSON), 9 updates size.
 * Returns { 1, orderJson } or { 0, reason } with nothing changed.
 */
const ACCEPT_RUN_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)
if order.mode ~= 'delivery' then return { 0, 'pickup' } end
if order.buyerId == ARGV[2] then return { 0, 'own' } end
if order.status ~= 'READY' or order.holder then
  if order.status == 'PLACED' or order.status == 'ACCEPTED' or order.status == 'PREPARING' then return { 0, 'notready' } end
  if order.status == 'PICKED_UP' or order.status == 'READY' then return { 0, 'taken' } end
  return { 0, 'closed' }
end
if ARGV[4] == 'runner' then
  local balance = tonumber(redis.call('GET', KEYS[2]) or '0')
  if balance < tonumber(ARGV[6]) then return { 0, 'balance' } end
  if redis.call('SCARD', KEYS[3]) >= tonumber(ARGV[7]) then return { 0, 'runs' } end
end

local now = tonumber(ARGV[5])
order.status = 'PICKED_UP'
order.holder = { kind = ARGV[4], id = ARGV[2], name = ARGV[3] }
table.insert(order.events, { at = now, status = 'PICKED_UP' })
order.updatedAt = now
redis.call('SET', KEYS[1], cjson.encode(order))
redis.call('SADD', KEYS[3], ARGV[1])
redis.call('ZADD', KEYS[4], now, ARGV[1])

redis.call('LPUSH', KEYS[5], ARGV[8])
redis.call('LTRIM', KEYS[5], 0, tonumber(ARGV[9]) - 1)
redis.call('INCR', KEYS[6])
return { 1, cjson.encode(order) }
`;

export interface AcceptedRun {
  run: RunCard;
  earn: number;
  staff: boolean;
}

/** Accepts the run. First valid scan wins: everyone else is told "Already taken by someone else". */
export async function acceptRun(user: RunUser, orderId: string, now: number): Promise<AcceptedRun> {
  const order = await getOrder(orderId);
  if (!order) throw refusal("missing");
  const kind = kindOf(user);
  if (kind === "runner") await listRuns(user.id); // drop stale entries so the 3-run count is true
  const update = makeUpdate(
    order.buyerId,
    { ...pickedUpUpdate({ kind, name: user.name }, order.buildingId ?? "gict"), kind: "order", orderId: order.id },
    now,
  );
  const result = (await getRedis().eval(
    ACCEPT_RUN_LUA,
    [orderKey(order.id), walletKey(user.id), runsLiveKey(user.id), runsByKey(user.id), updatesKey(order.buyerId), unreadKey(order.buyerId)],
    [order.id, user.id, user.name, kind, now, WALLET_MIN_TO_USE, MAX_ACTIVE_RUNS, JSON.stringify(update), UPDATES_KEEP],
  )) as [number, (string | Order)?];
  if (result[0] !== 1) throw refusal(String(result[1]));
  const taken = (typeof result[1] === "string" ? JSON.parse(result[1]) : result[1]) as Order;
  return { run: toRunCard(taken), earn: earnFor(taken, kind), staff: kind === "staff" };
}

// ---------------------------------------------------------------------------
// I'm here
// ---------------------------------------------------------------------------

/**
 * KEYS: 1 order, 2 buyer's updates, 3 buyer's unread.
 * ARGV: 1 holder's id, 2 now, 3 the buyer's Update (JSON), 4 updates size.
 * Returns { 1, orderJson, "new" | "again" } or { 0, reason }.
 */
const ARRIVE_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)
if order.status ~= 'PICKED_UP' then return { 0, 'status' } end
if not order.holder or order.holder.id ~= ARGV[1] then return { 0, 'holder' } end
if order.arrivedAt then return { 1, cjson.encode(order), 'again' } end

local now = tonumber(ARGV[2])
order.arrivedAt = now
table.insert(order.events, { at = now, status = 'PICKED_UP', note = 'Arrived at the drop point' })
order.updatedAt = now
redis.call('SET', KEYS[1], cjson.encode(order))
redis.call('LPUSH', KEYS[2], ARGV[3])
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[4]) - 1)
redis.call('INCR', KEYS[3])
return { 1, cjson.encode(order), 'new' }
`;

/** The holder taps "I'm here" at the drop point. Only while PICKED_UP and only by the holder. Tapping again changes nothing. */
export async function arriveAtDropPoint(user: RunUser, orderId: string, now: number): Promise<RunCard> {
  const order = await getOrder(orderId);
  if (!order) throw refusal("missing");
  const update = makeUpdate(
    order.buyerId,
    { ...runnerArrivedUpdate(order.buildingId ?? "gict"), kind: "order", orderId: order.id },
    now,
  );
  const result = (await getRedis().eval(
    ARRIVE_LUA,
    [orderKey(order.id), updatesKey(order.buyerId), unreadKey(order.buyerId)],
    [user.id, now, JSON.stringify(update), UPDATES_KEEP],
  )) as [number, (string | Order)?, string?];
  if (result[0] !== 1) {
    if (result[1] === "holder") throw new AppError(403, RUN_ERRORS.notHolder);
    if (result[1] === "status") throw new AppError(409, RUN_ERRORS.notOut);
    throw refusal(String(result[1]));
  }
  const moved = (typeof result[1] === "string" ? JSON.parse(result[1]) : result[1]) as Order;
  return toRunCard(moved);
}

// ---------------------------------------------------------------------------
// Handover
// ---------------------------------------------------------------------------

/**
 * KEYS: 1 order, 2 active, 3 done, 4 buyer's live set, 5 buyer's updates, 6 buyer's unread, 7 holder's live runs,
 *       8 holder's wallet, 9 holder's ledger, 10 holder's updates, 11 holder's unread.
 * ARGV: 1 holder's id, 2 the code typed, 3 now, 4 earning (0 for staff), 5 ledger entry (JSON), 6 ledger size,
 *       7 the buyer's Update (JSON), 8 the holder's Update (JSON, "" for none), 9 updates size.
 * Returns { 1, earned, balance } or { 0, reason }. A wrong code changes nothing.
 */
const HANDOVER_LUA =
  LUA_MOVE_MONEY +
  `
local raw = redis.call('GET', KEYS[1])
if not raw then return { 0, 'missing' } end
local order = cjson.decode(raw)
if order.status ~= 'PICKED_UP' then return { 0, 'status' } end
if not order.holder or order.holder.id ~= ARGV[1] then return { 0, 'holder' } end
if order.code ~= ARGV[2] then return { 0, 'code' } end

local now = tonumber(ARGV[3])
order.status = 'DELIVERED'
table.insert(order.events, { at = now, status = 'DELIVERED' })
order.updatedAt = now
redis.call('SET', KEYS[1], cjson.encode(order))
redis.call('ZREM', KEYS[2], order.id)
redis.call('ZADD', KEYS[3], now, order.id)
redis.call('SREM', KEYS[4], order.id)
redis.call('SREM', KEYS[7], order.id)

redis.call('LPUSH', KEYS[5], ARGV[7])
redis.call('LTRIM', KEYS[5], 0, tonumber(ARGV[9]) - 1)
redis.call('INCR', KEYS[6])

local earned = tonumber(ARGV[4])
local balance = 0
if earned > 0 then
  local moved = move_money(KEYS[8], KEYS[9], earned, ARGV[5], ARGV[6], '')
  balance = moved[2]
  redis.call('LPUSH', KEYS[10], ARGV[8])
  redis.call('LTRIM', KEYS[10], 0, tonumber(ARGV[9]) - 1)
  redis.call('INCR', KEYS[11])
end
return { 1, earned, balance }
`;

export interface HandoverResult {
  /** Rupees added to the runner's wallet. 0 for staff. */
  earned: number;
  balance: number;
}

/**
 * The holder types the buyer's 4-digit code. A match delivers the order and pays the runner (students only)
 * in one step. A wrong code changes nothing and has no penalty, but after a few in a row the entry pauses for a minute.
 */
export async function confirmHandover(user: RunUser, orderId: string, code: string, now: number): Promise<HandoverResult> {
  const order = await getOrder(orderId);
  if (!order) throw refusal("missing");
  const redis = getRedis();
  const wrong = Number((await redis.get<number>(handoverWrongKey(order.id))) ?? 0);
  if (wrong >= HANDOVER_RATE_LIMIT.maxWrongTries) throw new AppError(429, RUN_ERRORS.locked);

  const kind = kindOf(user);
  const earn = earnFor(order, kind);
  const buildingId = order.buildingId ?? "gict";
  const buyerUpdate = makeUpdate(order.buyerId, { ...deliveredUpdate(buildingId), kind: "order", orderId: order.id }, now);
  // Runner and staff Updates carry no order link: the order page is the buyer's.
  const holderUpdate = earn > 0 ? makeUpdate(user.id, { ...runnerEarnedUpdate(earn), kind: "wallet" }, now) : null;
  const ledgerEntry = { at: now, type: "earning", amount: earn, orderId: order.id, note: `Delivered to ${getBuilding(buildingId).short}` };

  const result = (await redis.eval(
    HANDOVER_LUA,
    [
      orderKey(order.id),
      activeKey(),
      doneKey(),
      liveKey(order.buyerId),
      updatesKey(order.buyerId),
      unreadKey(order.buyerId),
      runsLiveKey(user.id),
      walletKey(user.id),
      ledgerKey(user.id),
      updatesKey(user.id),
      unreadKey(user.id),
    ],
    [user.id, code, now, earn, JSON.stringify(ledgerEntry), LEDGER_KEEP, JSON.stringify(buyerUpdate), holderUpdate ? JSON.stringify(holderUpdate) : "", UPDATES_KEEP],
  )) as [number, number | string, number?];

  if (result[0] !== 1) {
    switch (result[1]) {
      case "code": {
        // The expiry is set first, so a counter can never be left without one.
        await redis.set(handoverWrongKey(order.id), 0, { nx: true, ex: HANDOVER_RATE_LIMIT.windowSec });
        await redis.incr(handoverWrongKey(order.id));
        throw new AppError(400, RUN_ERRORS.badCode);
      }
      case "holder":
        throw new AppError(403, RUN_ERRORS.notHolder);
      case "status":
        throw new AppError(409, RUN_ERRORS.notOut);
      default:
        throw refusal(String(result[1]));
    }
  }
  return { earned: Number(result[1]), balance: Number(result[2] ?? 0) };
}
