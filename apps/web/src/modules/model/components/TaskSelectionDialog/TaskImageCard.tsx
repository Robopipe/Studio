import { cn } from "@/lib/utils";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Task } from "@repo/schema";

export interface TaskImageCardProps {
  task: Task;
  selected: boolean;
  onToggle: (taskId: number) => void;
}

export const TaskImageCard = ({
  task,
  selected,
  onToggle,
}: TaskImageCardProps) => (
  <button
    type="button"
    onClick={() => onToggle(task.id)}
    className={cn(
      "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border transition-colors",
      selected
        ? "border-emerald-500 bg-emerald-500/10"
        : "border-black/10 bg-black/2 hover:border-black/20",
    )}
  >
    <div className="relative aspect-4/3 w-full overflow-hidden">
      <img
        src={task.thumbnailUrl}
        alt={`#${task.iid}`}
        className="size-full object-cover"
      />
      <div className="absolute left-2 top-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(task.id)}
          className={cn(
            "size-5 rounded border-2 shadow-sm",
            selected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-white/80 bg-white/80",
          )}
        />
      </div>
    </div>
    <div className="px-2 py-1.5">
      <span className="truncate text-xs leading-4 text-foreground/90">
        #{task.iid}
      </span>
    </div>
  </button>
);
