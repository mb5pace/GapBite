import { WALLET_COPY } from "@/data/copy";
import { AppError, handle, ok } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { ADMIN_USERS_LIST_MAX } from "@/lib/config";
import { getUser, listUsers, normalizeAnyId } from "@/lib/users";
import { getBalance, getBalances, getLedger } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/**
 * GET ?q=text  -> up to 50 people (ID, name, role, balance), newest first.
 * GET ?id=AU2340101 -> one person with their balance and full ledger.
 */
export async function GET(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const params = new URL(req.url).searchParams;

    const id = params.get("id");
    if (id !== null) {
      const normalized = normalizeAnyId(id);
      const user = normalized ? await getUser(normalized) : null;
      if (!user) throw new AppError(404, WALLET_COPY.admin.noOne);
      const [balance, ledger] = await Promise.all([getBalance(user.id), getLedger(user.id)]);
      return ok({ user, balance, ledger, now: Date.now() });
    }

    const users = await listUsers(params.get("q") ?? "", ADMIN_USERS_LIST_MAX);
    const balances = await getBalances(users.map((u) => u.id));
    return ok({ users: users.map((u, i) => ({ ...u, balance: balances[i] })), now: Date.now() });
  });
}
