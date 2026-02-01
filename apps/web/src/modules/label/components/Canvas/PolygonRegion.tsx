import { Circle, Group, Line } from "react-konva";
import Konva from "konva";
import { Annotation } from "../../types/annotations";
import { ToolMode } from "../../types/annotations";

interface PolygonRegionProps {
  annotation: Annotation;
  imageWidth: number;
  imageHeight: number;
  isSelected: boolean;
  toolMode: ToolMode;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
}

export const PolygonRegion = ({
  annotation,
  imageWidth,
  imageHeight,
  isSelected,
  toolMode,
  onSelect,
  onUpdate,
}: PolygonRegionProps) => {
  const pts = annotation.points ?? [];
  const flatPoints = pts.flatMap(([px, py]) => [
    (px / 100) * imageWidth,
    (py / 100) * imageHeight,
  ]);

  const isInteractive = toolMode === ToolMode.SELECT;

  const handlePointDrag = (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newPts = pts.map((p, i) =>
      i === index
        ? [(node.x() / imageWidth) * 100, (node.y() / imageHeight) * 100] as [number, number]
        : p,
    );
    onUpdate(annotation.id, { points: newPts });
  };

  const handleGroupDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    const dx = e.target.x();
    const dy = e.target.y();
    e.target.position({ x: 0, y: 0 });
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
    <Group
      draggable={isInteractive}
      onDragEnd={handleGroupDrag}
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
    >
      <Line
        points={flatPoints}
        closed
        stroke={annotation.color}
        strokeWidth={2}
        fill={annotation.color + "33"}
        hitStrokeWidth={20}
      />
      {isSelected &&
        isInteractive &&
        pts.map(([px, py], i) => (
          <Circle
            key={i}
            x={(px / 100) * imageWidth}
            y={(py / 100) * imageHeight}
            radius={5}
            fill="white"
            stroke={annotation.color}
            strokeWidth={2}
            draggable
            onDragMove={(e) => handlePointDrag(i, e)}
          />
        ))}
    </Group>
  );
};
