import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getTodayTotals } from "@/lib/cafe-today";

export const dynamic = "force-dynamic";

/** GET -> today's totals, counted from IST midnight. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    return ok(await getTodayTotals(Date.now()));
  });
}
