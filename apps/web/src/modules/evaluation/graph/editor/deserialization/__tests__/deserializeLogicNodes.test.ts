import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { addLogicToEditor } from "@/modules/evaluation/graph/editor/deserialization/deserializeLogicNodes";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { createTestEditor } from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
import {
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
  EvalSeverityEnum,
  EvalTestCaseTypeEnum,
  type EvalLogicNode,
} from "@repo/schema";
import { describe, expect, it } from "vitest";

type TestEditor = ReturnType<typeof createTestEditor>;

async function addLimits(
  editor: TestEditor,
  count: number,
): Promise<LimitNode[]> {
  const limits: LimitNode[] = [];
  for (let i = 0; i < count; i++) {
    const limit = new LimitNode({ label: (i % 2) + 1 });
    await editor.addNode(limit);
    limits.push(limit);
  }
  return limits;
}

function limitMap(limits: LimitNode[]): Map<string, LimitNode> {
  return new Map(limits.map((n) => [n.id, n]));
}

describe("addLogicToEditor — ResultNode", () => {
  it("always creates a ResultNode", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(
      editor.getNodes().filter((n) => n instanceof ResultNode),
    ).toHaveLength(1);
  });

  it("returns the ResultNode", async () => {
    const editor = createTestEditor();
    const result = await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(result).toBeInstanceOf(ResultNode);
  });

  it("adds no connections when logicNodes is empty", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(editor.getConnections()).toHaveLength(0);
  });
});

describe("addLogicToEditor — top-level NOT drives the result connection", () => {
  it("uses TRUE on the result connection for a plain limit", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNode[] = [
      { id: limit!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      },
    );

    const conn = editor
      .getConnections()
      .find(
        (c): c is BooleanConnection =>
          c instanceof BooleanConnection && c.target === resultNode.id,
      );
    expect(conn?.booleanOperator).toBe("TRUE");
  });

  it("uses NOT on the result connection for a top-level [NOT, LIMIT]", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNode[] = [
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.NOT },
      { id: limit!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      },
    );

    // The NOT rides on the result-input connection, and the limit feeds it directly.
    const conn = editor
      .getConnections()
      .find(
        (c): c is BooleanConnection =>
          c instanceof BooleanConnection && c.target === resultNode.id,
      );
    expect(conn?.booleanOperator).toBe("NOT");
    expect(conn?.source).toBe(limit!.id);
  });
});

describe("addLogicToEditor — single limit", () => {
  it("connects the limit directly to the ResultNode", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNode[] = [
      { id: limit!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      },
    );

    const conn = editor.getConnections().find((c) => c.source === limit!.id);
    expect(conn).toBeDefined();
    expect(conn!.target).toBe(resultNode.id);
  });
});

describe("addLogicToEditor — logical operators", () => {
  it("creates an AndNode for AND operator", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNode[] = [
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(editor.getNodes().some((n) => n instanceof AndNode)).toBe(true);
  });

  it("creates an OrNode for OR operator", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNode[] = [
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.OR },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(editor.getNodes().some((n) => n instanceof OrNode)).toBe(true);
  });

  it("connects both limits to the logical node", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNode[] = [
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    const andNode = editor.getNodes().find((n) => n instanceof AndNode)!;
    const incomingToAnd = editor
      .getConnections()
      .filter((c) => c.target === andNode.id);
    expect(incomingToAnd).toHaveLength(2);
  });
});

describe("addLogicToEditor — NOT operator", () => {
  it("applies NOT on the connection for the negated child", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNode[] = [
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.NOT },
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    const notConns = editor
      .getConnections()
      .filter(
        (c): c is BooleanConnection =>
          c instanceof BooleanConnection && c.booleanOperator === "NOT",
      );
    expect(notConns).toHaveLength(1);
    expect(notConns[0]!.source).toBe(limitA!.id);
  });
});

