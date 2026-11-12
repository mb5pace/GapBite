import { z } from "zod";
import { COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { createStaff, listStaff } from "@/lib/users";

export const dynamic = "force-dynamic";

/** GET -> every staff account, in ID order. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("admin");
    return ok({ staff: await listStaff() });
  });
}

const schema = z.object({
  name: z.string().max(60, COPY.admin.staff.badName),
});

/** POST { name } -> creates the next staff ID and returns it with the updated list. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const { name } = await parseBody(req, schema);
    const created = await createStaff(name, Date.now());
    return ok({ created, staff: await listStaff() });
  });
}
