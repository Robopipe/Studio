import { GRID } from "@/modules/evaluation/graph/editor/constants";
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

/** Output / input socket locators for a node, by the project-wide testid convention. */
export function outSocket(page: Page, id: string): Locator {
  return page.getByTestId(`socket-output-${id}`);
}

export function inSocket(page: Page, id: string): Locator {
  return page.getByTestId(`socket-input-${id}`);
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
 * Lets pending editor work settle (node/connection creation is async). Flushes
 * two animation frames, so a negative assertion taken afterwards cannot
 * false-pass before a wrongly-created node or connection has had time to land.
 */
export async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

/**
 * Adds a node via its keyboard shortcut at the given canvas-relative offset
 * from the centre. Waits for the node to actually appear (creation is async)
 * and returns the newly created node id (diffed against the prior set, since
 * the editor does not guarantee node ordering).
 */
export async function addNodeAt(
  page: Page,
  key: string,
  dx: number,
  dy: number,
): Promise<string> {
  const before = new Set((await getNodes(page)).map((n) => n.id));
  const centre = await canvasCentre(page);
  await pressShortcutAt(page, key, { x: centre.x + dx, y: centre.y + dy });
  await page.waitForFunction(
    (count) => (window.__editor?.editor.getNodes().length ?? 0) > count,
    before.size,
  );
  const created = (await getNodes(page)).find((n) => !before.has(n.id));
  if (!created) throw new Error("node was not created");
  return created.id;
}

/**
 * Drags a node by (dx, dy). Grabs near the top-left to avoid the socket hit
 * zones along the bottom edge.
 */
export async function dragNode(page: Page, id: string, dx: number, dy: number) {
  const box = await nodeById(page, id).boundingBox();
  if (!box) throw new Error(`node ${id} not visible`);
  const start = { x: box.x + 30, y: box.y + 20 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
  await page.mouse.up();
}

/** Hold past the editor's 250ms scope-enter threshold before dragging. */
export const SCOPE_HOLD_MS = 300;

/**
 * Press-hold-drag gesture used to nest a node into (or out of) a scope: press,
 * hold past SCOPE_HOLD_MS to enter scope mode, then drag to the target and drop.
 */
export async function dragWithScopeHold(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(SCOPE_HOLD_MS);
  await page.mouse.move(to.x, to.y, { steps: 15 });
  await page.mouse.up();
}

/**
 * Asserts a node moved by approximately (dx, dy). Nodes snap to the grid, so the
 * observed delta is allowed to differ from the requested drag by up to one GRID.
 */
export function expectMovedBy(
  before: NodeSnapshot,
  after: NodeSnapshot,
  dx: number,
  dy: number,
  tolerance: number = GRID,
) {
  expect(after.position.x - before.position.x).toBeGreaterThanOrEqual(
    dx - tolerance,
  );
  expect(after.position.x - before.position.x).toBeLessThanOrEqual(
    dx + tolerance,
  );
  expect(after.position.y - before.position.y).toBeGreaterThanOrEqual(
    dy - tolerance,
  );
  expect(after.position.y - before.position.y).toBeLessThanOrEqual(
    dy + tolerance,
  );
}

/**
 * Builds a Limit node with `childCount` Count children nested inside it. Returns
 * the limit id and the child ids. Parenting is assigned directly on the model
 * (the same field the scopes plugin sets) so a test can start from a populated
 * limit without performing the drag gesture each time.
 */
export async function createLimitWithChildren(page: Page, childCount: number) {
  const limitId = await addNodeAt(page, "l", -200, 0);
  const childIds: string[] = [];
  for (let i = 0; i < childCount; i++) {
    childIds.push(await addNodeAt(page, "1", 100 + i * 100, (i % 2) * 100));
  }
  await page.evaluate(
    ({ parentId, ids }) => {
      const { editor } = window.__editor!;
      for (const id of ids) {
        const node = editor.getNode(id);
        if (node) node.parent = parentId;
      }
    },
    { parentId: limitId, ids: childIds },
  );
  return { limitId, childIds };
}
