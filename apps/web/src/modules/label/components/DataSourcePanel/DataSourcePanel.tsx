import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/modules/shadcn/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { cn } from "@/lib/utils";
import { Task } from "@repo/schema";
import { useEffect, useRef } from "react";

export type AnnotationFilter = "all" | "true" | "false";

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Annotated", value: "true" },
  { label: "Not annotated", value: "false" },
] as const;

export interface DataSourcePanelProps {
  tasks: Task[];
  selectedTaskId: number | null;
  annotationCount: number;
  onSelectTask: (taskId: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  annotationFilter: AnnotationFilter;
  onAnnotationFilterChange: (value: AnnotationFilter) => void;
}

export const DataSourcePanel = ({
  tasks,
  selectedTaskId,
  annotationCount,
  onSelectTask,
  page,
  totalPages,
  onPageChange,
  annotationFilter,
  onAnnotationFilterChange,
}: DataSourcePanelProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="flex max-h-full min-h-0 flex-col overflow-hidden border-r border-black/10 bg-black/[0.03] py-4 pl-4">
      <p className="mb-3 pr-4 text-[10px] font-bold uppercase tracking-wider">
        Data Source
      </p>

      <div className="mb-2 pr-4">
        <Select
          value={annotationFilter}
          onValueChange={(val) =>
            onAnnotationFilterChange(val as AnnotationFilter)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter">
              {(value: string) =>
                FILTER_OPTIONS.find((o) => o.value === value)?.label ?? "Filter"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-1 overflow-y-auto pr-2"
      >
        {tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;
          return (
            <button
              key={task.id}
              type="button"
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border-2 border-transparent bg-transparent p-1 text-left hover:bg-black/[0.04]",
                isSelected && "border-primary bg-primary/[0.06]"
              )}
              onClick={() => onSelectTask(task.id)}
            >
              <img
                src={task.thumbnailUrl}
                alt={task.filePath.split("/").pop() ?? "task"}
                className="aspect-[4/3] w-[5.5rem] rounded bg-muted-foreground object-cover"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-bold">#{task.iid}</span>
                <span className="text-[0.6875rem] text-muted-foreground">
                  {new Date(task.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-[0.6875rem] font-semibold text-muted-foreground">
                  {isSelected ? annotationCount : task.annotationCount ?? 0}{" "}
                  annotations
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-shrink-0 border-t border-black/10 pr-4 pt-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
                className={
                  page <= 1 ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) onPageChange(page + 1);
                }}
                className={
                  page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
