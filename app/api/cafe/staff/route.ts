import { handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { listStaff } from "@/lib/users";

export const dynamic = "force-dynamic";

/** GET -> the existing staff accounts (ID and first name), for the Send with staff picker. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("cafe");
    const staff = await listStaff();
    return ok({ staff: staff.map((person) => ({ id: person.id, name: person.name })) });
  });
}
