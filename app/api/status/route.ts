import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getSourceStatus } from "@/lib/source-status";

export const dynamic = "force-dynamic";

/** GET -> every place's status and "Ready in about N min", and the server's time. Polled by Home and the menu pages. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("student", { user: true });
    return ok(await getSourceStatus(Date.now()));
  });
}
