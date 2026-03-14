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

/**
 * Find the insertion gap index (0..n) based on cursor X within the container.
 * Gap 0 = before first item, gap n = after last item.
 * Determines position by scanning rendered item elements.
 */
function findGapIndex(
  containerEl: HTMLElement,
  clientX: number,
  itemCount: number,
): number {
  // Items with data-logic-item attribute are the rendered limit/group/operator elements
  const items = containerEl.querySelectorAll<HTMLElement>("[data-logic-item]");
  if (items.length === 0) return 0;

  for (let i = 0; i < items.length; i++) {
    const rect = items[i]!.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (clientX < midX) return i;
  }
  return itemCount;
}

export function LogicNodeList({ nodes, groupId }: LogicNodeListProps) {
  const { addLimit } = useLogicBuilderContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  const dragCounter = useRef(0); // track enter/leave nesting

  const processedItems = processNodes(nodes);

  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_DATA_KEY)) return;
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      const gap = containerRef.current
        ? findGapIndex(containerRef.current, e.clientX, processedItems.length)
        : 0;
      setDropGap(gap);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_DATA_KEY)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    const gap = containerRef.current
      ? findGapIndex(containerRef.current, e.clientX, processedItems.length)
      : 0;
    setDropGap(gap);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDropGap(null);
    }
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    const gap = dropGap ?? processedItems.length;
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
          dropGap !== null
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
      {processedItems.map((pi, idx) => (
        <div key={pi.item.renderId} className="contents">
          {/* Drop indicator before this item */}
          {dropGap === idx && (
            <div className="w-0.5 self-stretch min-h-7 rounded-full bg-primary mx-0.5" />
          )}

          {/* AND/OR connector */}
          {pi.connector && (
            <span data-logic-item className="px-2">
              <OperatorChip node={pi.connector} />
            </span>
          )}

          {/* Limit or group */}
          <span data-logic-item>
            {isGroupNode(pi.item) ? (
              <GroupBox node={pi.item} />
            ) : (
              <LimitChip node={pi.item} hasNot={pi.not !== null} />
            )}
          </span>
        </div>
      ))}

      {/* Drop indicator after last item */}
      {dropGap !== null && dropGap >= processedItems.length && (
        <div className="w-0.5 self-stretch min-h-7 rounded-full bg-primary mx-0.5" />
      )}
    </div>
  );
}
