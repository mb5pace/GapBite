import { readdirSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

/**
 * Which item photos exist, decided once at build time. public/food/<item-id>.jpg
 * on disk becomes an entry here; lib/photos.ts reads it. Photos are served from
 * the CDN on Vercel and are not on the function's disk, so the list has to be
 * made now, not when a request comes in. Add photos, push, and the build picks
 * them up.
 */
function foodPhotoIds(): string {
  try {
    return readdirSync("public/food")
      .filter((file) => file.endsWith(".jpg"))
      .map((file) => file.slice(0, -".jpg".length))
      .join(",");
  } catch {
    return "";
  }
}

/**
 * The version line ("QuickX v0.8.0 · abc1234", plus "· dev" on a preview) is decided at build time: the version
 * from package.json, the short commit from Vercel (VERCEL_GIT_COMMIT_SHA, first 7 characters, or "local"), and
 * whether this is a preview deployment (VERCEL_ENV). Nothing secret is in any of these.
 */
function buildInfo(): Record<string, string> {
  let version = "0.0.0";
  try {
    version = (JSON.parse(readFileSync("package.json", "utf8")) as { version?: string }).version ?? version;
  } catch {
    // keep the placeholder; the build still works
  }
  return {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    NEXT_PUBLIC_APP_ENV: process.env.VERCEL_ENV ?? "local",
  };
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_FOOD_PHOTOS: foodPhotoIds(), ...buildInfo() },
  // Tailwind v4 is compiled by the Turbopack loader that create-next-app wires up.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
