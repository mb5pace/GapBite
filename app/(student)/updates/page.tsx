import { UpdatesView } from "@/components/student/UpdatesView";
import { requirePageSession } from "@/lib/auth";
import { listUpdates } from "@/lib/updates";

/** Updates: the notification feed, grouped Today and Earlier. */
export default async function Updates() {
  const session = await requirePageSession("student", { user: true });
  return <UpdatesView initial={await listUpdates(session.userId as string)} />;
}
