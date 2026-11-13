import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { VENDING_SLOTS } from "@/data/menu";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { adjustStock, getStock, refillAll } from "@/lib/stock";

export const dynamic = "force-dynamic";

/** GET -> units left in every vending slot. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    return ok({ stock: await getStock() });
  });
}

const schema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("adjust"), slot: z.string(CAFE_COPY.errors.badSlot), delta: z.union([z.literal(1), z.literal(-1)], CAFE_COPY.errors.badSlot) }),
    z.object({ action: z.literal("refill") }),
  ],
  CAFE_COPY.errors.badSlot,
);

/** POST { action: "adjust", slot, delta: 1 | -1 } or { action: "refill" } -> the new stock. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const body = await parseBody(req, schema);
    if (body.action === "refill") {
      await refillAll();
    } else {
      if (!VENDING_SLOTS.includes(body.slot)) throw new AppError(400, CAFE_COPY.errors.badSlot);
      await adjustStock(body.slot, body.delta);
    }
    return ok({ stock: await getStock() });
  });
}
