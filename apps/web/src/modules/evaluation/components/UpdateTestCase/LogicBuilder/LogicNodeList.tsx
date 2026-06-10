import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { GroupBox } from "./GroupBox";
import { LimitChip } from "./LimitChip";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { OperatorChip } from "./OperatorChip";
import {
  RenderNode,
  getInsertBeforeId,
  isGroupNode,
  processNodes,
} from "./logicBuilder.utils";

interface LogicNodeListProps {
  nodes: RenderNode[];
  /** null means root level */
  groupId: string | null;
}

export const DRAG_DATA_KEY = "application/logic-limit-id";

type DropGap = { index: number; left: number; top: number; height: number };

/**
 * Find the insertion gap for the cursor position, row-aware.
 * Scopes to direct children only (excludes chips inside nested GroupBoxes).
 * Returns container-relative geometry for the absolute-positioned indicator.
 */
function findGap(
  containerEl: HTMLElement,
  clientX: number,
  clientY: number,
): DropGap | null {
  // :scope > div is the <div className="contents"> wrapper; its direct child is <span data-logic-item>
  const items = Array.from(
    containerEl.querySelectorAll<HTMLElement>(":scope > div > [data-logic-item]"),
  );
  if (items.length === 0) return null;

  const containerRect = containerEl.getBoundingClientRect();

  // Bucket items into rows by rect.top (4 px tolerance handles subpixel rounding)
  type Row = { top: number; bottom: number; items: { el: HTMLElement; rect: DOMRect; index: number }[] };
  const rows: Row[] = [];
  items.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const last = rows[rows.length - 1];
    if (last && Math.abs(rect.top - last.top) <= 4) {
      last.bottom = Math.max(last.bottom, rect.bottom);
      last.items.push({ el, rect, index });
    } else {
      rows.push({ top: rect.top, bottom: rect.bottom, items: [{ el, rect, index }] });
    }
  });

  // Pick the row whose band brackets clientY; otherwise snap to nearest band edge
  let chosenRow = rows[0]!;
  let minDist = Infinity;
  for (const row of rows) {
    if (clientY >= row.top && clientY <= row.bottom) {
      chosenRow = row;
      minDist = 0;
      break;
    }
    const dist = Math.min(Math.abs(clientY - row.top), Math.abs(clientY - row.bottom));
    if (dist < minDist) {
      minDist = dist;
      chosenRow = row;
    }
  }

  // Within the chosen row, find the first item whose mid-X exceeds clientX
  for (const { rect, index } of chosenRow.items) {
    const midX = rect.left + rect.width / 2;
    if (clientX < midX) {
      return {
        index,
        left: rect.left - containerRect.left - 3,
        top: rect.top - containerRect.top,
        height: rect.height,
      };
    }
  }

  // Cursor is past all items in this row — gap is after the last item of the row,
  // which in the flat array is the index of the first item on the next row (or length).
  const lastInRow = chosenRow.items[chosenRow.items.length - 1]!;
  const rowIdx = rows.indexOf(chosenRow);
  const nextRow = rows[rowIdx + 1];
  const gapIndex = nextRow ? nextRow.items[0]!.index : items.length;
  return {
    index: gapIndex,
    left: lastInRow.rect.right - containerRect.left + 3,
    top: lastInRow.rect.top - containerRect.top,
    height: lastInRow.rect.height,
  };
}

export function LogicNodeList({ nodes, groupId }: LogicNodeListProps) {
  const { addLimit } = useLogicBuilderContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropGap, setDropGap] = useState<DropGap | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const processedItems = processNodes(nodes);

  const computeGap = (e: React.DragEvent): DropGap | null =>
    containerRef.current
      ? findGap(containerRef.current, e.clientX, e.clientY)
      : null;

  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_DATA_KEY)) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
      const gap = computeGap(e);
      setDropGap(gap);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_DATA_KEY)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    const next = computeGap(e);
    setDropGap((prev) => (prev?.index === next?.index ? prev : next));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
      setDropGap(null);
    }
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    const gap = dropGap?.index ?? processedItems.length;
    setDropGap(null);

    const limitId = e.dataTransfer.getData(DRAG_DATA_KEY);
    if (!limitId) return;

    if (gap === 0) {
      addLimit(limitId, { type: "prepend", groupId });
    } else if (gap >= processedItems.length) {
      addLimit(limitId, { type: "append", groupId });
    } else {
      const targetItem = processedItems[gap]!;
      addLimit(limitId, {
        type: "before",
        nodeId: getInsertBeforeId(targetItem),
      });
    }
  };

  // Empty state
  if (processedItems.length === 0) {
    return (
      <div
        ref={containerRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded border-2 border-dashed text-xs text-muted-foreground transition-colors",
          isDragOver
            ? "border-primary bg-primary/5 text-primary"
            : "border-border/40",
        )}
      >
        Drag limits here to build logic
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-wrap items-center gap-y-2 rounded p-1 transition-colors"
    >
      {processedItems.map((pi) => (
        <div key={pi.item.renderId} className="contents">
          {/* AND/OR connector — no data-logic-item so it doesn't affect gap indexing */}
          {pi.connector && (
            <span className="px-2">
              <OperatorChip node={pi.connector} />
            </span>
          )}

          {/* Limit or group — the sole gap-defining element per processedItem */}
          <span data-logic-item>
            {isGroupNode(pi.item) ? (
              <GroupBox node={pi.item} />
            ) : (
              <LimitChip node={pi.item} hasNot={pi.not !== null} />
            )}
          </span>
        </div>
      ))}

      {/* Absolute-positioned drop indicator — zero layout impact */}
      {dropGap && (
        <div
          aria-hidden
          className="pointer-events-none absolute w-0.5 rounded-full bg-primary"
          style={{ left: dropGap.left, top: dropGap.top, height: dropGap.height }}
        />
      )}
    </div>
  );
}
