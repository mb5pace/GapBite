import { z } from "zod";
import { RUN_ERRORS } from "@/data/order-copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { parseOrderRef } from "@/lib/order-ref";
import { getUser } from "@/lib/users";
import { CODE_DIGITS } from "@/lib/config";
import { confirmHandover } from "@/lib/runs";

export const dynamic = "force-dynamic";

/** Who is asking, as a runner sees them: ID, first name and whether they are staff. */
async function runUser(userId: string) {
  const user = await getUser(userId);
  if (!user) throw new AppError(403, RUN_ERRORS.notHolder);
  return { id: user.id, name: user.name, role: user.role };
}
const schema = z.object({
  orderId: z.string(RUN_ERRORS.notFound).max(INPUT_MAX.id, RUN_ERRORS.notFound),
  code: z.string(RUN_ERRORS.needDigits).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), RUN_ERRORS.needDigits),
});

/** POST { orderId, code } -> the buyer's 4-digit code. A match delivers the order and pays the runner (students only) in one step. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { orderId, code } = await parseBody(req, schema);
    const id = parseOrderRef(orderId);
    if (!id) throw new AppError(404, RUN_ERRORS.notFound);
    return ok(await confirmHandover(await runUser(session.userId as string), id, code, Date.now()));
  });
}
