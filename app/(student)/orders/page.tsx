import { Receipt } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder. Orders (Active and Past) is Phase 5. */
export default function Orders() {
  return <EmptyState icon={<Receipt weight="regular" size={40} />}>{COPY.student.stubs.orders}</EmptyState>;
}
