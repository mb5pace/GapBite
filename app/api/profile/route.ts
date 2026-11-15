import { z } from "zod";
import { COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { renameUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string(COPY.identify.badName).max(INPUT_MAX.name, COPY.identify.badName) }).strict();

/** PUT { name } -> your first name changed, by the same rules as Identify. Your ID and role cannot be changed. */
export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { name } = await parseBody(req, schema);
    const user = await renameUser(session.userId as string, name);
    return ok({ user: { id: user.id, name: user.name, role: user.role } });
  });
}
