import { cn } from "@/lib/utils";
import { HistoryEntry } from "../../types/annotations";

interface HistoryTabProps {
  entries: HistoryEntry[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

const typeLabel: Record<HistoryEntry["type"], string> = {
  add: "Added",
  update: "Updated",
  delete: "Deleted",
};

const badgeClass: Record<HistoryEntry["type"], string> = {
  add: "bg-green-500/15 text-green-700",
  update: "bg-blue-500/15 text-blue-700",
  delete: "bg-red-500/15 text-red-700",
};

export const HistoryTab = ({
  entries,
  currentIndex,
  onJumpTo,
}: HistoryTabProps) => {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <span className="text-sm">No changes yet</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {[...entries].reverse().map((entry, ri) => {
        const index = entries.length - 1 - ri;
        const isFuture = index >= currentIndex;
        const isCurrent = index === currentIndex - 1;

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded border-none bg-transparent px-2 py-1.5 text-left text-[0.8125rem] transition-colors hover:bg-black/[0.06]",
              isFuture && "opacity-40",
              isCurrent && "bg-black/[0.06]"
            )}
            onClick={() => onJumpTo(isFuture ? index + 1 : index)}
          >
            <span
              className={cn(
                "shrink-0 rounded-[0.1875rem] px-1.5 py-px text-[0.6875rem] font-semibold uppercase tracking-wider",
                badgeClass[entry.type]
              )}
            >
              {typeLabel[entry.type]}
            </span>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.annotation.color }}
            />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {entry.annotation.labelName}
            </span>
          </button>
        );
      })}
    </div>
  );
};
