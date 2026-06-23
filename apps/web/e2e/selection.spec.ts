import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  canvas,
  createLimitWithChildren,
  getNodes,
  gotoEditor,
  nodeById,
} from "./helpers";

test.describe("Selection", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("clicking a node selects it & clicking another node replaces selection", async ({
    page,
  }) => {
    await addNodeAt(page, "a", -200, 0);
    await addNodeAt(page, "o", 200, 0);

    const initial = await getNodes(page);
    expect(initial).toHaveLength(2);

    const [first, second] = initial as [
      (typeof initial)[number],
      (typeof initial)[number],
    ];

    await nodeById(page, first.id).click();
    let nodes = await getNodes(page);
    expect(nodes.find((n) => n.id === first.id)?.selected).toBe(true);
    expect(nodes.find((n) => n.id === second.id)?.selected).toBe(false);

    await nodeById(page, second.id).click();
    nodes = await getNodes(page);
    expect(nodes.find((n) => n.id === first.id)?.selected).toBe(false);
    expect(nodes.find((n) => n.id === second.id)?.selected).toBe(true);
  });

  test("clicking background deselects everything", async ({ page }) => {
    await addNodeAt(page, "a", 0, 0);
    expect((await getNodes(page))[0]!.selected).toBe(true);

    await canvas(page).click({ position: { x: 10, y: 10 } });
    expect((await getNodes(page))[0]!.selected).toBe(false);
  });

  test("Pressing escape key deselects everything", async ({ page }) => {
    await addNodeAt(page, "a", 0, 0);
    expect((await getNodes(page))[0]!.selected).toBe(true);

    await page.keyboard.press("Escape");
    expect((await getNodes(page))[0]!.selected).toBe(false);
  });

  test("Cmd/Ctrl+A selects every node", async ({ page }) => {
    await addNodeAt(page, "a", -200, 0);
    await addNodeAt(page, "o", 200, 0);
    await addNodeAt(page, "r", 0, 200);

    await page.keyboard.press("Escape");
    expect((await getNodes(page)).every((n) => !n.selected)).toBe(true);

    await page.keyboard.press("ControlOrMeta+a");

    const nodes = await getNodes(page);
    expect(nodes.every((n) => n.selected)).toBe(true);
  });

  test("Ctrl+click accumulates selection", async ({ page }) => {
    await addNodeAt(page, "a", -200, 0);
    await addNodeAt(page, "o", 200, 0);
    const [firstId, secondId] = (await getNodes(page)).map((n) => n.id) as [
      string,
      string,
    ];

    await nodeById(page, firstId).click();
    await nodeById(page, secondId).click({ modifiers: ["ControlOrMeta"] });

    const nodes = await getNodes(page);
    expect(nodes.every((n) => n.selected)).toBe(true);
  });

  test("clicking a LimitNode selects all of its children", async ({ page }) => {
    const { limitId } = await createLimitWithChildren(page, 2);

    await page.keyboard.press("Escape");
    expect((await getNodes(page)).every((n) => !n.selected)).toBe(true);

    await nodeById(page, limitId).click({ position: { x: 5, y: 5 } });

    const nodes = await getNodes(page);
    expect(nodes.find((n) => n.id === limitId)?.selected).toBe(true);
    const children = nodes.filter((n) => n.parent === limitId);
    expect(children).toHaveLength(2);
    expect(children.every((n) => n.selected)).toBe(true);
  });
});
