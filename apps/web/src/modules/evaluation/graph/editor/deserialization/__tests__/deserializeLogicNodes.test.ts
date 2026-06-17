import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { addLogicToEditor } from "@/modules/evaluation/graph/editor/deserialization/deserializeLogicNodes";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { EvalLogicNodePayload } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { createTestEditor } from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
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
      type: "CHECK",
      severity: null,
    });

    expect(
      editor.getNodes().filter((n) => n instanceof ResultNode),
    ).toHaveLength(1);
  });

  it("returns the ResultNode", async () => {
    const editor = createTestEditor();
    const result = await addLogicToEditor(editor, [], new Map(), {
      type: "CHECK",
      severity: null,
    });

    expect(result).toBeInstanceOf(ResultNode);
  });

  it("adds no connections when logicNodes is empty", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: "CHECK",
      severity: null,
    });

    expect(editor.getConnections()).toHaveLength(0);
  });
});

describe("addLogicToEditor — type determines result connection operator", () => {
  it("uses TRUE on the result connection for CHECK type", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limit!.id, type: "LIMIT" },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: "CHECK",
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

  it("uses NOT on the result connection for DEFECT type", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limit!.id, type: "LIMIT" },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: "DEFECT",
        severity: null,
      },
    );

    const conn = editor
      .getConnections()
      .find(
        (c): c is BooleanConnection =>
          c instanceof BooleanConnection && c.target === resultNode.id,
      );
    expect(conn?.booleanOperator).toBe("NOT");
  });
});

describe("addLogicToEditor — single limit", () => {
  it("connects the limit directly to the ResultNode", async () => {
    const editor = createTestEditor();
    const [limit] = await addLimits(editor, 1);
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limit!.id, type: "LIMIT" },
    ];

    const resultNode = await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limit!]),
      {
        type: "CHECK",
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
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limitA!.id, type: "LIMIT" },
      { id: "", type: "OPERATOR", operatorValue: "AND" },
      { id: limitB!.id, type: "LIMIT" },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: "CHECK",
      severity: null,
    });

    expect(editor.getNodes().some((n) => n instanceof AndNode)).toBe(true);
  });

  it("creates an OrNode for OR operator", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limitA!.id, type: "LIMIT" },
      { id: "", type: "OPERATOR", operatorValue: "OR" },
      { id: limitB!.id, type: "LIMIT" },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: "CHECK",
      severity: null,
    });

    expect(editor.getNodes().some((n) => n instanceof OrNode)).toBe(true);
  });

  it("connects both limits to the logical node", async () => {
    const editor = createTestEditor();
    const [limitA, limitB] = await addLimits(editor, 2);
    const logicNodes: EvalLogicNodePayload[] = [
      { id: limitA!.id, type: "LIMIT" },
      { id: "", type: "OPERATOR", operatorValue: "AND" },
      { id: limitB!.id, type: "LIMIT" },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: "CHECK",
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
    const logicNodes: EvalLogicNodePayload[] = [
      { id: "", type: "OPERATOR", operatorValue: "NOT" },
      { id: limitA!.id, type: "LIMIT" },
      { id: "", type: "OPERATOR", operatorValue: "AND" },
      { id: limitB!.id, type: "LIMIT" },
    ];

    await addLogicToEditor(editor, logicNodes, limitMap([limitA!, limitB!]), {
      type: "CHECK",
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
    const logicNodes: EvalLogicNodePayload[] = [
      {
        id: "group-1",
        type: "GROUP",
        children: [
          { id: limitA!.id, type: "LIMIT" },
          { id: "", type: "OPERATOR", operatorValue: "OR" },
          { id: limitB!.id, type: "LIMIT" },
        ],
      },
      { id: "", type: "OPERATOR", operatorValue: "AND" },
      { id: limitC!.id, type: "LIMIT" },
    ];

    await addLogicToEditor(
      editor,
      logicNodes,
      limitMap([limitA!, limitB!, limitC!]),
      {
        type: "CHECK",
        severity: null,
      },
    );

    expect(editor.getNodes().some((n) => n instanceof OrNode)).toBe(true);
    expect(editor.getNodes().some((n) => n instanceof AndNode)).toBe(true);
  });

  it("throws for an empty GROUP", async () => {
    const editor = createTestEditor();
    const logicNodes: EvalLogicNodePayload[] = [
      { id: "g1", type: "GROUP", children: [] },
    ];

    await expect(
      addLogicToEditor(editor, logicNodes, new Map(), {
        type: "CHECK",
        severity: null,
      }),
    ).rejects.toThrow("Empty logic group");
  });
});

describe("addLogicToEditor — error cases", () => {
  it("throws when a LIMIT id is not in the limitNodesById map", async () => {
    const editor = createTestEditor();
    const logicNodes: EvalLogicNodePayload[] = [
      { id: "missing", type: "LIMIT" },
    ];

    await expect(
      addLogicToEditor(editor, logicNodes, new Map(), {
        type: "CHECK",
        severity: null,
      }),
    ).rejects.toThrow("Missing limit node");
  });
});

describe("addLogicToEditor — severity", () => {
  it("creates an AlertNode when severity is ALERT", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: "CHECK",
      severity: "ALERT",
    });

    expect(editor.getNodes().some((n) => n instanceof AlertNode)).toBe(true);
  });

  it("creates a WarningNode when severity is WARNING", async () => {
    const editor = createTestEditor();
    await addLogicToEditor(editor, [], new Map(), {
      type: "CHECK",
      severity: "WARNING",
    });

    expect(editor.getNodes().some((n) => n instanceof WarningNode)).toBe(true);
  });

  it("connects the ResultNode to the action node", async () => {
    const editor = createTestEditor();
    const resultNode = await addLogicToEditor(editor, [], new Map(), {
      type: "CHECK",
      severity: "ALERT",
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
      type: "CHECK",
      severity: null,
    });

    expect(
      editor
        .getNodes()
        .filter((n) => n instanceof AlertNode || n instanceof WarningNode),
    ).toHaveLength(0);
  });
});
