// FIX(naming): "LogicNodes" here vs "Logical" everywhere else (nodes/logical/, validateLogical.ts, LogicalNodeBase) — fix: rename to serializeLogicalNodes.ts (and the deserialization twin), or add a note that the name intentionally mirrors the backend payload field `logicNodes`; why: the Logic/Logical split makes cross-module grep and navigation unreliable.
import type {
  NodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";

import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";

import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";

import type {
  EvalLogicNodeOperatorValue,
  EvalLogicNodePayload,
  EvalSeverity,
  EvalTestCaseType,
} from "./backendTypes";

export type LogicSerializationResult = {
  type: EvalTestCaseType;
  severity: EvalSeverity | null;
  logicNodes: EvalLogicNodePayload[];
};

type LogicalNode = AndNode | OrNode;

type SerializedExpression = {
  operatorValue: EvalLogicNodeOperatorValue | null;
  nodes: EvalLogicNodePayload[];
};

export function serializeLogicNodes(
  editor: NodeEditor<Schemes>,
): LogicSerializationResult {
  const resultNode = editor
    .getNodes()
    .find((node) => node instanceof ResultNode);

  if (!resultNode) {
    return {
      type: "CHECK",
      severity: null,
      logicNodes: [],
    };
  }

  const resultInputConnection = findResultInputConnection(editor, resultNode);
  const resultActionConnection = findResultActionConnection(editor, resultNode);

  const resultActionNode = resultActionConnection
    ? editor.getNode(resultActionConnection.target)
    : undefined;

  if (!resultInputConnection) {
    return {
      type: "CHECK",
      severity: getActionSeverity(resultActionNode),
      logicNodes: [],
    };
  }

  const resultInputSourceNode = editor.getNode(resultInputConnection.source);

  if (!resultInputSourceNode) {
    return {
      type: getTestCaseTypeFromResultInputConnection(resultInputConnection),
      severity: getActionSeverity(resultActionNode),
      logicNodes: [],
    };
  }

  const expression = serializeExpression(editor, resultInputSourceNode);

  return {
    type: getTestCaseTypeFromResultInputConnection(resultInputConnection),
    severity: getActionSeverity(resultActionNode),
    logicNodes: expression.nodes,
  };
}

function findResultInputConnection(
  editor: NodeEditor<Schemes>,
  resultNode: ResultNode,
) {
  return editor.getConnections().find((connection) => {
    return connection.target === resultNode.id;
  });
}

function findResultActionConnection(
  editor: NodeEditor<Schemes>,
  resultNode: ResultNode,
) {
  return editor.getConnections().find((connection) => {
    if (connection.source !== resultNode.id) return false;

    const targetNode = editor.getNode(connection.target);

    return targetNode instanceof ActionNodeBase;
  });
}

function serializeExpression(
  editor: NodeEditor<Schemes>,
  node: NodeProps,
  parentOperatorValue: EvalLogicNodeOperatorValue | null = null,
): SerializedExpression {
  if (node instanceof LimitNode) {
    return {
      operatorValue: null,
      nodes: [
        {
          id: node.id,
          type: "LIMIT",
        },
      ],
    };
  }

  if (node instanceof AndNode || node instanceof OrNode) {
    return serializeLogicalExpression(editor, node, parentOperatorValue);
  }

  throw new Error(`Unsupported logic node "${node.id}".`);
}

function serializeLogicalExpression(
  editor: NodeEditor<Schemes>,
  node: LogicalNode,
  parentOperatorValue: EvalLogicNodeOperatorValue | null,
): SerializedExpression {
  const operatorValue = getLogicalNodeOperatorValue(node);

  const incomingConnections = editor
    .getConnections()
    .filter((connection) => connection.target === node.id)
    .sort((a, b) => a.source.localeCompare(b.source));

  const children: EvalLogicNodePayload[] = [];

  for (const connection of incomingConnections) {
    const sourceNode = editor.getNode(connection.source);

    if (!sourceNode) continue;

    const childExpression = serializeExpression(
      editor,
      sourceNode,
      operatorValue,
    );
    const childNodes = maybeWrapChildExpression(childExpression, operatorValue);
    const maybeNegatedChildNodes = applyNotIfNeeded(connection, childNodes);

    if (children.length > 0) {
      children.push({
        id: "",
        type: "OPERATOR",
        operatorValue,
      });
    }

    children.push(...maybeNegatedChildNodes);
  }

  const needsGroup =
    parentOperatorValue !== null &&
    parentOperatorValue !== operatorValue &&
    children.length > 1;

  if (needsGroup) {
    return {
      operatorValue,
      nodes: [
        {
          id: node.id,
          type: "GROUP",
          children,
        },
      ],
    };
  }

  return {
    operatorValue,
    nodes: children,
  };
}

// FIX(dead-code): the GROUP-wrapping branch at the bottom of this helper is unreachable —
// serializeExpression always passes the parent's operatorValue down (line in the loop above), so
// serializeLogicalExpression already wraps a differing-operator multi-node child via `needsGroup`
// and returns nodes.length === 1; every early-return here therefore always fires — fix: keep the
// grouping logic in exactly one place (drop this helper and use childExpression.nodes directly,
// or drop needsGroup and wrap only here); why: two near-identical grouping implementations that
// even disagree on the GROUP id (`needsGroup` emits id: node.id, this one id: '') invite silent
// divergence on future edits.
function maybeWrapChildExpression(
  childExpression: SerializedExpression,
  parentOperatorValue: EvalLogicNodeOperatorValue,
): EvalLogicNodePayload[] {
  const childOperatorValue = childExpression.operatorValue;

  if (childOperatorValue === null) {
    return childExpression.nodes;
  }

  if (childOperatorValue === parentOperatorValue) {
    return childExpression.nodes;
  }

  if (childExpression.nodes.length <= 1) {
    return childExpression.nodes;
  }

  return [
    {
      id: "",
      type: "GROUP",
      children: childExpression.nodes,
    },
  ];
}

function applyNotIfNeeded(
  connection: Schemes["Connection"],
  childNodes: EvalLogicNodePayload[],
): EvalLogicNodePayload[] {
  if (!(connection instanceof BooleanConnection)) return childNodes;
  if (connection.booleanOperator !== "NOT") return childNodes;
  if (childNodes.length === 0) return childNodes;

  if (childNodes.length === 1) {
    const [child] = childNodes;
    if (!child) return childNodes;

    return [
      {
        id: "",
        type: "OPERATOR",
        operatorValue: "NOT",
      },
      child,
    ];
  }

  return [
    {
      id: "",
      type: "OPERATOR",
      operatorValue: "NOT",
    },
    {
      id: "",
      type: "GROUP",
      children: childNodes,
    },
  ];
}

function getLogicalNodeOperatorValue(
  node: LogicalNode,
): EvalLogicNodeOperatorValue {
  return node instanceof AndNode ? "AND" : "OR";
}

function getActionSeverity(node: NodeProps | undefined): EvalSeverity | null {
  if (node instanceof ActionNodeBase) {
    return node.evalSeverity;
  }

  return null;
}

function getTestCaseTypeFromResultInputConnection(
  connection: Schemes["Connection"],
): EvalTestCaseType {
  if (connection instanceof BooleanConnection) {
    return connection.booleanOperator === "NOT" ? "DEFECT" : "CHECK";
  }

  return "CHECK";
}
