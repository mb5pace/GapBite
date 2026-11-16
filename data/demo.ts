/**
 * Demo data for Admin › Demo (v1.0.0 Phase C2). Seeding sets these exact values every time, so running it twice
 * changes nothing. Item and building IDs come from data/menu.ts and data/locations.ts.
 */
import type { BuildingId } from "./locations";

export interface DemoStudent {
  id: string;
  name: string;
  /** The balance seeding sets, in whole rupees. */
  balance: number;
}

export const DEMO_STUDENTS: readonly DemoStudent[] = [
  { id: "AU2340101", name: "Riya", balance: 300 },
  { id: "AU2340102", name: "Aarav", balance: 120 },
  { id: "AU2340103", name: "Meera", balance: 300 },
];

/** Created as QX-STF-01 only when that ID does not exist yet. */
export const DEMO_STAFF_NAME = "Ramesh";

export interface DemoPastOrder {
  /** Fixed IDs, so seeding again overwrites instead of adding. */
  id: string;
  buyerId: string;
  /** Who carried it: a student runner (by AU number) or "staff" for QX-STF-01. */
  holder: string;
  lines: { itemId: string; qty: number }[];
  buildingId: BuildingId;
  /** How long ago it was placed, in minutes. */
  agoMin: number;
}

export const DEMO_PAST_ORDERS: readonly DemoPastOrder[] = [
  { id: "QX-9001", buyerId: "AU2340101", holder: "AU2340102", lines: [{ itemId: "ti-thali", qty: 1 }], buildingId: "gict", agoMin: 26 * 60 },
  { id: "QX-9002", buyerId: "AU2340103", holder: "staff", lines: [{ itemId: "ti-poha", qty: 2 }], buildingId: "sas", agoMin: 2 * 60 },
];

/** The late-test order: one line, delivered to this building, promised this many minutes after it is made. */
export const DEMO_LATE_LINES = [{ itemId: "ti-poha", qty: 1 }] as const;
export const DEMO_LATE_BUILDING: BuildingId = "gict";
export const DEMO_LATE_PROMISE_MIN = 1;

/** What has to be typed before Reset runs. */
export const DEMO_RESET_WORD = "RESET";
