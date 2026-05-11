import { cn } from "@/lib/utils";
import { HistoryEntry } from "../../types/annotations";

interface HistoryTabProps {
  entries: HistoryEntry[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

const labelFor = (entry: HistoryEntry): string => {
  switch (entry.type) {
    case "add":
      return "Added";
    case "update":
      return "Updated";
    case "delete":
      return "Deleted";
    case "batch":
      if (entry.label === "delete") return `Deleted ${entry.children.length}`;
      if (entry.label === "paste") return `Pasted ${entry.children.length}`;
      return `Moved ${entry.children.length}`;
  }
};

const badgeClassFor = (entry: HistoryEntry): string => {
  switch (entry.type) {
    case "add":
      return "bg-green-500/15 text-green-700";
    case "update":
      return "bg-blue-500/15 text-blue-700";
    case "delete":
      return "bg-red-500/15 text-red-700";
    case "batch":
      if (entry.label === "delete") return "bg-red-500/15 text-red-700";
      if (entry.label === "paste") return "bg-emerald-500/15 text-emerald-700";
      return "bg-blue-500/15 text-blue-700";
  }
};

const summaryFor = (entry: HistoryEntry): { color: string; name: string } | null => {
  if (entry.type === "batch") {
    const first = entry.children[0];
    if (!first) return null;
    return { color: first.annotation.color, name: first.annotation.labelName };
  }
  return { color: entry.annotation.color, name: entry.annotation.labelName };
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
        const summary = summaryFor(entry);

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
                badgeClassFor(entry)
              )}
            >
              {labelFor(entry)}
            </span>
            {summary && (
              <>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: summary.color }}
                />
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {summary.name}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};
