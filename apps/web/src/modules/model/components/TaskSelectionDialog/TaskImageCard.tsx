import { cn } from "@/lib/utils";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Task, TaskStatusEnum } from "@repo/schema";
import { Check } from "lucide-react";

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
      "group relative flex cursor-pointer flex-col gap-2 rounded-sm border p-2 transition-colors",
      selected
        ? "border-emerald-500 bg-emerald-500/10"
        : "border-black/10 bg-black/2 hover:border-black/20",
    )}
  >
    {/* Top row: checkbox (left) + annotation chip (right) */}
    <div className="relative flex h-5 items-center justify-between">
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(task.id)}
          className={cn(
            "size-5 rounded",
            selected && "border-emerald-600 bg-emerald-600 text-white",
          )}
        />
      </div>
      <AnnotationChip
        count={task.annotationCount ?? 0}
        status={task.status}
      />
    </div>

    {/* Image */}
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xs">
      <img
        src={task.thumbnailUrl}
        alt={`#${task.iid}`}
        className="size-full object-cover"
      />
    </div>
  </button>
);

/**
 * Small "annotation chip" badge: a hairline-bordered rectangle with the
 * annotation count inside and two diagonal corner dots — matches the
 * crop-mark styling used on the annotate page (DataSourcePanel).
 */
const AnnotationChip = ({ count, status }: { count: number; status: string }) => (
  <div className="relative flex h-4 shrink-0 items-center justify-center rounded-xs border border-gray-300 bg-black/3 px-1 text-[11px] leading-3 text-foreground/60">
    {count === 0 && status === TaskStatusEnum.DONE ? (
      <Check className="size-3 text-emerald-500" />
    ) : (
      count
    )}
    <span className="absolute -left-[2.5px] -top-[2.5px] size-1 rounded-full bg-gray-300" />
    <span className="absolute -bottom-[2.5px] -right-[2.5px] size-1 rounded-full bg-gray-300" />
  </div>
);
