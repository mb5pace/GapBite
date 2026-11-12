import { ShoppingBag } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillLink } from "@/components/ui/PillButton";

/** Placeholder. Checkout (mode, building, when, pay) is Phase 5. */
export default function Checkout() {
  return (
    <EmptyState
      icon={<ShoppingBag weight="regular" size={40} />}
      action={
        <PillLink href="/cart" variant="secondary">
          {COPY.student.stubs.backToCart}
        </PillLink>
      }
    >
      {COPY.student.stubs.checkout}
    </EmptyState>
  );
}
