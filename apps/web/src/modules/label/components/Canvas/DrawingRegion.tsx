import { useEffect, useRef } from "react";
import { Circle, Line, Rect } from "react-konva";
import Konva from "konva";
import { ToolMode } from "../../types/annotations";

interface DrawingBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingRegionProps {
  toolMode: ToolMode;
  drawingBBox: DrawingBBox | null;
  polygonPoints: [number, number][];
  cursorPosition: { x: number; y: number } | null;
  color: string;
  stageScale: number;
}

export const DrawingRegion = ({
  toolMode,
  drawingBBox,
  polygonPoints,
  cursorPosition,
  color,
  stageScale,
}: DrawingRegionProps) => {
  if (toolMode === ToolMode.DRAW_BBOX && drawingBBox) {
    return (
      <Rect
        x={drawingBBox.x}
        y={drawingBBox.y}
        width={drawingBBox.width}
        height={drawingBBox.height}
        stroke={color}
        strokeWidth={2}
        strokeScaleEnabled={false}
        dash={[6 / stageScale, 3 / stageScale]}
        fill={color + "1A"}
        listening={false}
      />
    );
  }

  return (
    <PolygonDrawing
      polygonPoints={polygonPoints}
      cursorPosition={cursorPosition}
      color={color}
      stageScale={stageScale}
      enabled={toolMode === ToolMode.DRAW_POLYGON && polygonPoints.length > 0}
    />
  );
};

interface PolygonDrawingProps {
  polygonPoints: [number, number][];
  cursorPosition: { x: number; y: number } | null;
  color: string;
  stageScale: number;
  enabled: boolean;
}

const PolygonDrawing = ({
  polygonPoints,
  cursorPosition,
  color,
  stageScale,
  enabled,
}: PolygonDrawingProps) => {
  const firstCircleRef = useRef<Konva.Circle>(null);

  const flatPoints = polygonPoints.flat();
  const firstPoint = polygonPoints[0];
  const canClose = polygonPoints.length >= 3;
  const isNearFirst =
    enabled &&
    canClose &&
    cursorPosition !== null &&
    firstPoint !== undefined &&
    Math.hypot(cursorPosition.x - firstPoint[0], cursorPosition.y - firstPoint[1]) <
      10 / stageScale;
  const linePoints =
    cursorPosition && !isNearFirst
      ? [...flatPoints, cursorPosition.x, cursorPosition.y]
      : isNearFirst && firstPoint
      ? [...flatPoints, firstPoint[0], firstPoint[1]]
      : flatPoints;

  useEffect(() => {
    const node = firstCircleRef.current;
    if (!node) return;
    node.to({
      radius: (isNearFirst ? 11 : 7) / stageScale,
      strokeWidth: isNearFirst ? 3 : 2,
      duration: 0.12,
      easing: Konva.Easings.EaseOut,
    });
  }, [isNearFirst, stageScale]);

  if (!enabled) return null;

  return (
    <>
      <Line
        points={linePoints}
        stroke={color}
        strokeWidth={2}
        strokeScaleEnabled={false}
        dash={[6 / stageScale, 3 / stageScale]}
        fill={color + "1A"}
        closed={false}
        listening={false}
      />
      {polygonPoints.map(([x, y], i) => (
        <Circle
          key={i}
          ref={i === 0 ? firstCircleRef : undefined}
          x={x}
          y={y}
          radius={(i === 0 ? 7 : 4) / stageScale}
          fill={i === 0 ? color : "white"}
          stroke={color}
          strokeWidth={2}
          strokeScaleEnabled={false}
          listening={false}
        />
      ))}
    </>
  );
};
