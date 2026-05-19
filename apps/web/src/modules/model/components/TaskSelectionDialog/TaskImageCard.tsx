import { cn } from "@/lib/utils";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Task, TaskStatusEnum } from "@repo/schema";
import { Check } from "lucide-react";

export interface TaskImageCardProps {
  task: Task;
  selected: boolean;
  onToggle: (taskId: number, shiftKey: boolean) => void;
}

export const TaskImageCard = ({
  task,
  selected,
  onToggle,
}: TaskImageCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={(e) => onToggle(task.id, e.shiftKey)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle(task.id, e.shiftKey);
      }
    }}
    className={cn(
      "group relative flex cursor-pointer flex-col gap-2 rounded-sm border p-2 transition-colors select-none focus-visible:outline-2 focus-visible:outline-emerald-500",
      selected
        ? "border-emerald-500 bg-emerald-500/10"
        : "border-black/10 bg-black/2 hover:border-black/20",
    )}
  >
    {/* Top row: checkbox (left) + iid (center) + annotation chip (right) */}
    <div className="relative flex h-5 items-center justify-between gap-2">
      <Checkbox
        checked={selected}
        onCheckedChange={() => {}}
        className={cn(
          "pointer-events-none size-5 rounded",
          selected && "border-emerald-600 bg-emerald-600 text-white",
        )}
      />
      <span className="min-w-0 truncate text-xs font-bold leading-4 text-foreground/90">
        #{task.iid}
      </span>
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
  </div>
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
