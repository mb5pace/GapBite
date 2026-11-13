/**
 * Admin › Live orders (docs/SCREENS.md "Admin portal"): every order in progress, for the demo.
 * Server-side only. The list never carries a 4-digit code. `revealCode` returns one order's code to
 * an admin session that asks for exactly that order; it is a demo tool.
 */
import { AppError } from "./api";
import { ORDER_COPY } from "@/data/order-copy";
import { CAFE_ORDERS_MAX } from "./config";
import { activeKey, getOrder, orderKey } from "./orders";
import type { BuildingId } from "@/data/locations";
import type { SourceId } from "@/data/menu";
import type { Holder, Order, OrderMode, OrderStatus } from "./order-types";
import { getRedis } from "./redis";

export interface LiveOrderRow {
  id: string;
  sourceId: SourceId;
  status: OrderStatus;
  mode: OrderMode;
  buildingId?: BuildingId;
  holder?: Holder;
  promisedAt?: number;
  arrivedAt?: number;
  createdAt: number;
}

export async function listLiveOrders(now: number): Promise<{ orders: LiveOrderRow[]; now: number }> {
  const redis = getRedis();
  const ids = await redis.zrange<string[]>(activeKey(), 0, CAFE_ORDERS_MAX - 1, { rev: true });
  if (ids.length === 0) return { orders: [], now };
  const found = await redis.mget<(Order | null)[]>(...ids.map((id) => orderKey(String(id))));
  const orders = found
    .filter((order): order is Order => order !== null && typeof order === "object")
    .map((order) => ({
      id: order.id,
      sourceId: order.sourceId,
      status: order.status,
      mode: order.mode,
      buildingId: order.buildingId,
      holder: order.holder,
      promisedAt: order.promisedAt,
      arrivedAt: order.arrivedAt,
      createdAt: order.createdAt,
    }));
  return { orders, now };
}

/** The 4-digit code of one order. Only called from an admin session. */
export async function revealCode(orderId: string): Promise<{ id: string; code: string }> {
  const order = await getOrder(orderId);
  if (!order) throw new AppError(404, ORDER_COPY.noSuchOrder);
  return { id: order.id, code: order.code };
}
