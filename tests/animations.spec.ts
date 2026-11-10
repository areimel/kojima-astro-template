import { expect, test, type Locator, type Page } from "@playwright/test";

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };
const LAB = 'section[aria-label="Animation lab"]';
const LOOPING = ["blink", "pulse", "flicker", "glitch-hover"];

async function open(page: Page, path: string, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

const card = (page: Page, name: string) => page.locator(`${LAB} [data-animation="${name}"]`);
const pendingCount = (page: Page) => page.locator("[data-anim-pending]").count();

/** Wait until nothing in view is pending (off-screen scroll targets legitimately wait), then let one-shots finish. */
async function settle(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-anim-pending]")].every((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom <= 0 || r.top >= innerHeight;
    }),
  );
  await page.waitForTimeout(1800); // longest one-shot preset (1s) + delays
}

const reveal = (loc: Locator) => loc.evaluate((n) => n.scrollIntoView({ block: "center" }));

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      // Wait for rendered frames, not wall time: IntersectionObserver delivers after a frame,
      // and under CPU load (e.g. software WebGL in parallel tests) 60ms may elapse first.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/** Records every class mutation so transient classes (e.g. anim-glitch) can be detected. */
function watchClasses(page: Page) {
  return page.evaluate(() => {
    const seen = new Set<string>();
    (window as unknown as { __classes: Set<string> }).__classes = seen;
    new MutationObserver((ms) => {
      for (const m of ms) (m.target as Element).classList.forEach((c) => seen.add(c));
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true });
  });
}
const seenClasses = (page: Page) => page.evaluate(() => [...(window as unknown as { __classes: Set<string> }).__classes]);

async function inject(page: Page, attrs: string, text = "Injected transmission 42") {
  return page.evaluate(
    ({ attrs, text }) => {
      const p = document.createElement("p");
      p.id = "injected";
      p.textContent = text;
      for (const part of attrs.split(" ")) {
        const [k, v] = part.split("=");
        p.setAttribute(k, v);
      }
      document.querySelector("main")!.appendChild(p);
      p.scrollIntoView();
    },
    { attrs, text },
  );
}

const exactText = async (page: Page, id: string, text: string) => expect(page.locator(id)).toHaveText(text);

test.describe("animation lab at desktop", () => {
  test("every sample is processed, settles visible, and keeps its text", async ({ page, request }) => {
    await open(page, "/components");
    const html = (await (await request.get("/components")).text()).replaceAll("<!-- -->", "");
    const samples = page.locator(`${LAB} [data-animation]`);
    const total = await samples.count();
    expect(total).toBeGreaterThanOrEqual(14);

    for (let i = 0; i < total; i++) {
      await reveal(samples.nth(i));
      await expect(samples.nth(i)).toHaveAttribute("data-anim-state", /.+/);
    }
    await scrollThrough(page); // also reaches page-bottom content outside the lab
    await settle(page);
    // Text presets wait for React hydration; under CPU load that can finish after the scroll
    // pass went by, leaving them armed until seen again. Bring stragglers back into view (DOM
    // scroll: they are pre-hidden, which Playwright's visibility-gated scrolling would wait on)
    // so every target must still animate once it is seen.
    // (Re-query each pass: positional locators go stale as targets stop being pending.)
    for (let pass = 0; pass < total && (await pendingCount(page)) > 0; pass++) {
      await page.locator("[data-anim-pending]").first().evaluate((node) => node.scrollIntoView({ block: "center" }));
      await settle(page);
    }
    expect(await pendingCount(page)).toBe(0);

    for (let i = 0; i < total; i++) {
      const el = samples.nth(i);
      const name = (await el.getAttribute("data-animation"))!;
      if (LOOPING.includes(name)) continue;
      const parts = await el.evaluate((node) => {
        const targets = node.querySelectorAll("li").length ? [...node.querySelectorAll("li")] : [node];
        return targets.map((t) => ({ opacity: getComputedStyle(t).opacity, text: (t.textContent ?? "").trim() }));
      });
      for (const part of parts) {
        expect(part.opacity, name).toBe("1");
        // Text must equal the server-rendered original (no glyph residue).
        expect(html.includes(part.text.replace(/>/g, "&gt;")), `${name}: ${part.text}`).toBe(true);
      }
    }
  });

  test("decode replay restores the exact text", async ({ page }) => {
    await open(page, "/components");
    const sample = card(page, "decode");
    await reveal(sample);
    await page.getByRole("button", { name: "Replay decode" }).click();
    await expect(sample).toHaveAttribute("data-anim-state", /armed|done/);
    await settle(page);
    await expect(card(page, "decode")).toHaveText("Agent Kojima online");
    await expect(card(page, "decode")).not.toHaveAttribute("aria-label", /.+/);
  });
});

