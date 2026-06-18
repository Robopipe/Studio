import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import {
  copyNodes,
  pasteNodes,
  type Clipboard,
} from "@/modules/evaluation/graph/editor/utils/copyPaste";
import { EvalLimitItemOperatorEnum } from "@repo/schema";
import type { AreaPlugin } from "rete-area-plugin";
import { describe, expect, it, vi } from "vitest";
import { createTestEditor } from "./testEditor";

function mockArea(positions: Record<string, { x: number; y: number }> = {}) {
  const nodeViews = new Map(
    Object.entries(positions).map(([id, pos]) => [id, { position: pos }]),
  );
  return {
    nodeViews,
    translate: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as AreaPlugin<Schemes, never>;
}

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

describe("copyNodes", () => {
  it("returns null when no nodes are selected", async () => {
    const editor = createTestEditor();
    await editor.addNode(new AndNode());
    expect(copyNodes(editor, mockArea())).toBeNull();
  });

  it("returns null when the editor is empty", () => {
    const editor = createTestEditor();
    expect(copyNodes(editor, mockArea())).toBeNull();
  });

  it("clones each selected node so the clipboard captures state at copy time", async () => {
    const editor = createTestEditor();
    const and = new AndNode();
    await editor.addNode(and);
    and.selected = true;

    const result = copyNodes(editor, mockArea());

    expect(result?.nodes).toHaveLength(1);
    expect(result?.nodes.at(0)?.node).not.toBe(and);
  });

  it("reads node positions from area.nodeViews", async () => {
    const editor = createTestEditor();
    const and = new AndNode();
    await editor.addNode(and);
    and.selected = true;

    const result = copyNodes(editor, mockArea({ [and.id]: { x: 120, y: 80 } }));

    expect(result?.nodes.at(0)?.position).toEqual({ x: 120, y: 80 });
  });

  it("defaults position to {0,0} when the node has no view entry", async () => {
    const editor = createTestEditor();
    const and = new AndNode();
    await editor.addNode(and);
    and.selected = true;

    const result = copyNodes(editor, mockArea()); // no position registered

    expect(result?.nodes.at(0)?.position).toEqual({ x: 0, y: 0 });
  });

  it("computes the center as the average of all node positions", async () => {
    const editor = createTestEditor();
    const a = new AndNode();
    const b = new OrNode();
    await editor.addNode(a);
    await editor.addNode(b);
    a.selected = true;
    b.selected = true;

    const result = copyNodes(
      editor,
      mockArea({ [a.id]: { x: 0, y: 0 }, [b.id]: { x: 100, y: 100 } }),
    );

    expect(result?.center).toEqual({ x: 50, y: 50 });
  });

  it("only includes connections where both endpoints are selected", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    const and = new AndNode();
    const r = new ResultNode();
    await editor.addNode(limit);
    await editor.addNode(and);
    await editor.addNode(r);
    await editor.addConnection(new BooleanConnection(limit, "out", and, "in"));
    await editor.addConnection(new BooleanConnection(and, "out", r, "in"));

    limit.selected = true;
    and.selected = true;
    // r is NOT selected — the and→r connection must be excluded

    const result = copyNodes(editor, mockArea());

    expect(result?.connections).toHaveLength(1);
    expect(result?.connections.at(0)?.kind).toBe("boolean");
  });

  it("preserves the BooleanOperator on a boolean connection", async () => {
    const editor = createTestEditor();
    const a = new LimitNode();
    const b = new ResultNode();
    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addConnection(new BooleanConnection(a, "out", b, "in", "NOT"));
    a.selected = true;
    b.selected = true;

    const result = copyNodes(editor, mockArea());
    const conn = result?.connections.at(0);

    expect(conn?.kind).toBe("boolean");
    if (conn?.kind === "boolean") expect(conn.operator).toBe("NOT");
  });

  it("preserves the limitItemOperator on a limit-item connection", async () => {
    const editor = createTestEditor();
    const a = new CountNode();
    const b = new CountNode();
    await editor.addNode(a);
    await editor.addNode(b);
    await editor.addConnection(
      new LimitItemConnection(a, "out", b, "in", EvalLimitItemOperatorEnum.OR),
    );
    a.selected = true;
    b.selected = true;

    const result = copyNodes(editor, mockArea());
    const conn = result?.connections.at(0);

    expect(conn?.kind).toBe("limitItem");
    if (conn?.kind === "limitItem") expect(conn.operator).toBe("OR");
  });

  it("records parentIndex for children whose Limit parent is also selected", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    const count = new CountNode();
    count.parent = limit.id;
    await editor.addNode(limit);
    await editor.addNode(count);
    limit.selected = true;
    count.selected = true;

    const result = copyNodes(editor, mockArea());

    const limitIdx = result!.nodes.findIndex(
      (e) => e.node instanceof LimitNode,
    );
    const countEntry = result!.nodes.find((e) => e.node instanceof CountNode);
    expect(countEntry?.parentIndex).toBe(limitIdx);
  });

  it("sets parentIndex to null for a child whose Limit parent is not selected", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    const count = new CountNode();
    count.parent = limit.id;
    await editor.addNode(limit);
    await editor.addNode(count);
    count.selected = true; // limit is NOT selected

    const result = copyNodes(editor, mockArea());

    expect(result?.nodes.at(0)?.parentIndex).toBeNull();
  });
});

