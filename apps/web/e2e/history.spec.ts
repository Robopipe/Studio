import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  createLimitWithChildren,
  getConnections,
  getNodes,
  gotoEditor,
  nodeById,
} from "./helpers";
import type { EvalLimitItemOperatorEnum } from "@repo/schema";

test.describe("Undo & redo", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("Cmd/Ctrl+Z undoes a node creation", async ({ page }) => {
    await addNodeAt(page, "a", 0, 0);
    expect(await getNodes(page)).toHaveLength(1);

    await page.keyboard.press("ControlOrMeta+z");
    expect(await getNodes(page)).toHaveLength(0);
  });

  test("Cmd/Ctrl+Shift+Z redoes", async ({ page }) => {
    await addNodeAt(page, "a", 0, 0);
    await page.keyboard.press("ControlOrMeta+z");
    expect(await getNodes(page)).toHaveLength(0);

    await page.keyboard.press("ControlOrMeta+Shift+z");
    expect(await getNodes(page)).toHaveLength(1);
  });

  test("undo restores a cascade-delete (Limit + children + connections)", async ({
    page,
  }) => {
    const { limitId, childIds } = await createLimitWithChildren(page, 2);

    await page.evaluate(
      ({ aId, bId }) =>
        window.__editor!.addLimitItemConnection(
          aId,
          bId,
          "AND" as EvalLimitItemOperatorEnum,
        ),
      { aId: childIds[0], bId: childIds[1] },
    );
    expect(await getConnections(page)).toHaveLength(1);

    await nodeById(page, limitId).click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Backspace");
    expect(await getNodes(page)).toHaveLength(0);
    expect(await getConnections(page)).toHaveLength(0);

    await page.keyboard.press("ControlOrMeta+z");
    const restored = await getNodes(page);
    expect(restored).toHaveLength(3);
    expect(restored.filter((n) => n.parent === limitId)).toHaveLength(2);
    expect(await getConnections(page)).toHaveLength(1);
  });
});
