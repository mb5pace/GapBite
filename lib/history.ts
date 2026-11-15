/**
 * Account › Order History and Refund Status. Server-side only. Both read the order records, which are the
 * source of truth, so they cannot disagree with Orders or the Wallet.
 */
import { HISTORY_RUNS_KEEP } from "./config";
import type { HistoryReply, RefundItem, RefundReason, RefundsReply, RunHistoryItem, RunOutcome } from "./history-types";
import { listOrdersFor, orderKey, runsByKey } from "./orders";
import type { Order, OrderStatus } from "./order-types";
import { getRedis } from "./redis";
import { getLedger } from "./wallet";

const RUN_OUTCOME: Partial<Record<OrderStatus, RunOutcome>> = {
  DELIVERED: "delivered",
  FAILED_LATE: "failed-late",
  NO_SHOW: "no-show",
};

const REFUND_REASON: Partial<Record<OrderStatus, RefundReason>> = {
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  FAILED_LATE: "failed-late",
};

/** Finished orders and finished runs. A run still being carried is in Orders › My runs, not here. */
export async function getHistory(userId: string): Promise<HistoryReply> {
  const redis = getRedis();
  const { past, now } = await listOrdersFor(userId);

  const ids = await redis.zrange<string[]>(runsByKey(userId), 0, HISTORY_RUNS_KEEP - 1, { rev: true });
  const runs: RunHistoryItem[] = [];
  if (ids.length > 0) {
    const [orders, ledger] = await Promise.all([
      redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id)))),
      getLedger(userId),
    ]);
    // What each run did to this wallet: an earning is +, a penalty is −.
    const moved = new Map<string, number>();
    for (const entry of ledger) {
      if (entry.orderId && (entry.type === "earning" || entry.type === "penalty")) moved.set(entry.orderId, (moved.get(entry.orderId) ?? 0) + entry.amount);
    }
    for (const order of orders) {
      if (!order || typeof order !== "object" || !order.holder || order.holder.id !== userId || !order.buildingId) continue;
      const outcome = RUN_OUTCOME[order.status];
      if (!outcome) continue;
      runs.push({
        id: order.id,
        sourceId: order.sourceId,
        buildingId: order.buildingId,
        outcome,
        kind: order.holder.kind,
        amount: moved.has(order.id) ? (moved.get(order.id) as number) : null,
        at: order.updatedAt,
      });
    }
    runs.sort((a, b) => b.at - a.at);
  }
  return { orders: past, runs, now };
}

/** Every refund the user has had: cancelled, rejected and failed-late orders. Always the full total, always to the wallet. */
export async function getRefunds(userId: string): Promise<RefundsReply> {
  const { past, now } = await listOrdersFor(userId);
  const refunds: RefundItem[] = [];
  for (const order of past) {
    const reason = REFUND_REASON[order.status];
    if (reason) refunds.push({ orderId: order.id, sourceId: order.sourceId, reason, amount: order.total, at: order.updatedAt });
  }
  refunds.sort((a, b) => b.at - a.at);
  return { refunds, total: refunds.reduce((sum, r) => sum + r.amount, 0), now };
}
