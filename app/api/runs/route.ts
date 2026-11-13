import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { healRunIndexes, listRuns } from "@/lib/runs";

export const dynamic = "force-dynamic";

/** GET -> the runs you are carrying now (students and staff): building, drop point, buyer first name, promised time. No codes. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    await healRunIndexes();
    return ok({ runs: await listRuns(session.userId as string), now: Date.now() });
  });
}
