/**
 * What is running: the package.json version and the short commit, filled in at build time by next.config.ts.
 * Shown as small text in Account, the Cafe header and the Admin header, so the team can tell which build
 * they are looking at. A preview deployment (the dev branch) adds "· dev".
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? "local";
export const APP_IS_PREVIEW = process.env.NEXT_PUBLIC_APP_ENV === "preview";

/** "QuickX v0.8.0 · abc1234", or "QuickX v0.9.0 · abc1234 · dev" on a preview. */
export function versionLabel(): string {
  return `QuickX v${APP_VERSION} · ${APP_COMMIT}${APP_IS_PREVIEW ? " · dev" : ""}`;
}
