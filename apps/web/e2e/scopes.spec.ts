import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  canvasCentre,
  getNodes,
  gotoEditor,
  nodeById,
  pressShortcutAt,
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

    await page.mouse.move(from.x, from.y);
    // To enter the scope mode, the user must press and hold a node for 250ms.
    // To assign the node to a parent, the user must release the node over the parent node.
    // FIX(duplication): this press-hold-drag sequence with the magic 300ms wait is duplicated verbatim in the "dragging a child out" test below — fix: extract a dragWithScopeHold(page, from, to) helper in helpers.ts with a named SCOPE_HOLD_MS constant tied to the app's 250ms threshold; why: when the hold threshold changes, two hand-rolled copies (and the bare 300) must be hunted down instead of one constant.
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(to.x, to.y, { steps: 15 });
    await page.mouse.up();

    const after = (await getNodes(page)).find((n) => n.id === countId)!;
    expect(after.parent).toBe(limitId);
  });

  test("dragging a child out of its Limit clears the parent", async ({
    page,
  }) => {
    const limitId = await addNodeAt(page, "l", -100, 0);
    // FIX(consistency): re-implements addNodeAt by hand (pressShortcutAt + canvasCentre twice + re-deriving the id via a label lookup) right after using addNodeAt for the limit on the previous line — fix: const countId = await addNodeAt(page, '1', 0, 0); why: the roundabout version is three times the code and would pick the wrong node if a second Count ever existed.
    await pressShortcutAt(page, "1", {
      x: (await canvasCentre(page)).x,
      y: (await canvasCentre(page)).y,
    });
    const countId = (await getNodes(page)).find((n) => n.label === "Count")!.id;

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

    await page.mouse.move(from.x, from.y);
    // To enter the scope mode, the user must press and hold a node for 250ms.
    // To clear the parent, the user must release the node over a different location.
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(from.x + 500, from.y + 300, { steps: 15 });
    await page.mouse.up();

    const after = (await getNodes(page)).find((n) => n.id === countId)!;
    expect(after.parent).toBeNull();
  });
});
