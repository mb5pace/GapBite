/**
 * IST helpers. The server is the only clock: every timestamp is epoch ms
 * produced on the server, and the browser only formats or counts down from it.
 * Safe to import from client components (no Redis, no Node-only code).
 */
import { GREETING_HOURS, IST_OFFSET_MIN, TIMEZONE } from "./config";

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

/** The server's clock, for server components, so they never read it themselves. */
export function serverNow(): number {
  return Date.now();
}

/** The greeting for right now. Server components call this so they never read the clock themselves. */
export function greetingNow(): string {
  return greetingFor(Date.now());
}

const dateParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Minutes since IST midnight, 0 to 1439. */
export function istMinutesOfDay(ms: number): number {
  const { hour, minute } = istParts(ms);
  return hour * 60 + minute;
}

/** Epoch ms of IST midnight on the IST day that contains `ms`. */
export function istMidnight(ms: number): number {
  const parts = dateParts.formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day")) - IST_OFFSET_MIN * 60_000;
}

/** "11:50" on the IST day of `nowMs`, as epoch ms. */
export function slotEpoch(slot: string, nowMs: number): number {
  const [hour, minute] = slot.split(":").map(Number);
  return istMidnight(nowMs) + (hour * 60 + minute) * 60_000;
}

const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, day: "numeric", month: "short" });

/** "Today 14:05", "Yesterday 09:12" or "11 Nov 14:05", for ledger rows. */
export function formatDayTime(ms: number, nowMs: number): string {
  const days = Math.round((istMidnight(nowMs) - istMidnight(ms)) / 86_400_000);
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : dayLabel.format(new Date(ms));
  return `${day} ${formatClock(ms)}`;
}
