import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import * as ContextMenuComponents from "@/modules/evaluation/graph/editor/ui/ContextMenuView";
import { removeNodeWithDescendants } from "@/modules/evaluation/graph/editor/utils/removeNodes";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import {
  ContextMenuPlugin,
  Presets as ContextMenuPresets,
} from "rete-context-menu-plugin";
import type { HistoryPlugin } from "rete-history-plugin";
import type { ReactPlugin } from "rete-react-plugin";
import { Presets } from "rete-react-plugin";
import type { AreaExtra } from "./createEditor";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  render: ReactPlugin<Schemes, AreaExtra>;
  history: HistoryPlugin<Schemes>;
  getLabels: () => LabelOption[];
};

export function setupContextMenu(props: Props): ContextMenuPlugin<Schemes> {
  const { editor, area, render, history, getLabels } = props;

  const classicItems = ContextMenuPresets.classic.setup([
    ["Limit", () => new LimitNode({ labels: getLabels() })],
    ["Result", () => new ResultNode()],
    [
      "Limit Item",
      [
        ["Position", () => new PositionNode()],
        ["Area", () => new AreaNode()],
        ["Count", () => new CountNode()],
      ],
    ],
    [
      "Logical",
      [
        ["And", () => new AndNode()],
        ["Or", () => new OrNode()],
      ],
    ],
    [
      "Action",
      [
        ["Warning", () => new WarningNode()],
        ["Alert", () => new AlertNode()],
      ],
    ],
  ]);

  const contextMenu = new ContextMenuPlugin<Schemes>({
    items(context, plugin) {
      const result = classicItems(context, plugin);
      if (context !== "root") {
        const nodeId = context.id;
        const node = editor.getNode(nodeId);
        const list = node
          ? result.list.map((item) =>
              item.key === "delete"
                ? {
                    ...item,
                    handler: () =>
                      removeNodeWithDescendants(editor, nodeId, {
                        area,
                        history,
                      }),
                  }
                : item,
            )
          : result.list;
        return { ...result, list, searchBar: false };
      }

      return {
        ...result,
        searchBar: false,
      };
    },
  });

  render.addPreset(
    Presets.contextMenu.setup({
      delay: 0,
      customize: {
        main: () => ContextMenuComponents.Menu,
        item: () => ContextMenuComponents.Item,
        common: () => ContextMenuComponents.Common,
        search: () => ContextMenuComponents.Search,
        subitems: () => ContextMenuComponents.Subitems,
      },
    }),
  );

  return contextMenu;
}
