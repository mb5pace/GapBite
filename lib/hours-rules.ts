/**
 * Opening hours, open days, holidays, item time windows, pauses and the service switch, as pure functions. No Redis and
 * no clock of their own: callers pass the server's time. The browser uses them to label tiles and grey out chips, and
 * place-order uses the very same ones on the server, which has the final say. Source: docs/BUSINESS_RULES.md "Opening
 * hours, holidays and pauses".
 *
 * Time windows are half-open: "08:00 to 19:00" accepts 08:00:00 up to 18:59:59; "until 11:00" stops at 11:00:00.
 */
import {
  DEFAULT_HOLIDAYS,
  DEFAULT_ITEM_WINDOWS,
  DEFAULT_SOURCE_HOURS,
  WEEKDAY_NAMES,
  type Holiday,
  type ItemWindow,
  type SourceHours,
  type Weekday,
} from "@/data/hours";
import { SOURCES, getItem, getSource, type MenuItem, type SourceId } from "@/data/menu";
import {
  CLOSED_NOTICE_MAX_LINES,
  HOLIDAY_NOTE_MAX,
  HOLIDAYS_MAX,
  HOURS_STEP_MIN,
  NEXT_OPEN_LOOKAHEAD_DAYS,
  SERVICE_DEFAULT_MESSAGE,
  SERVICE_MESSAGE_MAX,
} from "./config";
import { readyPhrase } from "./ready-estimate";
import { istDateKey, istMidnight, istMinutesOfDay, istWeekday, slotEpoch } from "./time";

export interface SourceConfig extends SourceHours {
  /** "Taking orders / Paused", set from the Cafe portal. Paused means no new orders for this source. */
  paused: boolean;
}

export interface HoursConfig {
  sources: Record<SourceId, SourceConfig>;
  /** Only items that have a window. */
  itemWindows: Record<string, ItemWindow>;
  /** Sorted by date. */
  holidays: Holiday[];
}

/** The service-wide switch. Set only from Admin › Service. */
export interface ServiceState {
  available: boolean;
  message: string;
}

export const DEFAULT_SERVICE: ServiceState = { available: true, message: SERVICE_DEFAULT_MESSAGE };

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** "08:05" is on a 5-minute step. */
export function isStepTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = TIME_PATTERN.exec(value);
  return m !== null && Number(m[2]) % HOURS_STEP_MIN === 0;
}

/** Minutes since midnight for "HH:MM". */
export function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// ---------------------------------------------------------------------------
// The configuration: defaults, and reading what is stored
// ---------------------------------------------------------------------------

