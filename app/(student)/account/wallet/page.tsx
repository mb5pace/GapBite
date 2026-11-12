import { WalletView } from "@/components/student/WalletView";
import { requirePageSession } from "@/lib/auth";
import { getWalletSnapshot } from "@/lib/wallet";

/** Account › Wallet: balance, mock UPI top-up, ledger. */
export default async function WalletPage() {
  const session = await requirePageSession("student", { user: true });
  return <WalletView initial={await getWalletSnapshot(session.userId as string)} />;
}
