import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import {
  serializeLimitNode,
  serializeLimits,
} from "@/modules/evaluation/graph/editor/serialization/serializeLimits";
import { createTestEditor } from "@/modules/evaluation/graph/editor/utils/__tests__/testEditor";
import { describe, expect, it } from "vitest";

describe("serializeLimits", () => {
  it("returns an empty array when no LimitNodes are in the editor", () => {
    const editor = createTestEditor();
    expect(serializeLimits(editor)).toEqual([]);
  });

  it("returns one entry per LimitNode", async () => {
    const editor = createTestEditor();
    await editor.addNode(new LimitNode({ label: 1 }));
    await editor.addNode(new LimitNode({ label: 2 }));

    expect(serializeLimits(editor)).toHaveLength(2);
  });

  it("serializes each limit with the correct targetLabelId", async () => {
    const editor = createTestEditor();
    await editor.addNode(new LimitNode({ label: 1 }));

    const [result] = serializeLimits(editor);
    expect(result?.targetLabelId).toBe(1);
  });
});

describe("serializeLimitNode", () => {
  it("sets targetLabelId from the label value", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    await editor.addNode(limit);

    expect(serializeLimitNode(editor, limit).targetLabelId).toBe(1);
  });

  it("sets targetParentLabelId to null when no parent label is set", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    await editor.addNode(limit);

    expect(serializeLimitNode(editor, limit).targetParentLabelId).toBeNull();
  });

  it("sets targetParentLabelId when a parent label is provided", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1, parentLabel: 2 });
    await editor.addNode(limit);

    expect(serializeLimitNode(editor, limit).targetParentLabelId).toBe(2);
  });

  it("includes LimitItem children that have the limit as their parent", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const itemA = new CountNode({ limitFrom: 0, limitTo: 10 });
    const itemB = new CountNode({ limitFrom: 11, limitTo: 20 });
    itemA.parent = limit.id;
    itemB.parent = limit.id;

    await editor.addNode(limit);
    await editor.addNode(itemA);
    await editor.addNode(itemB);

    expect(serializeLimitNode(editor, limit).limitItems).toHaveLength(2);
  });

  it("excludes LimitItem nodes that belong to a different limit", async () => {
    const editor = createTestEditor();
    const limitA = new LimitNode({ label: 1 });
    const limitB = new LimitNode({ label: 2 });
    const item = new CountNode();
    item.parent = limitB.id;

    await editor.addNode(limitA);
    await editor.addNode(limitB);
    await editor.addNode(item);

    expect(serializeLimitNode(editor, limitA).limitItems).toHaveLength(0);
  });

  it("resolves ALERT severity from a connected AlertNode", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const alert = new AlertNode();

    await editor.addNode(limit);
    await editor.addNode(alert);
    await editor.addConnection(
      new BooleanConnection(limit, "out", alert, "in"),
    );

    expect(serializeLimitNode(editor, limit).severity).toBe("ALERT");
  });

  it("resolves WARNING severity from a connected WarningNode", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    const warning = new WarningNode();

    await editor.addNode(limit);
    await editor.addNode(warning);
    await editor.addConnection(
      new BooleanConnection(limit, "out", warning, "in"),
    );

    expect(serializeLimitNode(editor, limit).severity).toBe("WARNING");
  });

  it("returns null severity when no action node is connected", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    await editor.addNode(limit);

    expect(serializeLimitNode(editor, limit).severity).toBeNull();
  });

  it("throws when label is missing", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode();
    await editor.addNode(limit);

    expect(() => serializeLimitNode(editor, limit)).toThrow();
  });

  it("uses the id from the limit node itself", async () => {
    const editor = createTestEditor();
    const limit = new LimitNode({ label: 1 });
    await editor.addNode(limit);

    expect(serializeLimitNode(editor, limit).id).toBe(limit.id);
  });
});
