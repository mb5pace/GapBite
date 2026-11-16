import { appIcon } from "@/lib/app-icon";

export const dynamic = "force-static";

/** The 512 px home-screen icon (app/manifest.ts). */
export function GET() {
  return appIcon(512, 0.62);
}
