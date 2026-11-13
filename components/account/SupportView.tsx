import { PillLink } from "@/components/ui/PillButton";
import { ACCOUNT_COPY } from "@/data/account-copy";

/** Account › Support: where to go when something is wrong. The team's own contact details are a placeholder for now. */
export function SupportView() {
  const copy = ACCOUNT_COPY.support;
  return (
    <div className="flex flex-col gap-4 pt-2">
      <section className="flex flex-col gap-2 rounded-card bg-parchment p-4">
        <h2 className="font-display text-section font-bold text-maroon">{copy.helpDeskTitle}</h2>
        {copy.helpDesk.map((line) => (
          <p key={line} className="text-body text-espresso">
            {line}
          </p>
        ))}
      </section>
      <section className="flex flex-col gap-2 rounded-card bg-parchment p-4">
        <h2 className="font-display text-section font-bold text-maroon">{copy.teamTitle}</h2>
        <p className="text-body text-espresso">{copy.team}</p>
      </section>
      <section className="flex flex-col items-start gap-3 rounded-card bg-parchment p-4">
        <h2 className="font-display text-section font-bold text-maroon">{copy.faqTitle}</h2>
        <p className="text-body text-espresso">{copy.faq}</p>
        <PillLink href="/discover/faq" variant="secondary" size="md">
          {copy.faqLink}
        </PillLink>
      </section>
    </div>
  );
}
