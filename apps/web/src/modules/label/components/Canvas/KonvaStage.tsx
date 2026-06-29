import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import Konva from "konva";
import { Annotation, ToolMode } from "../../types/annotations";
import { BoundingBox } from "./BoundingBox";
import { PolygonRegion } from "./PolygonRegion";
import { DrawingRegion } from "./DrawingRegion";

export interface KonvaStageHandle {
  cancelDrawing: () => void;
  /** Captures the current Konva node positions for the given annotations so that
   *  applyNudge can express the offset relative to the hold-start position. */
  startNudge: (selectedIds: Set<string>) => void;
  /** Moves selected annotation nodes imperatively by (dxPx, dyPx) image-pixels
   *  from their hold-start positions, then calls batchDraw. No React state update. */
  applyNudge: (dxPx: number, dyPx: number) => void;
  /** Resets nodes to their hold-start positions before the final setAnnotations commit. */
  clearNudge: () => void;
}

interface KonvaStageProps {
  width: number;
  height: number;
  image: HTMLImageElement;
  scale: number;
  position: { x: number; y: number };
  toolMode: ToolMode;
  readOnly?: boolean;
  annotations: Annotation[];
  selectedAnnotationIds: Set<string>;
  primarySelectedId: string | null;
  activeLabel: { id: string; name: string; color: string } | null;
  selectedVertex: { annotationId: string; index: number } | null;
  onSelect: (id: string | null, opts?: { additive?: boolean }) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onVertexSelect: (vertex: { annotationId: string; index: number } | null) => void;
  onGroupTranslate: (
    updates: Array<{ id: string; updates: Partial<Annotation> }>,
  ) => void;
  onZoomAtPoint: (pointer: { x: number; y: number }, factor: number) => void;
  onSetPosition: (pos: { x: number; y: number }) => void;
  showCrosshair: boolean;
}

export interface GroupDragApi {
  registerNode: (id: string, node: Konva.Node | null) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string) => void;
  /** Returns true if the drag was a group drag and the parent will commit
   *  the updates (the region must NOT call its own onUpdate). Returns false
   *  for single-region drags — the region commits its own update as normal. */
  onDragEnd: (id: string) => boolean;
}

const CLOSE_THRESHOLD = 10;
const CROSSHAIR_V_INIT = [0, -1e6, 0, 1e6];
const CROSSHAIR_H_INIT = [-1e6, 0, 1e6, 0];

