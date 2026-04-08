import { Label } from "@repo/schema";
import { cn } from "@/lib/utils";

export interface ClassSelectProps {
  labels: Label[];
  activeLabelId: number;
  onSelectLabel: (labelId: number) => void;
}

export const ClassSelect = ({
  labels,
  activeLabelId,
  onSelectLabel,
}: ClassSelectProps) => {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border bg-muted px-4 py-3">
      {labels.map((label) => {
        const isActive = activeLabelId === label.id;
        return (
          <button
            key={label.id}
            onClick={() => onSelectLabel(label.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-2xl border border-border px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: label.color }}
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
};
