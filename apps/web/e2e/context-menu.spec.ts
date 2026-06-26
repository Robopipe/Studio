import { expect, test } from "@playwright/test";
import { addNodeAt, canvas, gotoEditor, nodeById } from "./helpers";

test.describe("Context menu", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("right clicking the background opens the root menu", async ({
    page,
  }) => {
    await canvas(page).click({ button: "right", position: { x: 100, y: 100 } });

    await expect(page.getByTestId("context-menu")).toBeVisible();
    await expect(page.getByTestId("context-menu-item")).toHaveText([
      "Check",
      "Result",
      "Check Item",
      "Logical",
      "Action",
    ]);
  });

  test("right clicking a node shows the Delete & Clone items", async ({
    page,
  }) => {
    const id = await addNodeAt(page, "a", 0, 0);

    await nodeById(page, id).click({
      button: "right",
      position: { x: 5, y: 5 },
    });
    await expect(page.getByTestId("context-menu-item")).toHaveText([
      "Delete",
      "Clone",
    ]);
  });

  const groups = [
    { label: "Check Item", children: ["Position", "Area", "Count"] },
    { label: "Logical", children: ["And", "Or"] },
    { label: "Action", children: ["Warning", "Alert"] },
  ];

  for (const group of groups) {
    test(`hovering "${group.label}" opens its submenu`, async ({ page }) => {
      await canvas(page).click({
        button: "right",
        position: { x: 100, y: 100 },
      });

      const items = page.getByTestId("context-menu-item");
      await items.filter({ hasText: new RegExp(`^${group.label}$`) }).hover();

      for (const child of group.children) {
        await expect(
          items.filter({ hasText: new RegExp(`^${child}$`) }),
        ).toBeVisible();
      }
    });
  }

  test("clicking outside closes the menu", async ({ page }) => {
    await canvas(page).click({ button: "right", position: { x: 100, y: 100 } });
    await expect(page.getByTestId("context-menu")).toBeVisible();

    await canvas(page).click({ position: { x: 600, y: 600 } });
    await expect(page.getByTestId("context-menu")).toBeHidden();
  });
});