export function defaultHours(): HoursConfig {
  const sources = {} as Record<SourceId, SourceConfig>;
  for (const source of SOURCES) {
    const d = DEFAULT_SOURCE_HOURS[source.id];
    sources[source.id] = { open: d.open, close: d.close, days: [...d.days], paused: false };
  }
  const itemWindows: Record<string, ItemWindow> = {};
  for (const [id, w] of Object.entries(DEFAULT_ITEM_WINDOWS)) itemWindows[id] = { ...w };
  return { sources, itemWindows, holidays: DEFAULT_HOLIDAYS.map((h) => ({ ...h })) };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asObject(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return null;
}

function cleanDays(value: unknown): Weekday[] | null {
  if (!Array.isArray(value)) return null;
  const days = [...new Set(value.filter((d): d is Weekday => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  return days.length > 0 ? (days as Weekday[]) : null;
}

/**
 * Reads the stored fields over the defaults. Redis holds one hash: `s:<source>` (open, close, days), `p:<source>`
 * (paused), `i:<item>` (an item's window; an empty one means "no window", overriding the default) and `h:<date>` (a
 * holiday's note). Anything missing or damaged falls back to the default, and nothing here throws.
 */
export function mergeHours(fields: Record<string, unknown> | null | undefined): HoursConfig {
  const cfg = defaultHours();
  if (!fields) return cfg;
  const holidays = new Map<string, string>(cfg.holidays.map((h) => [h.date, h.note]));

  for (const [field, value] of Object.entries(fields)) {
    const kind = field.slice(0, 2);
    const id = field.slice(2);
    if (kind === "s:" && id in cfg.sources) {
      const o = asObject(value);
      if (!o) continue;
      const source = cfg.sources[id as SourceId];
      const open = isStepTime(o.open) ? o.open : source.open;
      const close = isStepTime(o.close) ? o.close : source.close;
      if (toMinutes(close) > toMinutes(open)) {
        source.open = open;
        source.close = close;
      }
      source.days = cleanDays(o.days) ?? source.days;
    } else if (kind === "p:" && id in cfg.sources) {
      const paused = asBool(value);
      if (paused !== null) cfg.sources[id as SourceId].paused = paused;
    } else if (kind === "i:" && getItem(id)) {
      const o = asObject(value);
      if (!o) continue;
      const w: ItemWindow = {};
      if (isStepTime(o.from)) w.from = o.from;
      if (isStepTime(o.until)) w.until = o.until;
      if (w.from && w.until && toMinutes(w.until) <= toMinutes(w.from)) continue;
      if (w.from || w.until) cfg.itemWindows[id] = w;
      else delete cfg.itemWindows[id];
    } else if (kind === "h:" && isDateKey(id)) {
      const note = String(value ?? "").trim();
      if (note) holidays.set(id, note.slice(0, HOLIDAY_NOTE_MAX));
    }
  }
  cfg.holidays = [...holidays.entries()].map(([date, note]) => ({ date, note })).sort((a, b) => a.date.localeCompare(b.date));
  return cfg;
}

/** Reads the stored service switch: on unless it was switched off, with the message (or the default). */
export function mergeService(fields: Record<string, unknown> | null | undefined): ServiceState {
  if (!fields) return { ...DEFAULT_SERVICE };
  const available = asBool(fields.available) ?? true;
  const message = typeof fields.message === "string" && fields.message.trim() ? fields.message.trim().slice(0, SERVICE_MESSAGE_MAX) : DEFAULT_SERVICE.message;
  return { available, message };
}

// ---------------------------------------------------------------------------
// Is a source open at a moment?
// ---------------------------------------------------------------------------

export function holidayOn(cfg: HoursConfig, dateKey: string): Holiday | undefined {
  return cfg.holidays.find((h) => h.date === dateKey);
}

/** Why a source is closed at a moment, ignoring pauses. Null while it is open. */
export type Closure =
  | { kind: "holiday"; note: string }
  | { kind: "closed-day" }
  | { kind: "before-open"; opensAt: string }
  | { kind: "after-close"; closedAt: string };

export function closureAt(cfg: HoursConfig, sourceId: SourceId, atMs: number): Closure | null {
  const holiday = holidayOn(cfg, istDateKey(atMs));
  if (holiday) return { kind: "holiday", note: holiday.note };
  const source = cfg.sources[sourceId];
  if (!source.days.includes(istWeekday(atMs) as Weekday)) return { kind: "closed-day" };
  const minutes = istMinutesOfDay(atMs);
  if (minutes < toMinutes(source.open)) return { kind: "before-open", opensAt: source.open };
  if (minutes >= toMinutes(source.close)) return { kind: "after-close", closedAt: source.close };
  return null;
}

/** One refusal: a short code for the browser, and the sentence a person reads. */
export interface Block {
  code: "service" | "paused" | "holiday" | "closed-day" | "before-open" | "after-close" | "target-closed" | "item-window";
  message: string;
}

function closureBlock(name: string, closure: Closure): Block {
  switch (closure.kind) {
    case "holiday":
      return { code: "holiday", message: `${name} is closed today (${closure.note}).` };
    case "closed-day":
      return { code: "closed-day", message: `${name} is closed today.` };
    case "before-open":
      return { code: "before-open", message: `${name} opens at ${closure.opensAt}.` };
    case "after-close":
      return { code: "after-close", message: `${name} has closed for today.` };
  }
}

/** The "right now" half of the ordering rule: (a) the service is on, (b) the source is not paused, (c) today is an open day, (d) it is within hours. */
export function sourceBlockNow(cfg: HoursConfig, service: ServiceState, sourceId: SourceId, nowMs: number): Block | null {
  if (!service.available) return { code: "service", message: service.message };
  const name = getSource(sourceId).name;
  if (cfg.sources[sourceId].paused) return { code: "paused", message: `${name} is not taking orders right now.` };
  const closure = closureAt(cfg, sourceId, nowMs);
  return closure ? closureBlock(name, closure) : null;
}

// ---------------------------------------------------------------------------
// Item windows
// ---------------------------------------------------------------------------

/** The window an item actually has: what the Cafe set, else the default, else none. */
export function windowOf(cfg: HoursConfig, itemId: string): ItemWindow | null {
  const w = cfg.itemWindows[itemId];
  return w && (w.from || w.until) ? w : null;
}

/** True when `atMs` is outside the item's own window. (The source's hours are checked separately.) */
export function outsideWindow(w: ItemWindow, atMs: number): boolean {
  const minutes = istMinutesOfDay(atMs);
  if (w.from && minutes < toMinutes(w.from)) return true;
  if (w.until && minutes >= toMinutes(w.until)) return true;
  return false;
}

/** "Kanda Poha is breakfast only, until 11:00." */
export function windowSentence(item: Pick<MenuItem, "name" | "category">, w: ItemWindow): string {
  if (w.from && w.until) return `${item.name} is available from ${w.from} to ${w.until}.`;
  if (w.until) return item.category === "Breakfast" ? `${item.name} is breakfast only, until ${w.until}.` : `${item.name} is available until ${w.until}.`;
  return `${item.name} is available from ${w.from}.`;
}

/** The short reason on a menu row: "Breakfast, until 11:00". */
export function windowLabel(item: Pick<MenuItem, "category">, w: ItemWindow): string {
  if (w.from && w.until) return `${w.from} to ${w.until}`;
  if (w.until) return item.category === "Breakfast" ? `Breakfast, until ${w.until}` : `Until ${w.until}`;
  return `From ${w.from}`;
}

// ---------------------------------------------------------------------------
// The ordering rule
// ---------------------------------------------------------------------------

export interface OrderCheck {
  sourceId: SourceId;
  itemIds: readonly string[];
  /** The server's time now. */
  nowMs: number;
  /** When the order should reach the buyer: the ASAP estimate, or the chosen break slot. */
  targetMs: number;
}

/**
 * The whole ordering rule, in order: (a) the service is on, (b) the source is not paused, (c) today is an open day and
 * not a holiday, (d) now is within the source's hours, (e) the target time is within the source's hours, and (f) for
 * every item, both now and the target are inside that item's window. Returns the first thing that stops the order, or
 * null. Orders that are already placed are never checked again.
 */
export function checkOrder(cfg: HoursConfig, service: ServiceState, check: OrderCheck): Block | null {
  const now = sourceBlockNow(cfg, service, check.sourceId, check.nowMs);
  if (now) return now;

  const source = cfg.sources[check.sourceId];
  const name = getSource(check.sourceId).name;
  const target = closureAt(cfg, check.sourceId, check.targetMs);
  if (target) {
    return target.kind === "after-close"
      ? { code: "target-closed", message: `${name} closes at ${source.close}, so this order would not be ready in time.` }
      : closureBlock(name, target);
  }

  for (const itemId of check.itemIds) {
    const item = getItem(itemId);
    const w = windowOf(cfg, itemId);
    if (!item || !w) continue;
    if (outsideWindow(w, check.nowMs) || outsideWindow(w, check.targetMs)) return { code: "item-window", message: windowSentence(item, w) };
  }
  return null;
}

/** Can this break slot be chosen for these items from this source? The same rule, with the slot as the target. */
export function slotBlock(
  cfg: HoursConfig,
  service: ServiceState,
  args: { sourceId: SourceId; itemIds: readonly string[]; slot: string; nowMs: number },
): Block | null {
  return checkOrder(cfg, service, { sourceId: args.sourceId, itemIds: args.itemIds, nowMs: args.nowMs, targetMs: slotEpoch(args.slot, args.nowMs) });
}

// ---------------------------------------------------------------------------
// What a student sees
// ---------------------------------------------------------------------------

export interface SourceLabel {
  /** "Open now", "Opens at 12:00", "Closed today (Diwali)", "Closed today", "Closed for today", "Paused". */
  text: string;
  open: boolean;
  tone: "olive" | "amber" | "brick" | "taupe";
}

/** The status line on a Home tile. A whole closed day beats a pause; a pause beats the hours. */
export function sourceLabel(cfg: HoursConfig, service: ServiceState, sourceId: SourceId, nowMs: number): SourceLabel {
  if (!service.available) return { text: "Not available", open: false, tone: "taupe" };
  const closure = closureAt(cfg, sourceId, nowMs);
  if (closure?.kind === "holiday") return { text: `Closed today (${closure.note})`, open: false, tone: "brick" };
  if (closure?.kind === "closed-day") return { text: "Closed today", open: false, tone: "brick" };
  if (cfg.sources[sourceId].paused) return { text: "Paused", open: false, tone: "brick" };
  if (closure?.kind === "before-open") return { text: `Opens at ${closure.opensAt}`, open: false, tone: "amber" };
  if (closure?.kind === "after-close") return { text: "Closed for today", open: false, tone: "brick" };
  return { text: "Open now", open: true, tone: "olive" };
}

/**
 * The one line under a cafe's name on its menu page: "Open 12:00–19:00 · Ready in about 10 min" while it takes orders, or the
 * reason it does not ("Global Bistro opens at 12:00.", "Cafe Delice is closed today (Diwali).", "... is not taking orders right now.").
 */
export function sourceInfoLine(cfg: HoursConfig, service: ServiceState, sourceId: SourceId, nowMs: number, readyMin: number | null | undefined): string {
  const block = sourceBlockNow(cfg, service, sourceId, nowMs);
  if (block) return block.message;
  const { open, close } = cfg.sources[sourceId];
  return readyMin === null || readyMin === undefined ? `Open ${open}–${close}` : `Open ${open}–${close} · ${readyPhrase(readyMin)}`;
}

/**
 * When a source next opens, in words ("today at 12:00", "tomorrow at 08:00", "Monday at 08:00") and as a time. Null
 * while it is open now, or when there is no open day within NEXT_OPEN_LOOKAHEAD_DAYS. A pause is not considered: it has
 * no end time.
 */
export function nextOpeningAt(cfg: HoursConfig, sourceId: SourceId, nowMs: number): { atMs: number; words: string } | null {
  const source = cfg.sources[sourceId];
  for (let offset = 0; offset < NEXT_OPEN_LOOKAHEAD_DAYS; offset++) {
    const dayMs = nowMs + offset * 86_400_000;
    if (holidayOn(cfg, istDateKey(dayMs))) continue;
    if (!source.days.includes(istWeekday(dayMs) as Weekday)) continue;
    if (offset === 0) {
      const minutes = istMinutesOfDay(nowMs);
      if (minutes < toMinutes(source.open)) return { atMs: istMidnight(nowMs) + toMinutes(source.open) * 60_000, words: `today at ${source.open}` };
      if (minutes < toMinutes(source.close)) return null; // open right now: there is no "next" opening
      continue; // already closed for today: look at the following days
    }
    const day = offset === 1 ? "tomorrow" : WEEKDAY_NAMES[istWeekday(dayMs)];
    return { atMs: istMidnight(dayMs) + toMinutes(source.open) * 60_000, words: `${day} at ${source.open}` };
  }
  return null;
}

export function nextOpening(cfg: HoursConfig, sourceId: SourceId, nowMs: number): string | null {
  return nextOpeningAt(cfg, sourceId, nowMs)?.words ?? null;
}

/** When no place can take an order right now: the service message, or who opens first ("Nothing is open right now. Truly Indian opens tomorrow at 08:00."). Null while at least one place is taking orders. */
export function nothingOpenMessage(cfg: HoursConfig, service: ServiceState, nowMs: number): string | null {
  if (!service.available) return service.message;
  let first: { name: string; atMs: number; words: string } | null = null;
  for (const source of SOURCES) {
    if (!sourceBlockNow(cfg, service, source.id, nowMs)) return null;
    const next = nextOpeningAt(cfg, source.id, nowMs);
    if (next && (!first || next.atMs < first.atMs)) first = { name: source.name, ...next };
  }
  return first ? `Nothing is open right now. ${first.name} opens ${first.words}.` : "Nothing is open right now.";
}

/**
 * One line for each place that is closed or paused right now ("Global Bistro opens at 12:00."), in menu order, at most
 * CLOSED_NOTICE_MAX_LINES. Empty while every place is taking orders, and empty while the whole service is off (the
 * service banner already says so).
 */
export function closedNoticeLines(cfg: HoursConfig, service: ServiceState, nowMs: number): string[] {
  if (!service.available) return [];
  const lines: string[] = [];
  for (const source of SOURCES) {
    const block = sourceBlockNow(cfg, service, source.id, nowMs);
    if (block) lines.push(block.message);
  }
  return lines.slice(0, CLOSED_NOTICE_MAX_LINES);
}

/** What the sheet on a closed place says: a title, the reason, and (when there is one) when it opens next. */
export interface ClosedInfo {
  title: string;
  reason: string;
  /** "Opens tomorrow at 08:00." Null when there is no time to give (paused, or it opens later today and the reason says when). */
  opens: string | null;
}

/** The sheet for a place that cannot take orders right now, or null when it can (or when the whole service is off, which has its own banner). */
export function closedInfo(cfg: HoursConfig, service: ServiceState, sourceId: SourceId, nowMs: number): ClosedInfo | null {
  const block = sourceBlockNow(cfg, service, sourceId, nowMs);
  if (!block || block.code === "service") return null;
  const name = getSource(sourceId).name;
  const next = nextOpening(cfg, sourceId, nowMs);
  switch (block.code) {
    case "paused":
      return { title: `${name} is paused`, reason: "New orders are switched off for now. Check back in a little while.", opens: null };
    case "before-open":
      return { title: `${name} is not open yet`, reason: block.message, opens: null };
    case "after-close":
      return { title: `${name} has closed for today`, reason: block.message, opens: next ? `Opens ${next}.` : null };
    default:
      return { title: `${name} is closed today`, reason: block.message, opens: next ? `Opens ${next}.` : null };
  }
}

// ---------------------------------------------------------------------------
// Checking what the Cafe types
// ---------------------------------------------------------------------------

export const HOURS_ERRORS = {
  badTime: `Use times on ${HOURS_STEP_MIN}-minute steps, like 08:05 or 12:30.`,
  closeAfterOpen: "Closing time must be after opening time.",
  needDay: "Pick at least one open day.",
  untilAfterFrom: "Available until must be after available from.",
  badDate: "Pick a date, like 2026-11-12.",
  needNote: "Add a short note, like Diwali.",
  tooMany: "That is too many holidays. Remove one first.",
  unknownSource: "That place does not exist.",
  unknownItem: "That item does not exist.",
} as const;

export function validateSourceHours(v: { open: unknown; close: unknown; days: unknown }): string | null {
  if (!isStepTime(v.open) || !isStepTime(v.close)) return HOURS_ERRORS.badTime;
  if (toMinutes(v.close) <= toMinutes(v.open)) return HOURS_ERRORS.closeAfterOpen;
  if (cleanDays(v.days) === null) return HOURS_ERRORS.needDay;
  return null;
}

export function validateWindow(w: { from?: unknown; until?: unknown }): string | null {
  if (w.from !== undefined && w.from !== "" && !isStepTime(w.from)) return HOURS_ERRORS.badTime;
  if (w.until !== undefined && w.until !== "" && !isStepTime(w.until)) return HOURS_ERRORS.badTime;
  if (isStepTime(w.from) && isStepTime(w.until) && toMinutes(w.until) <= toMinutes(w.from)) return HOURS_ERRORS.untilAfterFrom;
  return null;
}

export function validateHoliday(date: unknown, note: unknown, count: number): string | null {
  if (!isDateKey(date)) return HOURS_ERRORS.badDate;
  if (typeof note !== "string" || note.trim() === "") return HOURS_ERRORS.needNote;
  if (count >= HOLIDAYS_MAX) return HOURS_ERRORS.tooMany;
  return null;
}

export { cleanDays };
