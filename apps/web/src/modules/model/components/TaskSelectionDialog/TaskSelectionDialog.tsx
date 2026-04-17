import { CardViewIcon, TableViewIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/modules/shadcn/ui/dialog";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { ArrowDownUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskFileRow } from "./TaskFileRow";
import { TaskImageCard } from "./TaskImageCard";

export interface TaskSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelectedIds: number[];
  onSave: (selection: {
    taskIds: number[];
    previews: { id: number; thumbnailUrl: string }[];
  }) => void;
}

const TASKS_PER_PAGE = 50;

export const TaskSelectionDialog = ({
  open,
  onOpenChange,
  initialSelectedIds,
  onSave,
}: TaskSelectionDialogProps) => {
  const [activeProject] = useActiveProject();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(initialSelectedIds),
  );
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);

  // Re-sync local state when the dialog is (re)opened
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [open, initialSelectedIds]);

  const { data: tasksData, isLoading } = useGetTasksQuery(
    {
      projectId: activeProject?.id!,
      page,
      limit: TASKS_PER_PAGE,
      order: sortOrder,
      ...(!showAll && { annotated: "true" }),
    },
    { skip: !activeProject?.id || !open },
  );

  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;

  const toggleTask = useCallback((taskId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const allPageSelected = useMemo(
    () => tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id)),
    [tasks, selectedIds],
  );

  const somePageSelected = useMemo(
    () => tasks.some((t) => selectedIds.has(t.id)),
    [tasks, selectedIds],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        tasks.forEach((t) => next.delete(t.id));
      } else {
        tasks.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }, [allPageSelected, tasks]);

  const handleSave = () => {
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    const previews = selectedTasks.map((t) => ({
      id: t.id,
      thumbnailUrl: t.thumbnailUrl,
    }));
    onSave({ taskIds: Array.from(selectedIds), previews });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] max-w-[min(1200px,calc(100vw-4rem))]! flex-col gap-0 p-0"
      >
        <DialogTitle className="sr-only">Select training images</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full border border-black/60 p-0.5">
              <span className="text-xs font-medium text-black/60">1</span>
            </span>
            <span className="text-base font-medium text-foreground/90">
              Create a version by selecting images you want to train
            </span>
          </div>
          <Button onClick={handleSave}>Save images</Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-2">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allPageSelected}
                indeterminate={somePageSelected && !allPageSelected}
                onCheckedChange={toggleSelectAll}
                className="size-5"
              />
              <span className="text-sm text-foreground/90">
                {selectedIds.size} images
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                showAll
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-black/5 text-foreground/60 hover:bg-black/10",
              )}
            >
              {showAll ? "Showing all" : "Annotated only"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              className="flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-foreground/60 hover:bg-black/5"
            >
              <ArrowDownUp className="size-4" />
              {sortOrder === "desc" ? "Newest on top" : "Oldest on top"}
            </button>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-lg p-2",
                  viewMode === "table"
                    ? "bg-emerald-500/15"
                    : "hover:bg-black/5",
                )}
              >
                <TableViewIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={cn(
                  "rounded-lg p-2",
                  viewMode === "card"
                    ? "bg-emerald-500/15"
                    : "hover:bg-black/5",
                )}
              >
                <CardViewIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm text-foreground/60">
              Loading images...
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-foreground/60">
              No images found
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-6">
              {tasks.map((task) => (
                <TaskImageCard
                  key={task.id}
                  task={task}
                  selected={selectedIds.has(task.id)}
                  onToggle={toggleTask}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {tasks.map((task) => (
                <TaskFileRow
                  key={task.id}
                  task={task}
                  selected={selectedIds.has(task.id)}
                  onToggle={toggleTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center border-t border-black/10 py-3">
            <PaginationNumbers
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
