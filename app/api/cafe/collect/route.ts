import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { scanCollect } from "@/lib/cafe";
import { CODE_DIGITS, INPUT_MAX } from "@/lib/config";
import { toCafeCard } from "@/lib/order-types";

export const dynamic = "force-dynamic";

const code = z.string(CAFE_COPY.errors.badCode).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), CAFE_COPY.errors.badCode);
const schema = z.union(
  [
    z.object({ qr: z.string(CAFE_COPY.scan.badQr).min(1, CAFE_COPY.scan.badQr).max(INPUT_MAX.qr, CAFE_COPY.scan.badQr) }).strict(),
    z.object({ orderId: z.string(CAFE_COPY.scan.notFound).min(1, CAFE_COPY.scan.notFound).max(INPUT_MAX.id, CAFE_COPY.scan.notFound), code }).strict(),
    z.object({ code }).strict(),
  ],
  CAFE_COPY.scan.badQr,
);

/**
 * POST { qr } | { orderId, code } | { code } -> Scan buyer QR at the counter (cafe session only). Only a cafe pickup
 * in READY with the right code becomes COLLECTED. The reply is the order as the desk sees it (no code).
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const body = await parseBody(req, schema);
    return ok({ order: toCafeCard(await scanCollect(body, Date.now())) });
  });
}
