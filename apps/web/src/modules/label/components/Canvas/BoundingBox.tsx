import { useEffect, useRef } from "react";
import { Rect, Transformer } from "react-konva";
import Konva from "konva";
import { Annotation } from "../../types/annotations";
import { ToolMode } from "../../types/annotations";

interface BoundingBoxProps {
  annotation: Annotation;
  imageWidth: number;
  imageHeight: number;
  isSelected: boolean;
  toolMode: ToolMode;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
}

export const BoundingBox = ({
  annotation,
  imageWidth,
  imageHeight,
  isSelected,
  toolMode,
  onSelect,
  onUpdate,
}: BoundingBoxProps) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const bbox = annotation.bbox!;

  const x = (bbox.x / 100) * imageWidth;
  const y = (bbox.y / 100) * imageHeight;
  const w = (bbox.width / 100) * imageWidth;
  const h = (bbox.height / 100) * imageHeight;

  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const isInteractive = toolMode === ToolMode.SELECT;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdate(annotation.id, {
      bbox: {
        x: (node.x() / imageWidth) * 100,
        y: (node.y() / imageHeight) * 100,
        width: bbox.width,
        height: bbox.height,
      },
    });
  };

  const handleTransformEnd = () => {
    const node = rectRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onUpdate(annotation.id, {
      bbox: {
        x: (node.x() / imageWidth) * 100,
        y: (node.y() / imageHeight) * 100,
        width: ((node.width() * scaleX) / imageWidth) * 100,
        height: ((node.height() * scaleY) / imageHeight) * 100,
      },
    });
  };

  return (
    <>
      <Rect
        ref={rectRef}
        x={x}
        y={y}
        width={w}
        height={h}
        stroke={annotation.color}
        strokeWidth={2}
        strokeScaleEnabled={false}
        fill={annotation.color + "33"}
        draggable={isInteractive}
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
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && isInteractive && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          borderEnabled={false}
          anchorStroke={annotation.color}
          anchorSize={8}
          anchorCornerRadius={2}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
          }
        />
      )}
    </>
  );
};
