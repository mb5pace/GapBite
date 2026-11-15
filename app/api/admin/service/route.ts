import { z } from "zod";
import { COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { SERVICE_MESSAGE_MAX } from "@/lib/config";
import { getService, saveService } from "@/lib/hours";

export const dynamic = "force-dynamic";

/** GET -> the service-wide switch and the message students read while it is off. Admin only. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("admin");
    return ok({ service: await getService() });
  });
}

const schema = z
  .object({
    available: z.boolean(COPY.admin.service.badValue),
    message: z.string(COPY.admin.service.badValue).max(SERVICE_MESSAGE_MAX, COPY.admin.service.tooLong),
  })
  .strict();

/**
 * PUT { available, message } -> the whole service on or off. Off: every student screen shows the message and the server
 * refuses every new order. Orders already placed carry on. Only Admin can do this, never the Cafe.
 */
export async function PUT(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const { available, message } = await parseBody(req, schema);
    return ok({ service: await saveService(available, message) });
  });
}
