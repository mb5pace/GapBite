import { AppError, handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getMe } from "@/lib/me";

export const dynamic = "force-dynamic";

/** GET -> who you are, your wallet balance, unread Updates, whether an order is in progress, and session time left. Polled by the header. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const me = await getMe(session, Date.now());
    if (!me) throw new AppError(403, "Tell us who's ordering first.");
    return ok(me);
  });
}
