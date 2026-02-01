import { useCallback, useEffect, useState } from "react";
import { useSelectedTask } from "../../hooks/useSelectedTask";
import { useToolMode } from "../../hooks/useToolMode";
import { useHistory } from "../../hooks/useHistory";
import { useCanvasState } from "../../hooks/useCanvasState";
import { Annotation } from "../../types/annotations";
import { mockLabels } from "../../mocks/data";
import { AnnotationPanel } from "../AnnotationPanel";
import { Canvas } from "../Canvas";
import { ClassFilter } from "../ClassFilter";
import { DataSourcePanel } from "../DataSourcePanel";
import { Toolbar } from "../Toolbar";
import styles from "./LabelPage.module.scss";

const drawingLabels = mockLabels.filter((l) => l.id !== "any");

const toAnnotation = (mock: any): Annotation => ({
  ...mock,
  color: mockLabels.find((l) => l.id === mock.labelId)?.color ?? "#6366f1",
});

export const LabelPage = () => {
  const { selectedTaskId, setSelectedTaskId, selectedTask } = useSelectedTask();
  const { toolMode, setToolMode } = useToolMode();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState(drawingLabels[0]);
  const canvasState = useCanvasState();

  const history = useHistory({
    setAnnotations,
    setSelectedAnnotationId,
  });

  useEffect(() => {
    if (selectedTask) {
      setAnnotations(selectedTask.annotations.map(toAnnotation));
      setSelectedAnnotationId(null);
    }
  }, [selectedTask?.id]);

  const handleClear = useCallback(() => {
    if (selectedAnnotationId) {
      history.deleteAnnotation(selectedAnnotationId);
    }
  }, [selectedAnnotationId, history]);

  const handleSelectLabel = useCallback((labelId: string) => {
    const label = drawingLabels.find((l) => l.id === labelId);
    if (label) setActiveLabel(label);
  }, []);

  return (
    <div className={styles.page}>
      <DataSourcePanel
        selectedTaskId={selectedTaskId}
        onSelectTask={setSelectedTaskId}
      />
      <AnnotationPanel
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        onSelectAnnotation={setSelectedAnnotationId}
        onDeleteAnnotation={history.deleteAnnotation}
      />
      <div className={styles.canvasArea}>
        <div className={styles.canvasRow}>
          <Canvas
            task={selectedTask}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            toolMode={toolMode}
            activeLabel={activeLabel}
            scale={canvasState.scale}
            position={canvasState.position}
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
        <ClassFilter
          activeLabelId={activeLabel.id}
          onSelectLabel={handleSelectLabel}
        />
      </div>
    </div>
  );
};
