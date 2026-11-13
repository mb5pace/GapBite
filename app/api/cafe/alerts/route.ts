import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { resolveAlert } from "@/lib/alerts";
import { CODE_DIGITS, INPUT_MAX } from "@/lib/config";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("seen"), id: z.string(CAFE_COPY.alerts.gone).max(INPUT_MAX.id, CAFE_COPY.alerts.gone) }),
    z.object({ action: z.literal("returned"), id: z.string(CAFE_COPY.alerts.gone).max(INPUT_MAX.id, CAFE_COPY.alerts.gone) }),
    z.object({
      action: z.literal("collect"),
      id: z.string(CAFE_COPY.alerts.gone).max(INPUT_MAX.id, CAFE_COPY.alerts.gone),
      code: z.string(CAFE_COPY.errors.badCode).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), CAFE_COPY.errors.badCode),
    }),
  ],
  CAFE_COPY.alerts.wrongKind,
);

/**
 * POST { action: "seen" | "returned" | "collect", id, code? } -> acts on one alert card.
 * Seen dismisses a failed-order alert (or a no-show whose hold has ended); Returned says the staff member
 * brought the bag back; Collect hands a no-show bag to the buyer who shows their code.
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const body = await parseBody(req, schema);
    await resolveAlert(body.id, body.action, body.action === "collect" ? body.code : undefined, Date.now());
    return ok({ done: true });
  });
}
