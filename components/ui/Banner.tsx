import { Info, Warning, WarningCircle } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";

type Tone = "info" | "warning" | "error";

const ICON_COLOUR: Record<Tone, string> = {
  info: "text-maroon",
  warning: "text-amber",
  error: "text-brick",
};

function ToneIcon({ tone }: { tone: Tone }) {
  const props = { weight: "regular" as const, size: 24, "aria-hidden": true };
  if (tone === "warning") return <Warning {...props} />;
  if (tone === "error") return <WarningCircle {...props} />;
  return <Info {...props} />;
}

/**
 * `parchment` strip with an icon and one sentence. A warning is an amber icon,
 * never a coloured side stripe (UI_UX_BIBLE.md section 4).
 */
export function Banner({
  tone = "info",
  children,
  action,
}: {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex items-start gap-3 rounded-card bg-parchment p-4"
    >
      <span className={`mt-0.5 shrink-0 ${ICON_COLOUR[tone]}`}>
        <ToneIcon tone={tone} />
      </span>
      <p className="min-w-0 flex-1 text-secondary text-espresso">{children}</p>
      {action}
    </div>
  );
}
