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
  /** Imperative Konva nudge callbacks from the canvas. When provided, all
   *  visual updates during the hold are done via Konva node moves + batchDraw,
   *  with zero React re-renders. setAnnotations fires exactly once on keyup. */
  startNudge?: (selectedIds: Set<string>) => void;
  applyNudge?: (dxPx: number, dyPx: number) => void;
  clearNudge?: () => void;
}

const STEP = 5; // px per single tap
const HOLD_SPEED = 120; // px/s during rAF-driven hold
const HOLD_DELAY = 200; // ms dead window after tap before continuous motion starts
const MAX_FRAME_PX = 12; // cap per-frame motion to avoid teleport on a slow frame

// Unit direction vectors — actual pixel magnitude computed at nudge time
const ARROW_DELTA: Record<string, { dx: number; dy: number }> = {
  arrowup:    { dx:  0, dy: -1 },
  arrowdown:  { dx:  0, dy:  1 },
  arrowleft:  { dx: -1, dy:  0 },
  arrowright: { dx:  1, dy:  0 },
};

const isFromFormField = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  return !!(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
};

/**
 * Handles Shift+Arrow keyboard nudging of selected annotations.
 *
 * Tap (press and release ≤200ms) = exact 5px nudge; one undo entry.
 * Hold (≥200ms) = smooth continuous motion at 120px/s via requestAnimationFrame.
 *
 * When the canvas exposes startNudge/applyNudge/clearNudge (via CanvasHandle),
 * all visual updates during the hold are done imperatively via Konva node moves +
 * batchDraw — zero React re-renders during the hold. setAnnotations fires exactly
 * once on keyup, eliminating the Chrome stutter entirely.
 *
 * Positions are always computed from the hold-start snapshot + total accumulated
 * delta (idempotent), so closeBurst pushes a correct undo entry without reading
 * opts.annotations.
 *
 * useLabelShortcuts early-returns on shiftKey so these bindings don't conflict
 * with arrow navigation.
 */
export const useAnnotationNudge = (options: UseAnnotationNudgeOptions) => {
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const burstBeforeRef = useRef<Map<string, Annotation> | null>(null);
  const burstSelectionRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let heldArrows: string[] = [];
    let tapDeadline = 0;
    let lastFrameTs: number | null = null;
    let rafId: number | null = null;
    let totalDxPx = 0;
    let totalDyPx = 0;

    // Commits the final snapshot+delta positions to React state and pushes
    // the undo entry. Called once per hold on keyup/blur.
    const closeBurst = () => {
      const before = burstBeforeRef.current;
      const dx = totalDxPx;
      const dy = totalDyPx;
      totalDxPx = 0;
      totalDyPx = 0;
      burstBeforeRef.current = null;
      burstSelectionRef.current = null;
      if (!before || before.size === 0) return;

      const opts = optionsRef.current;
      const dims = opts.imageDimsRef.current;
      if (!dims || dims.width === 0 || dims.height === 0) return;
      if (dx === 0 && dy === 0) return;

      const dxPct = (dx / dims.width) * 100;
      const dyPct = (dy / dims.height) * 100;

      // Clear nudge bookkeeping. Node positions are left as-is; react-konva's
      // reconciliation will commit finalX ≈ currentImperativeX — no visible jump.
      opts.clearNudge?.();

      // Single React commit: final positions from snapshot + total delta.
      opts.setAnnotations((prev) =>
        prev.map((a) => {
          const original = before.get(a.id);
          if (!original) return a;
          if (original.type === "bbox" && original.bbox) {
            return { ...a, bbox: { ...original.bbox, x: original.bbox.x + dxPct, y: original.bbox.y + dyPct } };
          }
          if (original.type === "polygon" && original.points) {
            return {
              ...a,
              points: original.points.map(([px, py]) => [px + dxPct, py + dyPct] as [number, number]),
            };
          }
          return a;
        }),
      );

      const changes: Array<{ before: Annotation; after: Annotation }> = [];
      for (const [, prev] of before) {
        let after: Annotation;
        if (prev.type === "bbox" && prev.bbox) {
          after = { ...prev, bbox: { ...prev.bbox, x: prev.bbox.x + dxPct, y: prev.bbox.y + dyPct } };
        } else if (prev.type === "polygon" && prev.points) {
          after = { ...prev, points: prev.points.map(([px, py]) => [px + dxPct, py + dyPct] as [number, number]) };
        } else {
          continue;
        }
        changes.push({ before: prev, after });
      }
      if (changes.length > 0) opts.pushBatchEntry({ label: "move", changes });
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastFrameTs = null;
    };

    const tick = (now: number) => {
      if (heldArrows.length === 0) {
        stopLoop();
        return;
      }

      const dt = lastFrameTs !== null ? Math.min(now - lastFrameTs, 100) : 0;
      lastFrameTs = now;

      if (now >= tapDeadline) {
        const activeKey = heldArrows[heldArrows.length - 1];
        const delta = ARROW_DELTA[activeKey];
        const pixels = Math.min(HOLD_SPEED * dt / 1000, MAX_FRAME_PX);
        if (pixels > 0) {
          totalDxPx += pixels * delta.dx;
          totalDyPx += pixels * delta.dy;
          // Imperative Konva move — no React state update, no re-render.
          optionsRef.current.applyNudge?.(totalDxPx, totalDyPx);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId !== null) return;
      lastFrameTs = null;
      rafId = requestAnimationFrame(tick);
    };

    const openBurst = (arrowKey: string) => {
      const opts = optionsRef.current;
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
      // Capture start positions for imperative nudge, then apply the tap nudge.
      opts.startNudge?.(opts.selectedAnnotationIds);
      const delta = ARROW_DELTA[arrowKey];
      totalDxPx += STEP * delta.dx;
      totalDyPx += STEP * delta.dy;
      opts.applyNudge?.(totalDxPx, totalDyPx);
    };

    const keydown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      const arrowKey = e.key.toLowerCase();
      if (!ARROW_DELTA[arrowKey]) return;
      if (isFromFormField(e.target)) return;

      const opts = optionsRef.current;
      if (opts.selectedAnnotationIds.size === 0) return;
      if (opts.toolMode === ToolMode.DRAW_BBOX || opts.toolMode === ToolMode.DRAW_POLYGON) return;
      const dims = opts.imageDimsRef.current;
      if (!dims || dims.width === 0 || dims.height === 0) return;

      e.preventDefault();
      if (e.repeat) return;

      if (heldArrows.length === 0) {
        openBurst(arrowKey);
        tapDeadline = performance.now() + HOLD_DELAY;
        heldArrows = [arrowKey];
        startLoop();
      } else if (!heldArrows.includes(arrowKey)) {
        heldArrows = [...heldArrows, arrowKey];
      }
    };

    const keyup = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") {
        heldArrows = [];
        stopLoop();
        closeBurst();
        return;
      }
      if (ARROW_DELTA[k]) {
        heldArrows = heldArrows.filter((key) => key !== k);
        if (heldArrows.length === 0) {
          stopLoop();
          closeBurst();
        }
      }
    };

    const blur = () => {
      heldArrows = [];
      stopLoop();
      closeBurst();
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      stopLoop();
    };
  }, []);
};
