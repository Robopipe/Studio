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
import { Annotation } from "../../types/annotations";
import { taskDetailToAnnotations, annotationsToUpdatePayload } from "../../utils/mapAnnotations";
import { AnnotationPanel } from "../AnnotationPanel";
import { Canvas } from "../Canvas";
import { ClassSelect } from "../ClassSelect";
import { AnnotationFilter, DataSourcePanel } from "../DataSourcePanel";
import { Toolbar } from "../Toolbar";
import styles from "./LabelPage.module.scss";

const TASKS_PER_PAGE = 50;

export const LabelPage = () => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const [page, setPage] = useState(1);
  const [annotationFilter, setAnnotationFilter] = useState<AnnotationFilter>("all");
  const { data: tasksData } = useGetTasksQuery(
    { projectId: projectId!, page, limit: TASKS_PER_PAGE, ...(annotationFilter !== "all" && { annotated: annotationFilter }) },
    { skip: !projectId },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData ? Math.ceil(tasksData.total / tasksData.limit) : 0;

  const { data: labels = [] } = useGetProjectLabelsQuery(
    { projectId: projectId! },
    { skip: !projectId },
  );

  const { selectedTaskId, setSelectedTaskId, selectedTask } = useSelectedTask(tasks);

  const { data: taskDetail } = useGetTaskQuery(
    { projectId: projectId!, taskId: selectedTaskId! },
    { skip: !projectId || selectedTaskId === null },
  );

  const [updateTask] = useUpdateTaskMutation();

  const { toolMode, setToolMode } = useToolMode();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
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
      setSelectedAnnotationId(null);
      setIsDirty(false);
      history.reset();
    }
  }, [taskDetail]);

  const handleClear = useCallback(() => {
    if (selectedAnnotationId) {
      history.deleteAnnotation(selectedAnnotationId);
    }
  }, [selectedAnnotationId, history]);

  const handleSelectLabel = useCallback(
    (labelId: number) => {
      const label = labels.find((l) => l.id === labelId);
      if (label) setActiveLabel(label);
    },
    [labels],
  );

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = useCallback(async () => {
    if (!projectId || selectedTaskId === null) return;
    setIsSaving(true);
    try {
      const payload = annotationsToUpdatePayload(annotations);
      await updateTask({
        projectId,
        taskId: selectedTaskId,
        body: payload,
      }).unwrap();
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, selectedTaskId, annotations, updateTask]);

  const activeLabelForCanvas = useMemo(
    () =>
      activeLabel
        ? { id: String(activeLabel.id), name: activeLabel.name, color: activeLabel.color }
        : null,
    [activeLabel],
  );

  return (
    <div className={styles.page}>
      <DataSourcePanel
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        annotationCount={annotations.length}
        onSelectTask={setSelectedTaskId}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        annotationFilter={annotationFilter}
        onAnnotationFilterChange={(val) => {
          setAnnotationFilter(val);
          setPage(1);
        }}
      />
      <AnnotationPanel
        annotations={annotations}
        labels={labels}
        selectedAnnotationId={selectedAnnotationId}
        onSelectAnnotation={setSelectedAnnotationId}
        onDeleteAnnotation={history.deleteAnnotation}
        historyEntries={history.entries}
        historyIndex={history.currentIndex}
        onJumpTo={history.jumpTo}
      />
      <div className={styles.canvasArea}>
        <div className={styles.canvasRow}>
          <Canvas
            task={selectedTask}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            toolMode={toolMode}
            activeLabel={activeLabelForCanvas}
            scale={canvasState.scale}
            position={canvasState.position}
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={handleSave}
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
          />
        </div>
        <ClassSelect
          labels={labels}
          activeLabelId={activeLabel?.id ?? 0}
          onSelectLabel={handleSelectLabel}
        />
      </div>
    </div>
  );
};
