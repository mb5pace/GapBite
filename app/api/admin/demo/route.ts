import { z } from "zod";
import { DEMO_RESET_WORD } from "@/data/demo";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { createLateTestOrder, demoEnv, demoPeople, resetDemo, seedDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

/** GET -> the environment, its key prefix and everyone for the late-test dropdowns. Admin only. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("admin");
    const people = await demoPeople();
    return ok({ ...demoEnv(), people: people.map((u) => ({ id: u.id, name: u.name, role: u.role })) });
  });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("seed") }).strict(),
  z.object({ action: z.literal("late"), buyerId: z.string().min(1).max(20), runnerId: z.string().min(1).max(20) }).strict(),
  z.object({ action: z.literal("reset"), confirm: z.string().max(20), staff: z.boolean(), hours: z.boolean() }).strict(),
]);

/** POST { action } -> seed, a late-test order, or reset (typed RESET). Only this environment's keys are touched. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const body = await parseBody(req, schema);
    const now = Date.now();
    if (body.action === "seed") return ok(await seedDemo(now));
    if (body.action === "late") {
      const order = await createLateTestOrder(body.buyerId, body.runnerId, now);
      return ok({ id: order.id, promisedAt: order.promisedAt });
    }
    if (body.confirm !== DEMO_RESET_WORD) throw new AppError(400, `Type ${DEMO_RESET_WORD} to confirm.`);
    return ok(await resetDemo({ staff: body.staff, hours: body.hours }));
  });
}
