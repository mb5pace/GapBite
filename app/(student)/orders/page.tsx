import { OrdersView } from "@/components/student/OrdersView";
import { requirePageSession } from "@/lib/auth";
import { listOrdersFor } from "@/lib/orders";

/** Orders: Active and Past. */
export default async function Orders() {
  const session = await requirePageSession("student", { user: true });
  return <OrdersView initial={await listOrdersFor(session.userId as string)} />;
}
