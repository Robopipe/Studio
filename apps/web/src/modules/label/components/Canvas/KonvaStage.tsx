import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import Konva from "konva";
import { Annotation, ToolMode } from "../../types/annotations";
import { BoundingBox } from "./BoundingBox";
import { PolygonRegion } from "./PolygonRegion";
import { DrawingRegion } from "./DrawingRegion";

export interface KonvaStageHandle {
  cancelDrawing: () => void;
}

interface KonvaStageProps {
  width: number;
  height: number;
  image: HTMLImageElement;
  scale: number;
  position: { x: number; y: number };
  toolMode: ToolMode;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  activeLabel: { id: string; name: string; color: string } | null;
  onSelect: (id: string | null) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onZoomAtPoint: (pointer: { x: number; y: number }, factor: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
  showCrosshair: boolean;
}

const CLOSE_THRESHOLD = 10;

function pointInPolygon(x: number, y: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const KonvaStage = forwardRef<KonvaStageHandle, KonvaStageProps>(({
  width,
  height,
  image,
  scale,
  position,
  toolMode,
  annotations,
  selectedAnnotationId,
  activeLabel,
  onSelect,
  onAddAnnotation,
  onUpdateAnnotation,
  onZoomAtPoint,
  onSetPosition,
  showCrosshair,
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  // Mirror `position` into a ref so the middle-mouse-pan handler can read the
  // latest value without re-binding its window listeners.
  const positionRef = useRef(position);
  useLayoutEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Crosshair is updated imperatively via Konva refs (not React state) so it
  // can keep up with high-frequency mousemove events without triggering a
  // full re-render of the stage on every pixel.
  const crosshairLayerRef = useRef<Konva.Layer>(null);
  const crosshairVHaloRef = useRef<Konva.Line>(null);
  const crosshairHHaloRef = useRef<Konva.Line>(null);
  const crosshairVCoreRef = useRef<Konva.Line>(null);
  const crosshairHCoreRef = useRef<Konva.Line>(null);

  const updateCrosshair = useCallback((x: number, y: number) => {
    const layer = crosshairLayerRef.current;
    if (!layer) return;
    crosshairVHaloRef.current?.points([x, -1e6, x, 1e6]);
    crosshairVCoreRef.current?.points([x, -1e6, x, 1e6]);
    crosshairHHaloRef.current?.points([-1e6, y, 1e6, y]);
    crosshairHCoreRef.current?.points([-1e6, y, 1e6, y]);
    if (!layer.visible()) layer.visible(true);
    layer.batchDraw();
  }, []);

  const hideCrosshair = useCallback(() => {
    const layer = crosshairLayerRef.current;
    if (!layer || !layer.visible()) return;
    layer.visible(false);
    layer.batchDraw();
  }, []);
  const [drawingBBox, setDrawingBBox] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const cancelDrawing = useCallback(() => {
    setPolygonPoints([]);
    setCursorPos(null);
    setDrawingBBox(null);
  }, []);

  useImperativeHandle(ref, () => ({ cancelDrawing }), [cancelDrawing]);

  // Middle-mouse drag pan (works in any tool mode)
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let prevCursor = "";

    const onDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      panning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      prevCursor = container.style.cursor;
      container.style.cursor = "grabbing";
    };
    const onMove = (e: MouseEvent) => {
      if (!panning) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      onSetPosition({
        x: positionRef.current.x + dx,
        y: positionRef.current.y + dy,
      });
    };
    const onUp = (e: MouseEvent) => {
      if (e.button !== 1 || !panning) return;
      panning = false;
      container.style.cursor = prevCursor;
    };
    // Suppress middle-click auto-scroll bubble on Linux/Windows
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    container.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    container.addEventListener("auxclick", onAuxClick);
    return () => {
      container.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      container.removeEventListener("auxclick", onAuxClick);
    };
  }, [onSetPosition]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && polygonPoints.length > 0) {
        e.preventDefault();
        cancelDrawing();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (polygonPoints.length === 0) return;
      const container = stageRef.current?.container();
      if (container && !container.contains(e.target as Node)) {
        cancelDrawing();
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [polygonPoints.length, cancelDrawing]);

  const imgW = image.width;
  const imgH = image.height;

  const getImageCoords = useCallback(
    (stage: Konva.Stage) => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      return {
        x: (pointer.x - position.x) / scale,
        y: (pointer.y - position.y) / scale,
      };
    },
    [position, scale],
  );

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom — exponential factor proportional to wheel delta so trackpad
      // (many small deltas) and mouse (few large deltas) both feel natural.
      const delta = e.evt.deltaY;
      const factor = Math.exp(-delta * 0.01);
      onZoomAtPoint(pointer, factor);
    } else if (scale > 1) {
      // Pan when zoomed
      onSetPosition({
        x: position.x - e.evt.deltaX,
        y: position.y - e.evt.deltaY,
      });
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    if (toolMode === ToolMode.DRAW_BBOX && activeLabel) {
      const coords = getImageCoords(stage);
      if (!coords) return;
      setDrawingBBox({
        startX: coords.x,
        startY: coords.y,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
      });
    }

  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    if (toolMode === ToolMode.DRAW_BBOX && drawingBBox) {
      let dx = coords.x - drawingBBox.startX;
      let dy = coords.y - drawingBBox.startY;
      if (e.evt.shiftKey) {
        const size = Math.min(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx) * size;
        dy = Math.sign(dy) * size;
      }
      const endX = drawingBBox.startX + dx;
      const endY = drawingBBox.startY + dy;
      setDrawingBBox({
        ...drawingBBox,
        x: Math.min(drawingBBox.startX, endX),
        y: Math.min(drawingBBox.startY, endY),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    }

    if (toolMode === ToolMode.DRAW_POLYGON && polygonPoints.length > 0) {
      setCursorPos(coords);
    }
    if (showCrosshair) {
      updateCrosshair(coords.x, coords.y);
    }
  };

  const handleMouseLeave = () => {
    if (showCrosshair) hideCrosshair();
    if (polygonPoints.length === 0) setCursorPos(null);
  };

  const handleMouseUp = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (toolMode === ToolMode.DRAW_BBOX && drawingBBox && activeLabel) {
      if (drawingBBox.width > 2 && drawingBBox.height > 2) {
        onAddAnnotation({
          id: `ann-${Date.now()}`,
          labelId: activeLabel.id,
          labelName: activeLabel.name,
          color: activeLabel.color,
          type: "bbox",
          bbox: {
            x: (drawingBBox.x / imgW) * 100,
            y: (drawingBBox.y / imgH) * 100,
            width: (drawingBBox.width / imgW) * 100,
            height: (drawingBBox.height / imgH) * 100,
          },
        });
      }
      setDrawingBBox(null);
    }
  };

  const handleDblClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (toolMode !== ToolMode.SELECT) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    // Find every annotation whose hit area contains the cursor
    const hitIds: string[] = [];
    for (const ann of annotations) {
      if (ann.type === "bbox" && ann.bbox) {
        const ax = (ann.bbox.x / 100) * imgW;
        const ay = (ann.bbox.y / 100) * imgH;
        const aw = (ann.bbox.width / 100) * imgW;
        const ah = (ann.bbox.height / 100) * imgH;
        if (
          coords.x >= ax &&
          coords.x <= ax + aw &&
          coords.y >= ay &&
          coords.y <= ay + ah
        ) {
          hitIds.push(ann.id);
        }
      } else if (ann.type === "polygon" && ann.points && ann.points.length >= 3) {
        const pts = ann.points.map(
          ([px, py]) => [(px / 100) * imgW, (py / 100) * imgH] as [number, number],
        );
        if (pointInPolygon(coords.x, coords.y, pts)) {
          hitIds.push(ann.id);
        }
      }
    }
    if (hitIds.length < 2) return;
    // Cycle one layer down (to the next annotation in array order, wrapping around)
    const currentPos = selectedAnnotationId
      ? hitIds.indexOf(selectedAnnotationId)
      : -1;
    const nextId = hitIds[(currentPos + 1) % hitIds.length];
    onSelect(nextId);
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Deselect when clicking empty area in SELECT mode
    if (toolMode === ToolMode.SELECT) {
      const stage = e.target.getStage();
      const clickedOnEmpty = e.target === stage || e.target.getParent()?.name() === "image";
      if (clickedOnEmpty) {
        onSelect(null);
      }
      return;
    }
    if (toolMode !== ToolMode.DRAW_POLYGON || !activeLabel) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    if (polygonPoints.length >= 3) {
      const [firstX, firstY] = polygonPoints[0];
      const dx = coords.x - firstX;
      const dy = coords.y - firstY;
      if (Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESHOLD / scale) {
        // Close polygon
        onAddAnnotation({
          id: `ann-${Date.now()}`,
          labelId: activeLabel.id,
          labelName: activeLabel.name,
          color: activeLabel.color,
          type: "polygon",
          points: polygonPoints.map(([px, py]) => [
            (px / imgW) * 100,
            (py / imgH) * 100,
          ]),
        });
        setPolygonPoints([]);
        setCursorPos(null);
        return;
      }
    }

    setPolygonPoints((prev) => [...prev, [coords.x, coords.y]]);
  };

