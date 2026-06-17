import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import {
  removeAllNodes,
  removeNodeWithDescendants,
} from "@/modules/evaluation/graph/editor/utils/removeNodes";
import { describe, expect, it } from "vitest";
import { createTestEditor } from "./testEditor";

describe("removeNodeWithDescendants", () => {
  it("removes a node that has no connections", async () => {
    const editor = createTestEditor();
    const node = new AndNode();

    await editor.addNode(node);
    await removeNodeWithDescendants(editor, node.id);

    expect(editor.getNodes()).toHaveLength(0);
  });

  it("removes both incoming and outgoing connections of the deleted node", async () => {
    const editor = createTestEditor();
    const limitA = new LimitNode();
    const limitB = new LimitNode();
    const and = new AndNode();
    const result = new ResultNode();

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(and);
    await editor.addNode(result);
    await editor.addConnection(new BooleanConnection(limitA, "out", and, "in"));
    await editor.addConnection(new BooleanConnection(limitB, "out", and, "in"));
    await editor.addConnection(new BooleanConnection(and, "out", result, "in"));

    await removeNodeWithDescendants(editor, and.id);

    expect(
      editor
        .getNodes()
        .map((n) => n.id)
        .sort(),
    ).toEqual([limitA.id, limitB.id, result.id].sort());
    expect(editor.getConnections()).toHaveLength(0);
  });

  it("leaves no dangling connection references after deletion", async () => {
    const editor = createTestEditor();
    const a = new LimitNode();
    const b = new AndNode();
    const r = new ResultNode();

    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addNode(r);
    await editor.addConnection(new BooleanConnection(a, "out", b, "in"));
    await editor.addConnection(new BooleanConnection(b, "out", r, "in"));

    await removeNodeWithDescendants(editor, b.id);

    for (const conn of editor.getConnections()) {
      expect(editor.getNode(conn.source)).toBeDefined();
      expect(editor.getNode(conn.target)).toBeDefined();
    }
  });

  it("cascades into scoped children when removing a Limit node", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    const itemA = new CountNode();
    const itemB = new CountNode();

    itemA.parent = limit.id;
    itemB.parent = limit.id;

    await editor.addNode(limit);
    await editor.addNode(itemA);
    await editor.addNode(itemB);
    await editor.addConnection(
      new LimitItemConnection(itemA, "out", itemB, "in"),
    );

    await removeNodeWithDescendants(editor, limit.id);

    expect(editor.getNodes()).toHaveLength(0);
    expect(editor.getConnections()).toHaveLength(0);
  });
});

describe("removeAllNodes", () => {
  it("clears all nodes and connections from the editor", async () => {
    const editor = createTestEditor();
    const and = new AndNode();
    const result = new ResultNode();

    await editor.addNode(and);
    await editor.addNode(result);
    await editor.addConnection(new BooleanConnection(and, "out", result, "in"));

    await removeAllNodes(editor);

    expect(editor.getNodes()).toHaveLength(0);
    expect(editor.getConnections()).toHaveLength(0);
  });

  it("does nothing when the editor is already empty", async () => {
    const editor = createTestEditor();
    await removeAllNodes(editor);
    expect(editor.getNodes()).toHaveLength(0);
  });
});
