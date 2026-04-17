import { cn } from "@/lib/utils";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Task } from "@repo/schema";
import { Camera } from "lucide-react";

export interface TaskFileRowProps {
  task: Task;
  selected: boolean;
  onToggle: (taskId: number) => void;
}

export const TaskFileRow = ({
  task,
  selected,
  onToggle,
}: TaskFileRowProps) => (
  <button
    type="button"
    onClick={() => onToggle(task.id)}
    className={cn(
      "flex w-full cursor-pointer items-center gap-4 border-b border-black/10 px-4 py-2 text-left transition-colors hover:bg-black/4",
      selected && "bg-emerald-500/15 hover:bg-emerald-500/15",
    )}
  >
    <div onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(task.id)}
        className={cn(
          "size-5 shrink-0",
          selected && "border-emerald-600 bg-emerald-600 text-white",
        )}
      />
    </div>
    <img
      src={task.thumbnailUrl}
      alt={`#${task.iid}`}
      className={cn(
        "h-13 w-15 shrink-0 rounded bg-muted object-cover",
        selected && "border border-emerald-500",
      )}
    />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-xs font-bold leading-4 text-foreground/90">
        #{task.iid}
      </span>
      <div className="flex items-center gap-1 text-xs leading-4 text-foreground/60">
        <Camera className="size-4 shrink-0" />
        <span className="truncate">
          {new Date(task.createdAt).toLocaleString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
    {task.annotationCount != null && task.annotationCount > 0 && (
      <span className="shrink-0 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700">
        {task.annotationCount} annotations
      </span>
    )}
  </button>
);
