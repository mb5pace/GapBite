/**
 * The one Redis client. Server-side only: this file is imported by other files
 * in lib/ and by API routes. Client components never import it (CLAUDE.md rule 6).
 *
 * The Upstash integration from the Vercel Marketplace sets KV_REST_API_URL and
 * KV_REST_API_TOKEN. A database made directly on Upstash uses
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Both are supported.
 */
import { Redis } from "@upstash/redis";
import { REDIS_PREFIX_DEV, REDIS_PREFIX_PRODUCTION } from "./config";

if (typeof window !== "undefined") {
  throw new Error("lib/redis.ts must only be imported on the server.");
}

export class RedisNotConfiguredError extends Error {
  constructor() {
    super("Redis env vars are missing (KV_REST_API_URL / KV_REST_API_TOKEN).");
    this.name = "RedisNotConfiguredError";
  }
}

let client: Redis | null = null;

/** Created on first use, so `next build` works without any env vars set. */
export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new RedisNotConfiguredError();

  client = new Redis({ url, token });
  return client;
}

/** Where this code is running: a Vercel production deployment, a Vercel preview deployment, or anywhere else (a laptop). */
export type DeployEnv = "production" | "preview" | "local";

export function deployEnv(): DeployEnv {
  const env = process.env.VERCEL_ENV;
  if (env === "production") return "production";
  if (env === "preview") return "preview";
  return "local";
}

/**
 * The prefix for this environment: "qx:" in production, "qxdev:" for preview and local. Only an explicit
 * VERCEL_ENV of "production" gets the production keys, so a stray laptop or preview can never read or write
 * real orders and wallets.
 */
export function keyPrefix(): string {
  return deployEnv() === "production" ? REDIS_PREFIX_PRODUCTION : REDIS_PREFIX_DEV;
}

/**
 * The one place a Redis key is built: key("order", "QX-4821") -> "qx:order:QX-4821" in production and
 * "qxdev:order:QX-4821" in preview and local. No other file writes a key as a string.
 */
export function key(...parts: string[]): string {
  return keyPrefix() + parts.join(":");
}

/**
 * For anything that scans or clears keys (the Phase 10 reset): a MATCH pattern that selects this
 * environment's keys and no one else's. "qx:*" does not match "qxdev:..." and the reverse.
 */
export function keyPattern(): string {
  return `${keyPrefix()}*`;
}

/** True when a key belongs to this environment. Check it before deleting a key a scan returned. */
export function ownsKey(redisKey: string): boolean {
  return redisKey.startsWith(keyPrefix());
}
