/**
 * API conventions (ARCHITECTURE.md): every route returns
 * { ok: true, data } or { ok: false, error: "plain sentence for the user" }
 * with a proper status code. Server-side only.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { COPY } from "@/data/copy";
import { LOG_MESSAGE_MAX } from "./config";
import { RedisNotConfiguredError } from "./redis";
import { SessionSecretError } from "./session";

/** An error whose message is safe to show to the user as is. */
export class AppError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * What goes in the server log for an unexpected error: its name and message, and nothing else.
 * An Upstash error ends with ", command was: [...]", and that part holds the script's arguments:
 * typed access codes, order data with the buyer's 4-digit code. It is cut off before logging.
 */
export function logSafeMessage(err: unknown): string {
  if (!(err instanceof Error)) return "unknown";
  const message = err.message.split(", command was:")[0].slice(0, LOG_MESSAGE_MAX);
  return `${err.name}: ${message}`;
}

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data }, { headers: NO_STORE });
}

export function fail(status: number, error: string): NextResponse {
  return NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });
}

/** Reads JSON and validates it. A bad body becomes a 400 with the first message in the schema. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError(400, "That request was empty or broken. Try again.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? "Check what you typed and try again.");
  }
  return parsed.data;
}

/** Wraps a route body so thrown errors become the standard failure response. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof AppError) return fail(err.status, err.message);
    if (err instanceof SessionSecretError) return fail(500, COPY.gate.notSetUp);
    if (err instanceof RedisNotConfiguredError) return fail(503, COPY.gate.notSetUp);
    // Log the name and message only. Never log request bodies, cookies or env values.
    console.error("API error:", logSafeMessage(err));
    return fail(503, COPY.gate.cannotCheck);
  }
}
