// FIX(testing): deserializeTestCase has no test file — the destructive removeAllNodes-first
// behavior, the limitNodesById wiring, and the severity/type pass-through are untested — fix:
// add a deserializeTestCase test (and a round-trip suite with serializeTestCase, see the note
// there); why: this is the only public entry point for loading a test case and a regression here
// wipes the user's graph.
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
  // Deselect before removing: the area selector keeps its own set of selected
  // entities that is NOT cleared by editor.removeNode, so wiping nodes while any
  // are selected leaves the selector holding stale references — which then breaks
  // deselect-on-select and dragging. Clearing while the nodes still exist lets the
  // selector unwind cleanly.
  if (selectableNodes) {
    await deselectAllNodes(selectableNodes, editor);
  }

  await removeAllNodes(editor);

  const limitNodesById = new Map<string, LimitNode>();

  for (const limit of testCase.limits ?? []) {
    const { limitNode } = await addLimitToEditor(editor, area, limit, labels);

    limitNodesById.set(limitNode.id, limitNode);
  }

  // FIX(consistency): layout responsibility is split inconsistently — addLimitToEditor manually
  // positions limit item children via area.translate, but limit nodes, logical nodes and the
  // ResultNode are all left at (0,0), so deserializeTestCase only produces a usable canvas if the
  // caller remembers to run arrange.layout() afterwards (Workspace.tsx does) — fix: either invoke
  // the arrange plugin here as the final step or drop the manual translate in deserializeLimits
  // and document that callers must arrange; why: an implicit caller contract that, if missed,
  // renders every top-level node stacked at the origin.
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
