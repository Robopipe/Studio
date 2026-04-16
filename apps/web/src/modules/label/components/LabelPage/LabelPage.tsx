import { useCallback, useEffect, useMemo, useState } from "react";
import { Label } from "@repo/schema";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { useGetTaskQuery, useUpdateTaskMutation } from "../../services/labelApi";
import { useSelectedTask } from "../../hooks/useSelectedTask";
import { useToolMode } from "../../hooks/useToolMode";
import { useHistory } from "../../hooks/useHistory";
import { useCanvasState } from "../../hooks/useCanvasState";
import { useLabelShortcuts } from "../../hooks/useLabelShortcuts";
import { Annotation } from "../../types/annotations";
import { taskDetailToAnnotations, annotationsToUpdatePayload } from "../../utils/mapAnnotations";
import { EditProjectModal } from "@/modules/project/components/EditProjectModal";
import { AnnotationPanel } from "../AnnotationPanel";
import { Canvas } from "../Canvas";
import { ClassSelect } from "../ClassSelect";
import { DataSourcePanel } from "../DataSourcePanel";
import { TaskFilterState } from "../TaskFilterDialog";
import { Toolbar } from "../Toolbar";

const TASKS_PER_PAGE = 50;

export const LabelPage = () => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TaskFilterState>({ annotationFilter: "all", labelIds: [] });
  const { data: tasksData } = useGetTasksQuery(
    {
      projectId: projectId!,
      page,
      limit: TASKS_PER_PAGE,
      ...(filter.annotationFilter !== "all" && { annotated: filter.annotationFilter }),
      ...(filter.labelIds.length > 0 && { labelIds: filter.labelIds.join(",") }),
    },
    { skip: !projectId },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData ? Math.ceil(tasksData.total / tasksData.limit) : 0;

  const { data: labels = [], isLoading: isLoadingLabels } = useGetProjectLabelsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const { selectedTaskId, setSelectedTaskId, selectedTask } = useSelectedTask(tasks);
  const [pendingPageSelection, setPendingPageSelection] = useState<
    "first" | "last" | null
  >(null);

  useEffect(() => {
    if (!pendingPageSelection || tasks.length === 0) return;
    setSelectedTaskId(
      pendingPageSelection === "first"
        ? tasks[0].id
        : tasks[tasks.length - 1].id,
    );
    setPendingPageSelection(null);
  }, [tasks, pendingPageSelection, setSelectedTaskId]);

  const { data: taskDetail } = useGetTaskQuery(
    { projectId: projectId!, taskId: selectedTaskId! },
    { skip: !projectId || selectedTaskId === null },
  );

  const [updateTask] = useUpdateTaskMutation();

  const { toolMode, setToolMode } = useToolMode();
  const [showCrosshair, setShowCrosshair] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("label.crosshair") === "1";
  });
  const toggleCrosshair = useCallback(() => {
    setShowCrosshair((prev) => {
      const next = !prev;
      window.localStorage.setItem("label.crosshair", next ? "1" : "0");
      return next;
    });
  }, []);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hiddenAnnotationIds, setHiddenAnnotationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleAnnotationVisibility = useCallback((id: string) => {
    setHiddenAnnotationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const canvasState = useCanvasState();

  const setAnnotationsAndDirty: typeof setAnnotations = useCallback((value) => {
    setAnnotations(value);
    setIsDirty(true);
  }, []);

  const history = useHistory({
    annotations,
    setAnnotations: setAnnotationsAndDirty,
    setSelectedAnnotationId,
  });

  // Set default active label when labels load
  useEffect(() => {
    if (labels.length > 0 && !activeLabel) {
      setActiveLabel(labels[0]);
    }
  }, [labels, activeLabel]);

  // Sync annotations from task detail
  useEffect(() => {
    if (taskDetail) {
      setAnnotations(taskDetailToAnnotations(taskDetail));
      setIsDirty(false);
      setHiddenAnnotationIds(new Set());
      history.reset();
      setSelectedAnnotationId(null);
    }
  }, [taskDetail]);

  const handleReorderAnnotations = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setAnnotationsAndDirty((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setAnnotationsAndDirty],
  );

  const handleClear = useCallback(() => {
    if (selectedAnnotationId) {
      history.deleteAnnotation(selectedAnnotationId);
    }
  }, [selectedAnnotationId, history]);

  const handleSelectLabel = useCallback(
    (labelId: number) => {
      const label = labels.find((l) => l.id === labelId);
      if (label) {
        setActiveLabel(label);
      }
    },
    [labels],
  );

  const canMarkEmpty = true;

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = useCallback(async (options?: { reviewed?: boolean }) => {
    if (!projectId || selectedTaskId === null) return;
    setIsSaving(true);
    try {
      const payload = annotationsToUpdatePayload(annotations);
      await updateTask({
        projectId,
        taskId: selectedTaskId,
        body: { ...payload, ...(options?.reviewed && { reviewed: true }) },
      }).unwrap();
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, selectedTaskId, annotations, updateTask]);

  const handleSaveEmpty = useCallback(() => {
    handleSave({ reviewed: true });
  }, [handleSave]);

  useLabelShortcuts({
    tasks,
    selectedTaskId,
    page,
    totalPages,
    labels,
    activeLabel,
    isDirty,
    isSaving,
    canMarkEmpty,
    annotationCount: annotations.length,
    onSave: handleSave,
    onSaveEmpty: handleSaveEmpty,
    onSetToolMode: setToolMode,
    onToggleCrosshair: toggleCrosshair,
    onSelectTask: setSelectedTaskId,
    onChangePage: (nextPage, anchor) => {
      setPendingPageSelection(anchor);
      setPage(nextPage);
    },
    onSelectLabel: handleSelectLabel,
  });

  const visibleAnnotations = useMemo(
    () => annotations.filter((a) => !hiddenAnnotationIds.has(a.id)),
    [annotations, hiddenAnnotationIds],
  );

  const activeLabelForCanvas = useMemo(
    () =>
      activeLabel
        ? { id: String(activeLabel.id), name: activeLabel.name, color: activeLabel.color }
        : null,
    [activeLabel],
  );

  return (
    <div className="-m-6 grid min-h-0 flex-1 grid-cols-[320px_280px_1fr] grid-rows-[minmax(0,1fr)] bg-white">
      <DataSourcePanel
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        annotationCount={annotations.length}
        onSelectTask={setSelectedTaskId}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filter={filter}
        labels={labels}
        onFilterChange={(val) => {
          setFilter(val);
          setPage(1);
        }}
      />
      <AnnotationPanel
        annotations={annotations}
        labels={labels}
        selectedAnnotationId={selectedAnnotationId}
        onSelectAnnotation={setSelectedAnnotationId}
        onDeleteAnnotation={history.deleteAnnotation}
        onReorderAnnotations={handleReorderAnnotations}
        hiddenAnnotationIds={hiddenAnnotationIds}
        onToggleAnnotationVisibility={toggleAnnotationVisibility}
        historyEntries={history.entries}
        historyIndex={history.currentIndex}
        onJumpTo={history.jumpTo}
        onOpenSettings={() => setSettingsOpen(true)}
        isLoadingLabels={isLoadingLabels}
      />
      <div className="relative flex min-h-0 flex-col overflow-hidden">
        <Canvas
          task={selectedTask}
          annotations={visibleAnnotations}
          selectedAnnotationId={selectedAnnotationId}
          toolMode={toolMode}
          activeLabel={activeLabelForCanvas}
          scale={canvasState.scale}
          position={canvasState.position}
          isDirty={isDirty}
          isSaving={isSaving}
          canMarkEmpty={canMarkEmpty}
          onSave={handleSave}
          onSaveEmpty={handleSaveEmpty}
          showCrosshair={showCrosshair}
          onSelect={setSelectedAnnotationId}
          onAddAnnotation={history.addAnnotation}
          onUpdateAnnotation={history.updateAnnotation}
          onDeleteAnnotation={history.deleteAnnotation}
          onUndo={history.undo}
          onRedo={history.redo}
          onZoomAtPoint={canvasState.zoomAtPoint}
          onSetPosition={canvasState.setPosition}
          onFitImage={canvasState.fitImage}
        />
        <div className="pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2">
          <div className="pointer-events-auto">
            <Toolbar
              toolMode={toolMode}
              onSetToolMode={setToolMode}
              onUndo={history.undo}
              onRedo={history.redo}
              onZoomIn={canvasState.zoomIn}
              onZoomOut={canvasState.zoomOut}
              onClear={handleClear}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              hasSelection={selectedAnnotationId !== null}
              hasLabels={labels.length > 0 || isLoadingLabels}
              showCrosshair={showCrosshair}
              onToggleCrosshair={toggleCrosshair}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-6 bottom-6 z-10 flex justify-center">
          <div className="pointer-events-auto min-w-0 max-w-full">
            <ClassSelect
              labels={labels}
              activeLabelId={activeLabel?.id ?? 0}
              onSelectLabel={handleSelectLabel}
              onOpenSettings={() => setSettingsOpen(true)}
              isLoadingLabels={isLoadingLabels}
            />
          </div>
        </div>
      </div>
      {settingsOpen && activeProject && (
        <EditProjectModal
          project={activeProject}
          initialTabId="labeling"
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};
