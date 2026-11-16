// C2-1 focused tests: seed is idempotent, reset stays in its prefix, the late-test order settles after grace.
// Run: redis-server --port 6390 &  node tests/shim.mjs &  node --test --test-concurrency=1 tests/
import assert from "node:assert/strict";
import { test } from "node:test";
import { createJiti } from "jiti";

process.env.KV_REST_API_URL = "http://127.0.0.1:8790";
process.env.KV_REST_API_TOKEN = "t";
delete process.env.VERCEL_ENV;
const ROOT = new URL("../", import.meta.url).pathname;
const jiti = createJiti(import.meta.url, { alias: { "@/": ROOT } });
const load = (p) => jiti.import(ROOT + p);

const demo = await load("lib/demo.ts");
const { getRedis, key } = await load("lib/redis.ts");
const wallet = await load("lib/wallet.ts");
const { getOrder, listOrdersFor } = await load("lib/orders.ts");
const { sweepLate } = await load("lib/late.ts");
const { GRACE_MIN } = await load("lib/config.ts");
const r = getRedis();

async function allKeys(match) {
  let cursor = 0;
  const out = [];
  do {
    const [next, keys] = await r.scan(cursor, { match, count: 500 });
    cursor = next;
    out.push(...keys);
  } while (String(cursor) !== "0");
  return out.sort();
}

test("reset with everything ticked starts clean", async () => {
  await demo.resetDemo({ staff: true, hours: true });
  assert.deepEqual((await allKeys("qxdev:*")).filter((k) => k !== "qxdev:stock"), []);
});

test("seeding twice makes no duplicates and sets balances", async () => {
  const now = Date.now();
  await demo.seedDemo(now);
  await wallet.topUp("AU2340101", 500, now); // balance drifts
  const keysBefore = await allKeys("qxdev:*");
  await demo.seedDemo(now + 1000);
  const keysAfter = (await allKeys("qxdev:*")).filter((k) => !k.startsWith("qxdev:updates") && !k.startsWith("qxdev:unread"));
  assert.deepEqual(keysAfter, keysBefore.filter((k) => !k.startsWith("qxdev:updates") && !k.startsWith("qxdev:unread")));
  assert.equal(await wallet.getBalance("AU2340101"), 300);
  assert.equal(await wallet.getBalance("AU2340102"), 120);
  assert.equal(await wallet.getBalance("AU2340103"), 300);
  assert.equal(await r.get(key("staff", "seq")), 1);
  assert.equal((await r.get(key("user", "QX-STF-01"))).name, "Ramesh");
  assert.equal(await r.scard(key("users")), 4);
  const riya = await listOrdersFor("AU2340101");
  assert.equal(riya.past.length, 1);
  assert.equal(riya.past[0].status, "DELIVERED");
  const ledger = await wallet.getLedger("AU2340101");
  assert.equal(ledger[0].balance, 300);
  assert.ok(ledger.some((e) => e.type === "order" && e.orderId === "QX-9001"));
  assert.ok((await wallet.getLedger("AU2340102")).some((e) => e.type === "earning"));
});

test("seed does not overwrite an existing QX-STF-01", async () => {
  await r.set(key("user", "QX-STF-01"), { id: "QX-STF-01", name: "Suresh", role: "staff", createdAt: 1 });
  await demo.seedDemo(Date.now());
  assert.equal((await r.get(key("user", "QX-STF-01"))).name, "Suresh");
  assert.equal(await r.get(key("staff", "seq")), 1);
});

test("reset keeps codes, staff and hours by default and never touches the other prefix", async () => {
  await r.set("qx:wallet:AU2340101", 999);
  await r.set("qx:order:QX-1111", "{}");
  await r.hset(key("codes", "temp"), { ABC123: "{}" });
  await r.hset(key("hours"), { "p:truly-indian": true });
  await r.hset(key("stock"), { A1: 0 });
  await r.set(key("idem", "AU2340101", "x"), "QX-1");
  await r.lpush(key("feedback"), "{}");
  const { deleted } = await demo.resetDemo({ staff: false, hours: false });
  assert.ok(deleted > 0);
  assert.equal(await r.get("qx:wallet:AU2340101"), 999);
  assert.equal(await r.exists("qx:order:QX-1111"), 1);
  assert.equal(await r.exists(key("wallet", "AU2340101")), 0);
  assert.equal(await r.exists(key("order", "QX-9001")), 0);
  assert.equal(await r.exists(key("idem", "AU2340101", "x")), 0);
  assert.equal(await r.exists(key("feedback")), 0);
  assert.equal(await r.exists(key("codes", "temp")), 1);
  assert.equal(await r.exists(key("hours")), 1);
  assert.equal(await r.exists(key("user", "QX-STF-01")), 1);
  assert.deepEqual((await r.smembers(key("users"))).map(String), ["QX-STF-01"]);
  assert.notEqual(Number(await r.hget(key("stock"), "A1")), 0);
  await demo.resetDemo({ staff: true, hours: true });
  assert.equal(await r.exists(key("user", "QX-STF-01")), 0);
  assert.equal(await r.exists(key("hours")), 0);
  assert.equal(await r.exists(key("codes", "temp")), 1);
  assert.equal(await r.get("qx:wallet:AU2340101"), 999);
  await r.del("qx:wallet:AU2340101", "qx:order:QX-1111", key("codes", "temp"));
});

for (const runnerId of ["AU2340102", "QX-STF-01"]) {
  test(`late-test order with ${runnerId} settles after grace`, async () => {
    await demo.resetDemo({ staff: true, hours: true });
    const now = Date.now();
    await demo.seedDemo(now);
    const order = await demo.createLateTestOrder("AU2340101", runnerId, now);
    assert.equal(order.status, "PICKED_UP");
    assert.equal(order.promisedAt, now + 60_000);
    assert.equal(await wallet.getBalance("AU2340101"), 300 - order.total);
    await sweepLate(now + 30_000);
    assert.equal((await getOrder(order.id)).status, "PICKED_UP");
    await r.del(key("sweep"));
    await sweepLate(now + 60_000 + GRACE_MIN * 60_000 + 1000);
    const settled = await getOrder(order.id);
    assert.equal(settled.status, "FAILED_LATE");
    assert.equal(await wallet.getBalance("AU2340101"), 300);
    await assert.rejects(demo.createLateTestOrder("AU2340101", "AU2340101", now));
  });
}

test("late-test order refuses a buyer who cannot pay", async () => {
  await r.set(key("wallet", "AU2340102"), 20);
  await assert.rejects(demo.createLateTestOrder("AU2340102", "AU2340103", Date.now()), /needs/);
  assert.equal(await wallet.getBalance("AU2340102"), 20);
});
