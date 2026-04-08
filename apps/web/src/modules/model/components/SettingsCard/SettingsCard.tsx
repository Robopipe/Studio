import { Check } from "lucide-react";
import { ReactNode } from "react";

export type StepState = "pending" | "complete";

export interface SettingsCardProps {
  stepNumber: number;
  state: StepState;
  title: string;
  children?: ReactNode;
}

export const SettingsCard = (props: SettingsCardProps) => {
  const { title, children, state, stepNumber } = props;

  return (
    <div className="w-full rounded-xl border border-black/10 bg-black/[0.03] p-6">
      <div className="flex flex-row gap-4">
        <div className="flex flex-row items-center gap-4">
          <div>
            {state === "complete" ? (
              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-600 pl-px text-white [&_svg]:size-3">
                <Check />
              </div>
            ) : (
              <span className="flex size-5 items-center justify-center rounded-full border border-muted-foreground text-xs font-medium">
                {stepNumber}
              </span>
            )}
          </div>
          <span className="min-w-[12.5rem] whitespace-nowrap text-sm font-medium">
            {title.toUpperCase()}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
};
