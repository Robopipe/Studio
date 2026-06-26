import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  addNodeAt,
  getConnections,
  gotoEditor,
  inSocket,
  outSocket,
  settle,
} from "./helpers";

async function dragSocketToSocket(
  page: Page,
  source: Locator,
  target: Locator,
) {
  const s = await source.boundingBox();
  const t = await target.boundingBox();
  if (!s || !t) throw new Error("socket not visible");
  const from = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
  const to = { x: t.x + t.width / 2, y: t.y + t.height / 2 };

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();

  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

test.describe("Connections", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("dragging output to input creates a boolean connection", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);

    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));

    const connections = await getConnections(page);
    expect(connections).toHaveLength(1);
    expect(connections[0]!.source).toBe(a);
    expect(connections[0]!.target).toBe(b);
  });

  test("dragging output to input creates a rule (limit-item) connection", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "1", -250, 0);
    const b = await addNodeAt(page, "1", 250, 0);

    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));

    const connections = await getConnections(page);
    expect(connections).toHaveLength(1);
    expect(connections[0]!.source).toBe(a);
    expect(connections[0]!.target).toBe(b);
  });

  test("mixed socket types are rejected", async ({ page }) => {
    const andNode = await addNodeAt(page, "a", -250, 0);
    const count = await addNodeAt(page, "1", 250, 0);

    await dragSocketToSocket(
      page,
      outSocket(page, andNode),
      inSocket(page, count),
    );

    await settle(page);
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("dropping a connection on empty canvas creates nothing", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -250, 0);

    const sourceBox = await outSocket(page, a).boundingBox();
    if (!sourceBox) throw new Error("socket missing");
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + 400, sourceBox.y + 300, { steps: 10 });
    await page.mouse.up();

    await settle(page);
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("magnetic snap connects when released near (not on) a socket", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);

    const s = await outSocket(page, a).boundingBox();
    const t = await inSocket(page, b).boundingBox();
    if (!s || !t) throw new Error("socket not visible");

    // Release off the 20px socket but within the magnetic distance — snaps.
    await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2 - 25, t.y + t.height / 2 + 18, {
      steps: 12,
    });
    await page.mouse.up();

    await settle(page);
    const connections = await getConnections(page);
    expect(connections).toHaveLength(1);
    expect(connections[0]!.source).toBe(a);
    expect(connections[0]!.target).toBe(b);
  });

  test("pressing Escape cancels a magnetic snap instead of committing it", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);

    const s = await outSocket(page, a).boundingBox();
    const t = await inSocket(page, b).boundingBox();
    if (!s || !t) throw new Error("socket not visible");

    // Drag into magnetic range so the preview is active, then Escape.
    await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2 - 25, t.y + t.height / 2 + 18, {
      steps: 12,
    });
    await page.keyboard.press("Escape");
    await page.mouse.up();

    await settle(page);
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("magnetic preview does not resurrect after a connection is removed", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);

    // Create, then remove by dragging the input end out to empty space.
    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));
    expect(await getConnections(page)).toHaveLength(1);

    const t = await inSocket(page, b).boundingBox();
    if (!t) throw new Error("socket not visible");
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + 400, t.y + 300, { steps: 10 });
    await page.mouse.up();

    await settle(page);
    expect(await getConnections(page)).toHaveLength(0);

    // Hover (no button held) back near the input socket — must NOT show a
    // preview or recreate the connection.
    await page.mouse.move(t.x + t.width / 2 - 25, t.y + t.height / 2 + 18);
    await settle(page);

    await expect(page.getByTestId("magnetic-connection")).toHaveCount(0);
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("re-picking a connection end can reconnect it to another node", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -300, 0);
    const b = await addNodeAt(page, "a", 0, 0);
    const c = await addNodeAt(page, "a", 300, 0);

    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));
    expect(await getConnections(page)).toHaveLength(1);

    // Grab the connection at B's input and drop it on C's input.
    await dragSocketToSocket(page, inSocket(page, b), inSocket(page, c));
    await settle(page);

    const connections = await getConnections(page);
    expect(connections).toHaveLength(1);
    expect(connections[0]!.source).toBe(a);
    expect(connections[0]!.target).toBe(c);
  });

  test("magnetic snap works while reconnecting an existing connection", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "a", -300, 0);
    const b = await addNodeAt(page, "a", 0, 0);
    const c = await addNodeAt(page, "a", 300, 0);

    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));
    expect(await getConnections(page)).toHaveLength(1);

    // Re-pick at B's end, release NEAR (not on) C's input — the magnet should snap.
    const from = await inSocket(page, b).boundingBox();
    const to = await inSocket(page, c).boundingBox();
    if (!from || !to) throw new Error("socket not visible");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2 - 25, to.y + to.height / 2 + 18, {
      steps: 12,
    });
    await page.mouse.up();

    await settle(page);
    const connections = await getConnections(page);
    expect(connections).toHaveLength(1);
    expect(connections[0]!.source).toBe(a);
    expect(connections[0]!.target).toBe(c);
  });

  test("magnetic snap does not reach beyond its distance", async ({ page }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);

    const s = await outSocket(page, a).boundingBox();
    const t = await inSocket(page, b).boundingBox();
    if (!s || !t) throw new Error("socket not visible");

    // Release far from the input socket — outside the magnetic distance.
    await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
    await page.mouse.down();
    await page.mouse.move(t.x + t.width / 2 - 320, t.y + t.height / 2 - 220, {
      steps: 12,
    });
    await page.mouse.up();

    await settle(page);
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("toggling a boolean connection flips TRUE to NOT", async ({ page }) => {
    const a = await addNodeAt(page, "a", -250, 0);
    const b = await addNodeAt(page, "a", 250, 0);
    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));

    const beforeOp = await page.evaluate(() => {
      const { editor } = window.__editor!;
      return (
        editor.getConnections()[0] as unknown as { booleanOperator: string }
      ).booleanOperator;
    });
    expect(beforeOp).toBe("TRUE");

    await page.getByRole("button", { name: /^PASS$/ }).click();

    const afterOp = await page.evaluate(() => {
      const { editor } = window.__editor!;
      return (
        editor.getConnections()[0] as unknown as { booleanOperator: string }
      ).booleanOperator;
    });
    expect(afterOp).toBe("NOT");
  });
});
