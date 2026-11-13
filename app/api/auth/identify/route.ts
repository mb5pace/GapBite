import { z } from "zod";
import { COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { setTempCodeUser } from "@/lib/codes";
import { INPUT_MAX } from "@/lib/config";
import { identifyUser } from "@/lib/users";
import { sessionCookie, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("student"),
    id: z.string().min(1, COPY.identify.badAu).max(INPUT_MAX.id, COPY.identify.badAu),
    name: z.string().max(INPUT_MAX.name, COPY.identify.badName).optional(),
  }),
  z.object({
    kind: z.literal("staff"),
    id: z.string().min(1, COPY.identify.badStaffId).max(INPUT_MAX.id, COPY.identify.badStaffId),
  }),
]);

/**
 * POST { kind, id, name? } -> who is ordering.
 * A new AU number first answers "needs-name". The session keeps its original
 * expiry: identifying never extends a temp session.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student");
    const input = await parseBody(req, schema);
    const now = Date.now();

    const result = await identifyUser(input, now);
    if (result.status === "needs-name") return ok({ status: "needs-name" as const });

    const token = await signSession(
      {
        portal: session.portal,
        codeType: session.codeType,
        code: session.code,
        userId: result.user.id,
      },
      session.exp,
    );

    if (session.codeType === "temp" && session.code) {
      try {
        await setTempCodeUser(session.code, result.user.id);
      } catch {
        // Only the Admin table's "used by" column depends on this.
      }
    }

    const res = ok({ status: "ok" as const, next: "/home", name: result.user.name });
    res.cookies.set(sessionCookie(token, session.exp, now));
    return res;
  });
}
