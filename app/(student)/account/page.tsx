import { AccountView } from "@/components/account/AccountView";
import { VersionLine } from "@/components/ui/VersionLine";

/** Account: the profile card and the rows. The version line sits at the bottom. */
export default function Account() {
  return (
    <>
      <AccountView />
      <VersionLine className="mt-8 text-center" />
    </>
  );
}
