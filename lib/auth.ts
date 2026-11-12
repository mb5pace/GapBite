/**
 * Server-side session checks for API routes and server pages. Never rely on
 * proxy.ts alone: it can only check the cookie, not Redis (docs/ACCESS.md).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COPY } from "@/data/copy";
import { SESSION_COOKIE } from "./config";
import { AppError } from "./api";
import { isTempSessionActive } from "./codes";
import { portalHome, verifySession, type Portal, type Session } from "./session";

/**
 * The current session, or null. For a temp code the code must also still be
 * active in Redis, so Admin can end a session early. Pass `checkTemp: false`
 * to read the cookie only (Logout uses this to end the code itself).
 */
export async function getSession(options: { checkTemp?: boolean } = {}): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  if (session.codeType === "temp" && options.checkTemp !== false) {
    if (!session.code || !(await isTempSessionActive(session.code, Date.now()))) return null;
  }
  return session;
}

/** For API routes. Throws an AppError the route turns into a 401 or 403. */
export async function requireApiSession(
  portal: Portal,
  options: { user?: boolean } = {},
): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AppError(401, COPY.gate.sessionEnded);
  if (session.portal !== portal) throw new AppError(403, COPY.common.wrongPortal);
  if (options.user && !session.userId) throw new AppError(403, COPY.common.needUser);
  return session;
}

/** For server pages and layouts. Redirects instead of throwing. */
export async function requirePageSession(
  portal: Portal,
  options: { user?: boolean } = {},
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/?ended=1");
  if (session.portal !== portal) redirect(portalHome(session));
  if (options.user && !session.userId) redirect("/identify");
  return session;
}
