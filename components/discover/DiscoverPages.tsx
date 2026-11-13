import { ForkKnife } from "@phosphor-icons/react/ssr";
import { DISCOVER_COPY } from "@/data/discover-copy";
import { Accordion } from "@/components/ui/Accordion";
import { PillLink } from "@/components/ui/PillButton";

/** A numbered list of short steps. The number is part of the text, not a decoration. */
function Steps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-body text-espresso">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-sand font-bold tabular-nums text-maroon" aria-hidden="true">
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="sr-only">Step {index + 1}: </span>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Discover › Introduction: what QuickX is, in three short paragraphs and one picture. */
export function IntroductionPage() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* The Open Peeps drawing goes here once the files are added (docs/UI_UX_BIBLE.md section 5). Until then: one icon in a sand circle. */}
      <span className="flex size-24 items-center justify-center self-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        <ForkKnife weight="regular" size={44} />
      </span>
      {DISCOVER_COPY.introduction.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-body text-espresso">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/** Discover › Help: how to order, how pickup works, how delivery works. */
export function HelpPage() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      {DISCOVER_COPY.help.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3 rounded-card bg-parchment p-4">
          <h2 className="font-display text-section font-bold text-maroon">{section.title}</h2>
          <Steps steps={section.steps} />
        </section>
      ))}
    </div>
  );
}

/** Discover › Smart Vending: how paying for the machine works, with a button into it. */
export function SmartVendingPage() {
  const copy = DISCOVER_COPY.smartVending;
  return (
    <div className="flex flex-col gap-4 pt-2">
      <section className="flex flex-col gap-3 rounded-card bg-parchment p-4">
        <Steps steps={copy.steps} />
      </section>
      <p className="text-secondary text-mocha">{copy.note}</p>
      <PillLink href="/s/vending" full arrow>
        {copy.open}
      </PillLink>
    </div>
  );
}

/** Discover › FAQ: fees, wallet minimum, late and no-show rules, runner earnings, refunds. */
export function FaqPage() {
  return (
    <div className="pt-2">
      <Accordion items={DISCOVER_COPY.faq.items.map((item) => ({ id: item.id, title: item.question, paragraphs: item.answer }))} />
    </div>
  );
}
