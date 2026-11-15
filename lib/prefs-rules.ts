/**
 * Saved preferences: the shape, the defaults and the rules for reading and changing them. Pure (no Redis), so
 * the browser can import the types and the defaults. Source: docs/SCREENS.md "Account" 3 and 4.
 */
import { BUILDINGS, type BuildingId } from "@/data/locations";
import { DEFAULT_BUILDING, DEFAULT_MODE, DEFAULT_NOTIFICATIONS, DEFAULT_WHEN } from "./config";
import type { OrderMode } from "./order-types";

/** "asap": as soon as possible. "next-break": the first break slot that is still open when Checkout opens. */
export type DefaultWhen = "asap" | "next-break";

export interface NotificationPrefs {
  orderUpdates: boolean;
  walletUpdates: boolean;
  /** The only one that does anything: a soft chime when a new Update arrives. */
  sounds: boolean;
}

export interface Prefs {
  defaultBuilding: BuildingId;
  defaultMode: OrderMode;
  defaultWhen: DefaultWhen;
  notifications: NotificationPrefs;
}

/** What a PUT may change: any part, and any of the three switches. */
export interface PrefsPatch {
  defaultBuilding?: BuildingId;
  defaultMode?: OrderMode;
  defaultWhen?: DefaultWhen;
  notifications?: Partial<NotificationPrefs>;
}

export const DEFAULT_PREFS: Prefs = {
  defaultBuilding: DEFAULT_BUILDING,
  defaultMode: DEFAULT_MODE,
  defaultWhen: DEFAULT_WHEN,
  notifications: { ...DEFAULT_NOTIFICATIONS },
};

export const BUILDING_IDS: readonly BuildingId[] = BUILDINGS.map((b) => b.id);
export const MODES: readonly OrderMode[] = ["pickup", "delivery"];
export const WHENS: readonly DefaultWhen[] = ["asap", "next-break"];

export function isBuildingId(value: unknown): value is BuildingId {
  return typeof value === "string" && (BUILDING_IDS as readonly string[]).includes(value);
}

/** Reads whatever is stored, keeping every good field and falling back to the default for the rest. Never throws. */
export function mergePrefs(raw: unknown): Prefs {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const stored = typeof source.notifications === "object" && source.notifications !== null ? (source.notifications as Record<string, unknown>) : {};
  const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
  return {
    defaultBuilding: isBuildingId(source.defaultBuilding) ? source.defaultBuilding : DEFAULT_PREFS.defaultBuilding,
    defaultMode: (MODES as readonly unknown[]).includes(source.defaultMode) ? (source.defaultMode as OrderMode) : DEFAULT_PREFS.defaultMode,
    defaultWhen: (WHENS as readonly unknown[]).includes(source.defaultWhen) ? (source.defaultWhen as DefaultWhen) : DEFAULT_PREFS.defaultWhen,
    notifications: {
      orderUpdates: flag(stored.orderUpdates, DEFAULT_PREFS.notifications.orderUpdates),
      walletUpdates: flag(stored.walletUpdates, DEFAULT_PREFS.notifications.walletUpdates),
      sounds: flag(stored.sounds, DEFAULT_PREFS.notifications.sounds),
    },
  };
}

/** The current preferences with a patch laid over them. The patch has already been checked. */
export function applyPatch(current: Prefs, patch: PrefsPatch): Prefs {
  return {
    defaultBuilding: patch.defaultBuilding ?? current.defaultBuilding,
    defaultMode: patch.defaultMode ?? current.defaultMode,
    defaultWhen: patch.defaultWhen ?? current.defaultWhen,
    notifications: { ...current.notifications, ...patch.notifications },
  };
}
