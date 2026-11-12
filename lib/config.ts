/**
 * Every number in QuickX lives here. Source: docs/BUSINESS_RULES.md, with the
 * numbers from ACCESS.md and FLOWS.md that would otherwise end up as magic
 * numbers in components or routes. All money is integer rupees.
 * Import from here. Never copy a value into a component or route.
 */

// ---------------------------------------------------------------------------
// Delivery fee and runner earning (by zone)
// ---------------------------------------------------------------------------

/** What the buyer pays. Depends only on the zone, never on who delivers. */
export const FEES = { pickup: 0, near: 5, far: 10 } as const;

/** What a runner buddy earns into their wallet on a confirmed handover. Staff earn nothing. */
export const RUNNER_EARN = { near: 5, far: 8 } as const;

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

/** Below this balance a user cannot place an order or accept a run. */
export const WALLET_MIN_TO_USE = 50;
/** From WALLET_MIN_TO_USE up to this, show the non-blocking "keep ₹100" banner. */
export const WALLET_SUGGESTED = 100;

/** Mock UPI top-up. */
export const TOPUP_CHIPS = [50, 100, 200, 500] as const;
export const TOPUP_MIN = 10;
export const TOPUP_MAX = 2000;
/** Fake "processing" step before a top-up succeeds. */
export const TOPUP_PROCESSING_MS = 1500;

/** Ledger and Updates are trimmed to the latest N entries (ARCHITECTURE.md Redis keys). */
export const LEDGER_KEEP = 100;
export const UPDATES_KEEP = 50;

// ---------------------------------------------------------------------------
// Runner buddy and staff delivery
// ---------------------------------------------------------------------------

export const MAX_ACTIVE_RUNS = 3;
/** A Ready delivery order with no runner after this long gets "No runner yet, send with staff?". */
export const UNCLAIMED_ALERT_MIN = 3;

// ---------------------------------------------------------------------------
// Promised time and grace
// ---------------------------------------------------------------------------

/** ASAP promise = accept time + prep + walk + BUFFER_MIN. */
export const BUFFER_MIN = 2;
/**
 * A break slot is selectable only if now + prep + walk + SLOT_LEAD_BUFFER_MIN is before the slot.
 * BUSINESS_RULES.md writes a bare "5" here without naming it (see Open questions).
 */
export const SLOT_LEAD_BUFFER_MIN = 5;
/** Extra minutes after the promised time before a delivery order fails. */
export const GRACE_MIN = 5;
/** Uncollected pickups are shown to the cafe after this long and can be closed by hand. */
export const PICKUP_STALE_MIN = 30;

// ---------------------------------------------------------------------------
// Order limits and identifiers
// ---------------------------------------------------------------------------

export const MAX_UNITS_PER_ORDER = 10;
/** Items tagged "morning" cannot be ordered at or after this IST time. */
export const MORNING_CUTOFF = { hour: 11, minute: 30 } as const;

export const ORDER_ID_PREFIX = "QX-";
export const ORDER_ID_DIGITS = 4;
/** Handover and collect codes. Always different from the digits of the order ID. */
export const CODE_DIGITS = 4;

// ---------------------------------------------------------------------------
// Access codes and sessions (docs/ACCESS.md)
// ---------------------------------------------------------------------------

/** Unused temporary codes the pool always holds. */
export const TEMP_POOL_SIZE = 6;
/** Number of permanent codes expected in env QX_PERMANENT_CODES. */
export const PERMANENT_CODE_COUNT = 5;

export const ACCESS_CODE_LENGTH = 6;
/** No 0, O, 1 or I. */
export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Shown grouped as K7Q-M2X; typed without the dash. */
export const ACCESS_CODE_GROUP_SIZE = 3;

/** Session lifetime in minutes, by what the person typed at the gate. */
export const SESSION_MIN = {
  permanent: 8 * 60,
  temp: 15,
  cafe: 12 * 60,
  admin: 2 * 60,
} as const;

/** 10 wrong gate tries per IP per 10 minutes. */
export const RATE_LIMIT = { maxWrongTries: 10, windowSec: 10 * 60 } as const;

/** Header chip "2:41 left" shows only for temp sessions in their last N minutes. */
export const TEMP_COUNTDOWN_CHIP_MIN = 3;

export const SESSION_COOKIE = "qx_session";

// ---------------------------------------------------------------------------
// Identity formats
// ---------------------------------------------------------------------------

export const AU_NUMBER_PATTERN = /^AU\d{7}$/;
export const STAFF_ID_PREFIX = "QX-STF-";
export const STAFF_ID_DIGITS = 2;
export const FIRST_NAME_MIN = 2;
export const FIRST_NAME_MAX = 20;

// ---------------------------------------------------------------------------
// Live sync (polling, not websockets)
// ---------------------------------------------------------------------------

export const POLL_MS = {
  /** Active order and Updates. */
  student: 4000,
  /** Cafe queue. */
  cafe: 3000,
  admin: 5000,
} as const;

// ---------------------------------------------------------------------------
// Time and storage
// ---------------------------------------------------------------------------

/** Every clock the user sees is IST. The server is the only clock. */
export const TIMEZONE = "Asia/Kolkata";

/** All Redis keys start with this, so Reset can scan safely. */
export const REDIS_KEY_PREFIX = "qx:";

/** /api/health writes one key and reads it back. It expires on its own. */
export const HEALTH_KEY_TTL_SEC = 60;
