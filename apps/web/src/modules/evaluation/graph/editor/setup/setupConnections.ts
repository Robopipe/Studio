import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import { RuleSocket } from "@/modules/evaluation/graph/editor/sockets/ruleSocket";
import type {
  LimitItemProps,
  BooleanNodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import {
  ClassicFlow,
  ConnectionPlugin,
  getSourceTarget,
} from "rete-connection-plugin";
import type { AreaExtra } from "./createEditor";
import { validateConnection } from "./connectionRules";

type Props = {
  editor: NodeEditor<Schemes>;
  area: AreaPlugin<Schemes, AreaExtra>;
  log: (text: string, type: "info" | "error") => void;
};

type PortRecord = Record<string, { socket?: unknown } | undefined>;
type SocketSide = "input" | "output";

/**
 * Configures drag-to-connect behaviour and connection validation.
 *
 * Rete's ClassicFlow handles pointer interaction (pick up a socket, drag, drop
 * on another socket). `canMakeConnection` is called on drop to decide legality.
 *
 * The editor pipe intercepts `connectioncreate` to replace the generic
 * Connection Rete would produce with a domain-typed one (LimitItemConnection or
 * BooleanConnection) that can carry additional state like OR/NOT flags.
 */
export function setupConnection(
  props: Props,
): ConnectionPlugin<Schemes, AreaExtra> {
  const { editor, area, log } = props;

  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  function getPort(nodeId: string, key: string, side: SocketSide) {
    const node = editor.getNode(nodeId);
    if (!node) return null;

    return side === "output"
      ? ((node.outputs as PortRecord)[key] ?? null)
      : ((node.inputs as PortRecord)[key] ?? null);
  }

  function getOutputSocket(nodeId: string, key: string) {
    return getPort(nodeId, key, "output")?.socket ?? null;
  }

  function getInputSocket(nodeId: string, key: string) {
    return getPort(nodeId, key, "input")?.socket ?? null;
  }

  function isTrackedSocket(
    socket: unknown,
  ): socket is RuleSocket | BooleanSocket {
    return socket instanceof RuleSocket || socket instanceof BooleanSocket;
  }

  function setSocketConnected(
    nodeId: string,
    key: string,
    side: SocketSide,
    connected: boolean,
  ) {
    const socket = getPort(nodeId, key, side)?.socket;

    if (!isTrackedSocket(socket)) return;

    socket.connected = connected;
  }

  function recomputeSocketConnected(
    nodeId: string,
    key: string,
    side: SocketSide,
  ) {
    const socket = getPort(nodeId, key, side)?.socket;

    if (!isTrackedSocket(socket)) return;

    if (
      pickedSocket &&
      pickedSocket.nodeId === nodeId &&
      String(pickedSocket.key) === key &&
      pickedSocket.side === side
    ) {
      socket.connected = true;
      return;
    }

    const connections = editor.getConnections();

    const isConnected =
      side === "output"
        ? connections.some(
            (conn) =>
              conn.source === nodeId && String(conn.sourceOutput) === key,
          )
        : connections.some(
            (conn) =>
              conn.target === nodeId && String(conn.targetInput) === key,
          );

    socket.connected = isConnected;
  }

  function refreshNode(nodeId: string) {
    void area.update("node", nodeId);
  }

  function refreshConnectionNodes(sourceId: string, targetId: string) {
    refreshNode(sourceId);

    if (targetId !== sourceId) {
      refreshNode(targetId);
    }
  }

  function updateConnectionSockets(data: {
    source: string;
    sourceOutput: string | number | symbol;
    target: string;
    targetInput: string | number | symbol;
  }) {
    recomputeSocketConnected(data.source, String(data.sourceOutput), "output");
    recomputeSocketConnected(data.target, String(data.targetInput), "input");
    refreshConnectionNodes(data.source, data.target);
  }

  function getExistingOutgoingActionConnections(nodeId: string) {
    return editor.getConnections().filter((existingConnection) => {
      if (existingConnection.source !== nodeId) return false;

      const targetNode = editor.getNode(existingConnection.target);

      return targetNode instanceof ActionNodeBase;
    });
  }

  function removeConnections(connectionsToRemove: Schemes["Connection"][]) {
    for (const connectionToRemove of connectionsToRemove) {
      void editor.removeConnection(connectionToRemove.id);
    }
  }

  function createTypedConnection(data: {
    source: string;
    sourceOutput: string | number | symbol;
    target: string;
    targetInput: string | number | symbol;
  }) {
    const sourceNode = editor.getNode(data.source);
    const targetNode = editor.getNode(data.target);

    if (!sourceNode || !targetNode) return null;

    const sourceOutput = String(data.sourceOutput);
    const targetInput = String(data.targetInput);
    const sourceSocket = getOutputSocket(data.source, sourceOutput);
    const targetSocket = getInputSocket(data.target, targetInput);

    if (
      sourceSocket instanceof RuleSocket &&
      targetSocket instanceof RuleSocket
    ) {
      if (sourceOutput !== "out" || targetInput !== "in") return null;

      return new LimitItemConnection(
        sourceNode as LimitItemProps,
        "out",
        targetNode as LimitItemProps,
        "in",
      );
    }

    if (
      sourceSocket instanceof BooleanSocket &&
      targetSocket instanceof BooleanSocket
    ) {
      if (sourceOutput !== "out" || targetInput !== "in") return null;

      return new BooleanConnection(
        sourceNode as BooleanNodeProps,
        "out",
        targetNode as BooleanNodeProps,
        "in",
      );
    }

    return null;
  }

  connection.addPreset(
    () =>
      new ClassicFlow({
        canMakeConnection(from, to) {
          const [source, target] = getSourceTarget(from, to) || [null, null];

          if (!source || !target || from === to) return false;

          const result = validateConnection(
            editor,
            { nodeId: source.nodeId, key: String(source.key) },
            { nodeId: target.nodeId, key: String(target.key) },
          );

          if (!result.ok) {
            if (result.reason) {
              log(result.reason, "error");
              connection.drop();
            }
            return false;
          }

          return true;
        },
      }),
  );

  let pickedSocket: {
    nodeId: string;
    key: string | number | symbol;
    side: "input" | "output";
  } | null = null;

  connection.addPipe((context) => {
    if (context.type === "connectionpick") {
      const { nodeId, key, side } = context.data.socket;

      pickedSocket = { nodeId, key, side };

      setSocketConnected(nodeId, String(key), side, true);
      refreshNode(nodeId);
    }

    if (context.type === "connectiondrop") {
      const { created } = context.data;

      const socket = context.data.socket ?? pickedSocket;

      if (socket && !created) {
        const { nodeId, key, side } = socket;

        recomputeSocketConnected(nodeId, String(key), side);
        refreshNode(nodeId);
      }

      pickedSocket = null;
    }

    return context;
  });

  editor.addPipe((context) => {
    if (context.type === "connectioncreate") {
      if (
        context.data instanceof LimitItemConnection ||
        context.data instanceof BooleanConnection
      ) {
        return context;
      }

      const typedConnection = createTypedConnection(context.data);

      if (!typedConnection) return context;

      const sourceNode = editor.getNode(typedConnection.source);
      const targetNode = editor.getNode(typedConnection.target);

      if (
        sourceNode instanceof LimitNode &&
        targetNode instanceof ActionNodeBase
      ) {
        removeConnections(getExistingOutgoingActionConnections(sourceNode.id));
      }

      void editor.addConnection(typedConnection);

      return undefined;
    }

    if (
      context.type === "connectioncreated" ||
      context.type === "connectionremoved"
    ) {
      updateConnectionSockets(context.data);
    }

    return context;
  });

  return connection;
}
