// C2-2 scripted end-to-end runs through the server functions the API routes call.
// Run: redis-server --port 6390 &  node tests/shim.mjs &  node --test --test-concurrency=1 tests/
import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { createJiti } from "jiti";

process.env.KV_REST_API_URL = "http://127.0.0.1:8790";
process.env.KV_REST_API_TOKEN = "t";
delete process.env.VERCEL_ENV;
const ROOT = new URL("../", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@/": ROOT } });
const load = (p) => jiti.import(ROOT + p);

const demo = await load("lib/demo.ts");
const { getRedis, key } = await load("lib/redis.ts");
const W = await load("lib/wallet.ts");
const O = await load("lib/orders.ts");
const C = await load("lib/cafe.ts");
const R = await load("lib/runs.ts");
const L = await load("lib/late.ts");
const H = await load("lib/hours.ts");
const { collectQrText } = await load("lib/order-ref.ts");
const { GRACE_MIN } = await load("lib/config.ts");
const r = getRedis();

// Tuesday 17 Nov 2026, 09:00 IST: every source but Global Bistro is open, breakfast still on.
const T0 = Date.UTC(2026, 10, 17, 3, 30);
const MIN = 60_000;
const riya = { id: "AU2340101", name: "Riya" };
const aarav = { id: "AU2340102", name: "Aarav", role: "student" };
const meera = { id: "AU2340103", name: "Meera", role: "student" };
const ramesh = { id: "QX-STF-01", name: "Ramesh", role: "staff" };
let n = 0;
const place = (buyer, lines, extra = {}, now = T0) =>
  O.placeOrder(buyer, { lines, mode: "pickup", when: "asap", requestId: `req-${++n}`, ...extra }, now);
const deliver = (b) => ({ mode: "delivery", buildingId: b });

async function cook(id, now = T0) {
  const accepted = await C.acceptOrder(id, now);
  if (accepted.status === "READY") return accepted; // vending is ready as soon as it is accepted
  const order = await O.getOrder(id);
  if (order.sourceId !== "vending") await C.startOrder(id, now + MIN);
  return C.readyOrder(id, now + 2 * MIN);
}
async function sweepAt(t) {
  await r.del(key("sweep"));
  await L.sweepLate(t);
}

beforeEach(async () => {
  await demo.resetDemo({ staff: true, hours: true });
  await demo.seedDemo(T0 - 60 * MIN);
});

test("QR pickup: collect with the buyer's QR at the counter", async () => {
  const { order } = await place(riya, [{ itemId: "cd-espresso", qty: 1 }]);
  await cook(order.id);
  await assert.rejects(C.scanCollect({ qr: collectQrText(order.id, order.code === "0000" ? "1111" : "0000") }, T0 + 3 * MIN));
  const done = await C.scanCollect({ qr: collectQrText(order.id, order.code) }, T0 + 3 * MIN);
  assert.equal(done.status, "COLLECTED");
  assert.equal(await W.getBalance(riya.id), 300 - order.total);
});

test("kiosk vending: code releases the slot and stock drops", async () => {
  const before = Number(await r.hget(key("stock"), "A1"));
  const { order } = await place(riya, [{ itemId: "v-pb-aamras", qty: 2 }]);
  assert.equal(Number(await r.hget(key("stock"), "A1")), before - 2);
  await cook(order.id);
  const res = await C.kioskCollect(order.code, T0 + 3 * MIN);
  assert.equal(res.orderId, order.id);
  assert.deepEqual(res.slots.map((s) => [s.slot, s.qty]), [["A1", 2]]);
  assert.equal((await O.getOrder(order.id)).status, "COLLECTED");
});

test("student runner with I'm here: handover pays the runner", async () => {
  const { order } = await place(riya, [{ itemId: "ti-thali", qty: 1 }], deliver("gict"));
  await cook(order.id);
  const aaravBefore = await W.getBalance(aarav.id);
  const { earn } = await R.acceptRun(aarav, order.id, T0 + 3 * MIN);
  await assert.rejects(R.acceptRun(meera, order.id, T0 + 3 * MIN));
  await R.arriveAtDropPoint(aarav, order.id, T0 + 6 * MIN);
  await assert.rejects(R.confirmHandover(aarav, order.id, order.code === "0000" ? "1111" : "0000", T0 + 7 * MIN));
  await R.confirmHandover(aarav, order.id, order.code, T0 + 7 * MIN);
  assert.equal((await O.getOrder(order.id)).status, "DELIVERED");
  assert.equal(await W.getBalance(aarav.id), aaravBefore + earn);
});

test("staff delivery: sent with staff, handed over, no earning", async () => {
  const { order } = await place(riya, [{ itemId: "ti-thali", qty: 1 }], deliver("sas"));
  await cook(order.id);
  await C.sendWithStaff(order.id, ramesh.id, T0 + 3 * MIN);
  const picked = await O.getOrder(order.id);
  assert.equal(picked.status, "PICKED_UP");
  assert.equal(picked.holder.kind, "staff");
  await R.confirmHandover(ramesh, order.id, order.code, T0 + 8 * MIN);
  assert.equal((await O.getOrder(order.id)).status, "DELIVERED");
  assert.equal(await W.getBalance(ramesh.id), 0);
});

async function lateRun(holder) {
  const { order } = await place(riya, [{ itemId: "ti-thali", qty: 1 }], deliver("gict"));
  await cook(order.id);
  if (holder.role === "staff") await C.sendWithStaff(order.id, holder.id, T0 + 3 * MIN);
  else await R.acceptRun(holder, order.id, T0 + 3 * MIN);
  const promised = (await O.getOrder(order.id)).promisedAt;
  await sweepAt(promised + GRACE_MIN * MIN + 1000);
  return { order, settled: await O.getOrder(order.id) };
}

test("runner late: buyer refunded, runner penalised", async () => {
  const before = await W.getBalance(aarav.id);
  const { settled } = await lateRun(aarav);
  assert.equal(settled.status, "FAILED_LATE");
  assert.equal(await W.getBalance(riya.id), 300);
  assert.ok((await W.getBalance(aarav.id)) < before);
});

test("staff late: buyer refunded, staff-return alert for the cafe", async () => {
  const { order, settled } = await lateRun(ramesh);
  assert.equal(settled.status, "FAILED_LATE");
  assert.equal(await W.getBalance(riya.id), 300);
  const alerts = (await C.listQueue(T0 + 60 * MIN)).alerts;
  assert.ok(alerts.some((a) => a.orderId === order.id && a.kind === "staff-return"));
});

test("no-show: runner arrived in time, buyer never came", async () => {
  const { order } = await place(riya, [{ itemId: "ti-thali", qty: 1 }], deliver("gict"));
  await cook(order.id);
  await R.acceptRun(aarav, order.id, T0 + 3 * MIN);
  const promised = (await O.getOrder(order.id)).promisedAt;
  await R.arriveAtDropPoint(aarav, order.id, promised - MIN);
  await sweepAt(promised + GRACE_MIN * MIN + 1000);
  assert.equal((await O.getOrder(order.id)).status, "NO_SHOW");
  assert.equal(await W.getBalance(riya.id), 300 - order.total);
});

test("cancel: buyer cancels before the cafe accepts and is refunded", async () => {
  const { order } = await place(riya, [{ itemId: "cd-espresso", qty: 1 }]);
  const res = await O.cancelOrder(order.id, riya.id, T0 + 1000);
  assert.equal(res.order.status, "CANCELLED");
  assert.equal(res.balance, 300);
  const { order: o2 } = await place(riya, [{ itemId: "cd-espresso", qty: 1 }]);
  await C.acceptOrder(o2.id, T0);
  await assert.rejects(O.cancelOrder(o2.id, riya.id, T0 + 1000));
});

test("reject: the cafe rejects and the buyer gets the money and stock back", async () => {
  const before = Number(await r.hget(key("stock"), "A2"));
  const { order } = await place(riya, [{ itemId: "v-pb-jaljeera", qty: 1 }]);
  const rejected = await C.rejectOrder(order.id, "ran-out", T0 + 1000);
  assert.equal(rejected.status, "REJECTED");
  assert.equal(await W.getBalance(riya.id), 300);
  assert.equal(Number(await r.hget(key("stock"), "A2")), before);
});

test("refusals: closed hours, breakfast window, pause and service off", async () => {
  const sunday = Date.UTC(2026, 10, 22, 4, 30);
  await assert.rejects(place(riya, [{ itemId: "cd-espresso", qty: 1 }], {}, sunday), (e) => e.status === 409);
  await assert.rejects(place(riya, [{ itemId: "cd-espresso", qty: 1 }], {}, Date.UTC(2026, 10, 17, 1, 0)), (e) => e.status === 409); // 06:30, before opening
  await assert.rejects(place(riya, [{ itemId: "ti-poha", qty: 1 }], {}, Date.UTC(2026, 10, 17, 6, 0)), (e) => e.status === 409); // 11:30, breakfast over
  await H.savePaused("cafe-delice", true);
  await assert.rejects(place(riya, [{ itemId: "cd-espresso", qty: 1 }]), (e) => e.status === 409);
  await H.savePaused("cafe-delice", false);
  await H.saveService(false, "Back after lunch.");
  await assert.rejects(place(riya, [{ itemId: "cd-espresso", qty: 1 }]), (e) => e.status === 409 && /Back after lunch/.test(e.message));
  await H.saveService(true, "Back after lunch.");
  await place(riya, [{ itemId: "cd-espresso", qty: 1 }]);
  assert.equal(await W.getBalance(riya.id), 300 - 60);
});

test("Order again: the past order's lines place a new order", async () => {
  const { past } = await O.listOrdersFor(riya.id);
  const lines = past[0].items.map((i) => ({ itemId: i.itemId, qty: i.qty }));
  const { order } = await place(riya, lines, deliver("gict"));
  assert.deepEqual(order.items.map((i) => i.itemId), lines.map((l) => l.itemId));
  assert.equal(order.status, "PLACED");
});
