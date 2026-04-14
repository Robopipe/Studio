import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { cn } from "@/lib/utils";
import { Label, Task, TaskStatusEnum } from "@repo/schema";
import { Camera, Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TaskFilterDialog, TaskFilterState } from "../TaskFilterDialog";

export type AnnotationFilter = "all" | "true" | "false";

export interface DataSourcePanelProps {
  tasks: Task[];
  selectedTaskId: number | null;
  annotationCount: number;
  onSelectTask: (taskId: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filter: TaskFilterState;
  labels: Label[];
  onFilterChange: (filter: TaskFilterState) => void;
}

export const DataSourcePanel = ({
  tasks,
  selectedTaskId,
  annotationCount,
  onSelectTask,
  page,
  totalPages,
  onPageChange,
  filter,
  labels,
  onFilterChange,
}: DataSourcePanelProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const hasActiveFilter =
    filter.annotationFilter !== "all" || filter.labelIds.length > 0;

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="flex max-h-full min-h-0 flex-col overflow-hidden border-r border-black/10 bg-black/[0.03]">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4">
        <p className="flex-1 text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
          Data source
        </p>
        <button
          type="button"
          aria-label="Filter tasks"
          title="Filter"
          onClick={() => setFilterDialogOpen(true)}
          className={cn(
            "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors hover:bg-black/[0.06] hover:text-foreground",
            hasActiveFilter && "bg-primary/10 text-primary",
          )}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      <TaskFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filter={filter}
        labels={labels}
        onApply={onFilterChange}
      />

      <div
        ref={listRef}
        className="flex flex-1 flex-col overflow-y-auto"
      >
        {tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;
          const count =
            isSelected ? annotationCount : task.annotationCount ?? 0;
          return (
            <button
              key={task.id}
              type="button"
              className={cn(
                "flex w-full cursor-pointer items-center gap-4 border-b border-black/10 px-4 py-2 text-left transition-colors hover:bg-black/[0.04]",
                isSelected && "bg-emerald-500/15 hover:bg-emerald-500/15",
              )}
              onClick={() => onSelectTask(task.id)}
            >
              <img
                src={task.thumbnailUrl}
                alt={`#${task.iid}`}
                className={cn(
                  "h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover",
                  isSelected && "border border-emerald-500",
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
              <AnnotationChip count={count} status={task.status} />
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-4 border-t border-black/10 px-2 py-4">
        <PaginationNumbers
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

/**
 * Small "annotation chip" badge: a hairline-bordered rectangle with the
 * annotation count inside and two diagonal corner dots — matches figma's
 * crop-mark styling on the data source rows.
 */
const AnnotationChip = ({ count, status }: { count: number; status: string }) => (
  <div className="relative flex h-4 shrink-0 items-center justify-center rounded-[2px] border border-gray-300 bg-black/[0.03] px-1 text-[11px] leading-3 text-foreground/60">
    {count === 0 && status === TaskStatusEnum.DONE ? (
      <Check className="size-3 text-emerald-500" />
    ) : (
      count
    )}
    <span className="absolute -left-[2.5px] -top-[2.5px] size-1 rounded-full bg-gray-300" />
    <span className="absolute -bottom-[2.5px] -right-[2.5px] size-1 rounded-full bg-gray-300" />
  </div>
);
