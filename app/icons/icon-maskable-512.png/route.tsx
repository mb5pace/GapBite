import { appIcon } from "@/lib/app-icon";

export const dynamic = "force-static";

/** The 512 px home-screen icon, maskable: the mark stays inside the safe zone (app/manifest.ts). */
export function GET() {
  return appIcon(512, 0.46);
}
