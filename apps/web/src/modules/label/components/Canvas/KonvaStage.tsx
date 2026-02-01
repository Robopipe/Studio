import { useCallback, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage } from "react-konva";
import Konva from "konva";
import { Annotation, ToolMode } from "../../types/annotations";
import { BoundingBox } from "./BoundingBox";
import { PolygonRegion } from "./PolygonRegion";
import { DrawingRegion } from "./DrawingRegion";

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
  onZoomAtPoint: (pointer: { x: number; y: number }, direction: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
}

const CLOSE_THRESHOLD = 10;

export const KonvaStage = ({
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
}: KonvaStageProps) => {
  const stageRef = useRef<Konva.Stage>(null);
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
      // Zoom
      onZoomAtPoint(pointer, e.evt.deltaY < 0 ? 1 : -1);
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
      setDrawingBBox({
        ...drawingBBox,
        x: Math.min(drawingBBox.startX, coords.x),
        y: Math.min(drawingBBox.startY, coords.y),
        width: Math.abs(coords.x - drawingBBox.startX),
        height: Math.abs(coords.y - drawingBBox.startY),
      });
    }

    if (toolMode === ToolMode.DRAW_POLYGON && polygonPoints.length > 0) {
      setCursorPos(coords);
    }
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
      onClick={handleClick}
      style={{ cursor: cursorStyle() }}
    >
      <Layer name="image">
        <KonvaImage image={image} width={imgW} height={imgH} listening={false} />
      </Layer>
      <Layer name="regions">
        {annotations.map((ann) =>
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
              onSelect={(id) => onSelect(id)}
              onUpdate={onUpdateAnnotation}
            />
          ) : null,
        )}
      </Layer>
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
        />
      </Layer>
    </Stage>
  );
};

