/**
 * Session cookie: a signed JWT (jose, HS256) in an HttpOnly cookie named qx_session.
 * Shape from docs/ACCESS.md. No Redis and no next/headers in this file, so the
 * proxy can import it. The Redis check for temp codes lives in lib/auth.ts.
 *
 * The permanent code is never stored in the cookie. Only a temp code is, because
 * the server needs it to check the code is still active.
 */
import { jwtVerify, SignJWT } from "jose";
import { SESSION_COOKIE, SESSION_SECRET_MIN_LENGTH } from "./config";
import { envText } from "./env";

export type Portal = "student" | "cafe" | "admin";
export type CodeType = "permanent" | "temp" | "cafe" | "admin";

export interface Session {
  portal: Portal;
  codeType: CodeType;
  /** Temp code only. */
  code?: string;
  /** AU number or staff ID, set by Identify. */
  userId?: string;
  /** Expiry, epoch seconds (JWT standard). */
  exp: number;
}

export type SessionClaims = Omit<Session, "exp">;

export class SessionSecretError extends Error {
  constructor() {
    super("QX_SESSION_SECRET is missing or shorter than 32 characters.");
    this.name = "SessionSecretError";
  }
}

function secretKey(): Uint8Array {
  const secret = envText("QX_SESSION_SECRET");
  if (!secret || secret.length < SESSION_SECRET_MIN_LENGTH) throw new SessionSecretError();
  return new TextEncoder().encode(secret);
}

const PORTALS: readonly Portal[] = ["student", "cafe", "admin"];
const CODE_TYPES: readonly CodeType[] = ["permanent", "temp", "cafe", "admin"];

/** Signs claims that expire at `expSec` (epoch seconds). */
export async function signSession(claims: SessionClaims, expSec: number): Promise<string> {
  const payload: Record<string, string> = {
    portal: claims.portal,
    codeType: claims.codeType,
  };
  if (claims.code) payload.code = claims.code;
  if (claims.userId) payload.userId = claims.userId;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expSec)
    .sign(secretKey());
}

/** Returns the session, or null for a missing, forged or expired token. */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { portal, codeType, code, userId, exp } = payload as Record<string, unknown>;
    if (!PORTALS.includes(portal as Portal)) return null;
    if (!CODE_TYPES.includes(codeType as CodeType)) return null;
    if (typeof exp !== "number") return null;
    return {
      portal: portal as Portal,
      codeType: codeType as CodeType,
      code: typeof code === "string" ? code : undefined,
      userId: typeof userId === "string" ? userId : undefined,
      exp,
    };
  } catch (err) {
    if (err instanceof SessionSecretError) throw err;
    return null;
  }
}

/** Cookie settings for the response that sets or clears the session. */
export function sessionCookie(token: string, expSec: number, nowMs: number) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.floor(expSec - nowMs / 1000)),
  };
}

export function clearedSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** Where each portal starts. */
export function portalHome(session: Pick<Session, "portal" | "userId">): string {
  if (session.portal === "cafe") return "/cafe";
  if (session.portal === "admin") return "/admin";
  return session.userId ? "/home" : "/identify";
}

/** Milliseconds until the session expires, measured on the server. */
export function msUntilExpiry(session: Pick<Session, "exp">): number {
  return Math.max(0, session.exp * 1000 - Date.now());
}
