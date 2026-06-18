import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { serializeLogicNodes } from "@/modules/evaluation/graph/editor/serialization/serializeLogicNodes";
import { createTestEditor } from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
import { EvalLogicNodeTypeEnum, type EvalLogicNode } from "@repo/schema";
import { describe, expect, it } from "vitest";

function operatorValues(nodes: EvalLogicNode[]) {
  return nodes
    .filter(
      (
        n,
      ): n is Extract<
        EvalLogicNode,
        { type: EvalLogicNodeTypeEnum.OPERATOR }
      > => n.type === EvalLogicNodeTypeEnum.OPERATOR,
    )
    .map((n) => n.operatorValue);
}

describe("serializeLogicNodes — no graph", () => {
  it("returns CHECK with empty logicNodes when editor has no ResultNode", () => {
    const editor = createTestEditor();
    expect(serializeLogicNodes(editor)).toEqual({
      type: "CHECK",
      severity: null,
      logicNodes: [],
    });
  });

  it("returns CHECK with empty logicNodes when ResultNode has no incoming connection", async () => {
    const editor = createTestEditor();
    await editor.addNode(new ResultNode());

    const result = serializeLogicNodes(editor);
    expect(result.type).toBe("CHECK");
    expect(result.logicNodes).toEqual([]);
  });
});

describe("serializeLogicNodes — type resolution", () => {
  it("always returns CHECK regardless of the result connection modifier", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in"),
    );

    expect(serializeLogicNodes(editor).type).toBe("CHECK");
  });

  it("still returns CHECK when the result connection uses NOT (NOT becomes a logic operator, not DEFECT)", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in", "NOT"),
    );

    expect(serializeLogicNodes(editor).type).toBe("CHECK");
  });
});

describe("serializeLogicNodes — severity resolution", () => {
  it("returns null severity when no action node follows the ResultNode", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in"),
    );

    expect(serializeLogicNodes(editor).severity).toBeNull();
  });

  it("returns ALERT severity when an AlertNode follows the ResultNode", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();
    const alert = new AlertNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addNode(alert);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(resultNode, "out", alert, "in"),
    );

    expect(serializeLogicNodes(editor).severity).toBe("ALERT");
  });

  it("returns WARNING severity when a WarningNode follows the ResultNode", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();
    const warning = new WarningNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addNode(warning);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(resultNode, "out", warning, "in"),
    );

    expect(serializeLogicNodes(editor).severity).toBe("WARNING");
  });
});

describe("serializeLogicNodes — single limit", () => {
  it("emits a single LIMIT payload for a direct Limit → Result connection", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(logicNodes).toEqual([{ id: limit.id, type: "LIMIT" }]);
  });
});

describe("serializeLogicNodes — logical operators", () => {
  it("emits LIMIT OPERATOR(AND) LIMIT for two limits joined by AndNode", async () => {
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const and = new AndNode();
    const resultNode = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(and);
    await editor.addNode(resultNode);
    await editor.addConnection(new BooleanConnection(limitA, "out", and, "in"));
    await editor.addConnection(new BooleanConnection(limitB, "out", and, "in"));
    await editor.addConnection(
      new BooleanConnection(and, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(logicNodes.map((n) => n.type)).toEqual([
      "LIMIT",
      "OPERATOR",
      "LIMIT",
    ]);
    expect(operatorValues(logicNodes)).toEqual(["AND"]);
  });

  it("emits LIMIT OPERATOR(OR) LIMIT for two limits joined by OrNode", async () => {
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const or = new OrNode();
    const resultNode = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(or);
    await editor.addNode(resultNode);
    await editor.addConnection(new BooleanConnection(limitA, "out", or, "in"));
    await editor.addConnection(new BooleanConnection(limitB, "out", or, "in"));
    await editor.addConnection(
      new BooleanConnection(or, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(logicNodes.map((n) => n.type)).toEqual([
      "LIMIT",
      "OPERATOR",
      "LIMIT",
    ]);
    expect(operatorValues(logicNodes)).toEqual(["OR"]);
  });
});

describe("serializeLogicNodes — grouping", () => {
  it("wraps the OR sub-expression in a GROUP when nested inside AND", async () => {
    // (A OR B) AND C — the OR side must be a GROUP because it differs from the parent AND
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const limitC = new LimitNode({ label: 3 });
    const or = new OrNode();
    const and = new AndNode();
    const resultNode = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(limitC);
    await editor.addNode(or);
    await editor.addNode(and);
    await editor.addNode(resultNode);
    await editor.addConnection(new BooleanConnection(limitA, "out", or, "in"));
    await editor.addConnection(new BooleanConnection(limitB, "out", or, "in"));
    await editor.addConnection(new BooleanConnection(or, "out", and, "in"));
    await editor.addConnection(new BooleanConnection(limitC, "out", and, "in"));
    await editor.addConnection(
      new BooleanConnection(and, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(logicNodes.some((n) => n.type === "GROUP")).toBe(true);
  });

  it("does not add a GROUP when all operators at the same level are the same type", async () => {
    // A AND B AND C — flat, no grouping needed
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const limitC = new LimitNode({ label: 3 });
    const andOuter = new AndNode();
    const andInner = new AndNode();
    const resultNode = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(limitC);
    await editor.addNode(andOuter);
    await editor.addNode(andInner);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limitA, "out", andInner, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(limitB, "out", andInner, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(andInner, "out", andOuter, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(limitC, "out", andOuter, "in"),
    );
    await editor.addConnection(
      new BooleanConnection(andOuter, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(logicNodes.every((n) => n.type !== "GROUP")).toBe(true);
  });
});

describe("serializeLogicNodes — NOT modifier on child connections", () => {
  it("prepends a NOT OPERATOR before a limit whose incoming connection has NOT", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const resultNode = new ResultNode();

    await editor.addNode(limit);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limit, "out", resultNode, "in", "NOT"),
    );

    // A NOT on the result-input connection negates the single limit: type stays CHECK
    // and the negation is emitted as a top-level NOT operator before the limit.
    const { type, logicNodes } = serializeLogicNodes(editor);
    expect(type).toBe("CHECK");
    expect(logicNodes).toEqual([
      expect.objectContaining({ type: "OPERATOR", operatorValue: "NOT" }),
      { id: limit.id, type: "LIMIT" },
    ]);
    // Operator nodes must carry a valid uuid (the BE schema requires uuidv7), not "".
    expect(logicNodes[0]!.id).not.toBe("");
  });

  it("inserts a NOT OPERATOR before a negated child inside an AND group", async () => {
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const and = new AndNode();
    const resultNode = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(and);
    await editor.addNode(resultNode);
    await editor.addConnection(
      new BooleanConnection(limitA, "out", and, "in", "NOT"),
    );
    await editor.addConnection(new BooleanConnection(limitB, "out", and, "in"));
    await editor.addConnection(
      new BooleanConnection(and, "out", resultNode, "in"),
    );

    const { logicNodes } = serializeLogicNodes(editor);
    expect(operatorValues(logicNodes)).toContain("NOT");
  });
});
