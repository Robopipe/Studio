import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import {
  deleteSelectedNodes,
  deselectAllNodes,
  selectAllNodes,
} from "@/modules/evaluation/graph/editor/utils/nodeSelection";
import { describe, expect, it, vi } from "vitest";
import { createTestEditor } from "./testEditor";

function mockSelectableNodes() {
  return {
    select: vi
      .fn<(nodeId: string, accumulate: boolean) => Promise<void>>()
      .mockResolvedValue(undefined),
    unselect: vi
      .fn<(nodeId: string) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
}

describe("selectAllNodes", () => {
  it("does nothing when the editor is empty", async () => {
    const editor = createTestEditor();
    const sel = mockSelectableNodes();
    await selectAllNodes(sel, editor);
    expect(sel.select).not.toHaveBeenCalled();
  });

  it("calls select for every node with accumulate=false for the first and true for the rest", async () => {
    const editor = createTestEditor();
    const a = new AndNode();
    const b = new OrNode();
    const r = new ResultNode();
    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addNode(r);

    const sel = mockSelectableNodes();
    await selectAllNodes(sel, editor);

    expect(sel.select).toHaveBeenCalledTimes(3);
    expect(sel.select).toHaveBeenNthCalledWith(1, a.id, false);
    expect(sel.select).toHaveBeenNthCalledWith(2, b.id, true);
    expect(sel.select).toHaveBeenNthCalledWith(3, r.id, true);
  });
});

describe("deselectAllNodes", () => {
  it("does nothing when no nodes are selected", async () => {
    const editor = createTestEditor();
    await editor.addNode(new AndNode());
    const sel = mockSelectableNodes();
    await deselectAllNodes(sel, editor);
    expect(sel.unselect).not.toHaveBeenCalled();
  });

  it("calls unselect only for selected nodes", async () => {
    const editor = createTestEditor();
    const a = new AndNode();
    const b = new OrNode();
    await editor.addNode(a);
    await editor.addNode(b);
    a.selected = true;

    const sel = mockSelectableNodes();
    await deselectAllNodes(sel, editor);

    expect(sel.unselect).toHaveBeenCalledTimes(1);
    expect(sel.unselect).toHaveBeenCalledWith(a.id);
    expect(sel.unselect).not.toHaveBeenCalledWith(b.id);
  });
});

describe("deleteSelectedNodes", () => {
  it("removes a selected node", async () => {
    const editor = createTestEditor();
    const a = new AndNode();
    await editor.addNode(a);
    a.selected = true;
    await deleteSelectedNodes(editor);
    expect(editor.getNode(a.id)).toBeUndefined();
  });

  it("leaves unselected nodes untouched", async () => {
    const editor = createTestEditor();
    const a = new AndNode();
    const b = new OrNode();
    await editor.addNode(a);
    await editor.addNode(b);
    a.selected = true;

    await deleteSelectedNodes(editor);

    expect(editor.getNode(a.id)).toBeUndefined();
    expect(editor.getNode(b.id)).toBeDefined();
  });

  it("removes a selected Limit and its children together", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    const count = new CountNode();
    count.parent = limit.id;
    await editor.addNode(limit);
    await editor.addNode(count);
    limit.selected = true;
    count.selected = true;

    await deleteSelectedNodes(editor);

    expect(editor.getNode(limit.id)).toBeUndefined();
    expect(editor.getNode(count.id)).toBeUndefined();
  });

  it("also removes connections attached to deleted nodes", async () => {
    const editor = createTestEditor();
    const a = new LimitNode();
    const b = new ResultNode();
    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addConnection(new BooleanConnection(a, "out", b, "in"));
    a.selected = true;

    await deleteSelectedNodes(editor);

    expect(editor.getConnections()).toHaveLength(0);
  });
});
