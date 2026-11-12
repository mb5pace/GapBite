import { KitGallery } from "@/components/kit/KitGallery";
import { requirePageSession } from "@/lib/auth";

/** Every UI component in one place, for visual review. Admin only. */
export default async function Kit() {
  await requirePageSession("admin");
  return <KitGallery />;
}