describe("addLogicToEditor — GROUP", () => {
  it("creates both AND and OR nodes for a nested (A OR B) AND C expression", async () => {
    const editor = createTestEditor();
    const [limitA, limitB, limitC] = await addLimits(editor, 3);
    const logicNodes: EvalLogicNode[] = [
      {
        id: "group-1",
        type: EvalLogicNodeTypeEnum.GROUP,
        children: [
          { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
          { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.OR },
          { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
        ],
      },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
      { id: limitC!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limitA!, limitB!, limitC!]),
      {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      },
    );

    expect(editor.getNodes().some((n) => n instanceof OrNode)).toBe(true);
    expect(editor.getNodes().some((n) => n instanceof AndNode)).toBe(true);
  });

  it("parses a mixed-operator level left-associatively: A OR B AND (C AND D)", async () => {
    const editor = createTestEditor();
    const [limitA, limitB, limitC, limitD] = await addLimits(editor, 4);
    // Flat list as the table-view LogicBuilder emits it: each operand carries its
    // own connector, nesting only via GROUP. Read left-to-right this is
    // ((A OR B) AND (C AND D)).
    const logicNodes: EvalLogicNode[] = [
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.OR },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
      {
        id: "group-1",
        type: EvalLogicNodeTypeEnum.GROUP,
        children: [
          { id: limitC!.id, type: EvalLogicNodeTypeEnum.LIMIT },
          { id: "", type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: EvalLogicNodeOperatorValueEnum.AND },
          { id: limitD!.id, type: EvalLogicNodeTypeEnum.LIMIT },
        ],
      },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limitA!, limitB!, limitC!, limitD!]),
      { type: EvalTestCaseTypeEnum.CHECK, severity: null },
    );

    const orNodes = editor.getNodes().filter((n) => n instanceof OrNode);
    const andNodes = editor.getNodes().filter((n) => n instanceof AndNode);
    expect(orNodes).toHaveLength(1);
    expect(andNodes).toHaveLength(2); // top-level AND + the group's AND

    // The ResultNode is fed by the top-level AND.
    const resultInput = editor
      .getConnections()
      .find((c) => c.target === resultNode.id);
    const topAnd = andNodes.find((n) => n.id === resultInput!.source);
    expect(topAnd).toBeDefined();

    // The top-level AND combines the OR node and the group's AND node.
    const groupAnd = andNodes.find((n) => n.id !== topAnd!.id)!;
    const topAndSources = editor
      .getConnections()
      .filter((c) => c.target === topAnd!.id)
      .map((c) => c.source);
    expect(topAndSources).toContain(orNodes[0]!.id);
    expect(topAndSources).toContain(groupAnd.id);

    // The OR node combines limits A and B (not C/D).
    const orSources = editor
      .getConnections()
      .filter((c) => c.target === orNodes[0]!.id)
      .map((c) => c.source);
    expect(orSources).toEqual(
      expect.arrayContaining([limitA!.id, limitB!.id]),
    );
  });

  it("throws for an empty GROUP", async () => {
    const editor = createTestEditor();
    const logicNodes: EvalLogicNode[] = [
      { id: "g1", type: EvalLogicNodeTypeEnum.GROUP, children: [] },
    ];

    await expect(
      addLogicToEditor(editor, logicNodes, new Map(), {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      }),
    ).rejects.toThrow("Empty logic group");
  });
});

describe("addLogicToEditor — error cases", () => {
  it("throws when a LIMIT id is not in the limitNodesById map", async () => {
    const editor = createTestEditor();
    const logicNodes: EvalLogicNode[] = [
      { id: "missing", type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await expect(
      addLogicToEditor(editor, logicNodes, new Map(), {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      }),
    ).rejects.toThrow("Missing limit node");
  });

  it("throws when operands do not alternate with operators", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNode[] = [
      { id: limitA!.id, type: EvalLogicNodeTypeEnum.LIMIT },
      { id: limitB!.id, type: EvalLogicNodeTypeEnum.LIMIT },
    ];

    await expect(
      addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
        type: EvalTestCaseTypeEnum.CHECK,
        severity: null,
      }),
    ).rejects.toThrow("alternate");
  });
});

describe("addLogicToEditor — empty logicNodes fallback", () => {
  it("connects a lone limit to the ResultNode when logicNodes is empty", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);

    const resultNode = await addLogicToEditor(editor, [], limitMap([limit!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    const conn = editor.getConnections().find((c) => c.source === limit!.id);
    expect(conn).toBeDefined();
    expect(conn!.target).toBe(resultNode.id);
  });

  it("AND-joins multiple limits into the ResultNode when logicNodes is empty", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);

    await addLogicToEditor(editor, [], limitMap([limitA!, limitB!]), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(editor.getNodes().some((n) => n instanceof AndNode)).toBe(true);
  });
});

describe("addLogicToEditor — severity", () => {
  it("creates an AlertNode when severity is ALERT", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: EvalSeverityEnum.ALERT,
    });

    expect(editor.getNodes().some((n) => n instanceof AlertNode)).toBe(true);
  });

  it("creates a WarningNode when severity is WARNING", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: EvalSeverityEnum.WARNING,
    });

    expect(editor.getNodes().some((n) => n instanceof WarningNode)).toBe(true);
  });

  it("connects the ResultNode to the action node", async () => {
    const editor = createTestEditor();
    const resultNode = await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: EvalSeverityEnum.ALERT,
    });

    const conn = editor
      .getConnections()
      .find((c) => c.source === resultNode.id);
    expect(conn).toBeDefined();
    expect(editor.getNode(conn!.target)).toBeInstanceOf(AlertNode);
  });

  it("adds no action node when severity is null", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: EvalTestCaseTypeEnum.CHECK,
      severity: null,
    });

    expect(
      editor
        .getNodes()
        .filter((n) => n instanceof AlertNode || n instanceof WarningNode),
    ).toHaveLength(0);
  });
});
