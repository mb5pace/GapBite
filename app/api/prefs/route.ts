import { z } from "zod";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { getPrefs, savePrefs } from "@/lib/prefs";
import { BUILDING_IDS, MODES, WHENS } from "@/lib/prefs-rules";

export const dynamic = "force-dynamic";

const bad = ACCOUNT_COPY.preferences.badValue;
const schema = z
  .object({
    defaultBuilding: z.enum(BUILDING_IDS as [string, ...string[]], bad).optional(),
    defaultMode: z.enum(MODES as [string, ...string[]], bad).optional(),
    defaultWhen: z.enum(WHENS as [string, ...string[]], bad).optional(),
    notifications: z
      .object({ orderUpdates: z.boolean(bad).optional(), walletUpdates: z.boolean(bad).optional(), sounds: z.boolean(bad).optional() })
      .strict()
      .optional(),
  })
  .strict();

/** GET -> your saved preferences (the defaults if you never saved any). */
export async function GET() {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    return ok({ prefs: await getPrefs(session.userId as string) });
  });
}

/** PUT a change to any part of your preferences -> the preferences as saved. */
export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const patch = await parseBody(req, schema);
    return ok({ prefs: await savePrefs(session.userId as string, patch as Parameters<typeof savePrefs>[1]) });
  });
}
