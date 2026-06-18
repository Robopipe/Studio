import {
  BooleanConnection,
  type BooleanOperator,
} from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type {
  LimitItemProps,
  LogicalProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { EvalLimitItemOperatorEnum } from "@repo/schema";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { deselectAllNodes, type SelectableNodes } from "./nodeSelection";

export type ClipboardNodeEntry = {
  node: Schemes["Node"];
  position: { x: number; y: number };
  // Index into the clipboard nodes array of this node's parent, or null if root-level.
  parentIndex: number | null;
};

export type ClipboardConnectionEntry =
  | {
      kind: "boolean";
      sourceIndex: number;
      sourceOutput: string;
      targetIndex: number;
      targetInput: string;
      operator: BooleanOperator;
    }
  | {
      kind: "limitItem";
      sourceIndex: number;
      sourceOutput: string;
      targetIndex: number;
      targetInput: string;
      operator: EvalLimitItemOperatorEnum;
    };

export type Clipboard = {
  nodes: ClipboardNodeEntry[];
  connections: ClipboardConnectionEntry[];
  center: { x: number; y: number };
};

// E is generic so this module does not need to import AreaExtra from the setup layer.

/**
 * Snapshots all selected nodes (cloning their state at copy time) along with
 * every connection whose both endpoints are inside the selection.
 */
export function copyNodes<E>(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, E>,
): Clipboard | null {
  const selectedNodes = editor.getNodes().filter((n) => n.selected);
  if (selectedNodes.length === 0) return null;

  const selectedIds = new Set(selectedNodes.map((n) => n.id));
  const indexById = new Map(selectedNodes.map((n, i) => [n.id, i]));

  const nodes: ClipboardNodeEntry[] = selectedNodes.map((node) => ({
    node: node.clone(),
    position: area.nodeViews.get(node.id)?.position ?? { x: 0, y: 0 },
    parentIndex:
      node.parent != null && indexById.has(node.parent)
        ? (indexById.get(node.parent) ?? null)
        : null,
  }));

  const connections: ClipboardConnectionEntry[] = editor
    .getConnections()
    .filter((c) => selectedIds.has(c.source) && selectedIds.has(c.target))
    .flatMap((c): ClipboardConnectionEntry[] => {
      const sourceIndex = indexById.get(c.source);
      const targetIndex = indexById.get(c.target);
      if (sourceIndex === undefined || targetIndex === undefined) return [];

      const base = {
        sourceIndex,
        sourceOutput: String(c.sourceOutput),
        targetIndex,
        targetInput: String(c.targetInput),
      };

      if (c instanceof BooleanConnection) {
        return [
          { ...base, kind: "boolean" as const, operator: c.booleanOperator },
        ];
      }
      if (c instanceof LimitItemConnection) {
        return [
          {
            ...base,
            kind: "limitItem" as const,
            operator: c.limitItemOperator,
          },
        ];
      }
      return [];
    });

  const center = {
    x: nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length,
    y: nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length,
  };

  return { nodes, connections, center };
}

/**
 * Clones the clipboard entries (fresh IDs each paste), positions the chunk
 * around the given canvas position, restores internal connections, and selects
 * the newly created nodes.
 */
export async function pasteNodes<E>(
  clipboard: Clipboard,
  props: {
    editor: NodeEditor<Schemes>;
    area: AreaPlugin<Schemes, E>;
    selectableNodes: SelectableNodes;
  },
  position: { x: number; y: number },
) {
  const { editor, area, selectableNodes } = props;

  const newNodes = clipboard.nodes.map((entry) => entry.node.clone());

  // Remap parent references from clipboard IDs to the newly cloned IDs.
  for (const [i, newNode] of newNodes.entries()) {
    const parentIndex = clipboard.nodes.at(i)?.parentIndex;
    if (parentIndex == null) continue;
    newNode.parent = newNodes.at(parentIndex)?.id;
  }

  // The scopes plugin requires a parent node to exist before its children are added.
  const roots = newNodes.filter((n) => !n.parent);
  const children = newNodes.filter((n) => !!n.parent);
  for (const node of [...roots, ...children]) {
    await editor.addNode(node);
  }

  // Place each node at the paste position plus its original offset from the center.
  for (const [i, node] of newNodes.entries()) {
    const entry = clipboard.nodes.at(i);
    if (!entry) continue;
    await area.translate(node.id, {
      x: position.x + (entry.position.x - clipboard.center.x),
      y: position.y + (entry.position.y - clipboard.center.y),
    });
  }

  for (const connEntry of clipboard.connections) {
    const source = newNodes.at(connEntry.sourceIndex);
    const target = newNodes.at(connEntry.targetIndex);
    if (!source || !target) continue;

    if (connEntry.kind === "boolean") {
      await editor.addConnection(
        new BooleanConnection(
          source as LogicalProps,
          connEntry.sourceOutput,
          target as LogicalProps,
          connEntry.targetInput,
          connEntry.operator,
        ),
      );
    } else {
      await editor.addConnection(
        new LimitItemConnection(
          source as LimitItemProps,
          connEntry.sourceOutput,
          target as LimitItemProps,
          connEntry.targetInput,
          connEntry.operator,
        ),
      );
    }
  }

  await deselectAllNodes(selectableNodes, editor);
  for (const [i, node] of newNodes.entries()) {
    await selectableNodes.select(node.id, i > 0);
  }

  for (const node of newNodes) {
    await area.update("node", node.id);
  }
}
