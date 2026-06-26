import {
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/modules/evaluation/graph/editor/constants";
import { expect, test } from "@playwright/test";
import { canvasCentre, getZoom, gotoEditor } from "./helpers";

const PRECISION = 5;

test.describe("Canvas viewport", () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test("wheel down zooms out", async ({ page }) => {
    expect(await getZoom(page)).toBe(ZOOM_MAX);

    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.wheel(0, 200);

    await expect.poll(() => getZoom(page)).toBeLessThan(ZOOM_MAX);
  });

  test("wheel up is clamped at the max", async ({ page }) => {
    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y);

    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -300);
    }

    await expect.poll(() => getZoom(page)).toBe(ZOOM_MAX);
  });

  test("wheel down is clamped at the min", async ({ page }) => {
    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y);

    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 300);
    }

    await expect.poll(() => getZoom(page)).toBeCloseTo(ZOOM_MIN, PRECISION);
  });

  test("dragging the background pans the canvas", async ({ page }) => {
    const before = await page.evaluate(() => ({
      x: window.__editor!.area.area.transform.x,
      y: window.__editor!.area.area.transform.y,
    }));

    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(centre.x + 200, centre.y + 150, { steps: 10 });
    await page.mouse.up({ button: "left" });

    const after = await page.evaluate(() => ({
      x: window.__editor!.area.area.transform.x,
      y: window.__editor!.area.area.transform.y,
    }));

    expect(after.x - before.x).toBeCloseTo(200, 0);
    expect(after.y - before.y).toBeCloseTo(150, 0);
  });
});
