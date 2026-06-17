import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  canvasCentre,
  getConnections,
  getNodes,
  gotoEditor,
  nodeById,
  pressShortcutAt,
} from "./helpers";

test.describe("Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("Backspace deletes the selected leaf node", async ({ page }) => {
    const id = await addNodeAt(page, "q", 0, 0);
    expect((await getNodes(page)).find((n) => n.id === id)).toBeDefined();

    // when creating a node, it is automatically selected
    await page.keyboard.press("Backspace");

    expect(await getNodes(page)).toHaveLength(0);
  });

  test("Backspace on a LimitNode cascades to its children", async ({
    page,
  }) => {
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 100, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y + 100 });

    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;

    // FIX(duplication): "Limit + Count children + parent assignment via page.evaluate" fixture is duplicated twice in this file and again in clipboard/history/movement/selection specs — fix: extract createLimitWithChildren(page, childCount) into helpers.ts; why: six copies of a non-trivial fixture will drift independently when the parenting mechanism changes.
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    await nodeById(page, limit.id).click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Backspace");

    expect(await getNodes(page)).toHaveLength(0);
  });

  test("context menu Delete cascades on a LimitNode", async ({ page }) => {
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 100, y: centre.y });
    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    await nodeById(page, limit.id).click({
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
    const a = await addNodeAt(page, "q", -300, 0);
    const b = await addNodeAt(page, "q", 0, 0);
    const c = await addNodeAt(page, "q", 300, 0);

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
