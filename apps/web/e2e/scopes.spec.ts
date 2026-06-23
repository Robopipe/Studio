import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  dragWithScopeHold,
  getNodes,
  gotoEditor,
  nodeById,
} from "./helpers";

test.describe("Scopes", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("LimitNode honours its minimum size when empty", async ({ page }) => {
    const id = await addNodeAt(page, "l", 0, 0);

    const { width, height, minWidth, minHeight } = await page.evaluate(
      (nodeId) => {
        const handle = window.__editor!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node = handle.editor.getNode(nodeId) as any;
        const min = node.getMinSize();
        return {
          width: node.width as number,
          height: node.height as number,
          minWidth: min.width as number,
          minHeight: min.height as number,
        };
      },
      id,
    );

    expect(width).toBeGreaterThanOrEqual(minWidth);
    expect(height).toBeGreaterThanOrEqual(minHeight);
  });

  test("dragging a rule node onto a Limit makes it a child", async ({
    page,
  }) => {
    const limitId = await addNodeAt(page, "l", -100, 0);
    const countId = await addNodeAt(page, "1", 250, 0);

    const countBox = await nodeById(page, countId).boundingBox();
    const limitBox = await nodeById(page, limitId).boundingBox();
    if (!countBox || !limitBox) throw new Error("node not visible");

    const from = { x: countBox.x + 30, y: countBox.y + 20 };
    const to = {
      x: limitBox.x + limitBox.width / 2,
      y: limitBox.y + limitBox.height / 2,
    };

    await dragWithScopeHold(page, from, to);

    const after = (await getNodes(page)).find((n) => n.id === countId)!;
    expect(after.parent).toBe(limitId);
  });

  test("dragging a child out of its Limit clears the parent", async ({
    page,
  }) => {
    const limitId = await addNodeAt(page, "l", -100, 0);
    const countId = await addNodeAt(page, "1", 0, 0);

    await page.evaluate(
      ({ parentId, childId }) => {
        const { editor } = window.__editor!;
        const child = editor.getNode(childId)!;
        child.parent = parentId;
      },
      { parentId: limitId, childId: countId },
    );

    const childBox = await nodeById(page, countId).boundingBox();
    if (!childBox) throw new Error("child not visible");
    const from = { x: childBox.x + 30, y: childBox.y + 20 };

    await dragWithScopeHold(page, from, {
      x: from.x + 500,
      y: from.y + 300,
    });

    const after = (await getNodes(page)).find((n) => n.id === countId)!;
    expect(after.parent).toBeNull();
  });
});
