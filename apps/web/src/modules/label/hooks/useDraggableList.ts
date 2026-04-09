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
}

/**
 * State machine for a list whose rows can be reordered via native HTML5
 * drag-and-drop, gated on a grip handle so the row's regular click handler
 * still works elsewhere.
 *
 * Returns `getItemProps(index)` which provides every prop the row needs;
 * `containerProps` go on the outer element and `handleProps` go on the grip.
 */
export const useDraggableList = (
  onReorder: (fromIndex: number, toIndex: number) => void,
) => {
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
    setDraggableIndex(null);
  };

  const getItemProps = (index: number): DraggableItemProps => ({
    containerProps: {
      draggable: draggableIndex === index,
      onDragStart: (e) => {
        setDragFromIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      },
      onDragEnter: () => {
        if (dragFromIndex !== null) setDragOverIndex(index);
      },
      onDragOver: (e) => {
        if (dragFromIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e) => {
        e.preventDefault();
        if (dragFromIndex !== null && dragFromIndex !== index) {
          onReorder(dragFromIndex, index);
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
      dragFromIndex > index,
    showDropBelow:
      dragOverIndex === index &&
      dragFromIndex !== null &&
      dragFromIndex < index,
  });

  return { getItemProps };
};
