import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { kioskCollect } from "@/lib/cafe";
import { CODE_DIGITS } from "@/lib/config";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string(CAFE_COPY.kiosk.notFound).regex(new RegExp(`^\\d{${CODE_DIGITS}}$`), CAFE_COPY.kiosk.notFound),
});

/** POST { code } -> the slots to release, and the order becomes COLLECTED. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const { code } = await parseBody(req, schema);
    return ok(await kioskCollect(code, Date.now()));
  });
}
