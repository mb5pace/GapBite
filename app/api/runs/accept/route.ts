import { z } from "zod";
import { RUN_ERRORS } from "@/data/order-copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { parseOrderRef } from "@/lib/order-ref";
import { getUser } from "@/lib/users";
import { SLIP_QR_PREFIX } from "@/lib/config";
import { acceptRun } from "@/lib/runs";

export const dynamic = "force-dynamic";

/** Who is asking, as a runner sees them: ID, first name and whether they are staff. */
async function runUser(userId: string) {
  const user = await getUser(userId);
  if (!user) throw new AppError(403, RUN_ERRORS.notHolder);
  return { id: user.id, name: user.name, role: user.role };
}
const schema = z.object({ orderId: z.string(RUN_ERRORS.notSlip).max(INPUT_MAX.id + SLIP_QR_PREFIX.length, RUN_ERRORS.notSlip) });

/** POST { orderId } -> accepts the run, atomically. First valid scan wins; everyone else gets one plain line saying why not. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { orderId } = await parseBody(req, schema);
    const id = parseOrderRef(orderId);
    if (!id) throw new AppError(400, RUN_ERRORS.notSlip);
    return ok(await acceptRun(await runUser(session.userId as string), id, Date.now()));
  });
}
