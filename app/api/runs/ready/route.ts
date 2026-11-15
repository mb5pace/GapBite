import { RUN_ERRORS } from "@/data/order-copy";
import { AppError, handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { listReadyBags } from "@/lib/runs";
import { getUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * GET -> delivery bags that are ready and nobody has taken, for any student or staff session: cafe, building and drop
 * point, the earning for its zone ("Staff delivery" for staff), item count and minutes since ready. Never the order ID,
 * the buyer or the code, and never the caller's own orders. Nothing can be taken from this list: a bag is taken by
 * scanning it at its counter.
 */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const user = await getUser(session.userId as string);
    if (!user) throw new AppError(403, RUN_ERRORS.notHolder);
    const now = Date.now();
    return ok({ bags: await listReadyBags({ id: user.id, name: user.name, role: user.role }, now), now });
  });
}
