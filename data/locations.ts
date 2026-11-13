/**
 * Delivery buildings. Source: docs/LOCATIONS.md.
 * Walk times are estimates from the campus map; the team will walk each route
 * once and correct them here. Every timing in the app reads from this file.
 * Fee and runner earning are per zone (lib/config.ts), never per building.
 */

export type ZoneId = "near" | "far";
export type BuildingId = "ag" | "gict" | "sas" | "amsom" | "venture" | "bk";

export interface Building {
  id: BuildingId;
  /** "GICT" */
  short: string;
  /** Full name */
  name: string;
  zone: ZoneId;
  /** Minutes on foot from UC */
  walkMin: number;
  /** Fixed handover spot, shown to buyer and runner */
  dropPoint: string;
}

/** Where everything is sold: University Centre, building 9 on the campus map. */
export const UC = {
  short: "UC",
  name: "University Centre",
} as const;

export const BUILDINGS: readonly Building[] = [
  {
    id: "ag",
    short: "AG",
    name: "AG building",
    zone: "near",
    walkMin: 2,
    dropPoint: "Main entrance, ground floor",
  },
  {
    id: "gict",
    short: "GICT",
    name: "GICT Building (School of Engineering and Applied Science)",
    zone: "near",
    walkMin: 2,
    dropPoint: "Ground floor lobby",
  },
  {
    id: "sas",
    short: "SAS",
    name: "School of Arts and Sciences",
    zone: "near",
    walkMin: 3,
    dropPoint: "Ground floor lobby",
  },
  {
    id: "amsom",
    short: "AMSOM",
    name: "Amrut Mody School of Management",
    zone: "near",
    walkMin: 4,
    dropPoint: "Main entrance foyer",
  },
  {
    id: "venture",
    short: "VentureStudio",
    name: "VentureStudio",
    zone: "far",
    walkMin: 5,
    dropPoint: "Reception, ground floor",
  },
  {
    id: "bk",
    short: "BK",
    name: "B K Majumdar Building",
    zone: "far",
    walkMin: 7,
    dropPoint: "Ground floor lobby",
  },
];

export function getBuilding(id: BuildingId): Building {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building: ${id}`);
  return building;
}

export function isBuildingId(value: string): value is BuildingId {
  return BUILDINGS.some((b) => b.id === value);
}
