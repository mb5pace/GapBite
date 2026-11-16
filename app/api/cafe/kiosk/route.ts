import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { kioskCollect, kioskCollectQr } from "@/lib/cafe";
import { CODE_DIGITS, INPUT_MAX } from "@/lib/config";

export const dynamic = "force-dynamic";

const schema = z.union(
  [
    z.object({ code: z.string(CAFE_COPY.kiosk.notFound).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), CAFE_COPY.kiosk.notFound) }).strict(),
    z.object({ qr: z.string(CAFE_COPY.kiosk.badQr).min(1, CAFE_COPY.kiosk.badQr).max(INPUT_MAX.qr, CAFE_COPY.kiosk.badQr) }).strict(),
  ],
  CAFE_COPY.kiosk.notFound,
);

/** POST { code } or { qr } (the buyer's collect QR, v1.0.0 Phase C1) -> the slots to release, and the order becomes COLLECTED. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const body = await parseBody(req, schema);
    return ok("qr" in body ? await kioskCollectQr(body.qr, Date.now()) : await kioskCollect(body.code, Date.now()));
  });
}
