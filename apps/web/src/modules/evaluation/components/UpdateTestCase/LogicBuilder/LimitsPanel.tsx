import { EvalLimit } from "@repo/schema";
import { GripHorizontalIcon } from "lucide-react";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { DRAG_DATA_KEY } from "./LogicNodeList";

function DraggableLimitCard({ limit }: { limit: EvalLimit }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_DATA_KEY, limit.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground select-none cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-colors"
    >
      <GripHorizontalIcon className="size-3 shrink-0 text-muted-foreground" />
      <span
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: limit.targetLabel.color }}
      />
      <span className="font-medium truncate max-w-[140px]">{limit.name}</span>
    </div>
  );
}

export function LimitsPanel() {
  const { availableLimits } = useLogicBuilderContext();

  if (availableLimits.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
        No limits defined for this test case yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableLimits.map((limit) => (
        <DraggableLimitCard key={limit.id} limit={limit} />
      ))}
    </div>
  );
}
