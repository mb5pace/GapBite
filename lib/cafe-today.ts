/**
 * Today totals for the cafe desk (docs/SCREENS.md "Today"). Server-side only.
 * Counted from IST midnight. Revenue is food only (the subtotal) for orders that
 * finished. Delivery fees kept: the whole fee when staff delivered, and the fee
 * minus the runner's earning when a runner buddy delivered.
 */
import { SOURCES, type SourceId } from "@/data/menu";
import { CAFE_ORDERS_MAX, RUNNER_EARN } from "./config";
import { getBuilding } from "@/data/locations";
import { activeKey, doneKey, orderKey } from "./orders";
import { isTerminal, type Order } from "./order-types";
import { getRedis } from "./redis";
import { istMidnight } from "./time";

export interface TodayTotals {
  now: number;
  placed: number;
  inProgress: number;
  delivered: number;
  collected: number;
  failed: number;
  closedEarly: number;
  refundCount: number;
  refundTotal: number;
  feesKept: number;
  revenueTotal: number;
  bySource: { sourceId: SourceId; name: string; finished: number; revenue: number }[];
}

export async function getTodayTotals(now: number): Promise<TodayTotals> {
  const redis = getRedis();
  const midnight = istMidnight(now);
  const [activeIds, doneIds] = await Promise.all([
    redis.zrange<string[]>(activeKey(), 0, CAFE_ORDERS_MAX - 1),
    redis.zrange<string[]>(doneKey(), midnight, "+inf", { byScore: true }),
  ]);
  const ids = [...new Set([...activeIds, ...doneIds].map(String))].slice(0, CAFE_ORDERS_MAX);
  const found = ids.length ? await redis.mget<(Order | null)[]>(...ids.map(orderKey)) : [];
  const orders = found.filter((o): o is Order => o !== null && typeof o === "object" && o.createdAt >= midnight);

  const totals: TodayTotals = {
    now,
    placed: orders.length,
    inProgress: 0,
    delivered: 0,
    collected: 0,
    failed: 0,
    closedEarly: 0,
    refundCount: 0,
    refundTotal: 0,
    feesKept: 0,
    revenueTotal: 0,
    bySource: SOURCES.map((source) => ({ sourceId: source.id, name: source.name, finished: 0, revenue: 0 })),
  };

  for (const order of orders) {
    if (!isTerminal(order.status)) {
      totals.inProgress++;
      continue;
    }
    if (order.status === "DELIVERED" || order.status === "COLLECTED") {
      if (order.status === "DELIVERED") totals.delivered++;
      else totals.collected++;
      const row = totals.bySource.find((r) => r.sourceId === order.sourceId);
      if (row) {
        row.finished++;
        row.revenue += order.subtotal;
      }
      totals.revenueTotal += order.subtotal;
      if (order.status === "DELIVERED") {
        const zone = order.buildingId ? getBuilding(order.buildingId).zone : "near";
        totals.feesKept += order.holder?.kind === "runner" ? order.fee - RUNNER_EARN[zone] : order.fee;
      }
      continue;
    }
    // CANCELLED, REJECTED and FAILED_LATE all refund the whole order.
    if (order.status === "FAILED_LATE") totals.failed++;
    else totals.closedEarly++;
    totals.refundCount++;
    totals.refundTotal += order.total;
  }
  return totals;
}