  const cursorStyle = () => {
    switch (toolMode) {
      case ToolMode.PAN:
        return "grab";
      case ToolMode.DRAW_BBOX:
      case ToolMode.DRAW_POLYGON:
        return "crosshair";
      default:
        return "default";
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable={toolMode === ToolMode.PAN}
      onDragEnd={(e) => {
        if (toolMode === ToolMode.PAN) {
          onSetPosition({ x: e.target.x(), y: e.target.y() });
        }
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      style={{ cursor: cursorStyle() }}
    >
      <Layer name="image">
        <KonvaImage image={image} width={imgW} height={imgH} listening={false} />
      </Layer>
      <Layer name="regions">
        {[...annotations]
          .sort((a, b) => {
            if (a.id === selectedAnnotationId) return 1;
            if (b.id === selectedAnnotationId) return -1;
            return 0;
          })
          .map((ann) =>
          ann.type === "bbox" && ann.bbox ? (
            <BoundingBox
              key={ann.id}
              annotation={ann}
              imageWidth={imgW}
              imageHeight={imgH}
              isSelected={ann.id === selectedAnnotationId}
              toolMode={toolMode}
              onSelect={(id) => onSelect(id)}
              onUpdate={onUpdateAnnotation}
            />
          ) : ann.type === "polygon" && ann.points ? (
            <PolygonRegion
              key={ann.id}
              annotation={ann}
              imageWidth={imgW}
              imageHeight={imgH}
              isSelected={ann.id === selectedAnnotationId}
              toolMode={toolMode}
              stageScale={scale}
              onSelect={(id) => onSelect(id)}
              onUpdate={onUpdateAnnotation}
            />
          ) : null,
        )}
      </Layer>
      {showCrosshair && (
        <Layer
          ref={crosshairLayerRef}
          name="crosshair"
          listening={false}
          visible={false}
        >
          {/* Dark halo so the bright core stays visible on any background */}
          <Line
            ref={crosshairVHaloRef}
            points={[0, -1e6, 0, 1e6]}
            stroke="rgba(0,0,0,0.7)"
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          <Line
            ref={crosshairHHaloRef}
            points={[-1e6, 0, 1e6, 0]}
            stroke="rgba(0,0,0,0.7)"
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          {/* Bright core dashed line */}
          <Line
            ref={crosshairVCoreRef}
            points={[0, -1e6, 0, 1e6]}
            stroke="#ef4444"
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          <Line
            ref={crosshairHCoreRef}
            points={[-1e6, 0, 1e6, 0]}
            stroke="#ef4444"
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
        </Layer>
      )}
      <Layer name="drawing">
        <DrawingRegion
          toolMode={toolMode}
          drawingBBox={
            drawingBBox
              ? { x: drawingBBox.x, y: drawingBBox.y, width: drawingBBox.width, height: drawingBBox.height }
              : null
          }
          polygonPoints={polygonPoints}
          cursorPosition={cursorPos}
          color={activeLabel?.color ?? "#6366f1"}
          stageScale={scale}
        />
      </Layer>
    </Stage>
  );
});

