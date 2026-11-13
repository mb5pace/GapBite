import { ChatCircleText, Compass, Info, Package, Question } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { DISCOVER_COPY, DISCOVER_TOPICS, type DiscoverTopic } from "@/data/discover-copy";
import { NavRow } from "@/components/ui/NavRow";

const ICON = { weight: "regular" as const, size: 22 };
const ICONS: Record<DiscoverTopic, ReactNode> = {
  introduction: <Info {...ICON} />,
  help: <Compass {...ICON} />,
  "smart-vending": <Package {...ICON} />,
  feedback: <ChatCircleText {...ICON} />,
  faq: <Question {...ICON} />,
};

/** Discover (docs/SCREENS.md): five rows, each opening a simple content page. */
export function DiscoverList() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-body text-espresso">{DISCOVER_COPY.intro}</p>
      <nav aria-label="Discover" className="flex flex-col gap-3">
        {DISCOVER_TOPICS.map((topic) => (
          <NavRow key={topic} href={`/discover/${topic}`} icon={ICONS[topic]} title={DISCOVER_COPY.rows[topic].title} hint={DISCOVER_COPY.rows[topic].blurb} />
        ))}
      </nav>
    </div>
  );
}
