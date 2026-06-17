import type { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type { EvalLimitItemOperator } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { createToggleConnectionView } from "./ToggleConnectionView";

export function createLimitItemConnectionView(
  refreshConnection: (id: string) => void,
) {
  return createToggleConnectionView<EvalLimitItemOperator, LimitItemConnection>(
    {
      refreshConnection,
      options: ["AND", "OR"],
      fallback: "AND",
      getValue: (connection) => connection.limitItemOperator,
      setValue: (connection, value) => {
        connection.limitItemOperator = value;
      },
    },
  );
}
