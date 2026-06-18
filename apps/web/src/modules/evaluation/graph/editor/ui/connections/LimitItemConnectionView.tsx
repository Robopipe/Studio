import type { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { EvalLimitItemOperatorEnum } from "@repo/schema";
import { createToggleConnectionView } from "./ToggleConnectionView";

export function createLimitItemConnectionView(
  refreshConnection: (id: string) => void,
) {
  return createToggleConnectionView<
    EvalLimitItemOperatorEnum,
    LimitItemConnection
  >({
    refreshConnection,
    options: [EvalLimitItemOperatorEnum.AND, EvalLimitItemOperatorEnum.OR],
    fallback: EvalLimitItemOperatorEnum.AND,
    getValue: (connection) => connection.limitItemOperator,
    setValue: (connection, value) => {
      connection.limitItemOperator = value;
    },
  });
}
