import { CaretRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** The icon circle, the words and the caret. Shared by the link and button rows below. */
function RowBody({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-section font-bold leading-tight text-maroon">{title}</span>
        {hint ? <span className="mt-0.5 block text-secondary text-mocha">{hint}</span> : null}
      </span>
      <CaretRight weight="regular" size={20} className="shrink-0 text-mocha" aria-hidden="true" />
    </>
  );
}

const ROW =
  "flex min-h-16 w-full items-center gap-3 rounded-card bg-parchment p-3 text-left transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

/** A tappable row that opens a page: used by the Account list and the Discover list. */
export function NavRow({ href, icon, title, hint }: { href: string; icon: ReactNode; title: string; hint?: string }) {
  return (
    <Link href={href} className={ROW}>
      <RowBody icon={icon} title={title} hint={hint} />
    </Link>
  );
}

/** The same row as a button, for something that opens a sheet (Log out). */
export function NavRowButton({
  icon,
  title,
  hint,
  ...rest
}: { icon: ReactNode; title: string; hint?: string } & Omit<ComponentProps<"button">, "children" | "title">) {
  return (
    <button type="button" className={ROW} {...rest}>
      <RowBody icon={icon} title={title} hint={hint} />
    </button>
  );
}
