# Verification record

Final result: **38/38 browser tests passed** (39.9 seconds), production build passed, TypeScript passed, and scoped ESLint passed.

[Desktop preview](./preview-desktop.png) ? [Mobile preview](./preview-mobile.png)

## Scope

Kojima adapts the supplied reference into a private-intelligence SaaS template for corporate intelligence and geopolitical risk teams. All original routes remain, plus `/components`.

## Automated coverage

- TypeScript: `pnpm run check`.
- Production build: executed by `pnpm run test:e2e` before preview starts.
- Browser suite: 38 tests in Microsoft Edge (Chromium) on Windows.
- Axe WCAG A/AA checks on sixteen pages in both dark and light modes.
- Horizontal-overflow checks at 320, 390, 768, and 1440 pixels.
- Radar/wave/matrix selection, palette switching, keyboard slider, regional filtering, and SVG export.
- Theme persistence and mobile navigation Escape/focus handling.
- Component dialog, settings snapshot, and restoration.
- Local inquiry preparation/download, billing toggle, and sign-in credential clearing.
- Server-rendered home/article content and disabled sign-in submission with JavaScript unavailable.
- Unknown-route status and recovery links.

Scoped ESLint checks were also run for changed React components. The suite waits for Astro hydration before driving client controls, while separately testing static/no-JavaScript rendering.

## Manual review

Compared the exact reference seed (`932598536`) against desktop and mobile screenshots. Reviewed the charcoal/orange layout, SVG artwork, responsive reflow, and new wordmark. Original SVG compositions preserve the reference's technical design language without bundling the reference application's generator.

The review found and corrected missing slider-thumb names, light-mode orange text contrast, checked-switch thumb contrast, a mobile privacy-page overflow, and Astro/React button composition on the 404 page.

## Boundaries

- Automated axe results are not an accessibility certification. Cross-browser review in Safari/Firefox was not performed.
- Product data, prices, and workflows are illustrative. No authentication, intelligence feeds, payment, or messaging backend is connected.
- The deployment URL remains `https://example.com` in `astro.config.mjs` until an actual domain is chosen.
- No remote deployment was requested or performed.
- No automatic animation is used; reduced-motion support disables scrolling/transitions where relevant.

## Astro 7 upgrade (2026-11-09)

Upgraded astro 5.18.2 → 6.4.8 → 7.4.7 one major at a time, with integrations moved to @astrojs/mdx 8.1.3, @astrojs/react 7.1.4, @astrojs/vercel 11.0.20, and tailwindcss / @tailwindcss/vite 4.3.5. The project now uses pnpm only.

- TypeScript and the production build pass on every step, with no compiler errors or deprecation warnings.
- Browser suite on Linux Chromium: 35/38 on each of 5.x, 6.x and 7.x. The same three tests fail before and after the upgrade: `/signup` dark/light, which overflows 324px against a 320px limit, and "content remains readable without JavaScript", where the locator at `tests/kojima.spec.ts:116` is not found. Both are pre-existing and separate from the upgrade.
- `compressHTML: true` keeps the Astro 6 whitespace behavior. Astro 7 defaults to `"jsx"`, so audit inline-element spacing before switching.
- The Playwright web server passes `--ignore-lock` to `astro preview`. Astro 7 auto-backgrounds `preview` and `dev` when an AI agent runs the CLI, and Playwright would treat that as an early exit.
- Follow-up: the latest eslint-plugin-astro and astro-eslint-parser (3.x) require ESLint 10. The current ESLint 8 toolchain still parses `.astro` files correctly.

## EncomGlobe (2026-11-10)

- `pnpm check`, `pnpm test:unit` (66 vitest tests) and `pnpm build` pass. ESLint is clean for every file added or changed in this work. The four remaining `import/order` errors in `src/content.config.ts`, `src/pages/404.astro`, `src/pages/index.astro` and `tests/kojima.spec.ts` were there before and are untouched.
- `pnpm test:e2e`: 58 passed and 1 skipped, on three consecutive runs on Linux Chromium with SwiftShader WebGL.
  - The skipped test is the `fixme` for hover/select picking.
  - `/globe-demo` runs through the axe (wcag2a/2aa/21aa) and overflow checks in both dark and light, and through the console sweep.
- The globe spec runs as its own Playwright project after the site suite, because software WebGL is CPU-heavy and was starving the timing-sensitive animation-lab test.
- I compared the result by eye against https://www.robscanlon.com/encom-globe/ with the `encom` preset, and found a close match:
  - tile sweep;
  - pin lines and tops;
  - arcs;
  - white/red satellites;
  - far-side fog.
- Boundaries:
  - Hover and click picking is only checked manually, through the event log in the demo playground.
  - Every globe needs its own WebGL context, and browsers limit how many can be open at once (about 16). The demo page uses 8.
