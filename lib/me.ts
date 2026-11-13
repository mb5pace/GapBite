/**
 * "Who am I and what is my state": the one place the student shell's live
 * numbers come from. The layout reads it for the first paint and /api/me serves
 * the same thing for polling. Server-side only; the type is safe to import anywhere.
 */
import { countLiveOrders } from "./orders";
import type { Session } from "./session";
import { getUnread } from "./updates";
import { getUser } from "./users";
import { getBalance } from "./wallet";

export interface MeData {
  user: { id: string; name: string; role: "student" | "staff" };
  /** Whole rupees. Can be negative only after a late-delivery penalty. */
  balance: number;
  /** Unread Updates: lights the dot on the Updates tab. */
  unread: number;
  /** True while the user has an order in progress: lights the dot on the Orders tab. */
  activeOrder: boolean;
  /** Time left on a temp-code session, measured on the server; null for other sessions. */
  sessionMsLeft: number | null;
  /** Saved preferences. Null until Preferences exist (Phase 9). */
  prefs: null;
  /** Server time, epoch ms. */
  now: number;
}

export async function getMe(session: Session, now: number): Promise<MeData | null> {
  if (!session.userId) return null;
  const [user, balance, unread, live] = await Promise.all([
    getUser(session.userId),
    getBalance(session.userId),
    getUnread(session.userId),
    countLiveOrders(session.userId),
  ]);
  if (!user) return null;
  return {
    user: { id: user.id, name: user.name, role: user.role },
    balance,
    unread,
    activeOrder: live > 0,
    sessionMsLeft: session.codeType === "temp" ? Math.max(0, session.exp * 1000 - now) : null,
    prefs: null,
    now,
  };
}

/** Same as getMe, reading the server clock itself (for server components). */
export async function getMeNow(session: Session): Promise<MeData | null> {
  return getMe(session, Date.now());
}
