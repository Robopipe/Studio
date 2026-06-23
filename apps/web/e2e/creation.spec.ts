import { expect, test } from "@playwright/test";
import {
  canvas,
  canvasCentre,
  getNodes,
  gotoEditor,
  pressShortcutAt,
} from "./helpers";

test.describe("Node creation", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    expect(await getNodes(page)).toHaveLength(0);
  });

  test.describe("keyboard shortcuts", () => {
    const cases: { key: string; label: string }[] = [
      { key: "a", label: "AND" },
      { key: "o", label: "OR" },
      { key: "l", label: "Limit" },
      { key: "r", label: "Result" },
      { key: "1", label: "Count" },
      { key: "2", label: "Area" },
      { key: "3", label: "Position" },
    ];

    for (const { key, label } of cases) {
      test(`"${key}" adds a ${label} node at the cursor`, async ({ page }) => {
        await pressShortcutAt(page, key);
        const nodes = await getNodes(page);
        expect(nodes).toHaveLength(1);
        expect(nodes[0]!.label).toBe(label);
      });
    }
  });

  test("new node is auto selected", async ({ page }) => {
    await pressShortcutAt(page, "a");
    const [node] = await getNodes(page);
    expect(node!.selected).toBe(true);
  });

  test("two shortcut presses create two nodes", async ({ page }) => {
    await pressShortcutAt(page, "a");
    const centre = await canvasCentre(page);
    await pressShortcutAt(page, "o", { x: centre.x + 200, y: centre.y });

    const nodes = await getNodes(page);
    expect(nodes.map((n) => n.label).sort()).toEqual(["AND", "OR"]);
  });

  test("context menu creates a Limit node", async ({ page }) => {
    await canvas(page).click({ button: "right", position: { x: 100, y: 100 } });

    const limitItem = page
      .getByTestId("context-menu-item")
      .filter({ hasText: /^Limit$/ });
    await expect(limitItem).toBeVisible();
    await limitItem.click();

    const nodes = await getNodes(page);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.label).toBe("Limit");
  });
});
