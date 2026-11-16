import { redirect } from "next/navigation";

/** The old Menu availability page. Its switches now live on Hours and items; this keeps old bookmarks working. */
export default function Page() {
  redirect("/cafe/hours");
}
