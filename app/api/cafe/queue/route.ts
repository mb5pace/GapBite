import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { listQueue } from "@/lib/cafe";
import { sweepLate } from "@/lib/late";

export const dynamic = "force-dynamic";

/** GET -> every order in progress, oldest first, with the server's time. Runs the late check first (Phase 8 fills it in). */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    const now = Date.now();
    await sweepLate(now);
    return ok(await listQueue(now));
  });
}
