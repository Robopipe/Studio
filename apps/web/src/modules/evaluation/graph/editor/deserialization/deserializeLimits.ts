import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import type { LabelOption } from "@/modules/evaluation/graph/editor/controls/label";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { FullLimit } from "@/modules/evaluation/graph/editor/serialization/serializeLimits";
import type { AreaExtra } from "@/modules/evaluation/graph/editor/setup/createEditor";
import type {
  LimitItemProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import { EvalSeverityEnum } from "@repo/schema";
import type { NodeEditor } from "rete";
import type { AreaPlugin } from "rete-area-plugin";
import { createLimitItemNode } from "./deserializeLimitItems";

const LIMIT_ITEM_START_X = 40;
const LIMIT_ITEM_START_Y = 120;
const LIMIT_ITEM_GAP_X = 170;

export type DeserializedLimit = {
  limitNode: LimitNode;
  limitItemNodes: LimitItemProps[];
};

export async function addLimitToEditor(
  editor: NodeEditor<Schemes>,
  area: AreaPlugin<Schemes, AreaExtra>,
  limit: FullLimit,
  labels: LabelOption[] = [],
): Promise<DeserializedLimit> {
  const limitNode = new LimitNode({
    id: limit.id ?? undefined,
    name: limit.name,
    label: limit.targetLabelId,
    parentLabel: limit.targetParentLabelId,
    enabled: limit.enabled,
    labels,
  });

  await editor.addNode(limitNode);

  const limitItemNodes: LimitItemProps[] = [];

  for (const [index, item] of limit.limitItems.entries()) {
    const limitItemNode = createLimitItemNode(item);

    limitItemNode.parent = limitNode.id;

    await editor.addNode(limitItemNode);

    await area.translate(limitItemNode.id, {
      x: LIMIT_ITEM_START_X + index * LIMIT_ITEM_GAP_X,
      y: LIMIT_ITEM_START_Y,
    });

    limitItemNodes.push(limitItemNode);
  }

  await addLimitItemConnections(editor, limitItemNodes, limit);
  await addDirectLimitActionIfNeeded(editor, limitNode, limit.severity);

  await area.update("node", limitNode.id);

  for (const node of limitItemNodes) {
    await area.update("node", node.id);
  }

  return {
    limitNode,
    limitItemNodes,
  };
}

async function addLimitItemConnections(
  editor: NodeEditor<Schemes>,
  nodes: LimitItemProps[],
  limit: FullLimit,
) {
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const sourceNode = nodes[index];
    const targetNode = nodes[index + 1];
    const sourceItem = limit.limitItems[index];

    if (!sourceNode || !targetNode || !sourceItem) continue;

    const connection = new LimitItemConnection(
      sourceNode,
      "out",
      targetNode,
      "in",
      sourceItem.operator,
    );

    await editor.addConnection(connection);
  }
}

async function addDirectLimitActionIfNeeded(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
  severity: EvalSeverityEnum | null,
) {
  if (!severity) return;

  const actionNode = createActionNode(severity);

  await editor.addNode(actionNode);

  const connection = new BooleanConnection(
    limitNode,
    "out",
    actionNode,
    "in",
    "TRUE",
  );

  await editor.addConnection(connection);
}

function createActionNode(severity: EvalSeverityEnum) {
  return severity === EvalSeverityEnum.ALERT
    ? new AlertNode()
    : new WarningNode();
}
