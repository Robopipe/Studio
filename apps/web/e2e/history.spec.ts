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

test.describe("Undo & redo", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("Cmd/Ctrl+Z undoes a node creation", async ({ page }) => {
    await addNodeAt(page, "q", 0, 0);
    expect(await getNodes(page)).toHaveLength(1);

    await page.keyboard.press("ControlOrMeta+z");
    expect(await getNodes(page)).toHaveLength(0);
  });

  test("Cmd/Ctrl+Shift+Z redoes", async ({ page }) => {
    await addNodeAt(page, "q", 0, 0);
    await page.keyboard.press("ControlOrMeta+z");
    expect(await getNodes(page)).toHaveLength(0);

    await page.keyboard.press("ControlOrMeta+Shift+z");
    expect(await getNodes(page)).toHaveLength(1);
  });

  test("undo restores a cascade-delete (Limit + children + connections)", async ({
    page,
  }) => {
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 100, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y + 100 });

    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;
    // FIX(duplication): same "Limit + Count children + parent assignment" fixture copy-pasted from clipboard/deletion/movement/selection specs — fix: extract createLimitWithChildren(page, childCount) into helpers.ts; why: shared fixtures belong in helpers so one change updates all specs.
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    const children = (await getNodes(page))
      .filter((n) => n.parent === limit.id)
      .map((n) => n.id) as [string, string];
    await page.evaluate(
      ({ aId, bId }) =>
        window.__editor!.addLimitItemConnection(aId, bId, "AND"),
      { aId: children[0], bId: children[1] },
    );
    expect(await getConnections(page)).toHaveLength(1);

    await nodeById(page, limit.id).click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Backspace");
    expect(await getNodes(page)).toHaveLength(0);
    expect(await getConnections(page)).toHaveLength(0);

    await page.keyboard.press("ControlOrMeta+z");
    const restored = await getNodes(page);
    expect(restored).toHaveLength(3);
    expect(restored.filter((n) => n.parent === limit.id)).toHaveLength(2);
    expect(await getConnections(page)).toHaveLength(1);
  });
});
