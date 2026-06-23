import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import type {
  BooleanNodeProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import { EvalSeverityEnum } from "@repo/schema";
import type { NodeEditor } from "rete";

/**
 * Adds the action node for a severity (alert/warning) and wires it from `source`
 * with a plain TRUE Boolean connection. Shared by the limit and logic
 * deserializers so the severity-to-action mapping lives in one place.
 */
export async function addActionForSeverity(
  editor: NodeEditor<Schemes>,
  source: BooleanNodeProps,
  severity: EvalSeverityEnum | null,
) {
  if (!severity) return;

  const actionNode =
    severity === EvalSeverityEnum.ALERT ? new AlertNode() : new WarningNode();

  await editor.addNode(actionNode);
  await editor.addConnection(
    new BooleanConnection(source, "out", actionNode, "in", "TRUE"),
  );
}
