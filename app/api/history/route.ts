import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getHistory } from "@/lib/history";

export const dynamic = "force-dynamic";

/** GET -> your finished orders and your finished runs. No codes, no other people's details. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok(await getHistory(session.userId as string));
  });
}
