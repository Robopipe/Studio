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
import {
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
  EvalSeverityEnum,
  EvalTestCaseTypeEnum,
  type EvalLogicNode,
} from "@repo/schema";
import { v7 as uuidv7 } from "uuid";

export type LogicSerializationResult = {
  type: EvalTestCaseTypeEnum;
  severity: EvalSeverityEnum | null;
  logicNodes: EvalLogicNode[];
};

type LogicalNode = AndNode | OrNode;

type SerializedExpression = {
  operatorValue: EvalLogicNodeOperatorValueEnum | null;
  nodes: EvalLogicNode[];
};

export function serializeLogicNodes(
  editor: NodeEditor<Schemes>,
): LogicSerializationResult {
  const resultNode = editor
    .getNodes()
    .find((node) => node instanceof ResultNode);

  if (!resultNode) {
    return {
      type: EvalTestCaseTypeEnum.CHECK,
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
      type: EvalTestCaseTypeEnum.CHECK,
      severity: getActionSeverity(resultActionNode),
      logicNodes: [],
    };
  }

  const resultInputSourceNode = editor.getNode(resultInputConnection.source);

  if (!resultInputSourceNode) {
    return {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: getActionSeverity(resultActionNode),
      logicNodes: [],
    };
  }

  const expression = serializeExpression(editor, resultInputSourceNode);

  // The test-case type is always CHECK (the table view has no DEFECT). A NOT on the
  // result-input connection negates the whole expression and is emitted as a top-level
  // NOT operator — only producible for a single Limit -> Result edge (see setupRender).
  const logicNodes = applyNotIfNeeded(resultInputConnection, expression.nodes);

  return {
    type: EvalTestCaseTypeEnum.CHECK,
    severity: getActionSeverity(resultActionNode),
    logicNodes,
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
  parentOperatorValue: EvalLogicNodeOperatorValueEnum | null = null,
): SerializedExpression {
  if (node instanceof LimitNode) {
    return {
      operatorValue: null,
      nodes: [
        {
          id: node.id,
          type: EvalLogicNodeTypeEnum.LIMIT,
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
  parentOperatorValue: EvalLogicNodeOperatorValueEnum | null,
): SerializedExpression {
  const operatorValue = getLogicalNodeOperatorValue(node);

  const incomingConnections = editor
    .getConnections()
    .filter((connection) => connection.target === node.id)
    .sort((a, b) => a.source.localeCompare(b.source));

  const children: EvalLogicNode[] = [];

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
        id: uuidv7(),
        type: EvalLogicNodeTypeEnum.OPERATOR,
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
          type: EvalLogicNodeTypeEnum.GROUP,
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
  parentOperatorValue: EvalLogicNodeOperatorValueEnum,
): EvalLogicNode[] {
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
      id: uuidv7(),
      type: EvalLogicNodeTypeEnum.GROUP,
      children: childExpression.nodes,
    },
  ];
}

function applyNotIfNeeded(
  connection: Schemes["Connection"],
  childNodes: EvalLogicNode[],
): EvalLogicNode[] {
  if (!(connection instanceof BooleanConnection)) return childNodes;
  if (connection.booleanOperator !== "NOT") return childNodes;
  if (childNodes.length === 0) return childNodes;

  if (childNodes.length === 1) {
    const [child] = childNodes;
    if (!child) return childNodes;

    return [
      {
        id: uuidv7(),
        type: EvalLogicNodeTypeEnum.OPERATOR,
        operatorValue: EvalLogicNodeOperatorValueEnum.NOT,
      },
      child,
    ];
  }

  return [
    {
      id: uuidv7(),
      type: EvalLogicNodeTypeEnum.OPERATOR,
      operatorValue: EvalLogicNodeOperatorValueEnum.NOT,
    },
    {
      id: uuidv7(),
      type: EvalLogicNodeTypeEnum.GROUP,
      children: childNodes,
    },
  ];
}

function getLogicalNodeOperatorValue(
  node: LogicalNode,
): EvalLogicNodeOperatorValueEnum {
  return node instanceof AndNode
    ? EvalLogicNodeOperatorValueEnum.AND
    : EvalLogicNodeOperatorValueEnum.OR;
}

function getActionSeverity(
  node: NodeProps | undefined,
): EvalSeverityEnum | null {
  if (node instanceof ActionNodeBase) {
    return node.evalSeverity;
  }

  return null;
}

