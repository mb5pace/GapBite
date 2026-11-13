import { notFound } from "next/navigation";
import { OrderView } from "@/components/student/OrderView";
import { requirePageSession } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";

/** Order Detail. Only the buyer can open it; anyone else gets the same 404 as for an order that does not exist. */
export default async function OrderPage({ params }: PageProps<"/o/[orderId]">) {
  const session = await requirePageSession("student", { user: true });
  const { orderId } = await params;
  const found = await getOrderForBuyer(orderId, session.userId as string);
  if (!found) notFound();
  return <OrderView initial={found} />;
}
