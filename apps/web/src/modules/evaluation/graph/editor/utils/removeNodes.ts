import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import type { HistoryPlugin } from "rete-history-plugin";

type Position = { x: number; y: number };

type NodeSnapshot = {
  node: Schemes["Node"];
  position: Position;
  width: number;
  height: number;
  depth: number;
};

/**
 * Atomic history action for a cascade delete. The default classic preset
 * records each child removal plus the parent translations the scopes plugin
 * triggers as separate entries, and replaying them in reverse leaves the
 * parent the wrong size, shifts children via translateChildren side effects,
 * and can drop connections. Snapshotting upfront and restoring in one shot
 * sidesteps all of that.
 */
class CascadeRemoveAction {
  constructor(
    private editor: NodeEditor<Schemes>,
    private area: AreaPlugin<Schemes, AreaExtra>,
    private snapshots: NodeSnapshot[],
    private connections: Schemes["Connection"][],
  ) {}

  async undo() {
    // Parents before children so the scopes plugin's nodecreate validator
    // finds the parent already in the editor.
    const ascending = [...this.snapshots].sort((a, b) => a.depth - b.depth);

    for (const snap of ascending) {
      snap.node.width = snap.width;
      snap.node.height = snap.height;
      await this.editor.addNode(snap.node);
      await this.area.translate(snap.node.id, snap.position);
    }

    // Each child translate triggers the scopes plugin to resize/translate its
    // parent. After the last child is restored the parent's bounding box
    // matches the original, but force-set width/height to be exact in case
    // padding/min-size clamping rounded differently.
    for (const snap of ascending) {
      if (snap.node.width !== snap.width || snap.node.height !== snap.height) {
        snap.node.width = snap.width;
        snap.node.height = snap.height;
        await this.area.resize(snap.node.id, snap.width, snap.height);
      }
    }

    for (const connection of this.connections) {
      await this.editor.addConnection(connection);
    }
  }

  async redo() {
    for (const connection of this.connections) {
      await this.editor.removeConnection(connection.id);
    }

    const descending = [...this.snapshots].sort((a, b) => b.depth - a.depth);
    for (const snap of descending) {
      await this.editor.removeNode(snap.node.id);
    }
  }
}

type CascadeOptions = {
  area: AreaPlugin<Schemes, AreaExtra>;
  history: HistoryPlugin<Schemes>;
};

/**
 * Disable history recording while running `fn`. The classic preset's pipes
 * still fire, but History.add() short-circuits when `active` is true. Used to
 * keep the cascade delete from polluting the history with the per-node remove
 * actions and the scopes plugin's resize-driven drag actions.
 */
async function withSuspendedHistory<T>(
  history: HistoryPlugin<Schemes>,
  fn: () => Promise<T>,
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inner = (history as any).history as { active: boolean };
  const previous = inner.active;
  inner.active = true;
  try {
    return await fn();
  } finally {
    inner.active = previous;
  }
}

export async function removeNodeWithDescendants(
  editor: NodeEditor<Schemes>,
  nodeId: string,
  options?: CascadeOptions,
) {
  const nodeIdsToRemove = collectDescendantNodeIds(editor, nodeId);

  const connectionsToRemove = editor.getConnections().filter((connection) => {
    return (
      nodeIdsToRemove.has(connection.source) ||
      nodeIdsToRemove.has(connection.target)
    );
  });

  const nodesInRemovalOrder = [...nodeIdsToRemove]
    .map((id) => editor.getNode(id))
    .filter((node): node is Schemes["Node"] => Boolean(node))
    .sort((a, b) => {
      return getNodeDepth(editor, b.id) - getNodeDepth(editor, a.id);
    });

  if (!options) {
    for (const connection of connectionsToRemove) {
      await editor.removeConnection(connection.id);
    }
    for (const node of nodesInRemovalOrder) {
      await editor.removeNode(node.id);
    }
    return;
  }

  const { area, history } = options;

  const snapshots: NodeSnapshot[] = [];
  for (const node of nodesInRemovalOrder) {
    const view = area.nodeViews.get(node.id);
    // FIX(bug): a node without a view is silently dropped from the snapshot but is still removed below, so undo restores the cascade minus this node while its connections are re-added pointing at a missing endpoint — fix: snapshot it with a fallback position (e.g. { x: 0, y: 0 }) instead of skipping; why: a partial undo silently corrupts the graph.
    if (!view) continue;
    snapshots.push({
      node,
      position: { x: view.position.x, y: view.position.y },
      width: node.width,
      height: node.height,
      depth: getNodeDepth(editor, node.id),
    });
  }

  await withSuspendedHistory(history, async () => {
    for (const connection of connectionsToRemove) {
      await editor.removeConnection(connection.id);
    }
    for (const node of nodesInRemovalOrder) {
      await editor.removeNode(node.id);
    }
  });

  history.add(
    new CascadeRemoveAction(editor, area, snapshots, connectionsToRemove),
  );
}

export async function removeAllNodes(editor: NodeEditor<Schemes>) {
  for (const connection of editor.getConnections()) {
    await editor.removeConnection(connection.id);
  }

  const nodes = editor
    .getNodes()
    .sort((a, b) => getNodeDepth(editor, b.id) - getNodeDepth(editor, a.id));

  for (const node of nodes) {
    await editor.removeNode(node.id);
  }
}

function collectDescendantNodeIds(
  editor: NodeEditor<Schemes>,
  rootNodeId: string,
) {
  const result = new Set<string>();
  const stack = [rootNodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();

    if (!currentId || result.has(currentId)) continue;

    result.add(currentId);

    for (const node of editor.getNodes()) {
      if (node.parent === currentId) {
        stack.push(node.id);
      }
    }
  }

  return result;
}

function getNodeDepth(editor: NodeEditor<Schemes>, nodeId: string) {
  let depth = 0;
  let current = editor.getNode(nodeId);

  while (current?.parent) {
    depth += 1;
    current = editor.getNode(current.parent);
  }

  return depth;
}
