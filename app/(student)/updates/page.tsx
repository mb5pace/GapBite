import { Bell } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder. The Updates feed is Phase 5. */
export default function Updates() {
  return <EmptyState icon={<Bell weight="regular" size={40} />}>{COPY.student.stubs.updates}</EmptyState>;
}
