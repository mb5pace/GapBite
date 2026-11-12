import { z } from "zod";
import { WALLET_COPY } from "@/data/copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { TOPUP_MAX, TOPUP_MIN } from "@/lib/config";
import { topUp } from "@/lib/wallet";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z
    .number(WALLET_COPY.badAmount)
    .int(WALLET_COPY.badAmount)
    .min(TOPUP_MIN, WALLET_COPY.badAmount)
    .max(TOPUP_MAX, WALLET_COPY.badAmount),
});

/**
 * POST { amount } -> mock UPI top-up. It always succeeds: the app shows a short
 * fake "processing" step first, then calls this. No real payment exists.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { amount } = await parseBody(req, schema);
    const result = await topUp(session.userId as string, amount, Date.now());
    return ok({ balance: result.balance, added: amount });
  });
}