function pointInPolygon(x: number, y: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const KonvaStage = forwardRef<KonvaStageHandle, KonvaStageProps>(({
  width,
  height,
  image,
  scale,
  position,
  toolMode,
  annotations,
  selectedAnnotationIds,
  primarySelectedId,
  activeLabel,
  selectedVertex,
  onSelect,
  onAddAnnotation,
  onUpdateAnnotation,
  onVertexSelect,
  onGroupTranslate,
  onZoomAtPoint,
  onSetPosition,
  showCrosshair,
  readOnly = false,
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  // Mirror `position` into a ref so the middle-mouse-pan handler can read the
  // latest value without re-binding its window listeners.
  const positionRef = useRef(position);
  useLayoutEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Crosshair is updated imperatively via Konva refs (not React state) so it
  // can keep up with high-frequency mousemove events without triggering a
  // full re-render of the stage on every pixel.
  const crosshairLayerRef = useRef<Konva.Layer>(null);
  const crosshairVHaloRef = useRef<Konva.Line>(null);
  const crosshairHHaloRef = useRef<Konva.Line>(null);
  const crosshairVCoreRef = useRef<Konva.Line>(null);
  const crosshairHCoreRef = useRef<Konva.Line>(null);

  const updateCrosshair = useCallback((x: number, y: number) => {
    const layer = crosshairLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    // Compute visible image-space bounds so line geometry is viewport-sized.
    // ±1e6 in image space causes millions of dash segments at high zoom levels
    // which tanks Chrome's Canvas2D dashed-stroke performance.
    const sx = stage.scaleX();
    const sy = stage.scaleY();
    const px = stage.x();
    const py = stage.y();
    const w = stage.width();
    const h = stage.height();
    const x0 = -px / sx;
    const x1 = (w - px) / sx;
    const y0 = -py / sy;
    const y1 = (h - py) / sy;

    crosshairVHaloRef.current?.points([x, y0, x, y1]);
    crosshairVCoreRef.current?.points([x, y0, x, y1]);
    crosshairHHaloRef.current?.points([x0, y, x1, y]);
    crosshairHCoreRef.current?.points([x0, y, x1, y]);
    if (!layer.visible()) layer.visible(true);
    layer.batchDraw();
  }, []);

  const hideCrosshair = useCallback(() => {
    const layer = crosshairLayerRef.current;
    if (!layer || !layer.visible()) return;
    layer.visible(false);
    layer.batchDraw();
  }, []);
  // Registry of each region's "anchor" Konva node (Rect for bbox, Line for
  // polygon). Used to imperatively move siblings during a multi-selection
  // drag without paying the cost of a React re-render per pointer move.
  const regionNodesRef = useRef<Map<string, Konva.Node>>(new Map());
  const registerNode = useCallback(
    (id: string, node: Konva.Node | null) => {
      if (node) regionNodesRef.current.set(id, node);
      else regionNodesRef.current.delete(id);
    },
    [],
  );
  // Captured at drag start. Null when not in a group drag.
  const groupDragRef = useRef<{
    startPositions: Map<string, {
      x: number;
      y: number;
      /** Pre-cached vertex circles for polygon nodes — avoids per-frame findOne() walks. */
      circles?: Array<{ node: Konva.Circle; baseX: number; baseY: number }>;
    }>;
  } | null>(null);

  // Keep these as refs so the drag handlers given to children stay stable
  // across renders (children register the node once on mount).
  const selectedIdsRef = useRef(selectedAnnotationIds);
  const annotationsRef = useRef(annotations);
  const imgWRef = useRef(0);
  const imgHRef = useRef(0);
  useLayoutEffect(() => {
    selectedIdsRef.current = selectedAnnotationIds;
    annotationsRef.current = annotations;
  });

  const handleGroupDragStart = useCallback((draggedId: string) => {
    const selected = selectedIdsRef.current;
    if (selected.size < 2 || !selected.has(draggedId)) {
      groupDragRef.current = null;
      return;
    }
    const iw = imgWRef.current;
    const ih = imgHRef.current;
    const startPositions = new Map<string, {
      x: number;
      y: number;
      circles?: Array<{ node: Konva.Circle; baseX: number; baseY: number }>;
    }>();
    for (const id of selected) {
      const node = regionNodesRef.current.get(id);
      if (!node) continue;
      const info: { x: number; y: number; circles?: Array<{ node: Konva.Circle; baseX: number; baseY: number }> } = {
        x: node.x(),
        y: node.y(),
      };
      // Pre-cache vertex circles for polygon nodes so handleGroupDragMove can
      // move them in O(1) without per-frame findOne() selector walks.
      if (node.getClassName() === "Line") {
        const ann = annotationsRef.current.find((a) => a.id === id);
        if (ann?.type === "polygon" && ann.points) {
          const layer = node.getLayer();
          const circles: Array<{ node: Konva.Circle; baseX: number; baseY: number }> = [];
          ann.points.forEach(([px, py], i) => {
            const c = layer?.findOne<Konva.Circle>(`#vertex-${id}-${i}`);
            if (c) circles.push({ node: c, baseX: (px / 100) * iw, baseY: (py / 100) * ih });
          });
          if (circles.length > 0) info.circles = circles;
        }
      }
      startPositions.set(id, info);
    }
    groupDragRef.current = { startPositions };
    // Rasterise each selected node into a bitmap (shadow included) so
    // batchDraw blits it per frame instead of recomputing the Gaussian blur.
    for (const id of startPositions.keys()) {
      regionNodesRef.current.get(id)?.cache();
    }
  }, []);

  const handleGroupDragMove = useCallback((draggedId: string) => {
    const state = groupDragRef.current;
    if (!state) return;
    const draggedNode = regionNodesRef.current.get(draggedId);
    const draggedStart = state.startPositions.get(draggedId);
    if (!draggedNode || !draggedStart) return;
    const dx = draggedNode.x() - draggedStart.x;
    const dy = draggedNode.y() - draggedStart.y;
    let layer: Konva.Layer | null = null;
    for (const [id, start] of state.startPositions) {
      if (id === draggedId) continue;
      const otherNode = regionNodesRef.current.get(id);
      if (!otherNode) continue;
      otherNode.x(start.x + dx);
      otherNode.y(start.y + dy);
      layer = otherNode.getLayer();
      // Move pre-cached vertex circles — avoids per-frame findOne() selector walks.
      start.circles?.forEach(({ node: c, baseX, baseY }) => {
        c.x(baseX + dx);
        c.y(baseY + dy);
      });
    }
    layer?.batchDraw();
  }, []);

  const handleGroupDragEnd = useCallback(
    (draggedId: string) => {
      const state = groupDragRef.current;
      if (!state) return false;
      // Restore live rendering before react-konva reconciles final positions.
      for (const id of state.startPositions.keys()) {
        regionNodesRef.current.get(id)?.clearCache();
      }
      groupDragRef.current = null;
      const draggedNode = regionNodesRef.current.get(draggedId);
      const draggedStart = state.startPositions.get(draggedId);
      if (!draggedNode || !draggedStart) return false;
      const dxPx = draggedNode.x() - draggedStart.x;
      const dyPx = draggedNode.y() - draggedStart.y;
      const iw = imgWRef.current;
      const ih = imgHRef.current;
      if (iw === 0 || ih === 0) return false;
      const dxPct = (dxPx / iw) * 100;
      const dyPct = (dyPx / ih) * 100;
      const updates: Array<{ id: string; updates: Partial<Annotation> }> = [];
      for (const id of state.startPositions.keys()) {
        const ann = annotationsRef.current.find((a) => a.id === id);
        if (!ann) continue;
        if (ann.type === "bbox" && ann.bbox) {
          updates.push({
            id,
            updates: {
              bbox: { ...ann.bbox, x: ann.bbox.x + dxPct, y: ann.bbox.y + dyPct },
            },
          });
        } else if (ann.type === "polygon" && ann.points) {
          // Polygons use the Line's x/y as a drag offset; reset to 0 so the
          // upcoming re-render (with shifted points) isn't double-translated.
          const node = regionNodesRef.current.get(id);
          if (node) node.position({ x: 0, y: 0 });
          updates.push({
            id,
            updates: {
              points: ann.points.map(
                ([px, py]) => [px + dxPct, py + dyPct] as [number, number],
              ),
            },
          });
        }
      }
      if (updates.length > 0) onGroupTranslate(updates);
      return true;
    },
    [onGroupTranslate],
  );

  // Memoised so children's registerNode effect ([annotation.id, groupDrag])
  // doesn't re-run on every render — all four callbacks are useCallback-stable.
  const groupDragApi = useMemo<GroupDragApi>(
    () => ({
      registerNode,
      onDragStart: handleGroupDragStart,
      onDragMove: handleGroupDragMove,
      onDragEnd: handleGroupDragEnd,
    }),
    [registerNode, handleGroupDragStart, handleGroupDragMove, handleGroupDragEnd],
  );

  const [drawingBBox, setDrawingBBox] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const cancelDrawing = useCallback(() => {
    setPolygonPoints([]);
    setCursorPos(null);
    setDrawingBBox(null);
  }, []);

  interface NudgeStartInfo {
    x: number;
    y: number;
    /** Vertex circle nodes for the polygon, with their base positions.
     *  Moved in lockstep with the Line via x/y offset so handles track the body. */
    circles?: Array<{ node: Konva.Circle; baseX: number; baseY: number }>;
  }
  const nudgeStartRef = useRef<Map<string, NudgeStartInfo>>(new Map());

  const startNudge = useCallback((selectedIds: Set<string>) => {
    nudgeStartRef.current.clear();
    for (const id of selectedIds) {
      const node = regionNodesRef.current.get(id);
      if (!node) continue;
      const info: NudgeStartInfo = { x: node.x(), y: node.y() };
      // Pre-cache vertex circles for polygon Lines (lockstep movement).
      if (node.getClassName() === "Line") {
        const flatPoints = (node as Konva.Line).points();
        const layer = node.getLayer();
        const circles: NudgeStartInfo["circles"] = [];
        for (let i = 0; i < flatPoints.length / 2; i++) {
          const circle = layer?.findOne<Konva.Circle>(`#vertex-${id}-${i}`);
          if (circle) circles.push({ node: circle, baseX: flatPoints[2 * i], baseY: flatPoints[2 * i + 1] });
        }
        if (circles.length > 0) info.circles = circles;
      }
      nudgeStartRef.current.set(id, info);
      // Rasterise node (shadow included) so draw() blits the bitmap each
      // animation frame instead of recomputing the Gaussian blur.
      node.cache();
    }
  }, []);

  const applyNudge = useCallback((dxPx: number, dyPx: number) => {
    let layer: Konva.Layer | null = null;
    for (const [id, start] of nudgeStartRef.current) {
      const node = regionNodesRef.current.get(id);
      if (!node) continue;
      // Both Rects and Lines move via x/y offset — the cached bitmap (baked
      // with shadow) is translated by Konva without recomputing the blur.
      node.x(start.x + dxPx);
      node.y(start.y + dyPx);
      // Move vertex handles in lockstep (polygon Lines only).
      start.circles?.forEach(({ node: circle, baseX, baseY }) => {
        circle.x(baseX + dxPx);
        circle.y(baseY + dyPx);
      });
      layer = node.getLayer();
    }
    // Use draw() (synchronous) rather than batchDraw() (deferred rAF) so the
    // canvas updates in the same frame as the node move. batchDraw would paint
    // one frame late, causing a visible "final nudge" after the user releases
    // the key because the canvas catches up in the next rAF after keyup.
    layer?.draw();
  }, []);

  const clearNudge = useCallback(() => {
    for (const [id] of nudgeStartRef.current) {
      const node = regionNodesRef.current.get(id);
      if (!node) continue;
      node.clearCache();
      // Polygon Lines were nudged via x/y offset; reset to (0,0) before
      // react-konva reconciles the final points array (which is at x=0, y=0 base).
      if (node.getClassName() === "Line") node.position({ x: 0, y: 0 });
    }
    nudgeStartRef.current.clear();
  }, []);

  useImperativeHandle(
    ref,
    () => ({ cancelDrawing, startNudge, applyNudge, clearNudge }),
    [cancelDrawing, startNudge, applyNudge, clearNudge],
  );

  // Middle-mouse drag pan (works in any tool mode)
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let prevCursor = "";

    const onDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      panning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      prevCursor = container.style.cursor;
      container.style.cursor = "grabbing";
    };
    const onMove = (e: MouseEvent) => {
      if (!panning) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      onSetPosition({
        x: positionRef.current.x + dx,
        y: positionRef.current.y + dy,
      });
    };
    const onUp = (e: MouseEvent) => {
      if (e.button !== 1 || !panning) return;
      panning = false;
      container.style.cursor = prevCursor;
    };
    // Suppress middle-click auto-scroll bubble on Linux/Windows
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    container.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    container.addEventListener("auxclick", onAuxClick);
    return () => {
      container.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      container.removeEventListener("auxclick", onAuxClick);
    };
  }, [onSetPosition]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && polygonPoints.length > 0) {
        e.preventDefault();
        cancelDrawing();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (polygonPoints.length === 0) return;
      const container = stageRef.current?.container();
      if (container && !container.contains(e.target as Node)) {
        cancelDrawing();
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [polygonPoints.length, cancelDrawing]);

  // Native mousemove tracks the cursor even while a child annotation is being
  // dragged (Konva's onMouseMove does not fire during child drags).
  useEffect(() => {
    if (!showCrosshair) return;
    const container = stageRef.current?.container();
    if (!container) return;
    const onMove = (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = container.getBoundingClientRect();
      const imgX = (e.clientX - rect.left - stage.x()) / stage.scaleX();
      const imgY = (e.clientY - rect.top - stage.y()) / stage.scaleY();
      updateCrosshair(imgX, imgY);
    };
    container.addEventListener("mousemove", onMove);
    return () => container.removeEventListener("mousemove", onMove);
  }, [showCrosshair, updateCrosshair]);

  useEffect(() => {
    cancelDrawing();
  }, [toolMode, cancelDrawing]);

  const imgW = image.width;
  const imgH = image.height;
  imgWRef.current = imgW;
  imgHRef.current = imgH;

  const getImageCoords = useCallback(
    (stage: Konva.Stage) => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      return {
        x: (pointer.x - position.x) / scale,
        y: (pointer.y - position.y) / scale,
      };
    },
    [position, scale],
  );

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom — exponential factor proportional to wheel delta so trackpad
      // (many small deltas) and mouse (few large deltas) both feel natural.
      const delta = e.evt.deltaY;
      const factor = Math.exp(-delta * 0.01);
      onZoomAtPoint(pointer, factor);
    } else {
      onSetPosition({
        x: position.x - e.evt.deltaX,
        y: position.y - e.evt.deltaY,
      });
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    const stage = e.target.getStage();
    if (!stage) return;

    if (readOnly) return;

    if (toolMode === ToolMode.DRAW_BBOX && activeLabel) {
      const coords = getImageCoords(stage);
      if (!coords) return;
      if (drawingBBox !== null) {
        // Already have a first anchor; let mouseup handle commit.
        return;
      }
      setDrawingBBox({
        startX: coords.x,
        startY: coords.y,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
      });
    }

  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    if (toolMode === ToolMode.DRAW_BBOX && drawingBBox) {
      let dx = coords.x - drawingBBox.startX;
      let dy = coords.y - drawingBBox.startY;
      if (e.evt.shiftKey) {
        const size = Math.min(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx) * size;
        dy = Math.sign(dy) * size;
      }
      const endX = drawingBBox.startX + dx;
      const endY = drawingBBox.startY + dy;
      setDrawingBBox({
        ...drawingBBox,
        x: Math.min(drawingBBox.startX, endX),
        y: Math.min(drawingBBox.startY, endY),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    }

    if (toolMode === ToolMode.DRAW_POLYGON && polygonPoints.length > 0) {
      setCursorPos(coords);
    }
  };

  const handleMouseLeave = () => {
    if (showCrosshair) hideCrosshair();
    if (polygonPoints.length === 0) setCursorPos(null);
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    if (toolMode === ToolMode.DRAW_BBOX && drawingBBox && activeLabel) {
      if (drawingBBox.width > 2 && drawingBBox.height > 2) {
        onAddAnnotation({
          id: `ann-${Date.now()}`,
          labelId: activeLabel.id,
          labelName: activeLabel.name,
          color: activeLabel.color,
          type: "bbox",
          bbox: {
            x: (drawingBBox.x / imgW) * 100,
            y: (drawingBBox.y / imgH) * 100,
            width: (drawingBBox.width / imgW) * 100,
            height: (drawingBBox.height / imgH) * 100,
          },
        });
        setDrawingBBox(null);
      }
      // else: small/zero drag → stay in two-click mode awaiting second click
    }
  };

  const handleDblClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (toolMode !== ToolMode.SELECT) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    // Find every annotation whose hit area contains the cursor
    const hitIds: string[] = [];
    for (const ann of annotations) {
      if (ann.type === "bbox" && ann.bbox) {
        const ax = (ann.bbox.x / 100) * imgW;
        const ay = (ann.bbox.y / 100) * imgH;
        const aw = (ann.bbox.width / 100) * imgW;
        const ah = (ann.bbox.height / 100) * imgH;
        if (
          coords.x >= ax &&
          coords.x <= ax + aw &&
          coords.y >= ay &&
          coords.y <= ay + ah
        ) {
          hitIds.push(ann.id);
        }
      } else if (ann.type === "polygon" && ann.points && ann.points.length >= 3) {
        const pts = ann.points.map(
          ([px, py]) => [(px / 100) * imgW, (py / 100) * imgH] as [number, number],
        );
        if (pointInPolygon(coords.x, coords.y, pts)) {
          hitIds.push(ann.id);
        }
      }
    }
    if (hitIds.length < 2) return;
    // Cycle one layer down (to the next annotation in array order, wrapping around).
    // Dbl-click collapses any multi-selection to a single primary.
    const currentPos = primarySelectedId
      ? hitIds.indexOf(primarySelectedId)
      : -1;
    const nextId = hitIds[(currentPos + 1) % hitIds.length];
    onSelect(nextId, { additive: false });
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    // Deselect when clicking empty area in SELECT mode
    if (toolMode === ToolMode.SELECT) {
      const stage = e.target.getStage();
      const clickedOnEmpty = e.target === stage || e.target.getParent()?.name() === "image";
      if (clickedOnEmpty) {
        onSelect(null);
      }
      return;
    }
    if (toolMode !== ToolMode.DRAW_POLYGON || !activeLabel) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const coords = getImageCoords(stage);
    if (!coords) return;

    if (polygonPoints.length >= 3) {
      const [firstX, firstY] = polygonPoints[0];
      const dx = coords.x - firstX;
      const dy = coords.y - firstY;
      if (Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESHOLD / scale) {
        // Close polygon
        onAddAnnotation({
          id: `ann-${Date.now()}`,
          labelId: activeLabel.id,
          labelName: activeLabel.name,
          color: activeLabel.color,
          type: "polygon",
          points: polygonPoints.map(([px, py]) => [
            (px / imgW) * 100,
            (py / imgH) * 100,
          ]),
        });
        setPolygonPoints([]);
        setCursorPos(null);
        return;
      }
    }

    setPolygonPoints((prev) => [...prev, [coords.x, coords.y]]);
  };

  const cursorStyle = () => {
    switch (toolMode) {
      case ToolMode.PAN:
        return "grab";
      case ToolMode.DRAW_BBOX:
      case ToolMode.DRAW_POLYGON:
        return "crosshair";
      default:
        return "default";
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable={toolMode === ToolMode.PAN}
      onDragEnd={(e) => {
        if (toolMode === ToolMode.PAN) {
          onSetPosition({ x: e.target.x(), y: e.target.y() });
        }
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      style={{ cursor: cursorStyle() }}
    >
      <Layer name="image">
        <KonvaImage image={image} width={imgW} height={imgH} listening={false} />
      </Layer>
      <Layer name="regions">
        {[...annotations]
          .sort(
            (a, b) =>
              Number(selectedAnnotationIds.has(a.id)) -
              Number(selectedAnnotationIds.has(b.id)),
          )
          .map((ann) => {
            const isSelected = selectedAnnotationIds.has(ann.id);
            const showHandles = isSelected;
            return ann.type === "bbox" && ann.bbox ? (
              <BoundingBox
                key={ann.id}
                annotation={ann}
                imageWidth={imgW}
                imageHeight={imgH}
                isSelected={isSelected}
                showHandles={showHandles}
                toolMode={toolMode}
                readOnly={readOnly}
                onSelect={onSelect}
                onUpdate={onUpdateAnnotation}
                groupDrag={groupDragApi}
              />
            ) : ann.type === "polygon" && ann.points ? (
              <PolygonRegion
                key={ann.id}
                annotation={ann}
                imageWidth={imgW}
                imageHeight={imgH}
                isSelected={isSelected}
                showHandles={showHandles}
                toolMode={toolMode}
                readOnly={readOnly}
                stageScale={scale}
                selectedVertexIndex={selectedVertex?.annotationId === ann.id ? selectedVertex.index : null}
                onSelect={onSelect}
                onUpdate={onUpdateAnnotation}
                onVertexSelect={(index) => onVertexSelect({ annotationId: ann.id, index })}
                groupDrag={groupDragApi}
              />
            ) : null;
          })}
      </Layer>
      {showCrosshair && (
        <Layer
          ref={crosshairLayerRef}
          name="crosshair"
          listening={false}
          visible={false}
        >
          {/* Dark halo so the bright core stays visible on any background */}
          <Line
            ref={crosshairVHaloRef}
            points={CROSSHAIR_V_INIT}
            stroke="rgba(0,0,0,0.7)"
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          <Line
            ref={crosshairHHaloRef}
            points={CROSSHAIR_H_INIT}
            stroke="rgba(0,0,0,0.7)"
            strokeWidth={2}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          {/* Bright core dashed line */}
          <Line
            ref={crosshairVCoreRef}
            points={CROSSHAIR_V_INIT}
            stroke="#ef4444"
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
          <Line
            ref={crosshairHCoreRef}
            points={CROSSHAIR_H_INIT}
            stroke="#ef4444"
            strokeWidth={1}
            strokeScaleEnabled={false}
            dash={[6, 4]}
            dashEnabled
          />
        </Layer>
      )}
      <Layer name="drawing">
        <DrawingRegion
          toolMode={toolMode}
          drawingBBox={
            drawingBBox
              ? { x: drawingBBox.x, y: drawingBBox.y, width: drawingBBox.width, height: drawingBBox.height }
              : null
          }
          polygonPoints={polygonPoints}
          cursorPosition={cursorPos}
          color={activeLabel?.color ?? "#6366f1"}
          stageScale={scale}
        />
      </Layer>
    </Stage>
  );
});

