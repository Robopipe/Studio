import { useRef } from "react";
import { Circle, Line } from "react-konva";
import Konva from "konva";
import { Annotation } from "../../types/annotations";
import { ToolMode } from "../../types/annotations";

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const ex = px - projX;
  const ey = py - projY;
  return Math.sqrt(ex * ex + ey * ey);
}

interface PolygonRegionProps {
  annotation: Annotation;
  imageWidth: number;
  imageHeight: number;
  isSelected: boolean;
  toolMode: ToolMode;
  stageScale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
}

export const PolygonRegion = ({
  annotation,
  imageWidth,
  imageHeight,
  isSelected,
  toolMode,
  stageScale,
  onSelect,
  onUpdate,
}: PolygonRegionProps) => {
  const pts = annotation.points ?? [];
  const flatPoints = pts.flatMap(([px, py]) => [
    (px / 100) * imageWidth,
    (py / 100) * imageHeight,
  ]);
  const lineRef = useRef<Konva.Line>(null);
  const circleRefs = useRef<(Konva.Circle | null)[]>([]);

  const isInteractive = toolMode === ToolMode.SELECT;

  const handleLineClick = () => {
    if (!isInteractive || !isSelected) return;
    const line = lineRef.current;
    if (!line) return;
    const stage = line.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const transform = line.getAbsoluteTransform().copy().invert();
    const localPos = transform.point(pointer);

    // Find closest edge to insert the new point
    let bestDist = Infinity;
    let insertAfter = 0;
    for (let i = 0; i < pts.length; i++) {
      const ax = (pts[i][0] / 100) * imageWidth;
      const ay = (pts[i][1] / 100) * imageHeight;
      const next = (i + 1) % pts.length;
      const bx = (pts[next][0] / 100) * imageWidth;
      const by = (pts[next][1] / 100) * imageHeight;
      const dist = distToSegment(localPos.x, localPos.y, ax, ay, bx, by);
      if (dist < bestDist) {
        bestDist = dist;
        insertAfter = i;
      }
    }

    // Only insert when clicking near an edge (within 10 screen pixels)
    const absTransform = line.getAbsoluteTransform();
    const origin = absTransform.point({ x: 0, y: 0 });
    const unit = absTransform.point({ x: 1, y: 0 });
    const scaleX = Math.sqrt((unit.x - origin.x) ** 2 + (unit.y - origin.y) ** 2);
    if (bestDist * scaleX > 10) return;

    const newPt: [number, number] = [
      (localPos.x / imageWidth) * 100,
      (localPos.y / imageHeight) * 100,
    ];
    const newPts = [...pts];
    newPts.splice(insertAfter + 1, 0, newPt);
    onUpdate(annotation.id, { points: newPts });
  };

  const handlePointDragMove = (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const line = lineRef.current;
    if (!line) return;
    const currentPoints = [...line.points()];
    currentPoints[index * 2] = node.x();
    currentPoints[index * 2 + 1] = node.y();
    line.points(currentPoints);
  };

  const handlePointDragEnd = (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newPts = pts.map((p, i) =>
      i === index
        ? [(node.x() / imageWidth) * 100, (node.y() / imageHeight) * 100] as [number, number]
        : p,
    );
    onUpdate(annotation.id, { points: newPts });
  };

  const handleLineDragMove = () => {
    const line = lineRef.current;
    if (!line) return;
    const dx = line.x();
    const dy = line.y();
    circleRefs.current.forEach((circle, i) => {
      if (!circle) return;
      const baseX = (pts[i][0] / 100) * imageWidth;
      const baseY = (pts[i][1] / 100) * imageHeight;
      circle.x(baseX + dx);
      circle.y(baseY + dy);
    });
  };

  const handleLineDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    node.position({ x: 0, y: 0 });
    const newPts = pts.map(
      ([px, py]) =>
        [
          px + (dx / imageWidth) * 100,
          py + (dy / imageHeight) * 100,
        ] as [number, number],
    );
    onUpdate(annotation.id, { points: newPts });
  };

  return (
    <>
      <Line
        ref={lineRef}
        points={flatPoints}
        closed
        stroke={annotation.color}
        strokeWidth={2}
        strokeScaleEnabled={false}
        fill={annotation.color + "33"}
        hitStrokeWidth={20 / stageScale}
        draggable={isInteractive}
        onDragMove={handleLineDragMove}
        onDragEnd={handleLineDragEnd}
        onClick={handleLineClick}
        onTap={handleLineClick}
        onMouseDown={(e) => {
          if (isInteractive) {
            e.cancelBubble = true;
            onSelect(annotation.id);
          }
        }}
        onTouchStart={(e) => {
          if (isInteractive) {
            e.cancelBubble = true;
            onSelect(annotation.id);
          }
        }}
      />
      {isSelected &&
        isInteractive &&
        pts.map(([px, py], i) => (
          <Circle
            key={i}
            ref={(node) => { circleRefs.current[i] = node; }}
            x={(px / 100) * imageWidth}
            y={(py / 100) * imageHeight}
            radius={4 / stageScale}
            hitRadius={40 / stageScale}
            fill="white"
            stroke={annotation.color}
            strokeWidth={2}
            strokeScaleEnabled={false}
            draggable
            onDragMove={(e) => handlePointDragMove(i, e)}
            onDragEnd={(e) => handlePointDragEnd(i, e)}
            onMouseDown={(e) => { e.cancelBubble = true; }}
            onTouchStart={(e) => { e.cancelBubble = true; }}
          />
        ))}
    </>
  );
};