describe("pasteNodes", () => {
  it("adds all clipboard nodes to the editor", async () => {
    const editor = createTestEditor();
    const clipboard: Clipboard = {
      nodes: [
        { node: new AndNode(), position: { x: 0, y: 0 }, parentIndex: null },
      ],
      connections: [],
      center: { x: 0, y: 0 },
    };

    await pasteNodes(
      clipboard,
      { editor, area: mockArea(), selectableNodes: mockSelectableNodes() },
      { x: 0, y: 0 },
    );

    expect(editor.getNodes()).toHaveLength(1);
  });

  it("recreates boolean connections between pasted nodes", async () => {
    const editor = createTestEditor();
    const clipboard: Clipboard = {
      nodes: [
        { node: new LimitNode(), position: { x: 0, y: 0 }, parentIndex: null },
        {
          node: new ResultNode(),
          position: { x: 100, y: 0 },
          parentIndex: null,
        },
      ],
      connections: [
        {
          kind: "boolean",
          sourceIndex: 0,
          sourceOutput: "out",
          targetIndex: 1,
          targetInput: "in",
          operator: "TRUE",
        },
      ],
      center: { x: 50, y: 0 },
    };

    await pasteNodes(
      clipboard,
      { editor, area: mockArea(), selectableNodes: mockSelectableNodes() },
      { x: 50, y: 0 },
    );

    expect(editor.getConnections()).toHaveLength(1);
    expect(editor.getConnections().at(0)).toBeInstanceOf(BooleanConnection);
  });

  it("recreates limit-item connections between pasted nodes", async () => {
    const editor = createTestEditor();
    const clipboard: Clipboard = {
      nodes: [
        { node: new CountNode(), position: { x: 0, y: 0 }, parentIndex: null },
        { node: new CountNode(), position: { x: 50, y: 0 }, parentIndex: null },
      ],
      connections: [
        {
          kind: "limitItem",
          sourceIndex: 0,
          sourceOutput: "out",
          targetIndex: 1,
          targetInput: "in",
          operator: EvalLimitItemOperatorEnum.OR,
        },
      ],
      center: { x: 25, y: 0 },
    };

    await pasteNodes(
      clipboard,
      { editor, area: mockArea(), selectableNodes: mockSelectableNodes() },
      { x: 0, y: 0 },
    );

    const conn = editor.getConnections().at(0);
    expect(conn).toBeInstanceOf(LimitItemConnection);
    expect((conn as LimitItemConnection).limitItemOperator).toBe("OR");
  });

  it("selects pasted nodes and deselects previous selection", async () => {
    const editor = createTestEditor();
    const clipboard: Clipboard = {
      nodes: [
        { node: new AndNode(), position: { x: 0, y: 0 }, parentIndex: null },
        { node: new OrNode(), position: { x: 50, y: 0 }, parentIndex: null },
      ],
      connections: [],
      center: { x: 25, y: 0 },
    };
    const sel = mockSelectableNodes();

    await pasteNodes(
      clipboard,
      { editor, area: mockArea(), selectableNodes: sel },
      { x: 0, y: 0 },
    );

    expect(sel.select).toHaveBeenCalledTimes(2);
    const calls = sel.select.mock.calls;
    expect(calls.at(0)?.at(1)).toBe(false); // first node: accumulate=false
    expect(calls.at(1)?.at(1)).toBe(true); // second node: accumulate=true
  });

  it("remaps parent references so children point to the new cloned parent", async () => {
    const editor = createTestEditor();
    const clipboard: Clipboard = {
      nodes: [
        { node: new LimitNode(), position: { x: 0, y: 0 }, parentIndex: null }, // index 0
        { node: new CountNode(), position: { x: 0, y: 0 }, parentIndex: 0 }, // index 1, child of index 0
      ],
      connections: [],
      center: { x: 0, y: 0 },
    };

    await pasteNodes(
      clipboard,
      { editor, area: mockArea(), selectableNodes: mockSelectableNodes() },
      { x: 0, y: 0 },
    );

    const nodes = editor.getNodes();
    const limit = nodes.find((n) => n instanceof LimitNode);
    const count = nodes.find((n) => n instanceof CountNode);
    expect(count?.parent).toBe(limit?.id);
  });

  it("translates each node to paste position plus its offset from the clipboard center", async () => {
    const editor = createTestEditor();
    const area = mockArea();
    const clipboard: Clipboard = {
      nodes: [
        {
          node: new AndNode(),
          position: { x: 100, y: 200 },
          parentIndex: null,
        },
      ],
      connections: [],
      center: { x: 100, y: 200 },
    };

    await pasteNodes(
      clipboard,
      { editor, area, selectableNodes: mockSelectableNodes() },
      { x: 300, y: 400 },
    );

    // offset from center = (0, 0), so final position = paste position = (300, 400)
    expect(area.translate).toHaveBeenCalledWith(expect.any(String), {
      x: 300,
      y: 400,
    });
  });
});
