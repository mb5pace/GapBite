import { z } from "zod";
import { BREAK_SLOTS } from "@/data/breaks";
import { isBuildingId } from "@/data/locations";
import { ORDER_COPY } from "@/data/order-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX, MAX_UNITS_PER_ORDER, REQUEST_ID_MIN } from "@/lib/config";
import { listOrdersFor, placeOrder } from "@/lib/orders";
import { getUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/** GET -> your orders, split into in progress and finished. Summaries: no codes. */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok(await listOrdersFor(session.userId as string));
  });
}

// Prices, fees and totals are deliberately not part of this: the server works them out.
const schema = z.object({
  requestId: z.string(ORDER_COPY.tryAgain).min(REQUEST_ID_MIN, ORDER_COPY.tryAgain).max(INPUT_MAX.requestId, ORDER_COPY.tryAgain),
  mode: z.enum(["pickup", "delivery"], ORDER_COPY.needBuilding),
  buildingId: z.string().refine(isBuildingId, ORDER_COPY.needBuilding).optional(),
  when: z.string(ORDER_COPY.badBreak).refine((w) => w === "asap" || BREAK_SLOTS.includes(w), ORDER_COPY.badBreak),
  items: z
    .array(
      z.object({
        itemId: z.string(ORDER_COPY.badItem).max(INPUT_MAX.itemId, ORDER_COPY.badItem),
        qty: z.number(ORDER_COPY.badItem).int(ORDER_COPY.badItem).min(1, ORDER_COPY.badItem).max(MAX_UNITS_PER_ORDER, ORDER_COPY.badItem),
      }),
      ORDER_COPY.emptyCart,
    )
    .min(1, ORDER_COPY.emptyCart)
    .max(INPUT_MAX.orderLines, ORDER_COPY.badItem),
});

/**
 * POST { requestId, mode, buildingId?, when, items: [{ itemId, qty }] } -> places the order.
 * Everything is priced and checked on the server. The reply includes the 4-digit
 * code, because this is the buyer asking. Sending the same requestId again returns the same order.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const input = await parseBody(req, schema);
    const buyer = await getUser(session.userId as string);
    const result = await placeOrder(
      { id: session.userId as string, name: buyer?.name ?? "Student" },
      {
        lines: input.items,
        mode: input.mode,
        // The schema already refused anything that is not a building.
        buildingId: input.buildingId !== undefined && isBuildingId(input.buildingId) ? input.buildingId : undefined,
        when: input.when,
        requestId: input.requestId,
      },
      Date.now(),
    );
    return ok(result);
  });
}
