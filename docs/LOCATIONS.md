# LOCATIONS

All selling happens at the **University Centre (UC)**, building 9 on the campus map, on Central Campus next to Gate 12 and Gate 13 on University Road. UC holds the four cafes and the vending machine. Only the six buildings below are delivery destinations. Ignore every other building on the map.

## Sources at UC

| id | Name | Type |
|---|---|---|
| `truly-indian` | Truly Indian | cafe |
| `global-bistro` | Global Bistro | cafe |
| `cafe-delice` | Cafe Delice | cafe |
| `greens-grains` | Greens and Grains | cafe |
| `vending` | UC Vending Machine | vending |

Pickup at UC: cafe orders are collected at that cafe's counter; vending orders are collected at the machine (kiosk screen) with the collect code.

## Delivery buildings

| id | Short name | Full name | Where (from the campus map) | Zone | Walk from UC (min) | Drop point |
|---|---|---|---|---|---|---|
| `ag` | AG | AG building | North Campus, directly across University Road from UC Gate 12 | near | 2 | Main entrance, ground floor |
| `gict` | GICT | GICT Building (School of Engineering and Applied Science) | Central Campus, just south of UC (map 10) | near | 2 | Ground floor lobby |
| `sas` | SAS | School of Arts and Sciences | Central Campus, east of the Arboretum (map 8) | near | 3 | Ground floor lobby |
| `amsom` | AMSOM | Amrut Mody School of Management | Central Campus, south-east (map 6) | near | 4 | Main entrance foyer |
| `venture` | VentureStudio | VentureStudio | North Campus across University Road via Gate 4 (map 2) | far | 5 | Reception, ground floor |
| `bk` | BK | B K Majumdar Building | East Campus, across the cross road via Gate 10/11 (map 11) | far | 7 | Ground floor lobby |

Walk times are estimates from the map. The team will walk each route once and correct them in `data/locations.ts`. Every timing in the app reads from that file.

## Zones

**Near zone:** AG, GICT, SAS, AMSOM. **Far zone:** VentureStudio, BK. Delivery fee and runner earning are set per zone (see BUSINESS_RULES.md), never per building.

## Data shape (`data/locations.ts`)

```ts
export type ZoneId = "near" | "far";
export type BuildingId = "ag" | "gict" | "sas" | "amsom" | "venture" | "bk";
export interface Building {
  id: BuildingId;
  short: string;      // "GICT"
  name: string;       // full name
  zone: ZoneId;
  walkMin: number;    // minutes from UC
  dropPoint: string;  // shown to buyer and runner
}
```

## Break slots

Real break times are not fixed yet. Use this placeholder list in `data/breaks.ts` and let the team edit it: 10:20, 11:50, 13:20, 14:50, 16:20 (IST, 24-hour). Buyers can choose "As soon as possible" or one of today's remaining slots.
