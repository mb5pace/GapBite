"use client";

import { useState } from "react";
import { WALLET_COPY } from "@/data/copy";
import { Banner } from "@/components/ui/Banner";
import { PillButton } from "@/components/ui/PillButton";
import { walletStatus } from "@/lib/wallet-rules";
import { TopUpSheet } from "./TopUpSheet";
import { useMe } from "./useMe";

/**
 * Home banner. Under ₹50 you cannot order or take a run ("Top up to order");
 * from ₹50 to ₹99 you can, but it asks you to keep ₹100. Nothing at ₹100 or more.
 */
export function WalletBanner() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const status = walletStatus(me.balance);

  // The sheet stays mounted even when the banner hides: a top-up that lifts the
  // balance to ₹100 hides the banner, and the "₹100 added" confirmation must survive that.
  return (
    <>
      {status === "ok" ? null : (
        <Banner
          tone="warning"
          action={
            <PillButton variant="secondary" size="md" onClick={() => setOpen(true)}>
              {WALLET_COPY.topUp}
            </PillButton>
          }
        >
          {status === "blocked" ? WALLET_COPY.blockedBanner : WALLET_COPY.lowBanner}
        </Banner>
      )}
      <TopUpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
