/**
 * Admin › Demo: seed, the late-test order and reset (v1.0.0 Phase C2). Server-side only.
 *
 * Everything here works inside the current environment's key prefix (qx: on production, qxdev: on preview and
 * local). Reset finds keys with SCAN and a MATCH on that prefix, never KEYS, and checks ownsKey() before deleting.
 */
import { DEMO_LATE_BUILDING, DEMO_LATE_LINES, DEMO_LATE_PROMISE_MIN, DEMO_PAST_ORDERS, DEMO_STAFF_NAME, DEMO_STUDENTS } from "@/data/demo";
import { getBuilding } from "@/data/locations";
import { getSource } from "@/data/menu";
import { AppError } from "./api";
import { LEDGER_KEEP, ORDER_ID_RETRIES, RUNNER_EARN, STAFF_ID_PREFIX, WALLET_MIN_TO_USE } from "./config";
import { staffIdFromNumber } from "./ids";
import { feeFor, priceLines, walkFor } from "./order-rules";
import { activeKey, byUserKey, doneKey, liveKey, newCode, newOrderId, orderKey, runsByKey, runsLiveKey } from "./orders";
import type { Holder, Order } from "./order-types";
import { deployEnv, getRedis, key, keyPattern, keyPrefix, ownsKey, type DeployEnv } from "./redis";
import { ensureStock } from "./stock";
import { getUser, listUsers, type UserRecord } from "./users";
import { moveMoney, type LedgerEntry } from "./wallet";
import { topUpNeeded } from "./wallet-rules";
import { formatRupees } from "./format";

const MIN = 60_000;
const DEMO_STAFF_ID = staffIdFromNumber(1);

export interface DemoEnv {
  env: DeployEnv;
  prefix: string;
}

