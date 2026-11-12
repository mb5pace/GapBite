import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getMenuState } from "@/lib/menu";

export const dynamic = "force-dynamic";

/** GET -> unavailable items, live vending stock and the server's time. Polled by the vending page. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("student", { user: true });
    return ok(await getMenuState(Date.now()));
  });
}
