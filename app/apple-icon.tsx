import { appIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The icon an iPhone uses when QuickX is added to the home screen (Next adds the apple-touch-icon link for it). */
export default function AppleIcon() {
  return appIcon(180);
}
