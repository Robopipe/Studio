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
      {labels.map((label, index) => {
        const isActive = activeLabelId === label.id;
        const shortcut =
          index < 9 ? String(index + 1) : index === 9 ? "0" : null;
        return (
          <button
            key={label.id}
            onClick={() => onSelectLabel(label.id)}
            title={shortcut ? `${label.name} (${shortcut})` : label.name}
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
            {shortcut && (
              <kbd
                className={cn(
                  "ml-1 flex h-4 min-w-4 items-center justify-center rounded border px-1 text-[10px] font-semibold leading-none",
                  isActive
                    ? "border-primary-foreground/40 text-primary-foreground/80"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
};
