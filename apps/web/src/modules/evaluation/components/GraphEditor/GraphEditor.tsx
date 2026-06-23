import { cn } from "@/lib/utils";
import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { EditorDebugOverlay } from "@/modules/evaluation/graph/editor/debug/EditorDebugOverlay";
import {
  useGetEvalTestCaseFullQuery,
  useUpdateEvalTestCaseFullMutation,
} from "@/modules/evaluation/api/evaluationApi";
import { deserializeTestCase } from "@/modules/evaluation/graph/editor/deserialization/deserializeTestCase";
import { serializeTestCase } from "@/modules/evaluation/graph/editor/serialization/serializeTestCase";
import { toFullCreateOrUpdate } from "@/modules/evaluation/graph/editor/serialization/toFullCreateOrUpdate";
import { createEditor } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { installTestHook } from "@/modules/evaluation/graph/workspace/testHook";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import {
  Keyboard,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RefreshCw,
  RefreshCwOff,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NodeEditor } from "rete";
import { useRete } from "rete-react-plugin";
import { toast } from "sonner";
import { GraphKeybindsDialog } from "./GraphKeybindsDialog";

const MIN_HEIGHT = 240;
const DEFAULT_HEIGHT = 480;
// Leave room for surrounding chrome when dragging toward the bottom of the viewport.
const VIEWPORT_MARGIN = 120;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type Props = {
  projectId: number;
  configId: number;
  testCaseId: string;
};

