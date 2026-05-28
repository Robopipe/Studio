import { useEffect, useLayoutEffect, useRef } from "react";
import { Annotation, ToolMode } from "../types/annotations";

interface UseAnnotationNudgeOptions {
  annotations: Annotation[];
  selectedAnnotationIds: Set<string>;
  toolMode: ToolMode;
  imageDimsRef: React.RefObject<{ width: number; height: number }>;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  pushBatchEntry: (params: {
    label: "move";
    changes: Array<{ before: Annotation; after: Annotation }>;
  }) => void;
}

const STEP = 5;

const ARROW_DELTA: Record<string, { dx: number; dy: number }> = {
  arrowup:    { dx:  0, dy: -STEP },
  arrowdown:  { dx:  0, dy:  STEP },
  arrowleft:  { dx: -STEP, dy:  0 },
  arrowright: { dx:  STEP, dy:  0 },
};

const isFromFormField = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
};

/**
 * Handles Alt+Arrow keyboard nudging of selected annotations.
 * All nudges within a single key-hold are coalesced into one undo entry
 * (committed on keyup/blur). useLabelShortcuts already early-returns on
 * altKey, so these bindings don't conflict with existing arrow navigation.
 */
export const useAnnotationNudge = (options: UseAnnotationNudgeOptions) => {
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const burstBeforeRef = useRef<Map<string, Annotation> | null>(null);
  const burstSelectionRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const closeBurst = () => {
      const before = burstBeforeRef.current;
      burstBeforeRef.current = null;
      burstSelectionRef.current = null;
      if (!before || before.size === 0) return;
      const opts = optionsRef.current;
      const changes: Array<{ before: Annotation; after: Annotation }> = [];
      for (const [id, prev] of before) {
        const after = opts.annotations.find((a) => a.id === id);
        if (!after || after === prev) continue;
        changes.push({ before: prev, after });
      }
      if (changes.length > 0) opts.pushBatchEntry({ label: "move", changes });
    };

    const keydown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const delta = ARROW_DELTA[e.key.toLowerCase()];
      if (!delta) return;
      if (isFromFormField(e.target)) return;

      const opts = optionsRef.current;
      if (opts.selectedAnnotationIds.size === 0) return;
      if (opts.toolMode === ToolMode.DRAW_BBOX || opts.toolMode === ToolMode.DRAW_POLYGON) return;
      const dims = opts.imageDimsRef.current;
      if (!dims || dims.width === 0 || dims.height === 0) return;

      e.preventDefault();

      if (burstSelectionRef.current && burstSelectionRef.current !== opts.selectedAnnotationIds) {
        closeBurst();
      }

      if (!burstBeforeRef.current) {
        const snap = new Map<string, Annotation>();
        for (const a of opts.annotations) {
          if (opts.selectedAnnotationIds.has(a.id)) snap.set(a.id, a);
        }
        burstBeforeRef.current = snap;
        burstSelectionRef.current = opts.selectedAnnotationIds;
      }

      const { width, height } = dims;
      const dxPct = (delta.dx / width) * 100;
      const dyPct = (delta.dy / height) * 100;
      const selected = opts.selectedAnnotationIds;

      opts.setAnnotations((prev) =>
        prev.map((a) => {
          if (!selected.has(a.id)) return a;
          if (a.type === "bbox" && a.bbox) {
            return { ...a, bbox: { ...a.bbox, x: a.bbox.x + dxPct, y: a.bbox.y + dyPct } };
          }
          if (a.type === "polygon" && a.points) {
            return {
              ...a,
              points: a.points.map(([px, py]) => [px + dxPct, py + dyPct] as [number, number]),
            };
          }
          return a;
        }),
      );
    };

    const keyup = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright" || k === "alt") {
        closeBurst();
      }
    };

    const blur = () => closeBurst();

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
    };
  }, []);
};
