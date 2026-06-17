// FIX(testing): serializeTestCase has no test file, and there is no serialize→deserialize
// round-trip test anywhere in the serialization/deserialization __tests__ suites — fix: add a
// round-trip suite asserting deserializeTestCase followed by serializeTestCase preserves
// type/severity/limits/logicNodes for representative graphs (single limit, NOT-negated child,
// nested groups); why: every leaf module is unit-tested but the composition is not, and a
// round-trip test would have caught the top-level NOT loss in deserializeLogicNodes.
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import type { EvalTestCaseCreateOrUpdatePayload } from "./backendTypes";
import { serializeLimits } from "./serializeLimits";
import { serializeLogicNodes } from "./serializeLogicNodes";

type SerializeTestCaseOptions = {
  id?: string;
  name?: string;
};

export function serializeTestCase(
  editor: NodeEditor<Schemes>,
  options: SerializeTestCaseOptions = {},
): EvalTestCaseCreateOrUpdatePayload {
  const logic = serializeLogicNodes(editor);

  return {
    id: options.id ?? "",
    name: options.name ?? "",
    type: logic.type,
    severity: logic.severity,
    // The editor does not model test-case enablement; that flag is owned by the web UI.
    enabled: true,
    limits: serializeLimits(editor),
    logicNodes: logic.logicNodes,
  };
}
