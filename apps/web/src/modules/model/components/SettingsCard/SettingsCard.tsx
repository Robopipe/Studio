import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export type StepState = "pending" | "complete";

export interface SettingsCardProps {
  stepNumber: number;
  state: StepState;
  title: string;
  children?: ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SettingsCard = (props: SettingsCardProps) => {
  const { title, children, state, stepNumber, collapsible, open, onOpenChange } = props;

  const badge = (
    <div className="flex items-center p-0.5">
      {state === "complete" ? (
        <div className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white [&_svg]:size-3">
          <Check />
        </div>
      ) : (
        <span className="flex size-5 items-center justify-center rounded-full border border-black/60 text-xs font-medium text-black/60">
          {stepNumber}
        </span>
      )}
    </div>
  );

  const titleContent = (
    <>
      {badge}
      <span className="w-[136px] whitespace-nowrap text-[10px] font-bold uppercase leading-4 tracking-[1px] text-black/90">
        {title}
      </span>
      {collapsible && (
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      )}
    </>
  );

  return (
    <div className="w-full rounded-2xl bg-black/[0.03] p-4">
      <div className="flex flex-row items-start gap-9">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => onOpenChange?.(!open)}
            className="flex flex-row items-center gap-3 cursor-pointer"
          >
            {titleContent}
          </button>
        ) : (
          <div className="flex flex-row items-center gap-3">
            {titleContent}
          </div>
        )}
        {(!collapsible || open) && children}
      </div>
    </div>
  );
};
