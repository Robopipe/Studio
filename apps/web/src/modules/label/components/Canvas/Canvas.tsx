import { Task } from "@repo/schema";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useImageLoader } from "../../hooks/useImageLoader";
import { Annotation, ToolMode } from "../../types/annotations";
import { KonvaStage, KonvaStageHandle } from "./KonvaStage";

export interface CanvasHandle {
  resetView: () => void;
  startNudge: (selectedIds: Set<string>) => void;
  applyNudge: (dxPx: number, dyPx: number) => void;
  clearNudge: () => void;
}

export interface CanvasProps {
  task: Task | undefined;
  annotations: Annotation[];
  selectedAnnotationIds: Set<string>;
  primarySelectedId: string | null;
  toolMode: ToolMode;
  activeLabel: { id: string; name: string; color: string } | null;
  scale: number;
  position: { x: number; y: number };
  onSelect: (id: string | null, opts?: { additive?: boolean }) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteSelected: () => void;
  onCopySelection: () => void;
  onPasteClipboard: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  canGroup: boolean;
  onGroupTranslate: (
    updates: Array<{ id: string; updates: Partial<Annotation> }>,
  ) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomAtPoint: (pointer: { x: number; y: number }, factor: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
  onFitImage: (iw: number, ih: number, cw: number, ch: number) => void;
  isDirty: boolean;
  isSaving: boolean;
  canMarkEmpty: boolean;
  onSave: () => void;
  onSaveEmpty: () => void;
  showCrosshair: boolean;
  toolbarsVisible: boolean;
  onToggleToolbars: () => void;
  onImageLoad?: (width: number, height: number) => void;
}

const isTextInputFocused = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable
  );
};

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  task,
  annotations,
  selectedAnnotationIds,
  primarySelectedId,
  toolMode,
  activeLabel,
  scale,
  position,
  onSelect,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteSelected,
  onCopySelection,
  onPasteClipboard,
  onGroupSelected,
  onUngroupSelected,
  canGroup,
  onGroupTranslate,
  onUndo,
  onRedo,
  onZoomAtPoint,
  onSetPosition,
  onFitImage,
  isDirty,
  isSaving,
  canMarkEmpty,
  onSave,
  onSaveEmpty,
  showCrosshair,
  toolbarsVisible,
  onToggleToolbars,
  onImageLoad,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageHandle = useRef<KonvaStageHandle>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedVertex, setSelectedVertex] = useState<{ annotationId: string; index: number } | null>(null);
  const { image, loading, error } = useImageLoader(task?.filePath);
  const fittedImageRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      const container = containerRef.current;
      if (!container || !image) return;
      onFitImage(image.width, image.height, container.clientWidth, container.clientHeight);
    },
    startNudge: (ids) => stageHandle.current?.startNudge(ids),
    applyNudge: (dx, dy) => stageHandle.current?.applyNudge(dx, dy),
    clearNudge: () => stageHandle.current?.clearNudge(),
  }), [image, onFitImage]);

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
      onImageLoad?.(image.width, image.height);
    }
  }, [image, containerSize.width, containerSize.height]);

  useEffect(() => {
    setSelectedVertex(null);
  }, [selectedAnnotationIds]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      const mod = e.ctrlKey || e.metaKey;

      if (key === "Delete" || key === "Backspace") {
        if (selectedVertex !== null) {
          const ann = annotations.find((a) => a.id === selectedVertex.annotationId);
          if (ann?.points && ann.points.length > 3) {
            const newPoints = ann.points.filter((_, i) => i !== selectedVertex.index);
            onUpdateAnnotation(ann.id, { points: newPoints });
          }
          setSelectedVertex(null);
          e.preventDefault();
          return;
        }
        if (selectedAnnotationIds.size > 0) {
          e.preventDefault();
          onDeleteSelected();
        }
        return;
      }
      if (key === "Escape") {
        stageHandle.current?.cancelDrawing();
        onSelect(null);
        setSelectedVertex(null);
        return;
      }
      if (mod && (key === "z" || key === "Z")) {
        if (isTextInputFocused(e.target)) return;
        e.preventDefault();
        if (e.shiftKey || key === "Z") onRedo();
        else onUndo();
        return;
      }
      if (mod && key.toLowerCase() === "c") {
        if (isTextInputFocused(e.target)) return;
        if (selectedAnnotationIds.size === 0) return;
        e.preventDefault();
        onCopySelection();
        return;
      }
      if (mod && key.toLowerCase() === "v") {
        if (isTextInputFocused(e.target)) return;
        e.preventDefault();
        onPasteClipboard();
        return;
      }
      if (mod && key.toLowerCase() === "g") {
        if (isTextInputFocused(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) {
          onUngroupSelected();
        } else if (canGroup) {
          onGroupSelected();
        }
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedAnnotationIds,
    selectedVertex,
    annotations,
    onDeleteSelected,
    onUpdateAnnotation,
    onCopySelection,
    onPasteClipboard,
    onGroupSelected,
    onUngroupSelected,
    canGroup,
    onSelect,
    onUndo,
    onRedo,
  ]);

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
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4">
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium"
          title={task.filePath.split("/").pop() ?? "Task"}
        >
          {task.filePath.split("/").pop() ?? "Task"}
        </span>
        <button
          type="button"
          title="Toggle toolbars (T)"
          className="shrink-0 cursor-pointer rounded border border-black/10 bg-transparent px-2 py-[3px] text-xs font-semibold text-muted-foreground hover:bg-black/5 hover:text-foreground"
          onClick={onToggleToolbars}
        >
          <span className="flex items-center gap-1.5 [&_svg]:size-3.5">
            {toolbarsVisible ? <Eye /> : <EyeOff />}
            {toolbarsVisible ? "Hide toolbars" : "Show toolbars"}
          </span>
        </button>
        {canMarkEmpty && annotations.length === 0 && (
          <button
            type="button"
            title="Mark as empty / background (E)"
            className="shrink-0 cursor-pointer rounded border border-primary bg-transparent px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onSaveEmpty}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "No objects"}
          </button>
        )}
        <button
          type="button"
          title="Save (S)"
          className="shrink-0 cursor-pointer rounded border-none bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
              selectedAnnotationIds={loading ? new Set() : selectedAnnotationIds}
              primarySelectedId={loading ? null : primarySelectedId}
              activeLabel={activeLabel}
              selectedVertex={selectedVertex}
              onSelect={onSelect}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onVertexSelect={setSelectedVertex}
              onGroupTranslate={onGroupTranslate}
              onZoomAtPoint={onZoomAtPoint}
              onSetPosition={onSetPosition}
              showCrosshair={showCrosshair}
            />
          </div>
        )}
      </div>
    </div>
  );
});
