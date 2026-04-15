import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { TaskListItem } from "@/modules/ui";
import { cn } from "@/lib/utils";
import { Label, Task, TaskStatusEnum } from "@repo/schema";
import { Check, SlidersHorizontal } from "lucide-react";
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
            <TaskListItem
              key={task.id}
              task={task}
              imageSrc={task.thumbnailUrl}
              selected={isSelected}
              onClick={() => onSelectTask(task.id)}
              rightSlot={<AnnotationChip count={count} status={task.status} />}
            />
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
