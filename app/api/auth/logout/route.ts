import { handle, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { endTempSession } from "@/lib/codes";
import { clearedSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST -> clears the cookie. A temp code is not given back: it stays burned,
 * so its session ends here as well.
 */
export async function POST() {
  return handle(async () => {
    const session = await getSession({ checkTemp: false });
    if (session?.codeType === "temp" && session.code) {
      try {
        await endTempSession(session.code, Date.now());
      } catch {
        // The cookie is cleared either way, and the code expires on its own.
      }
    }
    const res = ok({ next: "/" });
    res.cookies.set(clearedSessionCookie());
    return res;
  });
}
