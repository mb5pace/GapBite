import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/account/FeedbackForm";
import { FaqPage, HelpPage, IntroductionPage, SmartVendingPage } from "@/components/discover/DiscoverPages";
import { isDiscoverTopic } from "@/data/discover-copy";

/** One Discover page. The header shows its title and a Back arrow to Discover. */
export default async function DiscoverTopic({ params }: PageProps<"/discover/[topic]">) {
  const { topic } = await params;
  if (!isDiscoverTopic(topic)) notFound();

  switch (topic) {
    case "introduction":
      return <IntroductionPage />;
    case "help":
      return <HelpPage />;
    case "smart-vending":
      return <SmartVendingPage />;
    case "feedback":
      return (
        <div className="pt-2">
          <FeedbackForm />
        </div>
      );
    case "faq":
      return <FaqPage />;
  }
}
