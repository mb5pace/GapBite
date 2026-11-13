import { User } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoutButton } from "@/components/ui/LogoutButton";

/**
 * Placeholder Account. The profile card and the rows (Wallet, My Profile, ...)
 * arrive in Phase 9; the Wallet page itself is built. Log out lives here, where it will stay.
 */
export default function Account() {
  return (
    <EmptyState icon={<User weight="regular" size={40} />} action={<LogoutButton />}>
      {COPY.student.stubs.account}
    </EmptyState>
  );
}
