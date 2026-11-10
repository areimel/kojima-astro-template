import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Software WebGL (SwiftShader) is slow: give every test extra room.
test.setTimeout(120_000);

async function open(page: Page, path = "/globe-demo") {
  const response = await page.goto(path);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  return response;
}

const json = (name: string) => JSON.parse(readFileSync(`src/data/globe/${name}.json`, "utf8"));
const hero = (page: Page) => page.getByRole("figure", { name: /^Hero globe showing/ });
const playground = (page: Page) => page.getByRole("figure", { name: "Playground globe" });
const gallery = (page: Page) => page.getByRole("region", { name: "Preset gallery" });
const pinLabels = (page: Page) => playground(page).locator(".encom-globe__label--pin");
const log = (page: Page) => page.getByRole("log", { name: "Globe events" });

function collectProblems(page: Page, withConsole = false) {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  if (withConsole) page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  return problems;
}

/** Number of pixels in the figure's PNG screenshot that differ from its dominant (background) colour. Decoded in-browser, so no PNG library is needed. */
async function drawnPixels(page: Page, figure: Locator) {
  const b64 = (await figure.screenshot({ animations: "disabled" })).toString("base64");
  return page.evaluate(async (data) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext("2d")!;
    ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    const counts = new Map<number, number>();
    for (let i = 0; i < px.length; i += 4) {
      const k = ((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return bmp.width * bmp.height - Math.max(...counts.values());
  }, b64);
}

test("hero globe renders a canvas with non-blank pixels", async ({ page }) => {
  const problems = collectProblems(page);
  await open(page);
  await hero(page).scrollIntoViewIfNeeded();
  await expect(hero(page).locator("canvas")).toHaveCount(1);
  await expect(hero(page).locator(".encom-globe__label--pin").first()).toBeAttached();
  // The globe, atmosphere and pins cover a large share of the frame; a blank canvas leaves ~0 non-background pixels.
  await expect.poll(() => drawnPixels(page, hero(page)), { timeout: 30_000 }).toBeGreaterThan(5_000);
  expect(problems).toEqual([]);
});

test("gallery globes start lazily and the page runs many instances", async ({ page }) => {
  const problems = collectProblems(page);
  await open(page);
  const figures = gallery(page).getByRole("figure");
  await expect(figures).toHaveCount(6);
  await expect(figures.locator("canvas")).toHaveCount(0);
  await gallery(page).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => figures.locator("canvas").count(), { timeout: 60_000 }).toBeGreaterThan(0);
  for (const y of [0, 500, 1000]) {
    await gallery(page).evaluate((el, dy) => window.scrollBy(0, dy + el.getBoundingClientRect().top - 100), y);
    await page.waitForTimeout(300);
  }
  await expect.poll(() => page.locator("canvas").count(), { timeout: 60_000 }).toBeGreaterThanOrEqual(8);
  expect(problems).toEqual([]);
});

test("playground layer switches, add-pin form and flyTo", async ({ page }) => {
  const problems = collectProblems(page, true);
  await open(page);
  await playground(page).scrollIntoViewIfNeeded();
  await expect(pinLabels(page).first()).toBeAttached({ timeout: 60_000 });

  await page.getByRole("switch", { name: "atmosphere" }).click();
  await expect(page.getByRole("switch", { name: "atmosphere" })).toBeChecked();
  await page.getByRole("switch", { name: "atmosphere" }).click();

  // Pin labels are removed with the pins layer and return with it.
  await page.getByRole("switch", { name: "pins" }).click();
  await expect(pinLabels(page)).toHaveCount(0);
  await page.getByRole("switch", { name: "pins" }).click();
  await expect(pinLabels(page).first()).toBeAttached();

  await page.getByLabel("Pin label").fill("E2E TEST PIN");
  // Open ocean, so label collision avoidance against the data pins cannot thin it out.
  await page.getByLabel("Latitude").fill("-50");
  await page.getByLabel("Longitude").fill("-120");
  await page.getByRole("button", { name: "Add pin", exact: true }).click();
  await expect(log(page)).toContainText("ADD pin: E2E TEST PIN");
  // Pins drop in progressively (slowly under software GL), so allow time for the new label.
  await expect(pinLabels(page).filter({ hasText: "E2E TEST PIN" })).toHaveCount(1, { timeout: 60_000 });

  // flyTo moves the camera, so the on-screen label transforms change.
  const positions = () => pinLabels(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).style.transform).join("|"));
  const start = await positions();
  await page.getByRole("button", { name: "Sydney" }).click();
  await expect.poll(positions, { timeout: 30_000 }).not.toBe(start);
  expect(problems).toEqual([]);
});

test.fixme("hover and select a pin logs to the event log", async () => {
  // Pin screen coordinates are not exposed (labels are CSS2D, WebGL picking is opaque) and the page
  // offers no handle to dispatch select/hover without adding test-only production hooks.
});

test("reduced motion freezes the hero globe, normal motion rotates it", async ({ page }) => {
  const snap = async () => {
    await hero(page).scrollIntoViewIfNeeded();
    await expect.poll(() => drawnPixels(page, hero(page)), { timeout: 30_000 }).toBeGreaterThan(5_000);
    // Pixels can appear before every layer (e.g. the fetched hex grid) is in; data-status
    // becomes "ready" only once the controller has finished building all layers.
    await expect(hero(page)).toHaveAttribute("data-status", "ready", { timeout: 30_000 });
    await page.waitForTimeout(500);
    const a = await hero(page).screenshot({ animations: "disabled" });
    await page.waitForTimeout(1500);
    return a.equals(await hero(page).screenshot({ animations: "disabled" }));
  };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await snap()).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  expect(await snap()).toBe(false);
});

test("navigating away and back disposes globes cleanly", async ({ page }) => {
  const problems = collectProblems(page);
  const warnings: string[] = [];
  page.on("console", (m) => /too many active webgl contexts/i.test(m.text()) && warnings.push(m.text()));
  for (let i = 0; i < 2; i++) {
    await open(page);
    await expect(hero(page).locator("canvas")).toHaveCount(1);
    await open(page, "/");
    await expect(page.locator("main h1")).toHaveCount(1);
  }
  expect(problems).toEqual([]);
  expect(warnings).toEqual([]);
});

test("hero figcaption lists every dataset item", async ({ page }) => {
  await open(page);
  const expected =
    json("offices").pins.length + json("hotspots").pins.length + json("routes").markers.length + json("satellites").satellites.length;
  await expect(hero(page).locator("figcaption li")).toHaveCount(expected);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("shows the heading and noscript message", async ({ page }) => {
    await page.goto("/globe-demo");
    await expect(page.locator("main h1")).toContainText("One globe.");
    // getByText skips <noscript>, so address the element directly.
    await expect(page.locator("figure noscript p").first()).toHaveText("Interactive 3D globe requires JavaScript.");
  });
});