test.describe("mobile resolution", () => {
  test("glitch-in falls back to fade-up and loop presets are static", async ({ page }) => {
    await page.addInitScript(() => {
      const classes = new Set<string>();
      (window as unknown as { __classes: Set<string> }).__classes = classes;
      document.addEventListener("DOMContentLoaded", () =>
        new MutationObserver((ms) => ms.forEach((m) => (m.target as Element).classList.forEach((c) => classes.add(c)))).observe(document.documentElement, {
          attributes: true, attributeFilter: ["class"], subtree: true,
        }),
      );
    });
    await open(page, "/components", MOBILE);
    await reveal(card(page, "glitch-in"));
    await expect(card(page, "glitch-in")).toHaveAttribute("data-anim-state", "done");
    await settle(page);
    expect(await seenClasses(page)).not.toContain("anim-glitch");
    await expect(card(page, "glitch-in")).toHaveCSS("opacity", "1");

    const blink = card(page, "blink");
    await reveal(blink);
    await expect(blink).toHaveAttribute("data-anim-state", "none");
    expect(await blink.evaluate((n) => (n as HTMLElement).style.opacity)).toBe("");
  });

  test("data-mobile-animation=none override and desktop playback", async ({ page }) => {
    await open(page, "/components", MOBILE);
    await inject(page, "data-animation=decode data-mobile-animation=none");
    await expect(page.locator("#injected")).toHaveAttribute("data-anim-state", "none");
    await exactText(page, "#injected", "Injected transmission 42");

    await open(page, "/components");
    await watchClasses(page);
    await inject(page, "data-animation=decode data-mobile-animation=none");
    await expect(page.locator("#injected")).toHaveAttribute("data-anim-state", /armed|done/);
    await settle(page);
    await exactText(page, "#injected", "Injected transmission 42");
  });

  test("desktop-specific override plays on desktop and is off on mobile", async ({ page }) => {
    const attrs = "data-desktop-animation=fade-up data-mobile-animation=none";
    await open(page, "/components");
    await inject(page, attrs);
    await expect(page.locator("#injected")).toHaveAttribute("data-anim-state", /armed|done/);
    await settle(page);
    await expect(page.locator("#injected")).toHaveCSS("opacity", "1");

    await open(page, "/components", MOBILE);
    await inject(page, attrs);
    await expect(page.locator("#injected")).toHaveAttribute("data-anim-state", "none");
  });
});

test.describe("reduced motion", () => {
  test("engine stays off and content is final immediately", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/");
    await expect(page.locator("html")).not.toHaveClass(/anim-ready/);
    expect(await pendingCount(page)).toBe(0);
    const h1 = page.locator("main h1");
    const first = await h1.textContent();
    await expect(h1).toHaveCSS("opacity", "1");
    await page.waitForTimeout(500);
    expect(await h1.textContent()).toBe(first);
    expect(await page.locator("[data-anim-state]").count()).toBe(0);
  });
});

test.describe("no javascript", () => {
  test.use({ javaScriptEnabled: false });
  for (const path of ["/", "/pricing"]) {
    test(`${path} content is visible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main h1")).toHaveCSS("opacity", "1");
      for (const el of await page.locator("main [data-animation]").all()) {
        await expect(el).toHaveCSS("opacity", "1");
        await expect(el).toHaveCSS("visibility", "visible");
      }
    });
  }
});

test("no console errors or warnings across key pages", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && problems.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  for (const path of ["/", "/about", "/pricing", "/components", "/globe-demo"]) {
    await open(page, path);
    await scrollThrough(page);
    await page.waitForTimeout(1200);
  }
  expect(problems).toEqual([]);
});

test("glitch-hover leaves no lingering transform", async ({ page }) => {
  await open(page, "/");
  const cta = page.locator("main a[href='/contact']", { hasText: "Request access" }).first();
  await cta.scrollIntoViewIfNeeded();
  const target = page.locator('main [data-animation="glitch-hover"]').first();
  await target.hover();
  await page.waitForTimeout(500);
  await expect.poll(() => target.evaluate((n) => getComputedStyle(n).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});

test("breakpoint changes leave no errors or pending targets", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && errors.push(m.text()));
  await open(page, "/components");
  await scrollThrough(page);
  for (const viewport of [MOBILE, DESKTOP]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300);
    await scrollThrough(page);
    await settle(page);
    expect(await pendingCount(page)).toBe(0);
  }
  expect(errors).toEqual([]);
});
