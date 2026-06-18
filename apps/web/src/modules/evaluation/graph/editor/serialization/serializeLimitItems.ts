import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type {
  LimitItemProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import { EvalLimitItemOperatorEnum } from "@repo/schema";
import type { NodeEditor } from "rete";
import type { FullLimit } from "./serializeLimits";

export type FullLimitItem = FullLimit["limitItems"][number];

export function serializeLimitItemNode(
  editor: NodeEditor<Schemes>,
  node: LimitItemProps,
): FullLimitItem {
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
): EvalLimitItemOperatorEnum {
  const connection = editor
    .getConnections()
    .find(
      (connection) =>
        connection.source === nodeId &&
        connection instanceof LimitItemConnection,
    ) as LimitItemConnection | undefined;

  return connection?.limitItemOperator ?? EvalLimitItemOperatorEnum.AND;
}
