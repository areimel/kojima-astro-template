import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  return response;
}

const routes = ["/", "/components", "/about", "/pricing", "/contact", "/login", "/signup", "/faq", "/blog", "/blog/post-1", "/blog/post-2", "/blog/post-3", "/blog/post-4", "/blog/post-5", "/privacy", "/404"];

for (const theme of ["dark", "light"]) {
  for (const route of routes) {
    test(`${theme} ${route}: accessible and responsive`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const response = await open(page, route === "/404" ? "/__missing_kojima_route__" : route);
      expect(response?.status()).toBe(route === "/404" ? 404 : 200);
      await expect(page.locator("main h1")).toHaveCount(1);
      if (route === "/404") {
        await expect(page.getByRole("link", { name: "Return to overview" })).toHaveAttribute("href", "/");
        await expect(page.getByRole("link", { name: "Explore field notes" })).toHaveAttribute("href", "/blog");
      }
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
      expect(errors).toEqual([]);
    });
  }
}

test("instrument controls, keyboard slider, filtering, and SVG export", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "02 / FREQUENCY" }).click();
  await expect(page.getByRole("heading", { name: "Signal analysis", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "paper palette" }).click();
  await expect(page.getByRole("button", { name: "paper palette" })).toHaveAttribute("aria-pressed", "true");
  const slider = page.getByRole("slider", { name: "DETAIL DENSITY" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "70");
  await page.getByLabel("REGION", { exact: true }).selectOption("APAC");
  await expect(page.locator(".signal-list li")).toHaveCount(1);
  await expect(page.locator(".signal-list")).toContainText("Policy outlook revised");
  const original = await page.locator(".instrument-plate").innerHTML();
  await page.getByRole("button", { name: "New study" }).click();
  expect(await page.locator(".instrument-plate").innerHTML()).not.toBe(original);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  expect((await download).suggestedFilename()).toMatch(/^kojima-wave-\d+\.svg$/);
});

test("theme persists and mobile navigation closes on Escape", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: /switch to light/i }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: /navigation/i });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});

test("component settings apply and restore through an accessible dialog", async ({ page }) => {
  await open(page, "/components");
  await page.getByLabel("Briefing title").fill("Pacific briefing");
  await page.getByRole("button", { name: "Review settings" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Apply locally" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Briefing title").fill("Another briefing");
  await page.getByRole("button", { name: "Restore snapshot" }).click();
  await expect(page.getByLabel("Briefing title")).toHaveValue("Pacific briefing");
});

test("contact prepares a local inquiry and pricing switches billing", async ({ page }) => {
  await open(page, "/contact");
  await page.getByLabel("Full name").fill("Demo Analyst");
  await page.getByLabel("Work email", { exact: true }).fill("analyst@example.com");
  await page.getByLabel("Intelligence requirements").fill("Monitor synthetic supply-chain scenarios in the Pacific region.");
  await page.getByRole("button", { name: "Prepare demo request" }).click();
  await expect(page.getByRole("status")).toContainText("no message sent");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download inquiry" }).click();
  expect((await download).suggestedFilename()).toBe("kojima-demo-inquiry.txt");
  await open(page, "/pricing");
  await expect(page.getByText("$384 per analyst, billed yearly", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Annual billing / save 20%" }).click();
  await expect(page.getByText("$40 per analyst, billed monthly", { exact: true })).toBeVisible();
});

test("demo sign-in clears credentials without making a network submission", async ({ page }) => {
  await open(page, "/login");
  const submissions: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.getByLabel("Sample work email").fill("analyst@example.com");
  await page.getByLabel("Demo password").fill("synthetic-password");
  await page.getByRole("button", { name: /validate demo/i }).click();
  await expect(page.getByRole("status")).toContainText("No authentication was attempted");
  await expect(page.getByLabel("Demo password")).toHaveValue("");
  expect(submissions).toEqual([]);
});

test("content remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4322/");
  await expect(page.getByRole("heading", { name: "Read the world. Stay ahead of it." })).toBeVisible();
  await page.goto("http://127.0.0.1:4322/blog/post-1");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main article")).toContainText(/./);
  await page.goto("http://127.0.0.1:4322/login");
  await expect(page.getByRole("button", { name: /validate demo/i })).toBeDisabled();
  await context.close();
});
