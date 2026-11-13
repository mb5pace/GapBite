import { z } from "zod";
import { CAFE_COPY, REJECT_REASON_IDS } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { acceptOrder, collectOrder, getBagSlip, readyOrder, rejectOrder, sendWithStaff, startOrder } from "@/lib/cafe";
import { CODE_DIGITS, INPUT_MAX } from "@/lib/config";
import { toCafeCard } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/** GET -> the bag slip: what is in the bag, where it goes, and the QR for the runner scan. */
export async function GET(_req: Request, ctx: RouteContext<"/api/cafe/orders/[id]">) {
  return handle(async () => {
    await requireApiSession("cafe");
    const { id } = await ctx.params;
    return ok(await getBagSlip(id));
  });
}

const schema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("accept") }),
    z.object({ action: z.literal("reject"), reason: z.enum(REJECT_REASON_IDS, CAFE_COPY.errors.badReason) }),
    z.object({ action: z.literal("start") }),
    z.object({ action: z.literal("ready") }),
    z.object({ action: z.literal("staff"), staffId: z.string(CAFE_COPY.errors.needStaff).max(INPUT_MAX.id, CAFE_COPY.errors.staffUnknown) }),
    z.object({
      action: z.literal("collect"),
      code: z.string(CAFE_COPY.errors.badCode).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), CAFE_COPY.errors.badCode),
    }),
  ],
  CAFE_COPY.moved,
);

/**
 * POST { action: accept | reject | start | ready | staff | collect, ... } -> moves the order and tells the buyer.
 * The reply is the order as the desk sees it (no code).
 */
export async function POST(req: Request, ctx: RouteContext<"/api/cafe/orders/[id]">) {
  return handle(async () => {
    await requireApiSession("cafe");
    const { id } = await ctx.params;
    const body = await parseBody(req, schema);
    const now = Date.now();
    switch (body.action) {
      case "accept":
        return ok({ order: toCafeCard(await acceptOrder(id, now)) });
      case "reject":
        return ok({ order: toCafeCard(await rejectOrder(id, body.reason, now)) });
      case "start":
        return ok({ order: toCafeCard(await startOrder(id, now)) });
      case "ready":
        return ok({ order: toCafeCard(await readyOrder(id, now)) });
      case "staff":
        return ok({ order: toCafeCard(await sendWithStaff(id, body.staffId, now)) });
      case "collect":
        return ok({ order: toCafeCard(await collectOrder(id, body.code, now)) });
    }
  });
}
