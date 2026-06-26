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
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from "@/modules/evaluation/graph/editor/constants";
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
  ScanEye,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NodeEditor } from "rete";
import { AreaExtensions } from "rete-area-plugin";
import { useRete } from "rete-react-plugin";
import { toast } from "sonner";
import { GraphKeybindsDialog } from "./GraphKeybindsDialog";

const MIN_HEIGHT = 240;
const DEFAULT_HEIGHT = 480;
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
  const saveRef = useRef<() => void>(() => {});
  const { data: projectLabels, isSuccess: labelsLoaded } = useGetProjectLabelsQuery({ projectId });
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

  const { data: testCaseData } = useGetEvalTestCaseFullQuery(
    {
      projectId,
      configId,
      testCaseId,
    },
    { refetchOnMountOrArgChange: true },
  );
  const [updateTestCaseFull, { isLoading: isSaving }] = useUpdateEvalTestCaseFullMutation();
  const [ready, setReady] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const instance = editorRef.current;
    if (hasLoadedRef.current) return;
    if (!instance || !editor || !testCaseData) return;
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

    const body = serializeTestCase(instance.editor, {
      name: testCaseData.name,
    });
    body.enabled = testCaseData.enabled;

    try {
      await updateTestCaseFull({
        projectId,
        configId,
        testCaseId,
        body,
      }).unwrap();

      toast.success("Test case saved.");
    } catch {
      toast.error("Failed to save test case.");
    }
  };

  saveRef.current = handleSave;

  const handleArrange = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    await instance.arrange.layout();
    toast.success("Arranged layout.");
  };

  const zoomBy = useCallback((step: number) => {
    const instance = editorRef.current;
    if (!instance) return;

    const { area } = instance;
    const { k } = area.area.transform;
    const next = clamp(k + step, ZOOM_MIN, ZOOM_MAX);
    if (next === k) return;

    const { width, height } = area.container.getBoundingClientRect();
    const delta = next / k - 1;
    void area.area.zoom(next, (-width / 2) * delta, (-height / 2) * delta);
  }, []);

  const handleFocus = useCallback(() => {
    const instance = editorRef.current;
    if (!instance) return;

    const nodes = instance.editor.getNodes();
    if (nodes.length === 0) return;
    void AreaExtensions.zoomAt(instance.area, nodes);
  }, []);

  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden rounded-md border bg-background",
        maximized && "fixed inset-0 z-50 rounded-none border-0",
      )}
      style={maximized ? undefined : { height }}
    >
      <div ref={ref} className="h-full w-full" data-testid="editor-canvas" />
      {editor && <EditorDebugOverlay editor={editor} />}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-40 bg-background transition-opacity duration-700 ease-out",
          ready ? "opacity-0" : "opacity-100",
        )}
      />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-50 flex justify-between gap-2">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            aria-label={maximized ? "Exit full screen" : "Full screen"}
            onClick={() => setMaximized((value) => !value)}
          >
            {maximized ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => zoomBy(-ZOOM_STEP)}
          >
            <ZoomOut />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Fit to view"
            onClick={handleFocus}
          >
            <ScanEye />
          </Button>
        </div>

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
