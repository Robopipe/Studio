import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import {
  deselectAllNodes,
  type SelectableNodes,
} from "@/modules/evaluation/graph/editor/utils/nodeSelection";
import { removeAllNodes } from "@/modules/evaluation/graph/editor/utils/removeNodes";
import type { EvalTestCaseFullCreateOrUpdate } from "@repo/schema";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { addLimitToEditor } from "./deserializeLimits";
import { addLogicToEditor } from "./deserializeLogicNodes";

export async function deserializeTestCase(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, AreaExtra>,
  testCase: EvalTestCaseFullCreateOrUpdate,
  labels: LabelOption[] = [],
  selectableNodes?: SelectableNodes,
) {
  if (selectableNodes) {
    await deselectAllNodes(selectableNodes, editor);
  }

  await removeAllNodes(editor);

  const limitNodesById = new Map<string, LimitNode>();

  for (const limit of testCase.limits ?? []) {
    const { limitNode } = await addLimitToEditor(editor, area, limit, labels);

    limitNodesById.set(limitNode.id, limitNode);
  }

  await addLogicToEditor(editor, testCase.logicNodes ?? [], limitNodesById, {
    severity: testCase.severity,
    type: testCase.type,
  });

  await updateAllNodes(editor, area);
}

async function updateAllNodes(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, AreaExtra>,
) {
  await Promise.all(
    editor.getNodes().map((node) => area.update("node", node.id)),
  );
}
