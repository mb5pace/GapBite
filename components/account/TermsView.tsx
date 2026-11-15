import { ACCOUNT_COPY } from "@/data/account-copy";

/** Account › Terms and Conditions: short, plain, and honest that this is a prototype. Includes the illustration credit. */
export function TermsView() {
  const copy = ACCOUNT_COPY.terms;
  return (
    <div className="flex flex-col gap-5 pt-2">
      <p className="text-body text-espresso">{copy.intro}</p>
      {copy.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2 rounded-card bg-parchment p-4">
          <h2 className="font-display text-section font-bold text-maroon">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="text-body text-espresso">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
