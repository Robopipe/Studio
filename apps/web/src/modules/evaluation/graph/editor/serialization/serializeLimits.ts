import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type {
  LimitItemProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import {
  isLimitItemNode,
  isLimitNode,
} from "@/modules/evaluation/graph/editor/utils/guards";
import type {
  EvalSeverityEnum,
  EvalTestCaseFullCreateOrUpdate,
} from "@repo/schema";
import type { NodeEditor } from "rete";
import { serializeLimitItemNode } from "./serializeLimitItems";
import { parseNullableNumber, parseRequiredNumber } from "./utils";

export type FullLimit = NonNullable<
  EvalTestCaseFullCreateOrUpdate["limits"]
>[number];

export function serializeLimits(
  editor: NodeEditor<Schemes>,
): FullLimit[] {
  return editor
    .getNodes()
    .filter(isLimitNode)
    .map((limitNode) => serializeLimitNode(editor, limitNode));
}

export function serializeLimitNode(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): FullLimit {
  const limitItems = getLimitItemChildren(editor, limitNode).map((node) =>
    serializeLimitItemNode(editor, node),
  );

  return {
    id: limitNode.id,
    name: limitNode.name,
    severity: getLimitSeverity(editor, limitNode),
    enabled: limitNode.enabledValue,
    targetLabelId: parseRequiredNumber(
      limitNode.labelValue,
      "Limit label is required.",
    ),
    targetParentLabelId: parseNullableNumber(limitNode.parentLabelValue),
    limitItems,
  };
}

function getLimitItemChildren(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): LimitItemProps[] {
  return editor
    .getNodes()
    .filter((node) => node.parent === limitNode.id)
    .filter(isLimitItemNode);
}

function getLimitSeverity(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): EvalSeverityEnum | null {
  const actionNode = editor
    .getConnections()
    .filter((connection) => connection.source === limitNode.id)
    .map((connection) => editor.getNode(connection.target))
    .find((node) => node instanceof ActionNodeBase);

  return actionNode instanceof ActionNodeBase ? actionNode.evalSeverity : null;
}
