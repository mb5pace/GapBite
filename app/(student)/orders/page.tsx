import { OrdersView } from "@/components/student/OrdersView";
import { requirePageSession } from "@/lib/auth";
import { listOrdersAndRuns } from "@/lib/runs";

/** Orders: Active and Past. */
export default async function Orders() {
  const session = await requirePageSession("student", { user: true });
  return <OrdersView initial={await listOrdersAndRuns(session.userId as string)} />;
}
