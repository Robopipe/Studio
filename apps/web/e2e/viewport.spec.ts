import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from "@/modules/evaluation/graph/editor/constants";
import { expect, test } from "@playwright/test";
import {
  addNodeAt,
  canvasCentre,
  getZoom,
  gotoEditor,
  nodeById,
} from "./helpers";

const PRECISION = 5;
const CLICKS_TO_CLAMP = Math.ceil((ZOOM_MAX - ZOOM_MIN) / ZOOM_STEP) + 2;

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

  test("the zoom-out button zooms out by one step", async ({ page }) => {
    expect(await getZoom(page)).toBe(ZOOM_MAX);

    await page.getByRole("button", { name: "Zoom out" }).click();

    await expect
      .poll(() => getZoom(page))
      .toBeCloseTo(ZOOM_MAX - ZOOM_STEP, PRECISION);
  });

  test("the zoom-in button is clamped at the max", async ({ page }) => {
    expect(await getZoom(page)).toBe(ZOOM_MAX);

    await page.getByRole("button", { name: "Zoom in" }).click();

    await expect.poll(() => getZoom(page)).toBe(ZOOM_MAX);
  });

  test("the zoom-in button reverses the zoom-out button", async ({ page }) => {
    const zoomOut = page.getByRole("button", { name: "Zoom out" });
    await zoomOut.click();
    await zoomOut.click();
    await expect
      .poll(() => getZoom(page))
      .toBeCloseTo(ZOOM_MAX - 2 * ZOOM_STEP, PRECISION);

    await page.getByRole("button", { name: "Zoom in" }).click();

    await expect
      .poll(() => getZoom(page))
      .toBeCloseTo(ZOOM_MAX - ZOOM_STEP, PRECISION);
  });

  test("the zoom-out button is clamped at the min", async ({ page }) => {
    const zoomOut = page.getByRole("button", { name: "Zoom out" });
    for (let i = 0; i < CLICKS_TO_CLAMP; i++) {
      await zoomOut.click();
    }

    await expect.poll(() => getZoom(page)).toBeCloseTo(ZOOM_MIN, PRECISION);
  });

  test("the fit-to-view button brings an off-screen node into view", async ({
    page,
  }) => {
    const id = await addNodeAt(page, "1", 0, 0);

    const centre = await canvasCentre(page);
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(centre.x - 1200, centre.y - 1200, { steps: 10 });
    await page.mouse.up({ button: "left" });

    await page.getByRole("button", { name: "Fit to view" }).click();

    await expect
      .poll(async () => {
        const node = await nodeById(page, id).boundingBox();
        const canvasBox = await page.getByTestId("editor-canvas").boundingBox();
        if (!node || !canvasBox) return false;
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        return (
          cx >= canvasBox.x &&
          cx <= canvasBox.x + canvasBox.width &&
          cy >= canvasBox.y &&
          cy <= canvasBox.y + canvasBox.height
        );
      })
      .toBe(true);
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
