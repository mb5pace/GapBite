import { z } from "zod";
import { ORDER_COPY } from "@/data/order-copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { listLiveOrders, revealCode } from "@/lib/admin-live";
import { sweepLate } from "@/lib/late";
import { parseOrderRef } from "@/lib/order-ref";

export const dynamic = "force-dynamic";

/** GET -> every order in progress, for Admin › Live orders. Never carries a 4-digit code. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("admin");
    const now = Date.now();
    await sweepLate(now);
    return ok(await listLiveOrders(now));
  });
}

const schema = z.object({
  action: z.literal("reveal", ORDER_COPY.noSuchOrder),
  orderId: z.string(ORDER_COPY.noSuchOrder).max(INPUT_MAX.id, ORDER_COPY.noSuchOrder),
});

/** POST { action: "reveal", orderId } -> that one order's 4-digit code. Admin session only, checked here. A demo tool. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const { orderId } = await parseBody(req, schema);
    const id = parseOrderRef(orderId);
    if (!id) throw new AppError(404, ORDER_COPY.noSuchOrder);
    return ok(await revealCode(id));
  });
}
