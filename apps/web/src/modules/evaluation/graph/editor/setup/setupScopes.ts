import { setupCustomScopePreset } from "@/modules/evaluation/graph/editor/presets/customScopePreset";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { isScopeNode } from "@/modules/evaluation/graph/editor/utils/scopes";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { ScopesPlugin } from "rete-scopes-plugin";
import type { AreaExtra } from "./createEditor";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
};

const DEFAULT_PADDING = { top: 100, right: 100, bottom: 100, left: 100 };

/**
 * Sets up the scopes plugin, which lets nodes act as visual containers for
 * other nodes. Dragging a child inside a scope makes it a child in the data
 * graph, and the scope node resizes to wrap its children.
 *
 * `padding` controls breathing room around children inside their parent.
 * `size` enforces a minimum so scope nodes don't collapse when emptied.
 */
export function setupScopes(props: Props): ScopesPlugin<Schemes, never> {
  // FIX(dead-code): props.area is required by the call site but never used here — fix: remove area from Props and from the createEditor call, or wire it if it was meant to be used; why: an unused mandatory dependency misleads readers into thinking the scopes setup touches the area layer.
  const { editor } = props;

  const scopes = new ScopesPlugin<Schemes>({
    padding: (nodeId) => {
      const node = editor.getNode(nodeId);

      if (isScopeNode(node)) {
        return node.getPadding();
      }

      return DEFAULT_PADDING;
    },

    size: (nodeId, size) => {
      const node = editor.getNode(nodeId);

      if (!isScopeNode(node)) {
        return size;
      }

      const min = node.getMinSize();

      return {
        width: Math.max(size.width, min.width),
        height: Math.max(size.height, min.height),
      };
    },
  });

  scopes.addPreset(setupCustomScopePreset(scopes));

  return scopes;
}
