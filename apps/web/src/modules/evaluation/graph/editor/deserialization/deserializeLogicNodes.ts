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

  // A test case built from the table view persists no logic tree (`logicNodes: []`),
  // yet its limits must still feed the ResultNode. Fall back to a default expression
  // synthesized from the limits present: a single limit connects directly, multiple
  // limits are AND-ed (the implicit conjunction the table view represents).
  const expression =
    parseLogicExpression(logicNodes) ??
    buildDefaultExpression(limitNodesById);

  if (expression) {
    // A top-level NOT negates the whole expression. The test-case type no longer drives
    // the result edge (DEFECT is unsupported); the NOT rides on the result-input
    // connection instead. In the table view this is only producible for a single limit
    // (-> a Limit -> Result edge carrying NOT), but a negated group is preserved too.
    const negateResult = expression.kind === "not";
    const rootExpression = negateResult ? expression.child : expression;

    const finalSourceNode = await createLogicGraphFromExpression(
      {
        editor,
        limitNodesById,
      },
      rootExpression,
    );

    const resultInputConnection = new BooleanConnection(
      finalSourceNode,
      "out",
      resultNode,
      "in",
      negateResult ? "NOT" : "TRUE",
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

function buildDefaultExpression(
  limitNodesById: Map<string, LimitNode>,
): ExpressionNode | null {
  const limitIds = [...limitNodesById.keys()];

  if (limitIds.length === 0) return null;

  const operands: ExpressionNode[] = limitIds.map((limitId) => ({
    kind: "limit",
    limitId,
  }));

  if (operands.length === 1) return operands[0]!;

  return {
    kind: "operator",
    operator: "AND",
    children: operands,
  };
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

// Mirrors the table-view LogicBuilder, which is the canonical producer of `logicNodes`:
// a flat ordered list where each operand carries its own connector and nesting happens
// ONLY through explicit GROUP nodes. There is no operator precedence anywhere in the
// product, so a level is read left-to-right (left-associative): each operator combines
// the accumulated left expression with the next operand. Consecutive identical operators
// are coalesced into one n-ary node (e.g. A OR B OR C -> a single OR), which is
// semantically identical for associative boolean ops and keeps the graph tidy.
//
// Parts must still strictly alternate operand/operator (starting and ending on an
// operand); a level with two operands or two operators in a row is genuine corruption
// the LogicBuilder cannot emit, so it throws rather than guessing.
function collapseExpressionParts(
  parts: Array<ExpressionNode | "AND" | "OR">,
): ExpressionNode {
  const isOperator = (part: ExpressionNode | "AND" | "OR") =>
    part === "AND" || part === "OR";

  parts.forEach((part, index) => {
    const operatorPosition = index % 2 === 1;
    if (operatorPosition !== isOperator(part)) {
      throw new Error(
        "Malformed logic expression: operands and operators must alternate.",
      );
    }
  });

  const first = parts[0];
  if (!first || typeof first === "string")
    throw new Error("Invalid logic expression.");

  let accumulator: ExpressionNode = first;

  for (let index = 1; index < parts.length; index += 2) {
    const operator = parts[index];
    const operand = parts[index + 1];

    if (operator !== "AND" && operator !== "OR")
      throw new Error("Invalid logic expression: operator expected.");
    if (!operand || typeof operand === "string")
      throw new Error("Invalid logic expression: operand expected.");

    // Coalesce a run of the same operator into the existing n-ary node; otherwise
    // nest the accumulated expression as the left child of the new operator.
    accumulator =
      accumulator.kind === "operator" && accumulator.operator === operator
        ? {
            kind: "operator",
            operator,
            children: [...accumulator.children, operand],
          }
        : {
            kind: "operator",
            operator,
            children: [accumulator, operand],
          };
  }

  return accumulator;
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

  // A nested 'not' returns the inner node; the caller (the operator loop below) applies
  // the 'NOT' on the connection into the logical node. A TOP-LEVEL 'not' is handled in
  // addLogicToEditor, which strips it and sets 'NOT' on the result-input connection — so
  // it never reaches here unwrapped.
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
