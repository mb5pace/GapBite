import type { ReactNode } from "react";

export interface StepperStep {
  label: string;
  /** done: filled maroon. current: filled maroon with a sun ring. upcoming: sand. stopped: brick, where the order ended early. */
  state: "done" | "current" | "upcoming" | "stopped";
  /** Shown on the right, for example "11:42". */
  time?: string;
  /** A Phosphor icon, 20 px. */
  icon: ReactNode;
}

const NODE: Record<StepperStep["state"], string> = {
  done: "bg-maroon text-cream",
  current: "bg-maroon text-cream ring-4 ring-sun",
  upcoming: "bg-sand text-mocha",
  stopped: "bg-brick text-cream",
};

/**
 * The vertical order tracker: a thick rail with round icon nodes and the time
 * on the right. The rail is maroon up to the step that is done and sand after
 * it. Nodes fill in 200 ms when the status changes.
 */
export function Stepper({ steps }: { steps: StepperStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.state === "current" ? "step" : undefined}
          className="relative flex min-h-10 items-center gap-4 pb-8 last:pb-0"
        >
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={`absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-1.5 transition-colors duration-200 ${
                step.state === "done" ? "bg-maroon" : "bg-sand"
              }`}
            />
          ) : null}
          <span
            className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-pill transition-colors duration-200 ${NODE[step.state]}`}
            aria-hidden="true"
          >
            {step.icon}
          </span>
          <span
            className={`flex-1 text-body ${
              step.state === "current" || step.state === "stopped" ? "font-bold text-espresso" : step.state === "done" ? "font-medium text-espresso" : "text-mocha"
            }`}
          >
            {step.label}
            <span className="sr-only">
              {step.state === "done" ? ", done" : step.state === "current" ? ", current step" : step.state === "stopped" ? ", ended here" : ", not yet"}
            </span>
          </span>
          {step.time ? <span className="text-secondary tabular-nums text-mocha">{step.time}</span> : null}
        </li>
      ))}
    </ol>
  );
}
