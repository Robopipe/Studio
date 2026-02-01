import { Circle, Line, Rect } from "react-konva";
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
}

export const DrawingRegion = ({
  toolMode,
  drawingBBox,
  polygonPoints,
  cursorPosition,
  color,
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
        dash={[6, 3]}
        fill={color + "1A"}
        listening={false}
      />
    );
  }

  if (toolMode === ToolMode.DRAW_POLYGON && polygonPoints.length > 0) {
    const flatPoints = polygonPoints.flat();
    const linePoints = cursorPosition
      ? [...flatPoints, cursorPosition.x, cursorPosition.y]
      : flatPoints;

    return (
      <>
        <Line
          points={linePoints}
          stroke={color}
          strokeWidth={2}
          dash={[6, 3]}
          fill={color + "1A"}
          closed={false}
          listening={false}
        />
        {polygonPoints.map(([x, y], i) => (
          <Circle
            key={i}
            x={x}
            y={y}
            radius={i === 0 ? 7 : 4}
            fill={i === 0 ? color : "white"}
            stroke={color}
            strokeWidth={2}
            listening={false}
          />
        ))}
      </>
    );
  }

  return null;
};
