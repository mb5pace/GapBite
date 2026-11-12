/**
 * IST helpers. The server is the only clock: every timestamp is epoch ms
 * produced on the server, and the browser only formats or counts down from it.
 * Safe to import from client components (no Redis, no Node-only code).
 */
import { GREETING_HOURS, TIMEZONE } from "./config";

const clockParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function istParts(ms: number): { hour: number; minute: number } {
  const parts = clockParts.formatToParts(new Date(ms));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

/** 11:47 in IST. */
export function formatClock(ms: number): string {
  const { hour, minute } = istParts(ms);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "Good morning" / "Good afternoon" / "Good evening" for the IST hour. */
export function greetingFor(ms: number): string {
  const { hour } = istParts(ms);
  if (hour < GREETING_HOURS.afternoonFrom) return "Good morning";
  if (hour < GREETING_HOURS.eveningFrom) return "Good afternoon";
  return "Good evening";
}

/** 2:41 for 161 000 ms. Rounds up, so the last second still reads 0:01. */
export function formatMsLeft(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** The greeting for right now. Server components call this so they never read the clock themselves. */
export function greetingNow(): string {
  return greetingFor(Date.now());
}
