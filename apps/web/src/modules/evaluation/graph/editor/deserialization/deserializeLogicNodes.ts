// FIX(naming): "LogicNodes" here vs "Logical" everywhere else (nodes/logical/, validateLogical.ts, LogicalNodeBase) — fix: rename to deserializeLogicalNodes.ts (and the serialization twin), or add a note that the name intentionally mirrors the backend payload field `logicNodes`; why: the Logic/Logical split makes cross-module grep and navigation unreliable.
import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type {
  EvalLogicNodePayload,
  EvalSeverity,
  EvalTestCaseType,
} from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import type {
  LogicalProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";

type LogicOptions = {
  severity: EvalSeverity | null;
  type: EvalTestCaseType;
};

type ExpressionNode =
  | {
      kind: "limit";
      limitId: string;
    }
  | {
      kind: "not";
      child: ExpressionNode;
    }
  | {
      kind: "operator";
      operator: "AND" | "OR";
      children: ExpressionNode[];
    };

type BuildContext = {
  editor: NodeEditor<Schemes>;
  limitNodesById: Map<string, LimitNode>;
};

export async function addLogicToEditor(
  editor: NodeEditor<Schemes>,
  logicNodes: EvalLogicNodePayload[],
  limitNodesById: Map<string, LimitNode>,
  options: LogicOptions,
): Promise<ResultNode> {
  const resultNode = new ResultNode();

  await editor.addNode(resultNode);

  const expression = parseLogicExpression(logicNodes);

  if (expression) {
    const finalSourceNode = await createLogicGraphFromExpression(
      {
        editor,
        limitNodesById,
      },
      expression,
    );

    const resultInputConnection = new BooleanConnection(
      finalSourceNode,
      "out",
      resultNode,
      "in",
      getResultInputBooleanOperator(options.type),
    );

    await editor.addConnection(resultInputConnection);
  }

  await addFinalActionIfNeeded(editor, resultNode, options);

  return resultNode;
}

function parseLogicExpression(
  nodes: EvalLogicNodePayload[],
): ExpressionNode | null {
  if (nodes.length === 0) return null;

  const parts: Array<ExpressionNode | "AND" | "OR"> = [];
  let pendingNot = false;

  for (const node of nodes) {
    if (node.type === "OPERATOR") {
      if (node.operatorValue === "NOT") {
        pendingNot = true;
        continue;
      }
      if (node.operatorValue === "AND" || node.operatorValue === "OR") {
        parts.push(node.operatorValue);
      }
      continue;
    }

    const operand = parseOperand(node);
    const maybeNegated = pendingNot
      ? {
          kind: "not" as const,
          child: operand,
        }
      : operand;

    pendingNot = false;
    parts.push(maybeNegated);
  }

  return collapseExpressionParts(parts);
}

function parseOperand(node: EvalLogicNodePayload): ExpressionNode {
  if (node.type === "LIMIT") {
    return {
      kind: "limit",
      limitId: node.id,
    };
  }

  if (node.type === "GROUP") {
    const expression = parseLogicExpression(node.children);

    if (!expression) throw new Error(`Empty logic group "${node.id}".`);
    return expression;
  }

  throw new Error("Unexpected operator where operand was expected.");
}

// FIX(error-handling): malformed or mixed-operator payloads are silently misparsed — `find`
// picks the first AND/OR token and treats ALL operands as its children, so "A AND B OR C"
// collapses to AND(A, B, C) with the OR dropped, and two adjacent operands with no operator
// ([A, B]) silently discard B via `return first` — fix: validate that parts strictly alternate
// operand/operator and that every operator token at one level is identical, throwing on
// violation; why: backend payloads that break the serializer's uniform-operator-per-level
// invariant get silently reinterpreted into different logic instead of being rejected.
function collapseExpressionParts(
  parts: Array<ExpressionNode | "AND" | "OR">,
): ExpressionNode {
  const first = parts[0];
  if (!first || typeof first === "string")
    throw new Error("Invalid logic expression.");

  const operator = parts.find((part): part is "AND" | "OR" => {
    return part === "AND" || part === "OR";
  });

  if (!operator) return first;

  const children = parts.filter(
    (part): part is ExpressionNode => typeof part !== "string",
  );
  return {
    kind: "operator",
    operator,
    children,
  };
}

async function createLogicGraphFromExpression(
  context: BuildContext,
  expression: ExpressionNode,
): Promise<LogicalProps> {
  if (expression.kind === "limit") {
    const limitNode = context.limitNodesById.get(expression.limitId);
    if (!limitNode)
      throw new Error(`Missing limit node "${expression.limitId}".`);
    return limitNode;
  }

  // FIX(bug): a top-level 'not' expression is silently dropped — this branch returns the child
  // node without applying the negation; the 'NOT' boolean operator is only applied when the
  // 'not' is a direct child of an operator expression (see the loop below). A payload like
  // [{type:'OPERATOR',operatorValue:'NOT'}, {type:'LIMIT',id}] — which serializeLogicNodes emits
  // for an AND/OR node with a single negated input — deserializes into a plain TRUE connection
  // to the ResultNode — fix: detect a top-level 'not' in addLogicToEditor and apply 'NOT' to the
  // result input connection (combined with the CHECK/DEFECT operator), or throw if that
  // combination is unrepresentable; why: silent round-trip data loss that inverts the test case
  // logic with no error.
  if (expression.kind === "not")
    return createLogicGraphFromExpression(context, expression.child);

  const logicalNode =
    expression.operator === "AND" ? new AndNode() : new OrNode();
  await context.editor.addNode(logicalNode);

  for (const childExpression of expression.children) {
    const childNode = await createLogicGraphFromExpression(
      context,
      childExpression,
    );
    const connection = new BooleanConnection(
      childNode,
      "out",
      logicalNode,
      "in",
      childExpression.kind === "not" ? "NOT" : "TRUE",
    );
    await context.editor.addConnection(connection);
  }

  return logicalNode;
}

// FIX(duplication): severity-to-action mapping and the "add action node + TRUE
// BooleanConnection" sequence are duplicated in deserializeLimits.ts
// (createActionNode/addDirectLimitActionIfNeeded use the identical
// `severity === 'ALERT' ? new AlertNode() : new WarningNode()` ternary) — fix: extract a shared
// helper, e.g. addActionForSeverity(editor, sourceNode, severity), used by both deserializers;
// why: two copies of the same mapping will drift when a new severity is introduced.
async function addFinalActionIfNeeded(
  editor: NodeEditor<Schemes>,
  resultNode: ResultNode,
  options: LogicOptions,
) {
  if (!options.severity) return;
  const actionNode =
    options.severity === "ALERT" ? new AlertNode() : new WarningNode();
  await editor.addNode(actionNode);
  const connection = new BooleanConnection(
    resultNode,
    "out",
    actionNode,
    "in",
    "TRUE",
  );
  await editor.addConnection(connection);
}

function getResultInputBooleanOperator(type: EvalTestCaseType) {
  return type === "DEFECT" ? "NOT" : "TRUE";
}
