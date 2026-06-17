import { expect, test, type Locator, type Page } from "@playwright/test";
import { addNodeAt, getConnections, gotoEditor } from "./helpers";

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

  // The connection plugin redraws on pointermove; multiple steps make it
  // pick up the trail and detect the drop target reliably.
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

// FIX(consistency): raw attribute selector for a data-testid — fix: use page.getByTestId(`socket-output-${id}`) like helpers.ts/gotoEditor does; why: getByTestId is the project-wide convention and respects a configured testIdAttribute.
function outSocket(page: Page, id: string) {
  return page.locator(`[data-testid="socket-output-${id}"]`);
}

function inSocket(page: Page, id: string) {
  return page.locator(`[data-testid="socket-input-${id}"]`);
}

test.describe("Connections", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("dragging output to input creates a boolean connection", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "q", -250, 0);
    const b = await addNodeAt(page, "q", 250, 0);

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
    const andNode = await addNodeAt(page, "q", -250, 0);
    const count = await addNodeAt(page, "1", 250, 0);

    await dragSocketToSocket(
      page,
      outSocket(page, andNode),
      inSocket(page, count),
    );

    // FIX(flakiness): negative assertion taken immediately after mouse.up — connection creation is async, so this can false-pass before a (wrongly created) connection lands; same pattern in the empty-canvas test below — fix: await expect.poll(() => getConnections(page), ...) over a short window, or first prove the timing with a positive control in the same flow; why: a regression that starts accepting mixed sockets would likely still go green here.
    expect(await getConnections(page)).toHaveLength(0);
  });

  test("dropping a connection on empty canvas creates nothing", async ({
    page,
  }) => {
    const a = await addNodeAt(page, "q", -250, 0);

    const sourceBox = await outSocket(page, a).boundingBox();
    if (!sourceBox) throw new Error("socket missing");
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + 400, sourceBox.y + 300, { steps: 10 });
    await page.mouse.up();

    expect(await getConnections(page)).toHaveLength(0);
  });

  test("toggling a boolean connection flips TRUE to NOT", async ({ page }) => {
    const a = await addNodeAt(page, "q", -250, 0);
    const b = await addNodeAt(page, "q", 250, 0);
    await dragSocketToSocket(page, outSocket(page, a), inSocket(page, b));

    const beforeOp = await page.evaluate(() => {
      const { editor } = window.__editor!;
      return (
        editor.getConnections()[0] as unknown as { booleanOperator: string }
      ).booleanOperator;
    });
    expect(beforeOp).toBe("TRUE");

    await page.getByRole("button", { name: /^TRUE$/ }).click();

    const afterOp = await page.evaluate(() => {
      const { editor } = window.__editor!;
      return (
        editor.getConnections()[0] as unknown as { booleanOperator: string }
      ).booleanOperator;
    });
    expect(afterOp).toBe("NOT");
  });
});
