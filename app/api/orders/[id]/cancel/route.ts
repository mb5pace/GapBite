import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { cancelOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** POST -> cancels your own order, only while the cafe has not accepted it: full refund, vending stock returned. */
export async function POST(_req: Request, ctx: RouteContext<"/api/orders/[id]/cancel">) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { id } = await ctx.params;
    return ok(await cancelOrder(id, session.userId as string, Date.now()));
  });
}
