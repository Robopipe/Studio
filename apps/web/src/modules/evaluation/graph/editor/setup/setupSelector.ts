import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { AreaExtensions } from "rete-area-plugin";
import type { AreaExtra } from "./createEditor";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
};

type SelectorEntity = {
  label: string;
  id: string;
  unselect(): void | Promise<void>;
  translate(dx: number, dy: number): void | Promise<void>;
};

export type SelectableNodesApi = ReturnType<
  typeof AreaExtensions.selectableNodes
>;

export function setupSelector(props: Props) {
  const { editor, area } = props;

  const baseSelector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  const baseAdd = baseSelector.add.bind(baseSelector);
  const baseRemove = baseSelector.remove.bind(baseSelector);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selector = Object.create(baseSelector) as any;

  const selectableNodes: SelectableNodesApi = AreaExtensions.selectableNodes(
    area,
    selector,
    {
      accumulating,
    },
  );

  selector.add = async (entity: SelectorEntity, accumulate: boolean) => {
    await baseAdd(entity, accumulate);
    if (entity.label !== "node") return;
    const node = editor.getNode(entity.id);
    if (!(node instanceof LimitNode)) return;
    for (const child of editor
      .getNodes()
      .filter((n) => n.parent === entity.id)) {
      await selectableNodes.select(child.id, true);
    }
  };

  selector.remove = async (entity: { label: string; id: string }) => {
    if (entity.label === "node") {
      const node = editor.getNode(entity.id);
      if (
        node?.parent &&
        baseSelector.isSelected({ label: "node", id: node.parent })
      ) {
        return;
      }
      if (node instanceof LimitNode) {
        for (const child of editor
          .getNodes()
          .filter((n) => n.parent === entity.id)) {
          await baseRemove({ label: "node", id: child.id });
        }
      }
    }
    await baseRemove(entity);
  };

  return { selectableNodes };
}
