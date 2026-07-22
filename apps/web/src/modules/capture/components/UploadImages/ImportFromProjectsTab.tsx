import {
  useGetImportedSourceTaskIdsQuery,
  useGetTaskIdsQuery,
  useGetTasksQuery,
} from "@/modules/capture/services/captureApi";
import { TaskImageCard } from "@/modules/model/components/TaskSelectionDialog/TaskImageCard";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectsQuery } from "@/modules/project/services/projectApi";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";

export interface ImportFromProjectsTabProps {
  /** sourceProjectId -> selected source task ids; accumulates across projects. */
  selection: Map<number, Set<number>>;
  onSelectionChange: (next: Map<number, Set<number>>) => void;
}

const TASKS_PER_PAGE = 50;

/**
 * "From projects" tab of the upload dialog: pick another project in the org
 * and multi-select its images for server-side import into the active project.
 * Selection lives in the parent so it survives tab switches and spans
 * multiple source projects; images already imported render disabled.
 */
export const ImportFromProjectsTab = ({
  selection,
  onSelectionChange,
}: ImportFromProjectsTabProps) => {
  const [activeProject] = useActiveProject();
  const { data: projects } = useGetProjectsQuery();

  const [sourceProjectId, setSourceProjectId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [lastToggledId, setLastToggledId] = useState<number | null>(null);

  const sourceProjects = useMemo(
    () => (projects ?? []).filter((p) => p.id !== activeProject?.id),
    [projects, activeProject?.id],
  );

  const handleProjectChange = (value: string | null) => {
    if (!value) return;
    setSourceProjectId(Number(value));
    setPage(1);
    setLastToggledId(null);
  };

  const { data: tasksData, isLoading } = useGetTasksQuery(
    { projectId: sourceProjectId!, page, limit: TASKS_PER_PAGE, sortOrder },
    { skip: !sourceProjectId },
  );
  const { data: idsData, isFetching: isIdsLoading } = useGetTaskIdsQuery(
    { projectId: sourceProjectId!, sortOrder },
    { skip: !sourceProjectId },
  );
  const { data: importedData } = useGetImportedSourceTaskIdsQuery(
    { projectId: activeProject?.id!, sourceProjectId: sourceProjectId! },
    { skip: !activeProject?.id || !sourceProjectId },
  );

  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;
  const orderedIds = useMemo(() => idsData?.ids ?? [], [idsData]);
  const importedSet = useMemo(
    () => new Set(importedData?.taskIds ?? []),
    [importedData],
  );
  const selectableIds = useMemo(
    () => orderedIds.filter((id) => !importedSet.has(id)),
    [orderedIds, importedSet],
  );

  const selectedIds = sourceProjectId
    ? selection.get(sourceProjectId)
    : undefined;

  const updateSelected = (mutate: (next: Set<number>) => void) => {
    if (!sourceProjectId) return;
    const next = new Set(selection.get(sourceProjectId) ?? []);
    mutate(next);
    const nextMap = new Map(selection);
    if (next.size === 0) nextMap.delete(sourceProjectId);
    else nextMap.set(sourceProjectId, next);
    onSelectionChange(nextMap);
  };

  const toggleTask = (taskId: number, shiftKey: boolean) => {
    if (importedSet.has(taskId)) return;

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
        updateSelected((next) => {
          for (let i = lo; i <= hi; i++) {
            if (!importedSet.has(orderedIds[i])) next.add(orderedIds[i]);
          }
        });
        // Anchor stays — chained shift-clicks extend from the same origin.
        return;
      }
    }

    updateSelected((next) => {
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
    });
    setLastToggledId(taskId);
  };

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds?.has(id));
  const someSelected =
    !allSelected && selectableIds.some((id) => selectedIds?.has(id));

  const toggleSelectAll = () => {
    updateSelected((next) => {
      if (allSelected) selectableIds.forEach((id) => next.delete(id));
      else selectableIds.forEach((id) => next.add(id));
    });
  };

  const selectedProject = sourceProjects.find((p) => p.id === sourceProjectId);

  const handleSortToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    // Anchor may not survive the reorder, so reset it.
    setLastToggledId(null);
  };

  if (sourceProjects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-foreground/60">
        There are no other projects in your organization to import from.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Select
        value={sourceProjectId ? String(sourceProjectId) : null}
        onValueChange={handleProjectChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a project to import from">
            {selectedProject
              ? `${selectedProject.name} (${selectedProject.taskCount} images)`
              : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sourceProjects.map((project) => {
            const count = selection.get(project.id)?.size ?? 0;
            return (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name} ({project.taskCount} images)
                {count > 0 ? ` — ${count} selected` : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {!sourceProjectId ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-foreground/60">
          Select a project to browse its images
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
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
                  {selectedIds?.size ?? 0} images
                </span>
              </div>
              <span className="text-xs text-foreground/50">
                Tip: hold{" "}
                <kbd className="rounded border border-black/15 bg-black/5 px-1 py-0.5 font-mono text-[10px] text-foreground/70">
                  Shift
                </kbd>{" "}
                and click to select a range
              </span>
            </div>
            <button
              type="button"
              onClick={handleSortToggle}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-foreground/60 hover:bg-black/5"
            >
              <ArrowDownUp className="size-4" />
              {sortOrder === "desc" ? "Newest on top" : "Oldest on top"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-foreground/60">
                Loading images...
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-foreground/60">
                No images found
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-1">
                {tasks.map((task) => (
                  <TaskImageCard
                    key={task.id}
                    task={task}
                    selected={selectedIds?.has(task.id) ?? false}
                    onToggle={toggleTask}
                    disabled={importedSet.has(task.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center border-t border-black/10 pt-2">
              <PaginationNumbers
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
