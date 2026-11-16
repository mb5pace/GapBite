import { z } from "zod";
import { CAFE_COPY } from "@/data/cafe-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { INPUT_MAX } from "@/lib/config";
import { addHoliday, getHoursConfig, getService, removeHoliday, saveItemWindow, savePaused, saveSourceHours } from "@/lib/hours";

export const dynamic = "force-dynamic";

/** GET -> opening hours, open days, pauses, item windows and holidays, and (read only) the service switch. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    const [hours, service] = await Promise.all([getHoursConfig(), getService()]);
    return ok({ hours, service, now: Date.now() });
  });
}

const bad = CAFE_COPY.hours.badValue;
const id = z.string(bad).min(1, bad).max(INPUT_MAX.itemId, bad);
const schema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("source"), sourceId: id, open: z.string(bad), close: z.string(bad), days: z.array(z.number(bad), bad) }).strict(),
    z.object({ action: z.literal("paused"), sourceId: id, paused: z.boolean(bad) }).strict(),
    z.object({ action: z.literal("item"), itemId: id, from: z.string(bad).nullable().optional(), until: z.string(bad).nullable().optional() }).strict(),
    z.object({ action: z.literal("item-reset"), itemId: id }).strict(),
    z.object({ action: z.literal("holiday-add"), date: z.string(bad), note: z.string(bad).max(200, bad) }).strict(),
    z.object({ action: z.literal("holiday-remove"), date: z.string(bad) }).strict(),
  ],
  bad,
);

/**
 * PUT one change to the hours. Each action changes one setting and nothing else, so two cafe screens editing different
 * things never overwrite each other. Orders already placed are never affected. Returns the hours as they now are.
 */
export async function PUT(req: Request) {
  return handle(async () => {
    await requireApiSession("cafe");
    const body = await parseBody(req, schema);
    switch (body.action) {
      case "source":
        return ok({ hours: await saveSourceHours(body.sourceId, body) });
      case "paused":
        return ok({ hours: await savePaused(body.sourceId, body.paused) });
      case "item":
        return ok({ hours: await saveItemWindow(body.itemId, { from: body.from || undefined, until: body.until || undefined }) });
      case "item-reset":
        return ok({ hours: await saveItemWindow(body.itemId, null) });
      case "holiday-add":
        return ok({ hours: await addHoliday(body.date, body.note) });
      case "holiday-remove":
        return ok({ hours: await removeHoliday(body.date) });
    }
  });
}
