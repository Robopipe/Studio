import { useEffect, useRef, useState } from "react";
import { DropdownMenuIcon, Text } from "@repo/ui";
import { Task } from "@repo/schema";
import { Annotation, ToolMode } from "../../types/annotations";
import { useImageLoader } from "../../hooks/useImageLoader";
import { KonvaStage } from "./KonvaStage";
import styles from "./Canvas.module.scss";

export interface CanvasProps {
  task: Task | undefined;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  toolMode: ToolMode;
  activeLabel: { id: string; name: string; color: string } | null;
  scale: number;
  position: { x: number; y: number };
  onSelect: (id: string | null) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomAtPoint: (pointer: { x: number; y: number }, direction: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
  onFitImage: (iw: number, ih: number, cw: number, ch: number) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export const Canvas = ({
  task,
  annotations,
  selectedAnnotationId,
  toolMode,
  activeLabel,
  scale,
  position,
  onSelect,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onUndo,
  onRedo,
  onZoomAtPoint,
  onSetPosition,
  onFitImage,
  isDirty,
  isSaving,
  onSave,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const { image, loading, error } = useImageLoader(task?.filePath);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [task]);

  useEffect(() => {
    if (image && containerSize.width > 0 && containerSize.height > 0) {
      onFitImage(image.width, image.height, containerSize.width, containerSize.height);
    }
  }, [image, containerSize.width, containerSize.height]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAnnotationId) {
          e.preventDefault();
          onDeleteAnnotation(selectedAnnotationId);
        }
      }
      if (e.key === "Escape") {
        onSelect(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAnnotationId, onDeleteAnnotation, onSelect, onUndo, onRedo]);

  if (!task) {
    return (
      <div className={styles.canvas}>
        <div className={styles.empty}>
          <Text variant="text-16">Select an image to view</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvas}>
      <div className={styles.header}>
        <Text variant="text-14" weight="500">
          {task.filePath.split("/").pop() ?? "Task"}
        </Text>
        {isDirty && (
          <button
            className={styles.saveButton}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        )}
        <button className={styles.menuButton}>
          <DropdownMenuIcon />
        </button>
      </div>

      <div className={styles.stageContainer} ref={containerRef}>
        {loading && (
          <div className={styles.empty}>
            <Text variant="text-14">Loading image...</Text>
          </div>
        )}
        {error && (
          <div className={styles.empty}>
            <Text variant="text-14">{error}</Text>
          </div>
        )}
        {image && containerSize.width > 0 && (
          <div className={styles.stageWrapper}>
            <KonvaStage
              width={containerSize.width}
              height={containerSize.height}
              image={image}
              scale={scale}
              position={position}
              toolMode={toolMode}
              annotations={annotations}
              selectedAnnotationId={selectedAnnotationId}
              activeLabel={activeLabel}
              onSelect={onSelect}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onZoomAtPoint={onZoomAtPoint}
              onSetPosition={onSetPosition}
            />
          </div>
        )}
      </div>
    </div>
  );
};
