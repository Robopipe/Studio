import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  createLimitWithChildren,
  getConnections,
  getNodes,
  gotoEditor,
  nodeById,
} from "./helpers";

test.describe("Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("Backspace deletes the selected leaf node", async ({ page }) => {
    const id = await addNodeAt(page, "a", 0, 0);
    expect((await getNodes(page)).find((n) => n.id === id)).toBeDefined();

    // when creating a node, it is automatically selected
    await page.keyboard.press("Backspace");

    expect(await getNodes(page)).toHaveLength(0);
  });

  test("Backspace on a LimitNode cascades to its children", async ({
    page,
  }) => {
    const { limitId } = await createLimitWithChildren(page, 2);

    await nodeById(page, limitId).click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Backspace");

    expect(await getNodes(page)).toHaveLength(0);
  });

  test("context menu Delete cascades on a LimitNode", async ({ page }) => {
    const { limitId } = await createLimitWithChildren(page, 1);

    await nodeById(page, limitId).click({
      button: "right",
      position: { x: 5, y: 5 },
    });
    await page
      .getByTestId("context-menu-item")
      .filter({ hasText: /^Delete$/ })
      .click();

    expect(await getNodes(page)).toHaveLength(0);
  });

  test("deleting a middle node also removes both connections", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -300, 0);
    const b = await addNodeAt(page, "a", 0, 0);
    const c = await addNodeAt(page, "a", 300, 0);

    await page.evaluate(
      async ({ aId, bId, cId }) => {
        await window.__editor!.addBooleanConnection(aId, bId);
        await window.__editor!.addBooleanConnection(bId, cId);
      },
      { aId: a, bId: b, cId: c },
    );

    expect(await getConnections(page)).toHaveLength(2);

    await nodeById(page, b).click();
    await page.keyboard.press("Backspace");

    const nodes = await getNodes(page);
    expect(nodes.map((n) => n.id).sort()).toEqual([a, c].sort());
    expect(await getConnections(page)).toHaveLength(0);
  });
});
