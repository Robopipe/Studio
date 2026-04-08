import { Task } from "@repo/schema";
import { useEffect, useRef, useState } from "react";
import { useImageLoader } from "../../hooks/useImageLoader";
import { Annotation, ToolMode } from "../../types/annotations";
import { KonvaStage, KonvaStageHandle } from "./KonvaStage";

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
  onZoomAtPoint: (pointer: { x: number; y: number }, factor: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
  onFitImage: (iw: number, ih: number, cw: number, ch: number) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  showCrosshair: boolean;
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
  showCrosshair,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageHandle = useRef<KonvaStageHandle>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const { image, loading, error } = useImageLoader(task?.filePath);
  const fittedImageRef = useRef<HTMLImageElement | null>(null);

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
    if (
      image &&
      containerSize.width > 0 &&
      containerSize.height > 0 &&
      fittedImageRef.current !== image
    ) {
      fittedImageRef.current = image;
      onFitImage(
        image.width,
        image.height,
        containerSize.width,
        containerSize.height,
      );
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
        stageHandle.current?.cancelDrawing();
        onSelect(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "Z" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAnnotationId, onDeleteAnnotation, onSelect, onUndo, onRedo]);

  if (!task) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black/[0.03]">
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <span className="text-base">Select an image to view</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black/[0.03]">
      <div className="flex items-center gap-2 border-b border-black/10 px-4 py-2">
        <span className="text-sm font-medium">
          {task.filePath.split("/").pop() ?? "Task"}
        </span>
        <button
          type="button"
          title="Save (S)"
          className="ml-auto cursor-pointer rounded border-none bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden [&_canvas]:absolute [&_canvas]:left-0 [&_canvas]:top-0"
        ref={containerRef}
      >
        {loading && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <span className="text-sm">Loading image...</span>
          </div>
        )}
        {error && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <span className="text-sm">{error}</span>
          </div>
        )}
        {image && containerSize.width > 0 && (
          <div className="absolute left-0 top-0 h-full w-full">
            <KonvaStage
              ref={stageHandle}
              width={containerSize.width}
              height={containerSize.height}
              image={image}
              scale={scale}
              position={position}
              toolMode={toolMode}
              annotations={loading ? [] : annotations}
              selectedAnnotationId={loading ? null : selectedAnnotationId}
              activeLabel={activeLabel}
              onSelect={onSelect}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onZoomAtPoint={onZoomAtPoint}
              onSetPosition={onSetPosition}
              showCrosshair={showCrosshair}
            />
          </div>
        )}
      </div>
    </div>
  );
};
