import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillLink } from "@/components/ui/PillButton";
import { getSession } from "@/lib/auth";
import { portalHome } from "@/lib/session";

/** A missing page, in our colours. The link goes to whatever the person's own home is. */
export default async function NotFound() {
  const session = await getSession();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-5">
      <EmptyState
        icon={<MagnifyingGlass weight="regular" size={40} />}
        action={
          <PillLink href={session ? portalHome(session) : "/"} variant="secondary">
            {session ? COPY.errorPages.goHome : COPY.errorPages.goBack}
          </PillLink>
        }
      >
        {COPY.errorPages.notFound}
      </EmptyState>
    </main>
  );
}
