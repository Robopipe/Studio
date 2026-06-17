import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type {
  LimitItemProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type {
  EvalLimitItemCreateOrUpdatePayload,
  EvalLimitItemOperator,
} from "./backendTypes";

export function serializeLimitItemNode(
  editor: NodeEditor<Schemes>,
  node: LimitItemProps,
): EvalLimitItemCreateOrUpdatePayload {
  return {
    id: node.id,
    limitFrom: node.limitFrom,
    limitTo: node.limitTo,
    parameter: node.parameter,
    operator: getLimitItemOperator(editor, node.id),
    quantifierType: node.quantifierType,
    quantifierUnit: node.quantifierUnit,
    quantifierValue: node.quantifierValue,
    targetEdge: node.targetEdge,
    parentEdge: node.parentEdge,
  };
}

function getLimitItemOperator(
  editor: NodeEditor<Schemes>,
  nodeId: string,
): EvalLimitItemOperator {
  const connection = editor
    .getConnections()
    .find(
      (connection) =>
        connection.source === nodeId &&
        connection instanceof LimitItemConnection,
    ) as LimitItemConnection | undefined;

  return connection?.limitItemOperator ?? "AND";
}
