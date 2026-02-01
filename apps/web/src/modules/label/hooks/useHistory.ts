import { useCallback, useRef, useState } from "react";
import { Annotation, HistoryEntry } from "../types/annotations";

interface UseHistoryOptions {
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  setSelectedAnnotationId: (id: string | null) => void;
}

export const useHistory = ({
  annotations,
  setAnnotations,
  setSelectedAnnotationId,
}: UseHistoryOptions) => {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const [revision, setRevision] = useState(0);

  const bumpRevision = useCallback(() => setRevision((r) => r + 1), []);

  const pushEntry = useCallback((entry: HistoryEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
    bumpRevision();
  }, [bumpRevision]);

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      setAnnotations((prev) => [...prev, annotation]);
      pushEntry({ type: "add", annotation });
    },
    [setAnnotations, pushEntry],
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      const old = annotations.find((a) => a.id === id);
      if (!old) return;
      const updated = { ...old, ...updates };
      setAnnotations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      pushEntry({ type: "update", annotation: updated, previousAnnotation: old });
    },
    [annotations, setAnnotations, pushEntry],
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      const old = annotations.find((a) => a.id === id);
      if (!old) return;
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      pushEntry({ type: "delete", annotation: old });
      setSelectedAnnotationId(null);
    },
    [annotations, setAnnotations, setSelectedAnnotationId, pushEntry],
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
    bumpRevision();
  }, [setAnnotations, bumpRevision]);

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
    bumpRevision();
  }, [setAnnotations, bumpRevision]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  // Combined entries list: [...undoStack (past), ...redoStack reversed (future)]
  const entries = [...undoStack.current, ...[...redoStack.current].reverse()];
  const currentIndex = undoStack.current.length;

  const jumpTo = useCallback(
    (targetIndex: number) => {
      const current = undoStack.current.length;
      if (targetIndex < current) {
        for (let i = 0; i < current - targetIndex; i++) undo();
      } else if (targetIndex > current) {
        for (let i = 0; i < targetIndex - current; i++) redo();
      }
    },
    [undo, redo],
  );

  const reset = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    bumpRevision();
  }, [bumpRevision]);

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
    entries,
    currentIndex,
    jumpTo,
    reset,
    revision,
  };
};
