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
