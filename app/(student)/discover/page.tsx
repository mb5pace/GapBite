import { Compass } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder. Discover (Introduction, Help, Smart Vending, Feedback, FAQ) is Phase 9. */
export default function Discover() {
  return <EmptyState icon={<Compass weight="regular" size={40} />}>{COPY.student.stubs.discover}</EmptyState>;
}
