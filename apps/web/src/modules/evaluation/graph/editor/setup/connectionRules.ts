import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { AppSocket } from "@/modules/evaluation/graph/editor/sockets/appSocket";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";

/**
 * Shared connection legality rules.
 *
 * Used by both the drag flow (ClassicFlow.canMakeConnection in setupConnections)
 * and the magnetic snap (setupMagneticConnection)
 */

export type SocketRef = { nodeId: string; key: string };

export type ConnectionValidation =
  | { ok: true }
  | { ok: false; reason?: string };

type PortRecord = Record<string, { socket?: unknown } | undefined>;

function getSocket(
  editor: NodeEditor<Schemes>,
  nodeId: string,
  key: string,
  side: "input" | "output",
): unknown {
  const node = editor.getNode(nodeId);
  if (!node) return null;

  const ports = (side === "output" ? node.outputs : node.inputs) as PortRecord;
  return ports[key]?.socket ?? null;
}

/**
 * Walks the existing graph from `targetNodeId` to see if it can reach
 * `sourceNodeId` — i.e. whether adding source -> target would close a loop.
 */
export function wouldCreateCycle(
  editor: NodeEditor<Schemes>,
  sourceNodeId: string,
  targetNodeId: string,
): boolean {
  if (sourceNodeId === targetNodeId) return true;

  const adjacency = new Map<string, string[]>();

  for (const node of editor.getNodes()) {
    adjacency.set(node.id, []);
  }

  for (const connection of editor.getConnections()) {
    const list = adjacency.get(connection.source) ?? [];
    list.push(connection.target);
    adjacency.set(connection.source, list);
  }

  const stack = [targetNodeId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (current === sourceNodeId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }

  return false;
}

/**
 * Decides whether a connection source(output) -> target(input) is legal.
 */
export function validateConnection(
  editor: NodeEditor<Schemes>,
  source: SocketRef,
  target: SocketRef,
): ConnectionValidation {
  if (source.nodeId === target.nodeId) return { ok: false };

  const sourceNode = editor.getNode(source.nodeId);
  const targetNode = editor.getNode(target.nodeId);
  if (!sourceNode || !targetNode) return { ok: false };

  const sourceSocket = getSocket(editor, source.nodeId, source.key, "output");
  const targetSocket = getSocket(editor, target.nodeId, target.key, "input");
  if (!sourceSocket || !targetSocket) return { ok: false };

  if (
    !(sourceSocket instanceof AppSocket) ||
    !(targetSocket instanceof AppSocket)
  ) {
    return { ok: false };
  }

  if (!sourceSocket.isCompatibleWith(targetSocket)) {
    return { ok: false, reason: "Sockets are not compatible" };
  }

  if (wouldCreateCycle(editor, source.nodeId, target.nodeId)) {
    return { ok: false, reason: "Loops are not allowed" };
  }

  if (sourceNode instanceof ResultNode && !(targetNode instanceof ActionNodeBase)) {
    return { ok: false, reason: "Result node can only connect to an action node" };
  }

  if (targetNode instanceof ActionNodeBase) {
    const sourceCanConnectToAction =
      sourceNode instanceof LimitNode || sourceNode instanceof ResultNode;

    if (!sourceCanConnectToAction) {
      return {
        ok: false,
        reason: "Action nodes can only be connected from a Limit node or Result node",
      };
    }
  }

  return { ok: true };
}
