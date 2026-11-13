import { z } from "zod";
import { RUN_ERRORS } from "@/data/order-copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { parseOrderRef } from "@/lib/order-ref";
import { getUser } from "@/lib/users";
import { arriveAtDropPoint } from "@/lib/runs";

export const dynamic = "force-dynamic";

/** Who is asking, as a runner sees them: ID, first name and whether they are staff. */
async function runUser(userId: string) {
  const user = await getUser(userId);
  if (!user) throw new AppError(403, RUN_ERRORS.notHolder);
  return { id: user.id, name: user.name, role: user.role };
}
const schema = z.object({ orderId: z.string(RUN_ERRORS.notFound).max(INPUT_MAX.id, RUN_ERRORS.notFound) });

/** POST { orderId } -> "I'm here": records arrivedAt and tells the buyer. Only while PICKED_UP, only by the holder. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { orderId } = await parseBody(req, schema);
    const id = parseOrderRef(orderId);
    if (!id) throw new AppError(404, RUN_ERRORS.notFound);
    return ok({ run: await arriveAtDropPoint(await runUser(session.userId as string), id, Date.now()) });
  });
}
