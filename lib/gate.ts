/**
 * The gate: decides what a typed code opens, and rate-limits wrong tries.
 * Server-side only. Source: docs/ACCESS.md "The gate".
 */
import { COPY } from "@/data/copy";
import { RATE_LIMIT, SESSION_MIN } from "./config";
import { AppError } from "./api";
import { burnTempCode, matchesPermanent, safeEqual } from "./codes";
import { getRedis, key } from "./redis";
import type { SessionClaims } from "./session";

export interface LoginResult {
  claims: SessionClaims;
  /** Session expiry, epoch seconds. */
  expSec: number;
  /** Where the browser goes next. */
  next: string;
}

/** The caller's IP. On Vercel, x-forwarded-for is set by the platform, not the browser. */
export function getClientIp(headers: Headers): string {
  const first = (headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "").split(",")[0].trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(first) ? first : "unknown";
}

const rateKey = (ip: string) => key("ratelimit", ip);

/** If Redis hiccups, the limit is skipped rather than locking everyone out. */
async function isBlocked(ip: string): Promise<boolean> {
  try {
    const tries = await getRedis().get<number>(rateKey(ip));
    return (tries ?? 0) >= RATE_LIMIT.maxWrongTries;
  } catch {
    return false;
  }
}

async function recordWrongTry(ip: string): Promise<void> {
  try {
    const redis = getRedis();
    // The expiry is set first, so a counter can never be left without one.
    await redis.set(rateKey(ip), 0, { nx: true, ex: RATE_LIMIT.windowSec });
    await redis.incr(rateKey(ip));
  } catch {
    // Not worth failing the request over.
  }
}

function cafeOrAdmin(typed: string, envName: "QX_CAFE_PASSWORD" | "QX_ADMIN_PASSWORD"): boolean {
  const expected = process.env[envName];
  return !!expected && safeEqual(typed, expected);
}

/** Checks what was typed against everything the gate opens, in the order of the ACCESS.md table. */
export async function attemptLogin(typed: string, ip: string, now: number): Promise<LoginResult> {
  if (await isBlocked(ip)) throw new AppError(429, COPY.gate.tooManyTries);

  const code = typed.trim();
  const nowSec = Math.floor(now / 1000);

  if (matchesPermanent(code)) {
    return {
      claims: { portal: "student", codeType: "permanent" },
      expSec: nowSec + SESSION_MIN.permanent * 60,
      next: "/identify",
    };
  }

  const burned = await burnTempCode(code, now);
  if (burned) {
    return {
      claims: { portal: "student", codeType: "temp", code: burned.code },
      expSec: Math.floor(burned.sessionEndsAt / 1000),
      next: "/identify",
    };
  }

  if (cafeOrAdmin(code, "QX_CAFE_PASSWORD")) {
    return {
      claims: { portal: "cafe", codeType: "cafe" },
      expSec: nowSec + SESSION_MIN.cafe * 60,
      next: "/cafe",
    };
  }

  if (cafeOrAdmin(code, "QX_ADMIN_PASSWORD")) {
    return {
      claims: { portal: "admin", codeType: "admin" },
      expSec: nowSec + SESSION_MIN.admin * 60,
      next: "/admin",
    };
  }

  await recordWrongTry(ip);
  throw new AppError(401, COPY.gate.badCode);
}
