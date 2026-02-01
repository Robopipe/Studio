import { useCallback, useRef } from "react";
import { Annotation, HistoryEntry } from "../types/annotations";

interface UseHistoryOptions {
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  setSelectedAnnotationId: (id: string | null) => void;
}

export const useHistory = ({
  setAnnotations,
  setSelectedAnnotationId,
}: UseHistoryOptions) => {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);

  const pushEntry = useCallback((entry: HistoryEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
  }, []);

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      setAnnotations((prev) => [...prev, annotation]);
      pushEntry({ type: "add", annotation });
    },
    [setAnnotations, pushEntry],
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) => {
        const old = prev.find((a) => a.id === id);
        if (!old) return prev;
        const updated = { ...old, ...updates };
        pushEntry({ type: "update", annotation: updated, previousAnnotation: old });
        return prev.map((a) => (a.id === id ? updated : a));
      });
    },
    [setAnnotations, pushEntry],
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      setAnnotations((prev) => {
        const old = prev.find((a) => a.id === id);
        if (!old) return prev;
        pushEntry({ type: "delete", annotation: old });
        return prev.filter((a) => a.id !== id);
      });
      setSelectedAnnotationId(null);
    },
    [setAnnotations, setSelectedAnnotationId, pushEntry],
  );

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push(entry);

    switch (entry.type) {
      case "add":
        setAnnotations((prev) => prev.filter((a) => a.id !== entry.annotation.id));
        break;
      case "update":
        if (entry.previousAnnotation) {
          setAnnotations((prev) =>
            prev.map((a) => (a.id === entry.annotation.id ? entry.previousAnnotation! : a)),
          );
        }
        break;
      case "delete":
        setAnnotations((prev) => [...prev, entry.annotation]);
        break;
    }
  }, [setAnnotations]);

  const redo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push(entry);

    switch (entry.type) {
      case "add":
        setAnnotations((prev) => [...prev, entry.annotation]);
        break;
      case "update":
        setAnnotations((prev) =>
          prev.map((a) => (a.id === entry.annotation.id ? entry.annotation : a)),
        );
        break;
      case "delete":
        setAnnotations((prev) => prev.filter((a) => a.id !== entry.annotation.id));
        break;
    }
  }, [setAnnotations]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
