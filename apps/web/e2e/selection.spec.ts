import { expect, test } from "@playwright/test";
import {
  canvas,
  canvasCentre,
  getNodes,
  gotoEditor,
  nodeById,
  pressShortcutAt,
} from "./helpers";

// FIX(duplication): local addNodeAt shadows the helpers.ts export of the same name but silently drops the returned node id — fix: delete this and import addNodeAt from './helpers' (ignore the return value where unused); why: two functions with identical names and diverging behaviour across the suite is a copy-paste trap, and it is why this file re-fetches ids via getNodes() ordering below.
async function addNodeAt(
  page: import("@playwright/test").Page,
  key: string,
  dx: number,
  dy: number,
) {
  const centre = await canvasCentre(page);
  await pressShortcutAt(page, key, { x: centre.x + dx, y: centre.y + dy });
}

test.describe("Selection", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("clicking a node selects it & clicking another node replaces selection", async ({
    page,
  }) => {
    await addNodeAt(page, "q", -200, 0);
    await addNodeAt(page, "w", 200, 0);

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
    await addNodeAt(page, "q", 0, 0);
    expect((await getNodes(page))[0]!.selected).toBe(true);

    await canvas(page).click({ position: { x: 10, y: 10 } });
    expect((await getNodes(page))[0]!.selected).toBe(false);
  });

  test("Pressing escape key deselects everything", async ({ page }) => {
    await addNodeAt(page, "q", 0, 0);
    expect((await getNodes(page))[0]!.selected).toBe(true);

    await page.keyboard.press("Escape");
    expect((await getNodes(page))[0]!.selected).toBe(false);
  });

  test("Cmd/Ctrl+A selects every node", async ({ page }) => {
    await addNodeAt(page, "q", -200, 0);
    await addNodeAt(page, "w", 200, 0);
    await addNodeAt(page, "r", 0, 200);

    // deselect all, by default the last created node would be selected.
    await page.keyboard.press("Escape");
    expect((await getNodes(page)).every((n) => !n.selected)).toBe(true);

    // FIX(dead-code): this background click is unexplained — Escape above already deselected everything and keyboard focus is already on the page, and per the "clicking background deselects" test the click is a no-op here — fix: remove it, or add a comment stating the focus quirk it works around; why: unexplained ritual steps get cargo-culted into new tests.
    await canvas(page).click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("ControlOrMeta+a");

    const nodes = await getNodes(page);
    expect(nodes.every((n) => n.selected)).toBe(true);
  });

  test("Ctrl+click accumulates selection", async ({ page }) => {
    await addNodeAt(page, "q", -200, 0);
    await addNodeAt(page, "w", 200, 0);
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
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "l", { x: centre.x - 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y });
    await pressShortcutAt(page, "1", { x: centre.x + 200, y: centre.y + 150 });

    const limit = (await getNodes(page)).find((n) => n.label === "Limit")!;
    // FIX(dead-code): expect(limit).toBeDefined() is redundant — the `!` non-null assertion on the line above already claims it exists, so the check either never fires or is contradicted by the assertion operator — fix: drop the expect (or drop the `!` and keep a real guard); why: checks that cannot fail give false confidence.
    expect(limit).toBeDefined();

    // FIX(duplication): same "Limit + Count children + parent assignment" fixture copy-pasted from clipboard/deletion/history/movement specs — fix: extract createLimitWithChildren(page, childCount) into helpers.ts; why: shared fixtures belong in helpers so one change updates all specs.
    await page.evaluate((parentId) => {
      const { editor } = window.__editor!;
      for (const n of editor.getNodes()) {
        if (n.id !== parentId && n.label === "Count") n.parent = parentId;
      }
    }, limit.id);

    await page.keyboard.press("Escape");
    expect((await getNodes(page)).every((n) => !n.selected)).toBe(true);

    await nodeById(page, limit.id).click({ position: { x: 5, y: 5 } });

    const nodes = await getNodes(page);
    expect(nodes.find((n) => n.id === limit.id)?.selected).toBe(true);
    const children = nodes.filter((n) => n.parent === limit.id);
    expect(children).toHaveLength(2);
    expect(children.every((n) => n.selected)).toBe(true);
  });
});
