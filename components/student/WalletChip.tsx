import Link from "next/link";
import { COPY } from "@/data/copy";
import { Money } from "@/components/ui/Money";
import { WALLET_MIN_TO_USE } from "@/lib/config";
import { formatRupees } from "@/lib/format";

/**
 * "₹240" in the header, tap to open the wallet. An amber dot means the balance
 * is under the ₹50 needed to order or run, which is a real state, not decoration.
 */
export function WalletChip({ balance }: { balance: number }) {
  const low = balance < WALLET_MIN_TO_USE;
  return (
    <Link
      href="/account/wallet"
      aria-label={`${COPY.student.walletLabel} ${formatRupees(balance)}${low ? ", low" : ""}. Open wallet`}
      className="inline-flex h-11 items-center gap-2 rounded-pill bg-sand px-4 font-display text-section font-bold text-espresso transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
    >
      {low ? <span className="size-2 rounded-pill bg-amber" aria-hidden="true" /> : null}
      <Money amount={balance} />
    </Link>
  );
}
