import { appIcon } from "@/lib/app-icon";

export const dynamic = "force-static";

/** The 192 px home-screen icon (app/manifest.ts). */
export function GET() {
  return appIcon(192, 0.62);
}
