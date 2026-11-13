import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { getItem } from "@/data/menu";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { INPUT_MAX } from "@/lib/config";
import { requireApiSession } from "@/lib/auth";
import { getMenuState, setItemAvailable } from "@/lib/menu";

export const dynamic = "force-dynamic";

/** GET -> the ids of items switched off today. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    const state = await getMenuState(Date.now());
    return ok({ unavailable: state.unavailable });
  });
}

const schema = z.object({
  itemId: z.string(CAFE_COPY.errors.badItem).max(INPUT_MAX.itemId, CAFE_COPY.errors.badItem),
  available: z.boolean(CAFE_COPY.errors.badItem),
});

/** POST { itemId, available } -> switches one item on or off for today. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const { itemId, available } = await parseBody(req, schema);
    if (!getItem(itemId)) throw new AppError(400, CAFE_COPY.errors.badItem);
    await setItemAvailable(itemId, available);
    const state = await getMenuState(Date.now());
    return ok({ unavailable: state.unavailable });
  });
}
