import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { EvalTestCaseFullCreateOrUpdate } from "@repo/schema";
import type { NodeEditor } from "rete";
import { serializeLimits } from "./serializeLimits";
import { serializeLogicNodes } from "./serializeLogicNodes";

type SerializeTestCaseOptions = {
  name?: string;
};

export function serializeTestCase(
  editor: NodeEditor<Schemes>,
  options: SerializeTestCaseOptions = {},
): EvalTestCaseFullCreateOrUpdate {
  const logic = serializeLogicNodes(editor);

  return {
    name: options.name ?? "",
    type: logic.type,
    severity: logic.severity,
    // The editor does not model test-case enablement; that flag is owned by the web UI.
    enabled: true,
    limits: serializeLimits(editor),
    logicNodes: logic.logicNodes,
  };
}
