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

test.describe("Copy, paste & cut", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("copy + paste duplicates the selected node", async ({ page }) => {
    const id = await addNodeAt(page, "q", 0, 0);
    await nodeById(page, id).click();

    await page.keyboard.press("ControlOrMeta+c");
    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x + 200, centre.y + 100);
    await page.keyboard.press("ControlOrMeta+v");

    const nodes = await getNodes(page);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.label)).toEqual(["AND", "AND"]);
  });

  test("cut removes the original and clipboard still pastes", async ({
    page,
  }) => {
    const id = await addNodeAt(page, "q", 0, 0);
    await nodeById(page, id).click();

    await page.keyboard.press("ControlOrMeta+x");
    expect(await getNodes(page)).toHaveLength(0);

    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x + 100, centre.y);
    await page.keyboard.press("ControlOrMeta+v");

    expect(await getNodes(page)).toHaveLength(1);
  });

  test("paste with empty clipboard is a no-op", async ({ page }) => {
    await page.keyboard.press("ControlOrMeta+v");
    expect(await getNodes(page)).toHaveLength(0);
  });

  test("paste preserves internal connections between copied nodes", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "q", -250, 0);
    const b = await addNodeAt(page, "q", 250, 0);

    await page.evaluate(
      ({ aId, bId }) => window.__editor!.addBooleanConnection(aId, bId),
      {
        aId: a,
        bId: b,
      },
    );
    expect(await getConnections(page)).toHaveLength(1);

    await nodeById(page, a).click();
    await nodeById(page, b).click({ modifiers: ["ControlOrMeta"] });
    await page.keyboard.press("ControlOrMeta+c");

    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y + 200);
    await page.keyboard.press("ControlOrMeta+v");

    expect(await getNodes(page)).toHaveLength(4);
    expect(await getConnections(page)).toHaveLength(2);
  });

  test("paste preserves parent-child relationships", async ({ page }) => {
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 100, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y + 100 });
    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;
    // FIX(duplication): this "create Limit + Count children, then assign n.parent via page.evaluate" fixture block is copy-pasted in deletion.spec.ts (x2), history.spec.ts, movement.spec.ts and selection.spec.ts — fix: add a createLimitWithChildren(page, childCount) helper to helpers.ts (ideally backed by a setParent method on the window.__editor test hook); why: six near-identical copies will drift, and direct n.parent mutation bypassing the scopes plugin is a fragile detail that should live in one place.
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    // selects both children as parent selection selects its children.
    await nodeById(page, limit.id).click({ position: { x: 5, y: 5 } });

    await page.keyboard.press("ControlOrMeta+c");
    await page.mouse.move(centre.x, centre.y + 300);
    await page.keyboard.press("ControlOrMeta+v");

    const after = await getNodes(page);
    expect(after).toHaveLength(6);

    const limits = after.filter((n) => n.label === "Limit");
    expect(limits).toHaveLength(2);

    for (const lim of limits) {
      const children = after.filter((n) => n.parent === lim.id);
      expect(children).toHaveLength(2);
      expect(children.every((c) => c.label === "Count")).toBe(true);
    }
  });
});
