import { CardViewIcon, TableViewIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  useGetTaskIdsQuery,
  useGetTasksQuery,
  useLazyGetTasksQuery,
} from "@/modules/capture/services/captureApi";
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
  const [lastToggledId, setLastToggledId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Re-sync local state when the dialog is (re)opened
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds));
      setLastToggledId(null);
    }
  }, [open, initialSelectedIds]);

  // Anchor becomes stale when the filter set changes (it may no longer be
  // present in the new orderedIds), so reset it.
  useEffect(() => {
    setLastToggledId(null);
  }, [showAll, sortOrder]);

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

  const { data: idsData, isFetching: isIdsLoading } = useGetTaskIdsQuery(
    {
      projectId: activeProject?.id!,
      order: sortOrder,
      ...(!showAll && { annotated: "true" }),
    },
    { skip: !activeProject?.id || !open },
  );

  const [fetchTasksByIds] = useLazyGetTasksQuery();

  const tasks = tasksData?.data ?? [];
  const orderedIds = useMemo(() => idsData?.ids ?? [], [idsData]);
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;

  const toggleTask = useCallback(
    (taskId: number, shiftKey: boolean) => {
      // Shift+click: range-add from the last plain-clicked anchor.
      if (
        shiftKey &&
        lastToggledId != null &&
        lastToggledId !== taskId &&
        orderedIds.length > 0
      ) {
        const idxA = orderedIds.indexOf(lastToggledId);
        const idxB = orderedIds.indexOf(taskId);
        if (idxA !== -1 && idxB !== -1) {
          const [lo, hi] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (let i = lo; i <= hi; i++) next.add(orderedIds[i]);
            return next;
          });
          // Anchor stays — chained shift-clicks extend from the same origin.
          return;
        }
      }

      // Plain click (or shift+click with no usable anchor): toggle this one.
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
      setLastToggledId(taskId);
    },
    [lastToggledId, orderedIds],
  );

  const allSelected = useMemo(
    () =>
      orderedIds.length > 0 && orderedIds.every((id) => selectedIds.has(id)),
    [orderedIds, selectedIds],
  );

  const someSelected = useMemo(
    () => orderedIds.some((id) => selectedIds.has(id)) && !allSelected,
    [orderedIds, selectedIds, allSelected],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        orderedIds.forEach((id) => next.delete(id));
      } else {
        orderedIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allSelected, orderedIds]);

  const handleSave = async () => {
    const selectedArr = Array.from(selectedIds);
    if (selectedArr.length === 0) {
      onSave({ taskIds: [], previews: [] });
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      const known = new Map<number, string>();
      tasks.forEach((t) => {
        if (selectedIds.has(t.id)) known.set(t.id, t.thumbnailUrl);
      });
      const missing = selectedArr.filter((id) => !known.has(id));
      // Backend caps limit at 100, so fetch missing previews in chunks.
      const CHUNK = 100;
      for (let i = 0; i < missing.length; i += CHUNK) {
        const chunk = missing.slice(i, i + CHUNK);
        const result = await fetchTasksByIds({
          projectId: activeProject?.id!,
          limit: chunk.length,
          ids: chunk.join(","),
        }).unwrap();
        result.data.forEach((t) => known.set(t.id, t.thumbnailUrl));
      }
      const previews = selectedArr
        .filter((id) => known.has(id))
        .map((id) => ({ id, thumbnailUrl: known.get(id)! }));
      onSave({ taskIds: selectedArr, previews });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save images"}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-2">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleSelectAll}
                disabled={isIdsLoading && orderedIds.length === 0}
                className="size-5"
              />
              <span className="text-sm text-foreground/90">
                {selectedIds.size} images
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowAll(!showAll)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowAll(!showAll);
                }
              }}
              className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-foreground/70"
            >
              <Checkbox
                checked={!showAll}
                onCheckedChange={() => {}}
                className="pointer-events-none size-4"
              />
              Annotated only
            </div>

            <span className="text-xs text-foreground/50">
              Tip: hold{" "}
              <kbd className="rounded border border-black/15 bg-black/5 px-1 py-0.5 font-mono text-[10px] text-foreground/70">
                Shift
              </kbd>{" "}
              and click to select a range
            </span>
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
                  "cursor-pointer rounded-lg p-2",
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
                  "cursor-pointer rounded-lg p-2",
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
