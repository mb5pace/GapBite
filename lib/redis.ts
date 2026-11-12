/**
 * The one Redis client. Server-side only: this file is imported by other files
 * in lib/ and by API routes. Client components never import it (CLAUDE.md rule 6).
 *
 * The Upstash integration from the Vercel Marketplace sets KV_REST_API_URL and
 * KV_REST_API_TOKEN. A database made directly on Upstash uses
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Both are supported.
 */
import { Redis } from "@upstash/redis";
import { REDIS_KEY_PREFIX } from "./config";

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

/** Builds a prefixed key: key("order", "QX-4821") -> "qx:order:QX-4821". */
export function key(...parts: string[]): string {
  return REDIS_KEY_PREFIX + parts.join(":");
}
