/**
 * The "Ready to deliver" list (the Scan button's count and the list in the runner sheet): delivery bags that are READY
 * and that nobody has taken yet. Pure: the server builds it from the orders and the tests check it.
 *
 * What it never carries: the order ID (a typed ID could be accepted without going to the counter), the buyer's name or
 * ID, the 4-digit code, prices. And never the caller's own orders. A bag can only be taken by scanning it at its counter.
 */
import { BUILDINGS, getBuilding, type BuildingId, type ZoneId } from "@/data/locations";
import { getSource } from "@/data/menu";
import { RUNNER_EARN } from "./config";
import type { Order } from "./order-types";

export interface ReadyBag {
  /** A key for the list only: the building and the position, nothing that identifies the order. */
  key: string;
  sourceName: string;
  buildingId: BuildingId;
  buildingShort: string;
  dropPoint: string;
  zone: ZoneId;
  /** Rupees a runner buddy earns for this zone; null for staff ("Staff delivery"). */
  earning: number | null;
  itemCount: number;
  /** Whole minutes since the cafe marked it ready. */
  minutesSinceReady: number;
}

const ZONE_RANK: Record<ZoneId, number> = { near: 0, far: 1 };

export function readyBagsFrom(orders: readonly (Order | null)[], caller: { id: string; role: "student" | "staff" }, now: number): ReadyBag[] {
  const bags = orders
    .filter((o): o is Order => !!o && typeof o === "object")
    .filter((o) => o.status === "READY" && o.mode === "delivery" && !o.holder && o.buildingId !== undefined && o.buyerId !== caller.id)
    .map((o) => {
      const building = getBuilding(o.buildingId as BuildingId);
      const readyAt = [...o.events].reverse().find((e) => e.status === "READY")?.at ?? o.updatedAt;
      return {
        building,
        readyAt,
        bag: {
          sourceName: getSource(o.sourceId).name,
          buildingId: building.id,
          buildingShort: building.short,
          dropPoint: building.dropPoint,
          zone: building.zone,
          earning: caller.role === "staff" ? null : RUNNER_EARN[building.zone],
          itemCount: o.items.reduce((sum, line) => sum + line.qty, 0),
          minutesSinceReady: Math.max(0, Math.floor((now - readyAt) / 60_000)),
        },
      };
    })
    // Near zone first, then the buildings in their usual order, and the oldest bag first inside each building.
    .sort(
      (a, b) =>
        ZONE_RANK[a.building.zone] - ZONE_RANK[b.building.zone] ||
        BUILDINGS.indexOf(a.building) - BUILDINGS.indexOf(b.building) ||
        a.readyAt - b.readyAt,
    );
  return bags.map(({ bag }, i) => ({ key: `${bag.buildingId}-${i}`, ...bag }));
}
