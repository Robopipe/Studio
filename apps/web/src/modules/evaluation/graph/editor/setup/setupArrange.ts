import { GRID } from "@/modules/evaluation/graph/editor/constants";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import { AreaExtensions, type AreaPlugin } from "rete-area-plugin";
import { AutoArrangePlugin, type Preset } from "rete-auto-arrange-plugin";
import type { ScopesPlugin } from "rete-scopes-plugin";
import type { AreaExtra } from "./createEditor";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  scopes: ScopesPlugin<Schemes>;
};

export type ArrangeController = {
  plugin: AutoArrangePlugin<Schemes>;
  layout: (options?: { zoom?: boolean }) => Promise<void>;
};

const LAYER_SPACING = 5 * GRID;
const PORT_SIZE = 15;

/**
 * Sets up automatic graph layout using rete-auto-arrange-plugin, which
 * delegates to the ELK (Eclipse Layout Kernel) algorithm under the hood.
 *
 * The layout() function:
 *  1. Resets LimitNode sizes to their minimum so ELK starts with fresh
 *     dimensions (parent nodes grow dynamically).
 *  2. Runs ELK via arrange.layout.
 *  3. Re-settles each LimitNode through scopes.update. The applier translates
 *     siblings in parallel via Promise.all, and every child translate fires
 *     the scopes plugin's resizeParent on a partially-updated bounding box,
 *     leaving the parent at a racy intermediate position. With all children
 *     now at their ELK-final positions, one explicit scope update recomputes
 *     the parent correctly. Without this, arrange somtimes takes two clicks
 *     to settle.
 *  4. Runs two React render cycles (updateAllNodes + nextFrame) so the DOM
 *     reflects the final positions before zoomAt measures bounds.
 */
export function setupArrange(props: Props): ArrangeController {
  const { editor, area, scopes } = props;

  const arrange = new AutoArrangePlugin<Schemes>();

  arrange.addPreset(createPreset(editor));

  async function layout(options: { zoom?: boolean } = {}) {
    const { zoom = true } = options;

    resetScopeNodeSizes(editor);

    await updateAllNodes(editor, area);
    await nextFrame();

    await arrange.layout({
      options: {
        "elk.layered.spacing.nodeNodeBetweenLayers": String(LAYER_SPACING),
      },
    });

    for (const node of editor.getNodes()) {
      if (node instanceof LimitNode) {
        await scopes.update(node.id);
      }
    }

    await updateAllNodes(editor, area);
    await nextFrame();

    if (zoom) {
      await AreaExtensions.zoomAt(area, editor.getNodes());
    }
  }

  return {
    plugin: arrange,
    layout,
  };
}

// Tells ELK where each port lives on the node so edge routing aligns with the
// visible socket circles. LimitNodes also declare minimum size and padding
// because they act as containers that must accommodate their nested children.
function createPreset(editor: NodeEditor<Schemes>): Preset {
  return (nodeId: string) => {
    const node = editor.getNode(nodeId);
    if (!node) return null;

    return {
      port: (data) => {
        const portCenterY = data.height - (node.socketHeight * GRID) / 2;

        return {
          x: 0,
          y: portCenterY - PORT_SIZE / 2,
          width: PORT_SIZE,
          height: PORT_SIZE,
          side: data.side === "output" ? "EAST" : "WEST",
        };
      },
      options: (): Record<string, string | number | boolean> => {
        if (!(node instanceof LimitNode)) return {};

        const min = node.getMinSize();

        return {
          "elk.padding": formatElkPadding(node.getPadding()),
          "elk.nodeSize.constraints":
            "NODE_LABELS PORTS PORT_LABELS MINIMUM_SIZE",
          "elk.nodeSize.minimum": `(${min.width},${min.height})`,
          "elk.layered.spacing.nodeNodeBetweenLayers": String(LAYER_SPACING),
        };
      },
    };
  };
}

function formatElkPadding(padding: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}) {
  return `[top=${padding.top},left=${padding.left},bottom=${padding.bottom},right=${padding.right}]`;
}

function resetScopeNodeSizes(editor: NodeEditor<Schemes>) {
  for (const node of editor.getNodes()) {
    if (node instanceof LimitNode) {
      const min = node.getMinSize();
      node.width = min.width;
      node.height = min.height;
    }
  }
}

async function updateAllNodes(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, AreaExtra>,
) {
  await Promise.all(
    editor.getNodes().map((node) => area.update("node", node.id)),
  );
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
