import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillLink } from "@/components/ui/PillButton";

/** A missing page or order inside the student app: the header and the bottom bar stay. */
export default function StudentNotFound() {
  return (
    <EmptyState
      icon={<MagnifyingGlass weight="regular" size={40} />}
      action={
        <PillLink href="/home" variant="secondary">
          {COPY.errorPages.goHome}
        </PillLink>
      }
    >
      {COPY.errorPages.notFound}
    </EmptyState>
  );
}
