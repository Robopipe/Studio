import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { HistoryPlugin } from "rete-history-plugin";
import { removeNodeWithDescendants } from "./removeNodes";

export type SelectableNodes = {
  select: (nodeId: string, accumulate: boolean) => Promise<void>;
  unselect: (nodeId: string) => Promise<void>;
};

export async function selectAllNodes(
  selectableNodes: SelectableNodes,
  editor: NodeEditor<Schemes>,
) {
  const nodes = editor.getNodes();
  for (const [index, node] of nodes.entries()) {
    await selectableNodes.select(node.id, index > 0);
  }
}

export async function deselectAllNodes(
  selectableNodes: SelectableNodes,
  editor: NodeEditor<Schemes>,
) {
  const selectedNodes = editor.getNodes().filter((node) => node.selected);
  for (const node of selectedNodes) {
    await selectableNodes.unselect(node.id);
  }
}

/**
 * Removes all selected nodes, treating each top-level selected node as the root
 * of its subtree. Children of a selected parent are removed via cascade and are
 * not processed separately.
 */
export async function deleteSelectedNodes(
  editor: NodeEditor<Schemes>,
  area?: AreaPlugin<Schemes, AreaExtra>,
  history?: HistoryPlugin<Schemes>,
) {
  const selectedNodes = editor.getNodes().filter((node) => node.selected);
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));

  const topLevelSelectedNodes = selectedNodes.filter(
    (node) => !node.parent || !selectedNodeIds.has(node.parent),
  );

  if (topLevelSelectedNodes.length === 0) return;

  const options = area && history ? { area, history } : undefined;

  // The history plugin chains undo across actions within 200ms of each other.
  // Without explicit boundaries, undoing the cascade deletes also undoes any
  // drag/create action that happened to land in that window, restoring nodes
  // to their pre-drag positions instead of where the user deleted them.
  // separate() marks the latest action as a hard stop for the chain.
  history?.separate();

  for (const node of topLevelSelectedNodes) {
    await removeNodeWithDescendants(editor, node.id, options);
  }

  history?.separate();
}
