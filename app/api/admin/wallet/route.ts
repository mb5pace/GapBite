import { z } from "zod";
import { WALLET_COPY } from "@/data/copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { ADMIN_ADJUST_MAX, ADMIN_NOTE_MAX, ADMIN_NOTE_MIN, INPUT_MAX } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getUser, normalizeAnyId } from "@/lib/users";
import { adjust, getLedger } from "@/lib/wallet";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string(WALLET_COPY.admin.noOne).min(1, WALLET_COPY.admin.noOne).max(INPUT_MAX.id, WALLET_COPY.admin.noOne),
  amount: z
    .number(WALLET_COPY.admin.badAmount)
    .int(WALLET_COPY.admin.badAmount)
    .refine((n) => n !== 0 && Math.abs(n) <= ADMIN_ADJUST_MAX, WALLET_COPY.admin.badAmount),
  note: z.string(WALLET_COPY.admin.badNote).trim().min(ADMIN_NOTE_MIN, WALLET_COPY.admin.badNote).max(ADMIN_NOTE_MAX, WALLET_COPY.admin.badNote),
});

/** POST { userId, amount, note } -> adjust a wallet up or down. The note is required and goes in the ledger. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const input = await parseBody(req, schema);

    const id = normalizeAnyId(input.userId);
    const user = id ? await getUser(id) : null;
    if (!user) throw new AppError(404, WALLET_COPY.admin.noOne);

    const result = await adjust(user.id, input.amount, input.note, Date.now());
    if (!result.ok) {
      throw new AppError(
        409,
        `That would take ${user.name}'s wallet below ₹0. Their balance is ${formatRupees(result.balance)}.`,
      );
    }
    return ok({ balance: result.balance, ledger: await getLedger(user.id), now: Date.now() });
  });
}
