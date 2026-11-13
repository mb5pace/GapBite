import { z } from "zod";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { listUpdates, markAllRead } from "@/lib/updates";

export const dynamic = "force-dynamic";

/** GET -> your Updates, newest first, each with a read flag, and the unread count. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok(await listUpdates(session.userId as string));
  });
}

const schema = z.object({ action: z.literal("markRead") });

/** POST { action: "markRead" } -> everything counts as read. Called when the Updates tab opens. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    await parseBody(req, schema);
    await markAllRead(session.userId as string);
    return ok({ unread: 0 });
  });
}
