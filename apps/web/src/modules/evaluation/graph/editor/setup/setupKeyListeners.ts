import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import {
  type Clipboard,
  copyNodes,
  pasteNodes,
} from "@/modules/evaluation/graph/editor/utils/copyPaste";
import {
  deleteSelectedNodes,
  deselectAllNodes,
  type SelectableNodes,
  selectAllNodes,
} from "@/modules/evaluation/graph/editor/utils/nodeSelection";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { ConnectionPlugin } from "rete-connection-plugin";
import type { HistoryPlugin } from "rete-history-plugin";
import type { AreaExtra } from "./createEditor";
import {
  focusContainer,
  isContainerFocused,
  releaseContainerFocus,
} from "./focusManager";
import { findShortcut, type ShortcutAction } from "./shortcuts";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  container: HTMLElement;
  selectableNodes: SelectableNodes;
  history: HistoryPlugin<Schemes>;
  connection: ConnectionPlugin<Schemes, AreaExtra>;
  /** Returns the current selectable label options for new Limit nodes. */
  getLabels: () => LabelOption[];
  /** Toggles the host's full-screen state (bound to the `f` shortcut). */
  toggleFullscreen?: () => void;
  /** Saves the test case (bound to the `mod+s` shortcut). */
  save?: () => void;
};

type MousePosition = {
  clientX: number;
  clientY: number;
};

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  const tag = element?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || !!element?.isContentEditable;
}

function getAreaPosition(
  area: AreaPlugin<Schemes, AreaExtra>,
  container: HTMLElement,
  mousePosition: MousePosition,
) {
  const rect = container.getBoundingClientRect();
  const transform = area.area.transform;
  return {
    x: (mousePosition.clientX - rect.left - transform.x) / transform.k,
    y: (mousePosition.clientY - rect.top - transform.y) / transform.k,
  };
}

async function createNodeAtMousePosition(
  props: {
    editor: NodeEditor<Schemes>;
    area: AreaPlugin<Schemes, AreaExtra>;
    container: HTMLElement;
    selectableNodes: SelectableNodes;
  },
  node: Schemes["Node"],
  mousePosition: MousePosition | null,
) {
  const { editor, area, container, selectableNodes } = props;
  const position = mousePosition
    ? getAreaPosition(area, container, mousePosition)
    : { x: 0, y: 0 };

  await editor.addNode(node);
  await area.translate(node.id, {
    x: position.x - node.width / 2,
    y: position.y - node.height / 2,
  });
  await deselectAllNodes(selectableNodes, editor);
  await selectableNodes.select(node.id, false);
  await area.update("node", node.id);
}

/**
 * Wires keyboard shortcuts for the canvas. The bindings themselves live in
 * `shortcuts.ts` (the single source of truth shared with the help dialog); this
 * module only maps each action to its behavior.
 *
 * Handlers run only for the focused editor instance (see `focusManager.ts`) and
 * are ignored while an input/textarea is focused.
 */
export const setupKeyListeners = (props: Props) => {
  const {
    editor,
    area,
    container,
    selectableNodes,
    history,
    connection,
    getLabels,
    toggleFullscreen,
    save,
  } = props;

  let mousePosition: MousePosition | null = null;
  let clipboard: Clipboard | null = null;

  const handlePointerMove = (event: PointerEvent) => {
    mousePosition = { clientX: event.clientX, clientY: event.clientY };
  };

  // Capture phase so a node/control calling stopPropagation still focuses the graph.
  const handleFocusPointerDown = () => focusContainer(container);

  container.addEventListener("pointermove", handlePointerMove);
  container.addEventListener("pointerdown", handleFocusPointerDown, true);

  const addNode = async (
    event: KeyboardEvent,
    createNode: () => Schemes["Node"],
  ) => {
    if (event.repeat || event.altKey) return;
    await createNodeAtMousePosition(
      { editor, area, container, selectableNodes },
      createNode(),
      mousePosition,
    );
  };

  const behaviors: Record<
    ShortcutAction,
    (event: KeyboardEvent) => void | Promise<void>
  > = {
    selectAll: () => selectAllNodes(selectableNodes, editor),
    // FIX(bug): copyNodes returns null when nothing is selected, so copy/cut with an empty selection wipes the clipboard — fix: clipboard = copyNodes(editor, area) ?? clipboard; why: copying nothing should keep the previous contents, and losing the clipboard on a stray keypress is destructive.
    copy: () => {
      clipboard = copyNodes(editor, area);
    },
    paste: async () => {
      if (!clipboard) return;
      const pastePosition = mousePosition
        ? getAreaPosition(area, container, mousePosition)
        : clipboard.center;
      await pasteNodes(
        clipboard,
        { editor, area, selectableNodes },
        pastePosition,
      );
    },
    cut: async () => {
      clipboard = copyNodes(editor, area);
      await deleteSelectedNodes(editor, area, history);
    },
    deleteSelection: () => deleteSelectedNodes(editor, area, history),
    deselect: async () => {
      connection.drop();
      await deselectAllNodes(selectableNodes, editor);
    },
    undo: () => history.undo(),
    redo: () => history.redo(),
    addAnd: (event) => addNode(event, () => new AndNode()),
    addOr: (event) => addNode(event, () => new OrNode()),
    addLimit: (event) =>
      addNode(event, () => new LimitNode({ labels: getLabels() })),
    addResult: (event) => addNode(event, () => new ResultNode()),
    addCount: (event) => addNode(event, () => new CountNode()),
    addArea: (event) => addNode(event, () => new AreaNode()),
    addPosition: (event) => addNode(event, () => new PositionNode()),
    save: () => save?.(),
    toggleFullscreen: () => toggleFullscreen?.(),
  };

  const handler = async (event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    if (!isContainerFocused(container)) return;

    const shortcut = findShortcut(event);
    if (!shortcut) return;

    event.preventDefault();
    await behaviors[shortcut.action](event);
  };

  return {
    handler,
    dispose: () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener(
        "pointerdown",
        handleFocusPointerDown,
        true,
      );
      releaseContainerFocus(container);
    },
  };
};
