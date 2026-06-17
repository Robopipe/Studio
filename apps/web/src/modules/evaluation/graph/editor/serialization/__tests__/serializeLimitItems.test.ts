import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { serializeLimitItemNode } from "@/modules/evaluation/graph/editor/serialization/serializeLimitItems";
import { createTestEditor } from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
import { describe, expect, it } from "vitest";

describe("serializeLimitItemNode", () => {
  it("defaults operator to AND when no outgoing LimitItemConnection exists", () => {
    const editor = createTestEditor();
    const node = new CountNode({ limitFrom: 1, limitTo: 5 });

    const result = serializeLimitItemNode(editor, node);

    expect(result.operator).toBe("AND");
  });

  it("picks up OR from a LimitItemConnection", async () => {
    const editor = createTestEditor();
    const a = new CountNode({ limitFrom: 1, limitTo: 2 });
    const b = new CountNode({ limitFrom: 3, limitTo: 4 });

    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addConnection(
      new LimitItemConnection(a, "out", b, "in", "OR"),
    );

    const result = serializeLimitItemNode(editor, a);

    expect(result.operator).toBe("OR");
  });

  it("picks up AND from an explicit AND LimitItemConnection", async () => {
    const editor = createTestEditor();
    const a = new CountNode({ limitFrom: 1, limitTo: 2 });
    const b = new CountNode({ limitFrom: 3, limitTo: 4 });

    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addConnection(
      new LimitItemConnection(a, "out", b, "in", "AND"),
    );

    const result = serializeLimitItemNode(editor, a);

    expect(result.operator).toBe("AND");
  });

  it("maps all fields through from the node", () => {
    const editor = createTestEditor();
    const node = new CountNode({ limitFrom: 2, limitTo: 8 });

    const result = serializeLimitItemNode(editor, node);

    expect(result).toMatchObject({
      id: node.id,
      limitFrom: 2,
      limitTo: 8,
      parameter: "COUNT",
      operator: "AND",
      quantifierType: "EXACT",
      quantifierUnit: "PERCENT",
      quantifierValue: 100,
    });
  });

  it("preserves null limitFrom and limitTo when node has no range set", () => {
    const editor = createTestEditor();
    const node = new CountNode();

    const result = serializeLimitItemNode(editor, node);

    expect(result.limitFrom).toBeNull();
    expect(result.limitTo).toBeNull();
  });

  it("uses the operator of the outgoing connection, not the incoming one", async () => {
    const editor = createTestEditor();
    const a = new CountNode();
    const b = new CountNode();
    const c = new CountNode();

    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addNode(c);
    await editor.addConnection(
      new LimitItemConnection(a, "out", b, "in", "OR"),
    );
    await editor.addConnection(
      new LimitItemConnection(b, "out", c, "in", "AND"),
    );

    expect(serializeLimitItemNode(editor, a).operator).toBe("OR");
    expect(serializeLimitItemNode(editor, b).operator).toBe("AND");
    expect(serializeLimitItemNode(editor, c).operator).toBe("AND");
  });
});
