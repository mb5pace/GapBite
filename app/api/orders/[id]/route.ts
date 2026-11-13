import { ORDER_COPY } from "@/data/order-copy";
import { AppError, handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * GET -> one order, including its 4-digit code. Only the buyer can read it; anyone
 * else gets the same "not found" as for an order that does not exist, so nobody
 * can learn which order IDs are real. (The cafe, the runner and Admin get their
 * own code-free views in later phases.)
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { id } = await ctx.params;
    const found = await getOrderForBuyer(id, session.userId as string);
    if (!found) throw new AppError(404, ORDER_COPY.noSuchOrder);
    return ok(found);
  });
}
