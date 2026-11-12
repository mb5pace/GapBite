import { COPY } from "@/data/copy";
import { GateForm } from "@/components/auth/GateForm";

/**
 * The gate. The only screen with the full-bleed brand yellow (UI_UX_BIBLE.md).
 * `?ended=1` is added by the guards when a session is over or missing.
 */
export default async function Gate({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const ended = params.ended !== undefined;

  return (
    <main className="flex min-h-dvh flex-col bg-sun">
      <section className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-center">
        <h1 className="font-display text-display font-extrabold text-maroon">QuickX</h1>
        <p className="text-section font-medium text-maroon">{COPY.tagline}</p>
      </section>
      <section className="rounded-t-sheet bg-cream px-5 pb-10 pt-8">
        <div className="mx-auto w-full max-w-[430px]">
          <GateForm notice={ended ? COPY.gate.sessionEnded : undefined} />
        </div>
      </section>
    </main>
  );
}
