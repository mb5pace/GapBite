import { LoadingView } from "@/components/ui/LoadingView";

/** The first load after the gate, and any page change that has no loading view of its own. */
export default function Loading() {
  return <LoadingView fullScreen />;
}
