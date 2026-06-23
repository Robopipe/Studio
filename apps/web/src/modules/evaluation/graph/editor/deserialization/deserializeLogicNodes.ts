import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { addActionForSeverity } from "@/modules/evaluation/graph/editor/deserialization/addActionForSeverity";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type {
  BooleanNodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import {
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
  EvalSeverityEnum,
  type EvalLogicNode,
  type EvalTestCaseTypeEnum,
} from "@repo/schema";
import type { NodeEditor } from "rete";

type LogicOptions = {
  severity: EvalSeverityEnum | null;
  type: EvalTestCaseTypeEnum;
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
  logicNodes: EvalLogicNode[],
  limitNodesById: Map<string, LimitNode>,
  options: LogicOptions,
): Promise<ResultNode> {
  const resultNode = new ResultNode();

  await editor.addNode(resultNode);

  // A test case built from the table view persists no logic tree (`logicNodes: []`),
  // yet its limits must still feed the ResultNode. Fall back to a default expression
  // synthesized from the limits present: a single limit connects directly, multiple
  // limits are connected with AND (the implicit conjunction the table view represents).
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

  await addActionForSeverity(editor, resultNode, options.severity);

  return resultNode;
}

function parseLogicExpression(
  nodes: EvalLogicNode[],
): ExpressionNode | null {
  if (nodes.length === 0) return null;

  const parts: Array<ExpressionNode | "AND" | "OR"> = [];
  let pendingNot = false;

  for (const node of nodes) {
    if (node.type === EvalLogicNodeTypeEnum.OPERATOR) {
      if (node.operatorValue === EvalLogicNodeOperatorValueEnum.NOT) {
        pendingNot = true;
        continue;
      }
      if (node.operatorValue === EvalLogicNodeOperatorValueEnum.AND) {
        parts.push("AND");
      } else if (node.operatorValue === EvalLogicNodeOperatorValueEnum.OR) {
        parts.push("OR");
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

function parseOperand(node: EvalLogicNode): ExpressionNode {
  if (node.type === EvalLogicNodeTypeEnum.LIMIT) {
    return {
      kind: "limit",
      limitId: node.id,
    };
  }

  if (node.type === EvalLogicNodeTypeEnum.GROUP) {
    const expression = parseLogicExpression(
      node.children as EvalLogicNode[],
    );

    if (!expression) throw new Error(`Empty logic group "${node.id}".`);
    return expression;
  }

  throw new Error("Unexpected operator where operand was expected.");
}

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
): Promise<BooleanNodeProps> {
  if (expression.kind === "limit") {
    const limitNode = context.limitNodesById.get(expression.limitId);
    if (!limitNode)
      throw new Error(`Missing limit node "${expression.limitId}".`);
    return limitNode;
  }

  // A nested 'not' returns the inner node; the operator loop below applies
  // the 'NOT' on the connection into the logical node. A TOP-LEVEL 'not' is handled in
  // addLogicToEditor, which strips it and sets 'NOT' on the result-input connection - so
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
