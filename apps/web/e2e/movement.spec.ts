import { GRID } from "@/modules/evaluation/graph/editor/constants";
import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  canvasCentre,
  getNodes,
  gotoEditor,
  nodeById,
  pressShortcutAt,
} from "./helpers";

// FIX(structure): generic node-drag gesture defined locally (with an inline import('@playwright/test').Page type instead of a top-level type import like connections.spec.ts uses) — fix: move dragNode into helpers.ts; why: scopes.spec.ts re-implements the same press-move-release sequence by hand, and gesture details (grab offset to dodge socket hit zones) should live in one place.
async function dragNode(
  page: import("@playwright/test").Page,
  id: string,
  dx: number,
  dy: number,
) {
  const handle = nodeById(page, id);
  const box = await handle.boundingBox();
  if (!box) throw new Error(`node ${id} not visible`);
  // Grab near the top-left to avoid socket hit-zones, which are placed along the bottom edge.
  const start = { x: box.x + 30, y: box.y + 20 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
  await page.mouse.up();
}

test.describe("Node movement", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("dragging a node moves it by approximately the drag delta", async ({
    page,
  }) => {
    const id = await addNodeAt(page, "q", 0, 0);
    const before = (await getNodes(page)).find((n) => n.id === id)!;

    await dragNode(page, id, 60, 40);

    const after = (await getNodes(page)).find((n) => n.id === id)!;
    // FIX(duplication): this four-line "delta within ±GRID of the drag distance" tolerance block is repeated three times in this file (here, child-follow test, multi-select test) — fix: extract an expectMovedBy(before, after, dx, dy, tolerance) assertion helper; why: twelve hand-written bounds invite copy-paste mistakes and obscure the intent (snap tolerance = GRID).
    expect(after.position.x - before.position.x).toBeGreaterThanOrEqual(40);
    expect(after.position.x - before.position.x).toBeLessThanOrEqual(80);
    expect(after.position.y - before.position.y).toBeGreaterThanOrEqual(20);
    expect(after.position.y - before.position.y).toBeLessThanOrEqual(60);
  });

  test("node positions remain grid aligned after drag", async ({ page }) => {
    const id = await addNodeAt(page, "q", 0, 0);
    await dragNode(page, id, 73, 47); // GRID size is 20, intentionally not alligned

    const after = (await getNodes(page)).find((n) => n.id === id)!;
    expect(after.position.x % GRID).toBe(0);
    expect(after.position.y % GRID).toBe(0);
  });

  test("dragging a LimitNode moves its children with it", async ({ page }) => {
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 100, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y + 100 });

    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;

    // FIX(duplication): same "Limit + Count children + parent assignment" fixture copy-pasted from clipboard/deletion/history/selection specs — fix: extract createLimitWithChildren(page, childCount) into helpers.ts; why: shared fixtures belong in helpers so one change updates all specs.
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    await nodeById(page, limit.id).click({ position: { x: 5, y: 5 } });
    const before = await getNodes(page);
    const childIds = before
      .filter((n) => n.parent === limit.id)
      .map((n) => n.id);
    expect(childIds).toHaveLength(2);

    await dragNode(page, limit.id, 60, 40);

    const after = await getNodes(page);
    for (const childId of childIds) {
      const b = before.find((n) => n.id === childId)!;
      const a = after.find((n) => n.id === childId)!;
      expect(a.position.x - b.position.x).toBeGreaterThanOrEqual(40);
      expect(a.position.x - b.position.x).toBeLessThanOrEqual(80);
      expect(a.position.y - b.position.y).toBeGreaterThanOrEqual(20);
      expect(a.position.y - b.position.y).toBeLessThanOrEqual(60);
    }
  });

  test("multi select drag moves every selected node", async ({ page }) => {
    const aId = await addNodeAt(page, "q", -250, 0);
    const bId = await addNodeAt(page, "w", 250, 0);

    await nodeById(page, aId).click();
    await nodeById(page, bId).click({ modifiers: ["ControlOrMeta"] });

    const before = await getNodes(page);

    // FIX(consistency): hardcodes the 'Control' key while every other multi-select interaction in the suite uses 'ControlOrMeta' (it works only because rete's accumulateOnCtrl accepts both Control and Meta) — fix: use page.keyboard.down('ControlOrMeta'); why: mixed modifier conventions make the suite behave differently per platform and confuse future edits.
    await page.keyboard.down("Control");
    await dragNode(page, aId, 60, 40);
    await page.keyboard.up("Control");

    const after = await getNodes(page);
    for (const id of [aId, bId]) {
      const b = before.find((n) => n.id === id)!;
      const a = after.find((n) => n.id === id)!;
      expect(a.position.x - b.position.x).toBeGreaterThanOrEqual(40);
      expect(a.position.x - b.position.x).toBeLessThanOrEqual(80);
      expect(a.position.y - b.position.y).toBeGreaterThanOrEqual(20);
      expect(a.position.y - b.position.y).toBeLessThanOrEqual(60);
    }
  });
});
