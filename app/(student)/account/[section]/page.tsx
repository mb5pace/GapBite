import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/account/FeedbackForm";
import { HistoryView } from "@/components/account/HistoryView";
import { NotificationsView } from "@/components/account/NotificationsView";
import { PreferencesView } from "@/components/account/PreferencesView";
import { ProfileView } from "@/components/account/ProfileView";
import { RefundsView } from "@/components/account/RefundsView";
import { SupportView } from "@/components/account/SupportView";
import { TermsView } from "@/components/account/TermsView";

/** The pages under Account except Wallet (which has its own page): My Profile, Preferences, Notifications, and the rest. */
export default async function AccountSection({ params }: PageProps<"/account/[section]">) {
  const { section } = await params;

  switch (section) {
    case "profile":
      return <ProfileView />;
    case "preferences":
      return <PreferencesView />;
    case "notifications":
      return <NotificationsView />;
    case "history":
      return <HistoryView />;
    case "refunds":
      return <RefundsView />;
    case "terms":
      return <TermsView />;
    case "feedback":
      return (
        <div className="pt-2">
          <FeedbackForm />
        </div>
      );
    case "support":
      return <SupportView />;
    default:
      notFound();
  }
}