export const GraphEditor = ({ projectId, configId, testCaseId }: Props) => {
  const editorRef = useRef<Awaited<ReturnType<typeof createEditor>> | null>(
    null,
  );
  const [autoValidationEnabled, setAutoValidationEnabled] = useState(false);
  const [editor, setEditor] = useState<NodeEditor<Schemes> | null>(null);
  const [keybindsOpen, setKeybindsOpen] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [maximized, setMaximized] = useState(false);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  // Read lazily by the `mod+s` shortcut so it always runs the latest handleSave
  // (which closes over testCaseData) without recreating the editor.
  const saveRef = useRef<() => void>(() => {});

  // Project labels feed the Limit-node selectors. They're read lazily via a ref so
  // node-creation sites (context menu, shortcut, deserialize) always see the latest
  // set — the editor mounts immediately and doesn't need to wait for the query.
  const { data: projectLabels, isSuccess: labelsLoaded } =
    useGetProjectLabelsQuery({ projectId });
  const labelsRef = useRef<LabelOption[]>([]);
  labelsRef.current = useMemo<LabelOption[]>(
    () =>
      (projectLabels ?? []).map((label) => ({
        id: label.id,
        name: label.name,
      })),
    [projectLabels],
  );

  const handleResizePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    dragStart.current = { y: event.clientY, height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragStart.current) return;

    const maxHeight = Math.max(
      MIN_HEIGHT,
      window.innerHeight - VIEWPORT_MARGIN,
    );
    const delta = event.clientY - dragStart.current.y;
    setHeight(clamp(dragStart.current.height + delta, MIN_HEIGHT, maxHeight));
  };

  const handleResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const create = useCallback((el: HTMLElement) => {
    const instance = createEditor(
      el,
      (text, type) => {
        if (type === "error") {
          toast.error(text);
          return;
        }

        toast.success(text);
      },
      {
        toggleFullscreen: () => setMaximized((value) => !value),
        getLabels: () => labelsRef.current,
        save: () => saveRef.current(),
      },
    );

    Promise.resolve(instance).then((result) => {
      editorRef.current = result;
      setAutoValidationEnabled(result.validation.isLiveValidationEnabled());
      setEditor(result.editor);
      installTestHook({ editor: result.editor, area: result.area });
    });

    return instance;
  }, []);

  const [ref] = useRete(create);

  // Loads the saved test case into the editor once both the editor instance and the
  // fetched data are ready. `editor` (state) flips non-null in the same tick the full
  // instance lands in editorRef, so it's a safe readiness trigger. projectLabels is a
  // dep so a late labels response re-runs the load and the limit nodes resolve names.
  // GraphEditor mounts fresh each time the graph view opens, so refetch on mount to
  // pick up anything the table view changed while the graph was hidden.
  const { data: testCaseData } = useGetEvalTestCaseFullQuery(
    {
      projectId,
      configId,
      testCaseId,
    },
    { refetchOnMountOrArgChange: true },
  );
  const [updateTestCaseFull, { isLoading: isSaving }] =
    useUpdateEvalTestCaseFullMutation();

  // Hides the deserialize + auto-arrange "jump" behind an opaque overlay that fades
  // out once the layout has settled (see the overlay in the JSX). Starts hidden so the
  // overlay covers the canvas from mount until the first load finishes.
  const [ready, setReady] = useState(false);

  // Deserialize ONCE per mount. The graph only mounts in graph view, so every later
  // testCaseData change is self-induced by our own save (the cache patch + refetch) —
  // re-deserializing then would needlessly rebuild + re-arrange the canvas (the "jump"
  // on save). External edits (made in the table view, with the graph unmounted) are
  // picked up on remount via refetchOnMountOrArgChange.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const instance = editorRef.current;
    if (hasLoadedRef.current) return;
    if (!instance || !editor || !testCaseData) return;
    // Wait for labels so limit nodes resolve their names on the first (only) load.
    if (!labelsLoaded) return;

    hasLoadedRef.current = true;
    let cancelled = false;
    setReady(false);

    void (async () => {
      try {
        const payload = toFullCreateOrUpdate(testCaseData);

        await deserializeTestCase(
          instance.editor,
          instance.area,
          payload,
          labelsRef.current,
          instance.selectableNodes,
        );
        if (cancelled) return;

        await instance.arrange.layout();
      } catch (error) {
        if (cancelled) return;
        toast.error(
          error instanceof Error
            ? `Failed to load test case: ${error.message}`
            : "Failed to load test case.",
        );
      } finally {
        // Reveal once the layout settled (or load failed — don't trap the canvas).
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, testCaseData, labelsLoaded]);

  const toggleValidation = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    const isEnabled = instance.validation.isLiveValidationEnabled();

    if (!isEnabled) {
      await instance.validation.runValidation();
      instance.validation.enableLiveValidation();
      setAutoValidationEnabled(true);
      return;
    }

    instance.validation.disableLiveValidation();
    await instance.validation.clearValidation();
    setAutoValidationEnabled(false);
  };

  const handleSave = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    if (!testCaseData) {
      toast.error("Test case is still loading. Try again in a moment.");
      return;
    }

    const validationResult = await instance.validation.validateNow();

    if (!instance.validation.isLiveValidationEnabled()) {
      instance.validation.enableLiveValidation();
      setAutoValidationEnabled(true);
    }

    if (!validationResult.valid) {
      toast.error("Graph contains errors. Fix them before saving.");
      return;
    }

    // The graph owns only the flow (limits, items, logic, severity, type). name and
    // enabled are owned by the table-view UI, so carry them over from the loaded data.
    const body = serializeTestCase(instance.editor, {
      name: testCaseData.name,
    });
    body.enabled = testCaseData.enabled;

    try {
      const saved = await updateTestCaseFull({
        projectId,
        configId,
        testCaseId,
        body,
      }).unwrap();

      // Surface a silent partial save: compare what the server stored against what we
      // sent (same-origin ids). Catches fields the /full endpoint may drop (e.g. limit
      // `enabled`) instead of failing silently.
      const diverged = (body.limits ?? []).some((sent) => {
        if (!sent.id) return false;
        const persisted = saved.limits.find((limit) => limit.id === sent.id);
        return persisted ? persisted.enabled !== sent.enabled : false;
      });

      if (diverged) {
        toast.warning(
          "Saved, but some changes didn't persist on the server.",
        );
      } else {
        toast.success("Test case saved.");
      }
    } catch {
      toast.error("Failed to save test case.");
    }
  };

  // Keep the mod+s shortcut pointed at the current handleSave.
  saveRef.current = handleSave;

  const handleArrange = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    await instance.arrange.layout();
    toast.success("Arranged layout.");
  };

  return (
    <div
      className={cn(
        // `isolate` traps the toolbar's z-50 in this editor's own stacking context, so
        // sibling editor instances can't bleed over a maximized one.
        "relative isolate w-full overflow-hidden rounded-md border bg-background",
        maximized && "fixed inset-0 z-50 rounded-none border-0",
      )}
      style={maximized ? undefined : { height }}
    >
      <div ref={ref} className="h-full w-full" data-testid="editor-canvas" />
      {editor && <EditorDebugOverlay editor={editor} />}
      {/* Masks the deserialize + auto-arrange jump until the layout settles, then
          fades out. `pointer-events-none` so it never intercepts clicks (even
          mid-fade); z-40 keeps it under the z-50 toolbar so the buttons stay visible. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-40 bg-background transition-opacity duration-700 ease-out",
          ready ? "opacity-0" : "opacity-100",
        )}
      />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-50 flex justify-between gap-2">
        <Button
          className="pointer-events-auto"
          variant="outline"
          size="icon"
          aria-label={maximized ? "Exit full screen" : "Full screen"}
          onClick={() => setMaximized((value) => !value)}
        >
          {maximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
        <div className="pointer-events-auto flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setKeybindsOpen(true)}
          >
            <Keyboard />
          </Button>
          <Button variant="outline" size="icon" onClick={handleArrange}>
            <LayoutGrid />
          </Button>
          <Button
            variant={autoValidationEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleValidation}
          >
            {autoValidationEnabled ? <RefreshCw /> : <RefreshCwOff />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save />
          </Button>
        </div>
      </div>
      {!maximized && (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize editor"
          className="absolute inset-x-0 bottom-0 z-10 flex h-2.5 cursor-ns-resize items-center justify-center"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-border transition-colors hover:bg-muted-foreground/40" />
        </div>
      )}
      <GraphKeybindsDialog open={keybindsOpen} onOpenChange={setKeybindsOpen} />
    </div>
  );
};
