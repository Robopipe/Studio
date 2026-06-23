import type {
  BooleanConnection,
  BooleanOperator,
} from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { createToggleConnectionView } from "./ToggleConnectionView";

export function createBooleanConnectionView(
  refreshConnection: (id: string) => void,
) {
  return createToggleConnectionView<BooleanOperator, BooleanConnection>({
    refreshConnection,
    options: ["TRUE", "NOT"],
    fallback: "TRUE",
    getValue: (connection) => connection.booleanOperator,
    setValue: (connection, value) => {
      connection.booleanOperator = value;
    },
    getLabel: (value) => (value === "TRUE" ? "PASS" : "FLIP"),
  });
}
