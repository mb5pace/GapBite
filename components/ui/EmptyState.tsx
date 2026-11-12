import type { ReactNode } from "react";

/**
 * One icon, one sentence, one action (UI_UX_BIBLE.md section 4). Until the Open
 * Peeps illustrations are added, the icon sits in a sand circle: pass a Phosphor
 * icon in Regular weight, for example <Users weight="regular" size={40} />.
 */
export function EmptyState({
  icon,
  children,
  action,
}: {
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
      <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        {icon}
      </span>
      <p className="max-w-sm text-body text-espresso">{children}</p>
      {action}
    </div>
  );
}
