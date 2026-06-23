import { useCallback, useRef, useState } from "react";
import { Annotation, AtomicHistoryEntry, HistoryEntry } from "../types/annotations";

interface UseHistoryOptions {
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
}

export const useHistory = ({
  annotations,
  setAnnotations,
}: UseHistoryOptions) => {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  // While non-null, atomic entries are captured here instead of pushed to
  // undoStack. `runBatch` wraps a callback in a batch frame.
  const batchStack = useRef<AtomicHistoryEntry[] | null>(null);
  const [revision, setRevision] = useState(0);

  const bumpRevision = useCallback(() => setRevision((r) => r + 1), []);

  const pushAtomic = useCallback(
    (entry: AtomicHistoryEntry) => {
      if (batchStack.current) {
        batchStack.current.push(entry);
        return;
      }
      undoStack.current.push(entry);
      redoStack.current = [];
      bumpRevision();
    },
    [bumpRevision],
  );

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      setAnnotations((prev) => [...prev, annotation]);
      pushAtomic({ type: "add", annotation });
    },
    [setAnnotations, pushAtomic],
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      const old = annotations.find((a) => a.id === id);
      if (!old) return;
      const updated = { ...old, ...updates };
      setAnnotations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      pushAtomic({ type: "update", annotation: updated, previousAnnotation: old });
    },
    [annotations, setAnnotations, pushAtomic],
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      const old = annotations.find((a) => a.id === id);
      if (!old) return;
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      pushAtomic({ type: "delete", annotation: old });
    },
    [annotations, setAnnotations, pushAtomic],
  );

  const runBatch = useCallback(
    (label: "delete" | "paste" | "move" | "relabel" | "group" | "ungroup", fn: () => void) => {
      // Nested batches: re-enter the existing frame, no nesting in the entry
      // tree. Simpler and the only nesting case we care about is "delete the
      // selection" called from inside something else, which we don't actually do.
      if (batchStack.current) {
        fn();
        return;
      }
      const frame: AtomicHistoryEntry[] = [];
      batchStack.current = frame;
      try {
        fn();
      } finally {
        batchStack.current = null;
      }
      if (frame.length === 0) return;
      undoStack.current.push({ type: "batch", label, children: frame });
      redoStack.current = [];
      bumpRevision();
    },
    [bumpRevision],
  );

  // Push a single batch entry from explicit before/after pairs. Unlike
  // runBatch+updateAnnotation, this doesn't rely on current annotation state
  // to compute "previousAnnotation", so it works correctly after a burst of
  // direct setAnnotations calls (e.g. keyboard nudge coalescing).
  const pushBatchEntry = useCallback(
    (params: {
      label: "delete" | "paste" | "move" | "relabel" | "group" | "ungroup";
      changes: Array<{ before: Annotation; after: Annotation }>;
    }) => {
      if (params.changes.length === 0) return;
      const children: AtomicHistoryEntry[] = params.changes.map(({ before, after }) => ({
        type: "update",
        annotation: after,
        previousAnnotation: before,
      }));
      if (batchStack.current) {
        for (const c of children) batchStack.current.push(c);
        return;
      }
      undoStack.current.push({ type: "batch", label: params.label, children });
      redoStack.current = [];
      bumpRevision();
    },
    [bumpRevision],
  );

  const applyUndo = useCallback(
    (entry: AtomicHistoryEntry) => {
      switch (entry.type) {
        case "add":
          setAnnotations((prev) => prev.filter((a) => a.id !== entry.annotation.id));
          break;
        case "update":
          setAnnotations((prev) =>
            prev.map((a) => (a.id === entry.annotation.id ? entry.previousAnnotation : a)),
          );
          break;
        case "delete":
          setAnnotations((prev) => [...prev, entry.annotation]);
          break;
      }
    },
    [setAnnotations],
  );

  const applyRedo = useCallback(
    (entry: AtomicHistoryEntry) => {
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
    },
    [setAnnotations],
  );

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push(entry);

    if (entry.type === "batch") {
      for (let i = entry.children.length - 1; i >= 0; i--) applyUndo(entry.children[i]);
    } else {
      applyUndo(entry);
    }
    bumpRevision();
  }, [applyUndo, bumpRevision]);

  const redo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push(entry);

    if (entry.type === "batch") {
      for (const child of entry.children) applyRedo(child);
    } else {
      applyRedo(entry);
    }
    bumpRevision();
  }, [applyRedo, bumpRevision]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

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
    batchStack.current = null;
    bumpRevision();
  }, [bumpRevision]);

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    runBatch,
    pushBatchEntry,
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
