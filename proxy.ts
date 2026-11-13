/**
 * Guards every route except the gate, /api/auth/*, /api/health and static files.
 * Next.js 16 calls this file `proxy` (it was `middleware`). It only checks the
 * cookie. Temp-code sessions are also checked against Redis by lib/auth.ts, and
 * every API route re-checks the session itself (docs/ACCESS.md "Sessions").
 */
import { NextResponse, type NextRequest } from "next/server";
import { COPY } from "@/data/copy";
import { SESSION_COOKIE } from "@/lib/config";
import { portalHome, verifySession, type Portal, type Session } from "@/lib/session";

function isPublic(path: string): boolean {
  return path === "/" || path === "/api/health" || path.startsWith("/api/auth/");
}

function portalFor(path: string): Portal {
  if (path === "/cafe" || path.startsWith("/cafe/") || path.startsWith("/api/cafe/")) return "cafe";
  // /kit is the UI component gallery: admin only.
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/") || path === "/kit") return "admin";
  return "student";
}

function deny(request: NextRequest, status: 401 | 403, message: string, redirectTo: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: message }, { status });
  }
  return NextResponse.redirect(new URL(redirectTo, request.url));
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isPublic(path)) return NextResponse.next();

  let session: Session | null = null;
  try {
    session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    // Server settings are broken. Fail closed: nobody gets past the gate.
  }

  if (!session) return deny(request, 401, COPY.gate.sessionEnded, "/?ended=1");

  const needed = portalFor(path);
  if (session.portal !== needed) {
    return deny(request, 403, COPY.common.wrongPortal, portalHome(session));
  }

  if (needed === "student" && !session.userId && path !== "/identify") {
    return deny(request, 403, COPY.common.needUser, "/identify");
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and public files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|illustrations/|food/|scanner/).*)"],
};
