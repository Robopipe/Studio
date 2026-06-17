import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Loads the editor and waits for the test hook to be installed.
 * Always call this at the start of a test.
 */
export async function gotoEditor(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(window.__editor));
  await expect(page.getByTestId("editor-canvas")).toBeVisible();
}

/**
 * Returns the canvas locator. Tests should target gestures (right click,
 * keyboard, wheel) against this element - it is the actual rete container.
 */
export function canvas(page: Page): Locator {
  return page.getByTestId("editor-canvas");
}

export type NodeSnapshot = {
  id: string;
  label: string;
  selected: boolean;
  parent: string | null;
  position: { x: number; y: number };
};

/**
 * Snapshot of every nodes {id, label, selected, parent, position}.
 */
export async function getNodes(page: Page): Promise<NodeSnapshot[]> {
  return page.evaluate(() => {
    const handle = window.__editor;
    if (!handle) throw new Error("test hook not installed");
    return handle.editor.getNodes().map((node) => {
      const view = handle.area.nodeViews.get(node.id);
      return {
        id: node.id,
        label: node.label,
        selected: Boolean(node.selected),
        parent: node.parent ?? null,
        position: view
          ? { x: view.position.x, y: view.position.y }
          : { x: 0, y: 0 },
      };
    });
  });
}

export async function getZoom(page: Page) {
  return page.evaluate(() => {
    const handle = window.__editor;
    if (!handle) throw new Error("test hook not installed");
    return handle.area.area.transform.k;
  });
}

/** Centre of the canvas, in viewport coords. Useful for cursor-anchored shortcuts. */
export async function canvasCentre(page: Page) {
  const box = await canvas(page).boundingBox();
  if (!box) throw new Error("canvas not visible");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Moves the mouse over the canvas before triggering a keyboard shortcut so
 * setupKeyListeners pointermove tracker has a known position.
 */
export async function pressShortcutAt(
  page: Page,
  key: string,
  position?: { x: number; y: number },
) {
  const target = position ?? (await canvasCentre(page));
  await page.mouse.move(target.x, target.y);
  await page.keyboard.press(key);
}

/** Locator for a specific node by its rete id. */
export function nodeById(page: Page, id: string): Locator {
  return page.locator(`[data-node-id="${id}"]`);
}

export type ConnectionSnapshot = {
  id: string;
  source: string;
  target: string;
  sourceOutput: string;
  targetInput: string;
};

export async function getConnections(
  page: Page,
): Promise<ConnectionSnapshot[]> {
  return page.evaluate(() => {
    const handle = window.__editor;
    if (!handle) throw new Error("test hook not installed");
    return handle.editor.getConnections().map((c) => ({
      id: c.id,
      source: c.source,
      target: c.target,
      sourceOutput: String(c.sourceOutput),
      targetInput: String(c.targetInput),
    }));
  });
}

/**
 * Adds a node via its keyboard shortcut at the given canvas-relative offset
 * from the centre. Returns the newly created node id.
 */
export async function addNodeAt(
  page: Page,
  key: string,
  dx: number,
  dy: number,
): Promise<string> {
  const centre = await canvasCentre(page);
  await pressShortcutAt(page, key, { x: centre.x + dx, y: centre.y + dy });
  // FIX(flakiness): getNodes() runs immediately after the keypress, but node creation in the app is async (editor.addNode returns a promise) — fix: capture the node count before the keypress and page.waitForFunction until window.__editor.editor.getNodes().length increases; why: a race here makes every spec that builds fixtures through addNodeAt intermittently fail.
  const nodes = await getNodes(page);
  // FIX(flakiness): nodes.at(-1) assumes editor.getNodes() returns nodes in creation order — fix: diff the set of ids before/after the keypress and return the new id; why: the rete editor API does not guarantee ordering, so a different insertion strategy would silently return the wrong node.
  const latest = nodes.at(-1);
  if (!latest) throw new Error("node was not created");
  return latest.id;
}
