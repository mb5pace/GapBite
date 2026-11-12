import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getWalletSnapshot } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/** GET -> your balance and your ledger, newest first. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok(await getWalletSnapshot(session.userId as string));
  });
}
