import { HEALTH_KEY_TTL_SEC } from "@/lib/config";
import { deployEnv, getRedis, key, keyPrefix, RedisNotConfiguredError } from "@/lib/redis";

// Always runs on the server at request time, never prerendered at build.
export const dynamic = "force-dynamic";

/**
 * Setup check: writes one key to Redis and reads it back.
 * Open /api/health after deploying. Returns no secrets and no user data.
 */
export async function GET() {
  try {
    const redis = getRedis();
    const healthKey = key("health");
    // Not a bare number: Upstash turns numeric strings back into numbers on read.
    const written = `ok:${Date.now()}`;

    const started = Date.now();
    await redis.set(healthKey, written, { ex: HEALTH_KEY_TTL_SEC });
    const readBack = await redis.get<string>(healthKey);
    const roundTripMs = Date.now() - started;

    if (readBack !== written) {
      return Response.json(
        {
          ok: false,
          error: "Redis answered but returned a different value than was written.",
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      // The environment and key prefix are not secrets. They let anyone check that production uses "qx:" and a
      // preview uses "qxdev:" without logging in.
      { ok: true, data: { redis: "ok", roundTripMs, env: deployEnv(), keyPrefix: keyPrefix() } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof RedisNotConfiguredError) {
      return Response.json(
        {
          ok: false,
          error:
            "Redis is not connected yet. Add Upstash for Redis to the Vercel project, then redeploy.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      {
        ok: false,
        error: "Could not reach Redis. Check the Upstash database is running, then try again.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
