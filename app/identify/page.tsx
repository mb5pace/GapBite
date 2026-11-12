import { COPY } from "@/data/copy";
import { IdentifyForm } from "@/components/auth/IdentifyForm";
import { requirePageSession } from "@/lib/auth";

/** After a student-type code: who is ordering. Needs a student session, not yet a user. */
export default async function Identify() {
  await requirePageSession("student");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-8 pt-16">
      <h1 className="font-display text-title font-extrabold text-maroon">{COPY.identify.title}</h1>
      <div className="mt-8">
        <IdentifyForm />
      </div>
      <p className="mt-auto pt-12 text-center text-secondary text-mocha">{COPY.identify.prototypeNote}</p>
    </main>
  );
}
