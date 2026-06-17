import { cn } from "@/lib/utils";
import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { EditorDebugOverlay } from "@/modules/evaluation/graph/editor/debug/EditorDebugOverlay";
import { deserializeTestCase } from "@/modules/evaluation/graph/editor/deserialization/deserializeTestCase";
import type { EvalTestCaseCreateOrUpdatePayload } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { serializeTestCase } from "@/modules/evaluation/graph/editor/serialization/serializeTestCase";
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
  RotateCcw,
  Save,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
};

export const GraphEditor = ({ projectId }: Props) => {
  const editorRef = useRef<Awaited<ReturnType<typeof createEditor>> | null>(
    null,
  );
  const [autoValidationEnabled, setAutoValidationEnabled] = useState(false);
  const [editor, setEditor] = useState<NodeEditor<Schemes> | null>(null);
  const [keybindsOpen, setKeybindsOpen] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [maximized, setMaximized] = useState(false);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  // Project labels feed the Limit-node selectors. They're read lazily via a ref so
  // node-creation sites (context menu, shortcut, deserialize) always see the latest
  // set — the editor mounts immediately and doesn't need to wait for the query.
  const { data: projectLabels } = useGetProjectLabelsQuery({ projectId });
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
      },
    );

    // FIX(react): this .then has no guard against the instance having been superseded or destroyed — under StrictMode useRete creates the editor twice, so the callback also fires for the discarded first instance, and nothing ever clears editorRef / setEditor / window.__editor on unmount — fix: track the latest created instance (or a disposed flag set by destroy) and skip stale resolutions, and clear the ref/state/test hook in a cleanup; why: toolbar handlers and Playwright hooks can end up operating on a destroyed editor.
    Promise.resolve(instance).then((result) => {
      editorRef.current = result;
      setAutoValidationEnabled(result.validation.isLiveValidationEnabled());
      setEditor(result.editor);
      installTestHook({ editor: result.editor, area: result.area });
    });

    return instance;
  }, []);

  const [ref] = useRete(create);

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

  // FIX(naming): handleSave does not save anything — it serializes, console.logs the payload and toasts "serialized successfully" — fix: rename to handleSerialize (or wire the real persistence call) and drop the console.log from the production path; why: a Save button that only logs misleads users and reviewers about what state is persisted.
  const handleSave = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    const validationResult = await instance.validation.validateNow();

    if (!instance.validation.isLiveValidationEnabled()) {
      instance.validation.enableLiveValidation();
      setAutoValidationEnabled(true);
    }

    if (!validationResult.valid) {
      toast.error("Graph contains errors. Fix them before saving.");
      return;
    }

    const payload = serializeTestCase(instance.editor, {
      id: "",
      name: "",
    });

    console.log(JSON.stringify(payload, null, 2));

    toast.success("Graph serialized successfully.");
  };

  const handleArrange = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    await instance.arrange.layout();
    toast.success("Arranged layout.");
  };

  // FIX(duplication): the validateNow + enableLiveValidation + error-toast + serializeTestCase block below is copy-pasted from handleSave — fix: extract a shared validateAndSerialize() helper that returns the payload or null; why: the copies differ only in toast text and every validation-flow fix must now be applied twice.
  const handleRoundTripTestCase = async () => {
    const instance = editorRef.current;
    if (!instance) return;

    const validationResult = await instance.validation.validateNow();

    if (!instance.validation.isLiveValidationEnabled()) {
      instance.validation.enableLiveValidation();
      setAutoValidationEnabled(true);
    }

    if (!validationResult.valid) {
      toast.error("Graph contains errors. Fix them before round-trip testing.");
      return;
    }
    const serialized = serializeTestCase(instance.editor, {
      id: "",
      name: "",
    });
    const payload = withAssignedIds(serialized);
    console.log("Round-trip payload:", JSON.stringify(payload, null, 2));
    await instance.validation.clearValidation();
    await deserializeTestCase(
      instance.editor,
      instance.area,
      payload,
      labelsRef.current,
      instance.selectableNodes,
    );
    await instance.arrange.layout();

    await instance.validation.validateNow();
    toast.success("Serialized and loaded back into editor.");
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
      <div className="absolute right-4 top-4 z-50 flex gap-2">
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
        <Button variant="outline" size="icon" onClick={handleRoundTripTestCase}>
          <RotateCcw />
        </Button>
        <Button
          variant={autoValidationEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleValidation}
        >
          {autoValidationEnabled ? <RefreshCw /> : <RefreshCwOff />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleSave}>
          <Save />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={maximized ? "Exit full screen" : "Full screen"}
          onClick={() => setMaximized((value) => !value)}
        >
          {maximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
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

function createTemporaryId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function withAssignedIds(
  payload: EvalTestCaseCreateOrUpdatePayload,
): EvalTestCaseCreateOrUpdatePayload {
  return {
    ...payload,
    id: payload.id || createTemporaryId("test-case"),

    limits: payload.limits.map((limit) => ({
      ...limit,
      id: limit.id || createTemporaryId("limit"),

      limitItems: limit.limitItems.map((item) => ({
        ...item,
        id: item.id || createTemporaryId("limit-item"),
      })),
    })),

    // FIX(duplication): this map body is an exact inline copy of assignLogicNodeIds below — fix: replace with `logicNodes: assignLogicNodeIds(payload.logicNodes)`; why: the helper already handles the top level, and the duplicate GROUP/OPERATOR branches will silently diverge.
    logicNodes: payload.logicNodes.map((node) => {
      if (node.type === "GROUP") {
        return {
          ...node,
          id: node.id || createTemporaryId("logic-group"),
          children: assignLogicNodeIds(node.children),
        };
      }

      if (node.type === "OPERATOR") {
        return {
          ...node,
          id: node.id || createTemporaryId("logic-operator"),
        };
      }

      return node;
    }),
  };
}

function assignLogicNodeIds(
  nodes: EvalTestCaseCreateOrUpdatePayload["logicNodes"],
): EvalTestCaseCreateOrUpdatePayload["logicNodes"] {
  return nodes.map((node) => {
    if (node.type === "GROUP") {
      return {
        ...node,
        id: node.id || createTemporaryId("logic-group"),
        children: assignLogicNodeIds(node.children),
      };
    }

    if (node.type === "OPERATOR") {
      return {
        ...node,
        id: node.id || createTemporaryId("logic-operator"),
      };
    }

    return node;
  });
}
