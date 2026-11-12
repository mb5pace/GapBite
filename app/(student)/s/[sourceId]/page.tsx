import { notFound } from "next/navigation";
import { isSourceId } from "@/data/menu";
import { SourceMenu } from "@/components/student/SourceMenu";
import { VendingMachine } from "@/components/student/VendingMachine";

/** A cafe's menu, or the vending machine grid for `vending`. */
export default async function Source({ params }: PageProps<"/s/[sourceId]">) {
  const { sourceId } = await params;
  if (!isSourceId(sourceId)) notFound();
  return sourceId === "vending" ? <VendingMachine /> : <SourceMenu sourceId={sourceId} />;
}