export function demoEnv(): DemoEnv {
  return { env: deployEnv(), prefix: keyPrefix() };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/** QX-STF-01 Ramesh, through the qx:staff:seq counter, only when QX-STF-01 does not exist yet. */
async function ensureDemoStaff(now: number): Promise<UserRecord> {
  const redis = getRedis();
  const existing = await getUser(DEMO_STAFF_ID);
  if (existing) return existing;
  // Only the first staff number may be claimed here: if the counter is already past 1 the ID was used and removed,
  // so it is written directly and the counter is left alone.
  const seq = Number((await redis.get<number>(key("staff", "seq"))) ?? 0);
  if (seq < 1) await redis.set(key("staff", "seq"), 1);
  const record: UserRecord = { id: DEMO_STAFF_ID, name: DEMO_STAFF_NAME, role: "staff", createdAt: now };
  await redis.set(key("user", record.id), record, { nx: true });
  await redis.sadd(key("users"), record.id);
  return (await getUser(DEMO_STAFF_ID)) ?? record;
}

function holderFor(spec: string, staff: UserRecord): Holder {
  if (spec === "staff") return { kind: "staff", id: staff.id, name: staff.name };
  const student = DEMO_STUDENTS.find((s) => s.id === spec);
  if (!student) throw new Error(`Unknown demo holder ${spec}`);
  return { kind: "runner", id: student.id, name: student.name };
}

function pastOrder(spec: (typeof DEMO_PAST_ORDERS)[number], holder: Holder, now: number): Order {
  const priced = priceLines(spec.lines);
  if (!priced.ok) throw new Error(`Demo order ${spec.id} has bad lines`);
  const buyer = DEMO_STUDENTS.find((s) => s.id === spec.buyerId);
  if (!buyer) throw new Error(`Unknown demo buyer ${spec.buyerId}`);
  const placed = now - spec.agoMin * MIN;
  const fee = feeFor("delivery", spec.buildingId);
  const walkMin = walkFor("delivery", spec.buildingId);
  const at = (min: number) => placed + min * MIN;
  const delivered = at(priced.prepMin + walkMin + 2);
  return {
    id: spec.id,
    buyerId: buyer.id,
    buyerName: buyer.name,
    sourceId: priced.sourceId,
    items: priced.items,
    mode: "delivery",
    buildingId: spec.buildingId,
    when: "asap",
    subtotal: priced.subtotal,
    fee,
    total: priced.subtotal + fee,
    code: newCode(spec.id),
    status: "DELIVERED",
    holder,
    prepMin: priced.prepMin,
    walkMin,
    promisedAt: at(priced.prepMin + walkMin + 4),
    arrivedAt: at(priced.prepMin + walkMin + 1),
    events: [
      { at: placed, status: "PLACED" },
      { at: at(1), status: "ACCEPTED" },
      { at: at(1), status: "PREPARING" },
      { at: at(1 + priced.prepMin), status: "READY" },
      { at: at(1 + priced.prepMin), status: "PICKED_UP" },
      { at: at(priced.prepMin + walkMin + 1), status: "PICKED_UP", note: "Arrived at the drop point" },
      { at: delivered, status: "DELIVERED" },
    ],
    createdAt: placed,
    updatedAt: delivered,
  };
}

/**
 * Seeds the demo people, wallets and two past delivered orders. Every value is set, not added: running it twice gives
 * the same balances, ledgers and orders. QX-STF-01 Ramesh is created only if that ID does not exist.
 */
export async function seedDemo(now: number): Promise<{ students: number; staffId: string; orders: string[] }> {
  const redis = getRedis();
  const staff = await ensureDemoStaff(now);
  const orders = DEMO_PAST_ORDERS.map((spec) => pastOrder(spec, holderFor(spec.holder, staff), now));

  // Each seeded wallet's ledger, oldest first: a top-up, then its part in the past orders, ending at the seeded balance.
  const moves = new Map<string, { at: number; type: LedgerEntry["type"]; amount: number; orderId?: string; note?: string }[]>();
  const add = (id: string, entry: { at: number; type: LedgerEntry["type"]; amount: number; orderId?: string; note?: string }) =>
    moves.set(id, [...(moves.get(id) ?? []), entry]);
  for (const order of orders) {
    add(order.buyerId, { at: order.createdAt, type: "order", amount: -order.total, orderId: order.id, note: getSource(order.sourceId).name });
    if (order.holder?.kind === "runner" && order.buildingId) {
      add(order.holder.id, { at: order.updatedAt, type: "earning", amount: RUNNER_EARN[getBuilding(order.buildingId).zone], orderId: order.id, note: "Delivery earning" });
    }
  }

  const pipeline = redis.pipeline();
  for (const student of DEMO_STUDENTS) {
    const record: UserRecord = { id: student.id, name: student.name, role: "student", createdAt: now - 3 * 24 * 60 * MIN };
    const existing = await getUser(student.id);
    pipeline.set(key("user", student.id), { ...record, createdAt: existing?.createdAt ?? record.createdAt });
    pipeline.sadd(key("users"), student.id);

    const own = (moves.get(student.id) ?? []).sort((a, b) => a.at - b.at);
    const net = own.reduce((sum, entry) => sum + entry.amount, 0);
    const opening = student.balance - net;
    const firstAt = Math.min(now - 3 * 24 * 60 * MIN, ...own.map((entry) => entry.at - MIN));
    let balance = 0;
    const ledger: LedgerEntry[] = [];
    for (const entry of [{ at: firstAt, type: "topup" as const, amount: opening, note: "Mock UPI top-up" }, ...own]) {
      if (entry.amount === 0) continue;
      balance += entry.amount;
      ledger.push({ ...entry, balance } as LedgerEntry);
    }
    pipeline.set(key("wallet", student.id), student.balance);
    pipeline.del(key("ledger", student.id));
    if (ledger.length > 0) pipeline.lpush(key("ledger", student.id), ...ledger.slice(-LEDGER_KEEP));
  }

  for (const order of orders) {
    pipeline.set(orderKey(order.id), order);
    pipeline.zrem(activeKey(), order.id);
    pipeline.zadd(doneKey(), { score: order.updatedAt, member: order.id });
    pipeline.zadd(byUserKey(order.buyerId), { score: order.createdAt, member: order.id });
    pipeline.srem(liveKey(order.buyerId), order.id);
    if (order.holder) {
      pipeline.zadd(runsByKey(order.holder.id), { score: order.updatedAt, member: order.id });
      pipeline.srem(runsLiveKey(order.holder.id), order.id);
    }
  }
  await pipeline.exec();
  await ensureStock();
  return { students: DEMO_STUDENTS.length, staffId: staff.id, orders: orders.map((o) => o.id) };
}

// ---------------------------------------------------------------------------
// Late-test order
// ---------------------------------------------------------------------------

/** Students and staff for the two dropdowns. */
export async function demoPeople(): Promise<UserRecord[]> {
  return listUsers("", 200);
}

/**
 * A delivery order already PICKED_UP by `runnerId`, promised one minute from now, with the buyer debited the normal
 * way (the same wallet floor as placing an order). The late sweep settles it when grace ends, like any other order.
 */
export async function createLateTestOrder(buyerId: string, runnerId: string, now: number): Promise<Order> {
  if (buyerId === runnerId) throw new AppError(400, "Pick a different runner from the buyer.");
  const [buyer, runner] = await Promise.all([getUser(buyerId), getUser(runnerId)]);
  if (!buyer || buyer.role !== "student") throw new AppError(404, "Pick a student as the buyer.");
  if (!runner) throw new AppError(404, "No one has that ID.");

  const priced = priceLines([...DEMO_LATE_LINES]);
  if (!priced.ok) throw new Error("Demo late-test lines are bad");
  const buildingId = DEMO_LATE_BUILDING;
  const fee = feeFor("delivery", buildingId);
  const total = priced.subtotal + fee;
  const holder: Holder = { kind: runner.role === "staff" ? "staff" : "runner", id: runner.id, name: runner.name };
  const redis = getRedis();

  for (let attempt = 0; attempt < ORDER_ID_RETRIES; attempt++) {
    const id = newOrderId();
    const order: Order = {
      id,
      buyerId: buyer.id,
      buyerName: buyer.name,
      sourceId: priced.sourceId,
      items: priced.items,
      mode: "delivery",
      buildingId,
      when: "asap",
      subtotal: priced.subtotal,
      fee,
      total,
      code: newCode(id),
      status: "PICKED_UP",
      holder,
      prepMin: priced.prepMin,
      walkMin: walkFor("delivery", buildingId),
      promisedAt: now + DEMO_LATE_PROMISE_MIN * MIN,
      events: [
        { at: now, status: "PLACED" },
        { at: now, status: "ACCEPTED" },
        { at: now, status: "READY" },
        { at: now, status: "PICKED_UP" },
      ],
      createdAt: now,
      updatedAt: now,
    };
    if (!(await redis.set(orderKey(id), order, { nx: true }))) continue;

    const paid = await moveMoney(
      buyer.id,
      -total,
      { type: "order", orderId: id, note: getSource(priced.sourceId).name },
      now,
      { floor: Math.max(WALLET_MIN_TO_USE, total) - total },
    );
    if (!paid.ok) {
      await redis.del(orderKey(id));
      throw new AppError(409, `${buyer.name} needs ${formatRupees(topUpNeeded(paid.balance, total))} more to pay for it.`);
    }
    const pipeline = redis.pipeline();
    pipeline.zadd(activeKey(), { score: now, member: id });
    pipeline.zadd(byUserKey(buyer.id), { score: now, member: id });
    pipeline.sadd(liveKey(buyer.id), id);
    pipeline.sadd(runsLiveKey(runner.id), id);
    pipeline.zadd(runsByKey(runner.id), { score: now, member: id });
    await pipeline.exec();
    return order;
  }
  throw new AppError(503, "Could not make an order ID. Try again.");
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

export interface ResetOptions {
  /** Also remove staff accounts and the staff counter. */
  staff: boolean;
  /** Also clear opening hours, holidays, item windows, "Available today" and the pause and service switches. */
  hours: boolean;
}

/** Keys (after the prefix) kept unless a box is ticked. Codes are always kept. */
function keepKey(rest: string, options: ResetOptions): boolean {
  if (rest === "codes" || rest.startsWith("codes:")) return true;
  if (!options.staff && (rest === "staff:seq" || rest.startsWith(`user:${STAFF_ID_PREFIX}`))) return true;
  if (!options.hours && (rest === "hours" || rest === "service" || rest === "unavailable")) return true;
  return false;
}

const SCAN_COUNT = 200;

/**
 * Wipes this environment's orders, wallets, ledgers, users, Updates, unread counts, alerts, runs, feedback and
 * idempotency keys, and puts vending stock back to its start values. Codes are kept; staff and hours are kept unless
 * asked. Only keys under this environment's prefix are touched.
 */
export async function resetDemo(options: ResetOptions): Promise<{ deleted: number; kept: number }> {
  const redis = getRedis();
  const prefix = keyPrefix();
  const keptStaff: string[] = [];
  let cursor: string | number = 0;
  let deleted = 0;
  let kept = 0;
  do {
    const [next, keys]: [string | number, string[]] = await redis.scan(cursor, { match: keyPattern(), count: SCAN_COUNT });
    cursor = next;
    const doomed: string[] = [];
    for (const k of keys.map(String)) {
      if (!ownsKey(k)) continue; // "qx:*" never matches "qxdev:", but check anyway
      const rest = k.slice(prefix.length);
      if (keepKey(rest, options)) {
        kept++;
        if (rest.startsWith(`user:${STAFF_ID_PREFIX}`)) keptStaff.push(rest.slice("user:".length));
      } else doomed.push(k);
    }
    if (doomed.length > 0) deleted += await redis.del(...doomed);
  } while (String(cursor) !== "0");

  if (keptStaff.length > 0) await redis.sadd(key("users"), keptStaff[0], ...keptStaff.slice(1));
  await ensureStock();
  return { deleted, kept };
}
