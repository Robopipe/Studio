import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { addLimitToEditor } from "@/modules/evaluation/graph/editor/deserialization/deserializeLimits";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import type { FullLimitItem } from "@/modules/evaluation/graph/editor/serialization/serializeLimitItems";
import type { FullLimit } from "@/modules/evaluation/graph/editor/serialization/serializeLimits";
import {
  createTestArea,
  createTestEditor,
} from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
  EvalSeverityEnum,
} from "@repo/schema";
import { describe, expect, it } from "vitest";

const countItem = (
  operator: EvalLimitItemOperatorEnum = EvalLimitItemOperatorEnum.AND,
): FullLimitItem => ({
  id: null,
  parameter: EvalLimitItemParameterEnum.COUNT,
  limitFrom: 1,
  limitTo: 5,
  operator,
  quantifierType: EvalLimitItemQuantifierTypeEnum.EXACT,
  quantifierUnit: EvalLimitItemQuantifierUnitEnum.PERCENT,
  quantifierValue: 100,
  targetEdge: EvalLimitItemEdgeEnum.CENTER,
  parentEdge: EvalLimitItemEdgeEnum.CENTER,
});

const baseLimit: FullLimit = {
  id: "limit-1",
  name: "My Limit",
  severity: null,
  enabled: true,
  targetLabelId: 1,
  targetParentLabelId: null,
  limitItems: [],
};

describe("addLimitToEditor — node creation", () => {
  it("creates a LimitNode with the payload id", async () => {
    const editor = createTestEditor();
    const { limitNode } = await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      id: "lim-abc",
    });

    expect(limitNode.id).toBe("lim-abc");
    expect(editor.getNode("lim-abc")).toBe(limitNode);
  });

  it("returns a LimitNode instance", async () => {
    const editor = createTestEditor();
    const result = await addLimitToEditor(editor, createTestArea(), baseLimit);
    expect(result.limitNode).toBeInstanceOf(LimitNode);
  });

  it("adds no limit item nodes when limitItems is empty", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      limitItems: [],
    });

    const nonLimitNodes = editor
      .getNodes()
      .filter((n) => !(n instanceof LimitNode));
    expect(nonLimitNodes).toHaveLength(0);
  });

  it("creates one child node per limit item", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      limitItems: [countItem(), countItem()],
    });

    expect(
      editor.getNodes().filter((n) => n instanceof CountNode),
    ).toHaveLength(2);
  });

  it("sets each limit item parent to the limit node id", async () => {
    const editor = createTestEditor();
    const { limitNode, limitItemNodes } = await addLimitToEditor(
      editor,
      createTestArea(),
      {
        ...baseLimit,
        limitItems: [countItem()],
      },
    );

    expect(limitItemNodes[0]?.parent).toBe(limitNode.id);
  });
});

describe("addLimitToEditor — limit item connections", () => {
  it("connects consecutive limit items with a LimitItemConnection", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      limitItems: [countItem(EvalLimitItemOperatorEnum.OR), countItem(EvalLimitItemOperatorEnum.AND)],
    });

    const limitItemConns = editor
      .getConnections()
      .filter((c) => c instanceof LimitItemConnection);
    expect(limitItemConns).toHaveLength(1);
  });

  it("uses the source item operator on the LimitItemConnection", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      limitItems: [countItem(EvalLimitItemOperatorEnum.OR), countItem(EvalLimitItemOperatorEnum.AND)],
    });

    const conn = editor
      .getConnections()
      .find((c): c is LimitItemConnection => c instanceof LimitItemConnection);
    expect(conn?.limitItemOperator).toBe("OR");
  });

  it("adds N-1 connections for N limit items", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      limitItems: [countItem(), countItem(), countItem()],
    });

    const limitItemConns = editor
      .getConnections()
      .filter((c) => c instanceof LimitItemConnection);
    expect(limitItemConns).toHaveLength(2);
  });
});

describe("addLimitToEditor — severity", () => {
  it("creates an AlertNode when severity is ALERT", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      severity: EvalSeverityEnum.ALERT,
    });

    expect(editor.getNodes().some((n) => n instanceof AlertNode)).toBe(true);
  });

  it("creates a WarningNode when severity is WARNING", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      severity: EvalSeverityEnum.WARNING,
    });

    expect(editor.getNodes().some((n) => n instanceof WarningNode)).toBe(true);
  });

  it("connects the limit node to the action node", async () => {
    const editor = createTestEditor();
    const { limitNode } = await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      severity: EvalSeverityEnum.ALERT,
    });

    const conn = editor
      .getConnections()
      .find(
        (c): c is BooleanConnection =>
          c instanceof BooleanConnection && c.source === limitNode.id,
      );
    expect(conn).toBeDefined();
    expect(editor.getNode(conn!.target)).toBeInstanceOf(AlertNode);
  });

  it("does not create an action node when severity is null", async () => {
    const editor = createTestEditor();
    await addLimitToEditor(editor, createTestArea(), {
      ...baseLimit,
      severity: null,
    });

    expect(
      editor
        .getNodes()
        .filter((n) => n instanceof AlertNode || n instanceof WarningNode),
    ).toHaveLength(0);
  });
});
