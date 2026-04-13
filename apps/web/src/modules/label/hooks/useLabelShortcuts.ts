import { useEffect, useLayoutEffect, useRef } from "react";
import { Label, Task } from "@repo/schema";
import { ToolMode } from "../types/annotations";

export interface UseLabelShortcutsOptions {
  // Reactive state read at the moment a key fires
  tasks: Task[];
  selectedTaskId: number | null;
  page: number;
  totalPages: number;
  labels: Label[];
  activeLabel: Label | null;
  isDirty: boolean;
  isSaving: boolean;
  canMarkEmpty: boolean;
  annotationCount: number;

  // Actions
  onSave: () => void;
  onSaveEmpty: () => void;
  onSetToolMode: (mode: ToolMode) => void;
  onToggleCrosshair: () => void;
  onSelectTask: (taskId: number) => void;
  /** Move to a different page and request which task on the new page should
   *  be selected once it loads. The caller is responsible for honoring the
   *  anchor (typically via a `pendingPageSelection` state). */
  onChangePage: (page: number, anchor: "first" | "last") => void;
  onSelectLabel: (labelId: number) => void;
}

/**
 * Global keyboard shortcuts for the labeling page. The window listener is
 * bound exactly once for the lifetime of the page; reactive state is read via
 * a ref so it stays current without re-binding (which previously caused churn
 * because callbacks like `handleSelectLabel` were re-created every render).
 */
export const useLabelShortcuts = (options: UseLabelShortcutsOptions) => {
  const optionsRef = useRef(options);
  // useLayoutEffect (not bare assignment) keeps this safe under React's
  // concurrent rendering — the ref is updated synchronously after commit.
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const opts = optionsRef.current;
      const key = e.key.toLowerCase();

      switch (key) {
        case "s":
          if (opts.isDirty && !opts.isSaving) {
            e.preventDefault();
            opts.onSave();
          }
          return;
        case "e":
          if (opts.canMarkEmpty && opts.annotationCount === 0 && !opts.isSaving) {
            e.preventDefault();
            opts.onSaveEmpty();
          }
          return;
        case "a":
          e.preventDefault();
          opts.onSetToolMode(ToolMode.SELECT);
          return;
        case "r":
          e.preventDefault();
          opts.onSetToolMode(ToolMode.DRAW_BBOX);
          return;
        case "p":
          e.preventDefault();
          opts.onSetToolMode(ToolMode.DRAW_POLYGON);
          return;
        case "m":
          e.preventDefault();
          opts.onSetToolMode(ToolMode.PAN);
          return;
        case "c":
          e.preventDefault();
          opts.onToggleCrosshair();
          return;
        case "arrowdown": {
          e.preventDefault();
          if (opts.tasks.length === 0) return;
          const idx = opts.tasks.findIndex((t) => t.id === opts.selectedTaskId);
          if (idx < opts.tasks.length - 1) {
            opts.onSelectTask(opts.tasks[idx + 1].id);
          } else if (opts.page < opts.totalPages) {
            opts.onChangePage(opts.page + 1, "first");
          }
          return;
        }
        case "arrowup": {
          e.preventDefault();
          if (opts.tasks.length === 0) return;
          const idx = opts.tasks.findIndex((t) => t.id === opts.selectedTaskId);
          if (idx > 0) {
            opts.onSelectTask(opts.tasks[idx - 1].id);
          } else if (opts.page > 1) {
            opts.onChangePage(opts.page - 1, "last");
          }
          return;
        }
        case "arrowright": {
          if (opts.labels.length === 0) return;
          e.preventDefault();
          const idx = opts.labels.findIndex(
            (l) => l.id === opts.activeLabel?.id,
          );
          const next =
            opts.labels[(idx + 1 + opts.labels.length) % opts.labels.length];
          opts.onSelectLabel(next.id);
          return;
        }
        case "arrowleft": {
          if (opts.labels.length === 0) return;
          e.preventDefault();
          const idx = opts.labels.findIndex(
            (l) => l.id === opts.activeLabel?.id,
          );
          const prev =
            opts.labels[(idx - 1 + opts.labels.length) % opts.labels.length];
          opts.onSelectLabel(prev.id);
          return;
        }
      }

      // Number shortcuts: 1-9 → labels 0..8, 0 → label 9
      if (/^[0-9]$/.test(e.key)) {
        const labelIndex = e.key === "0" ? 9 : Number(e.key) - 1;
        if (labelIndex < opts.labels.length) {
          e.preventDefault();
          opts.onSelectLabel(opts.labels[labelIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
};
