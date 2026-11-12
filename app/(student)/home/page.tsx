import { ForkKnife } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";

/** Placeholder Home. The real Home (sources, search, popular) is Phase 3. */
export default function Home() {
  return <EmptyState icon={<ForkKnife weight="regular" size={40} />}>{COPY.student.stubs.home}</EmptyState>;
}
