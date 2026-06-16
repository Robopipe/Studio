import { DragEvent, MouseEvent, useState } from "react";

export interface DraggableItemProps {
  /** Spread on the row's outer container. */
  containerProps: {
    draggable: boolean;
    onDragStart: (e: DragEvent<HTMLElement>) => void;
    onDragEnter: () => void;
    onDragOver: (e: DragEvent<HTMLElement>) => void;
    onDrop: (e: DragEvent<HTMLElement>) => void;
    onDragEnd: () => void;
  };
  /** Spread on the grip handle button. */
  handleProps: {
    onMouseDown: (e: MouseEvent<HTMLElement>) => void;
    onMouseUp: () => void;
    onClick: (e: MouseEvent<HTMLElement>) => void;
  };
  /** True while this item is the source of an active drag. */
  isDragging: boolean;
  /** True when the cursor is hovering this item from above (i.e. moving up). */
  showDropAbove: boolean;
  /** True when the cursor is hovering this item from below (i.e. moving down). */
  showDropBelow: boolean;
  /** True when the cursor is hovering directly on this item (for group header drop zones). */
  showDropOnto: boolean;
}

export interface MoveEvent {
  fromIndex: number;
  toIndex: number;
  /** Non-null when the drop target belongs to a group (drop into group). */
  targetGroupId: string | null;
}

/**
 * State machine for a list whose rows can be reordered via native HTML5
 * drag-and-drop, gated on a grip handle so the row's regular click handler
 * still works elsewhere.
 *
 * Returns `getItemProps(index, groupId?)` which provides every prop the row needs;
 * `containerProps` go on the outer element and `handleProps` go on the grip.
 *
 * When `onMove` is provided it replaces `onReorder` and receives a richer event
 * including the target's groupId.
 */
export const useDraggableList = (
  onReorder: (fromIndex: number, toIndex: number) => void,
  onMove?: (event: MoveEvent) => void,
) => {
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Track whether the current hover target is a group header (onto) rather than above/below
  const [dragOntoGroupId, setDragOntoGroupId] = useState<string | null>(null);

  const reset = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
    setDragOntoGroupId(null);
  };

  const getItemProps = (index: number, groupId?: string | null): DraggableItemProps => ({
    containerProps: {
      draggable: draggableIndex === index,
      onDragStart: (e) => {
        setDragFromIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      },
      onDragEnter: () => {
        if (dragFromIndex !== null) {
          setDragOverIndex(index);
          // dragOntoGroupId is managed externally via signalDropOnto /
          // signalDropTopLevel — do not reset it here.
        }
      },
      onDragOver: (e) => {
        if (dragFromIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e) => {
        e.preventDefault();
        if (dragFromIndex !== null && dragFromIndex !== index) {
          if (onMove) {
            onMove({ fromIndex: dragFromIndex, toIndex: index, targetGroupId: dragOntoGroupId });
          } else {
            onReorder(dragFromIndex, index);
          }
        }
        reset();
      },
      onDragEnd: reset,
    },
    handleProps: {
      onMouseDown: (e) => {
        e.stopPropagation();
        setDraggableIndex(index);
      },
      onMouseUp: () => setDraggableIndex(null),
      onClick: (e) => e.stopPropagation(),
    },
    isDragging: dragFromIndex === index,
    showDropAbove:
      dragOverIndex === index &&
      dragFromIndex !== null &&
      dragFromIndex > index &&
      dragOntoGroupId === null,
    showDropBelow:
      dragOverIndex === index &&
      dragFromIndex !== null &&
      dragFromIndex < index &&
      dragOntoGroupId === null,
    showDropOnto: dragOverIndex === index && dragOntoGroupId === (groupId ?? null) && dragOntoGroupId !== null,
  });

  /** Call from a group header row to signal a "drop onto group" intent. */
  const signalDropOnto = (groupId: string) => {
    setDragOntoGroupId(groupId);
  };

  /** Call from a top-level row to clear the onto-group state. */
  const signalDropTopLevel = () => {
    setDragOntoGroupId(null);
  };

  return { getItemProps, signalDropOnto, signalDropTopLevel };
};
