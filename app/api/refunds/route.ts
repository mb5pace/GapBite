import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getRefunds } from "@/lib/history";

export const dynamic = "force-dynamic";

/** GET -> every refund you have had, with the reason, and the total. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok(await getRefunds(session.userId as string));
  });
}
