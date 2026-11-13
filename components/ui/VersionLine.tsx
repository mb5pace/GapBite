import { versionLabel } from "@/lib/version";

/** Small `mocha` text: which version and commit this is. Server component, nothing to load. */
export function VersionLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-caption text-mocha ${className}`} data-version="">
      {versionLabel()}
    </p>
  );
}
