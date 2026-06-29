import { useEffect, useRef } from "react";
import { Rect, Text, Transformer } from "react-konva";
import Konva from "konva";
import { Annotation } from "../../types/annotations";
import { ToolMode } from "../../types/annotations";
import type { GroupDragApi } from "./KonvaStage";

interface BoundingBoxProps {
  annotation: Annotation;
  imageWidth: number;
  imageHeight: number;
  isSelected: boolean;
  showHandles: boolean;
  toolMode: ToolMode;
  readOnly?: boolean;
  onSelect: (id: string, opts?: { additive?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  groupDrag: GroupDragApi;
}

export const BoundingBox = ({
  annotation,
  imageWidth,
  imageHeight,
  isSelected,
  showHandles,
  toolMode,
  readOnly = false,
  onSelect,
  onUpdate,
  groupDrag,
}: BoundingBoxProps) => {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  // Captured on mouseDown; consumed on click (collapse selection) and cleared
  // on dragStart (a drag is happening — don't collapse).
  const pendingClickRef = useRef<{ additive: boolean } | null>(null);
  const bbox = annotation.bbox!;

  const x = (bbox.x / 100) * imageWidth;
  const y = (bbox.y / 100) * imageHeight;
  const w = (bbox.width / 100) * imageWidth;
  const h = (bbox.height / 100) * imageHeight;

  const isInteractive = !readOnly && toolMode === ToolMode.SELECT;

  useEffect(() => {
    if (showHandles && isInteractive && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [showHandles, isInteractive]);

  useEffect(() => {
    const node = rectRef.current;
    if (!node) return;
    groupDrag.registerNode(annotation.id, node);
    return () => groupDrag.registerNode(annotation.id, null);
  }, [annotation.id, groupDrag]);

  const handleDragStart = () => {
    pendingClickRef.current = null;
    groupDrag.onDragStart(annotation.id);
  };

  const handleDragMove = () => {
    groupDrag.onDragMove(annotation.id);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const wasGroup = groupDrag.onDragEnd(annotation.id);
    if (wasGroup) return;
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

  // Inferred regions (confidence-report predictions) render with a dashed
  // outline and a score badge. GT annotations keep the solid style.
  const isInferred = annotation.inferred === true;
  const dash = isInferred ? [8, 6] : undefined;
  const fill = isInferred
    ? annotation.color + "00"
    : annotation.color + (isSelected ? "60" : "33");

  return (
    <>
      <Rect
        ref={rectRef}
        x={x}
        y={y}
        width={w}
        height={h}
        stroke={annotation.color}
        strokeWidth={isSelected ? 3 : 2}
        strokeScaleEnabled={false}
        dash={dash}
        fill={fill}
        shadowEnabled={isSelected}
        shadowColor={annotation.color}
        shadowBlur={6}
        shadowOpacity={0.5}
        draggable={isInteractive && isSelected}
        onMouseDown={(e) => {
          if (!isInteractive) return;
          e.cancelBubble = true;
          const additive = e.evt.ctrlKey || e.evt.metaKey;
          if (!isSelected) {
            // Need to select first so the upcoming drag (if any) can begin.
            onSelect(annotation.id, { additive });
            pendingClickRef.current = null;
          } else {
            // Already selected — defer the selection change so a drag-without-
            // release preserves the group, but a click-without-drag collapses
            // (or toggles, if ctrl).
            pendingClickRef.current = { additive };
          }
        }}
        onTouchStart={(e) => {
          if (!isInteractive) return;
          e.cancelBubble = true;
          if (!isSelected) onSelect(annotation.id);
        }}
        onClick={() => {
          const pending = pendingClickRef.current;
          pendingClickRef.current = null;
          if (!pending) return;
          onSelect(annotation.id, { additive: pending.additive });
        }}
        onTap={() => {
          const pending = pendingClickRef.current;
          pendingClickRef.current = null;
          if (!pending) return;
          onSelect(annotation.id, { additive: pending.additive });
        }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isInferred && annotation.score != null && (
        <Text
          x={x + 3}
          y={y + 3}
          text={annotation.score.toFixed(2)}
          fontSize={11}
          fontStyle="bold"
          fill="#fff"
          shadowEnabled={true}
          shadowColor="#000"
          shadowBlur={3}
          shadowOpacity={0.8}
          listening={false}
        />
      )}
      {showHandles && isInteractive && (
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
