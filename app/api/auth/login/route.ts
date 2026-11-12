import { z } from "zod";
import { COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { CODE_INPUT_MAX } from "@/lib/config";
import { attemptLogin, getClientIp } from "@/lib/gate";
import { sessionCookie, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(1, COPY.gate.codeRequired).max(CODE_INPUT_MAX, COPY.gate.badCode),
});

/** POST { code } -> sets the session cookie and says which page to open next. */
export async function POST(req: Request) {
  return handle(async () => {
    const { code } = await parseBody(req, schema);
    const now = Date.now();
    const result = await attemptLogin(code, getClientIp(req.headers), now);

    const token = await signSession(result.claims, result.expSec);
    const res = ok({ portal: result.claims.portal, next: result.next });
    res.cookies.set(sessionCookie(token, result.expSec, now));
    return res;
  });
}
