import { notFound } from "next/navigation";
import { User } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillLink } from "@/components/ui/PillButton";

/**
 * Placeholder for Account › Wallet, My Profile, Preferences and the rest, so the
 * wallet chip and later links never land on a missing page. Wallet is Phase 4,
 * the others Phase 9.
 */
export default async function AccountSection({ params }: PageProps<"/account/[section]">) {
  const { section } = await params;
  if (!(section in COPY.student.accountSections)) notFound();

  return (
    <EmptyState
      icon={<User weight="regular" size={40} />}
      action={
        <PillLink variant="secondary" href="/account">
          {COPY.student.accountSections[section as keyof typeof COPY.student.accountSections]}
        </PillLink>
      }
    >
      {COPY.student.stubs.section}
    </EmptyState>
  );
}
