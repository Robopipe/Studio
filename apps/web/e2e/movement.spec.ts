import { GRID } from "@/modules/evaluation/graph/editor/constants";
import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  createLimitWithChildren,
  dragNode,
  expectMovedBy,
  getNodes,
  gotoEditor,
  nodeById,
} from "./helpers";

test.describe("Node movement", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("dragging a node moves it by approximately the drag delta", async ({
    page,
  }) => {
    const id = await addNodeAt(page, "a", 0, 0);
    const before = (await getNodes(page)).find((n) => n.id === id)!;

    await dragNode(page, id, 60, 40);

    const after = (await getNodes(page)).find((n) => n.id === id)!;
    expectMovedBy(before, after, 60, 40);
  });

  test("node positions remain grid aligned after drag", async ({ page }) => {
    const id = await addNodeAt(page, "a", 0, 0);
    await dragNode(page, id, 73, 47);

    const after = (await getNodes(page)).find((n) => n.id === id)!;
    expect(after.position.x % GRID).toBe(0);
    expect(after.position.y % GRID).toBe(0);
  });

  test("dragging a LimitNode moves its children with it", async ({ page }) => {
    const { limitId, childIds } = await createLimitWithChildren(page, 2);

    await nodeById(page, limitId).click({ position: { x: 5, y: 5 } });
    const before = await getNodes(page);
    expect(childIds).toHaveLength(2);

    await dragNode(page, limitId, 60, 40);

    const after = await getNodes(page);
    for (const childId of childIds) {
      const b = before.find((n) => n.id === childId)!;
      const a = after.find((n) => n.id === childId)!;
      expectMovedBy(b, a, 60, 40);
    }
  });

  test("multi select drag moves every selected node", async ({ page }) => {
    const aId = await addNodeAt(page, "a", -250, 0);
    const bId = await addNodeAt(page, "o", 250, 0);

    await nodeById(page, aId).click();
    await nodeById(page, bId).click({ modifiers: ["ControlOrMeta"] });

    const before = await getNodes(page);

    await page.keyboard.down("ControlOrMeta");
    await dragNode(page, aId, 60, 40);
    await page.keyboard.up("ControlOrMeta");

    const after = await getNodes(page);
    for (const id of [aId, bId]) {
      const b = before.find((n) => n.id === id)!;
      const a = after.find((n) => n.id === id)!;
      expectMovedBy(b, a, 60, 40);
    }
  });
});
