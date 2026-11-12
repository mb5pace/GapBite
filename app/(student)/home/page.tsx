import { redirect } from "next/navigation";
import { COPY } from "@/data/copy";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { requirePageSession } from "@/lib/auth";
import { greetingNow } from "@/lib/time";
import { getUser } from "@/lib/users";

/** Placeholder home. The real Home (sources, search, popular) is Phase 3. */
export default async function Home() {
  const session = await requirePageSession("student", { user: true });
  const user = session.userId ? await getUser(session.userId) : null;
  if (!user) redirect("/identify");

  return (
    <section className="flex flex-col gap-6 pt-6">
      <div>
        <p className="text-section font-medium text-mocha">{greetingNow()}</p>
        <h1 className="font-display text-greeting font-extrabold text-maroon">{user.name}</h1>
        {user.role === "staff" ? (
          <p className="mt-1 text-secondary text-mocha">QuickX staff · {user.id}</p>
        ) : (
          <p className="mt-1 text-secondary text-mocha">{user.id}</p>
        )}
      </div>
      <p className="text-body text-espresso">{COPY.student.placeholderHome}</p>
      <div>
        <LogoutButton />
      </div>
    </section>
  );
}
