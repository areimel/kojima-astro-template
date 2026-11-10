# Kojima theme rework

## Confirmed direction

- Close visual adaptation of https://kojima-san.vercel.app/#s=932598536.
- Kojima demo brand for corporate intelligence and geopolitical risk teams.
- Keep all pages; replace content to match the new product concept.
- Graphic-led marketing homepage with simple interactive instrument controls.
- Charcoal default, orange poster, optional ivory/light mode.
- Accessible defaults, responsive layouts, reduced motion; reference reuse authorized.
- Reusable opt-in theme over existing Astro, React, Tailwind, and shadcn components.
- Six parallel agents with distinct workstreams; parent-owned integration and commits.

## TODO

- [x] Inspect template, reference source, and exact-seed screenshot.
- [x] Resolve fidelity, content, audience, behavior, branding, and accessibility preferences.
- [x] Implement semantic shadcn tokens and reusable theme styling.
- [x] Rework shared navigation, footer, metadata, layouts, and favicon.
- [x] Create reusable instrument graphics and social-preview assets.
- [x] Build themed homepage with working controls and SVG export.
- [x] Add an interactive component showcase using existing shadcn primitives.
- [x] Rewrite retained secondary pages and journal entries.
- [x] Check desktop/mobile presentation, keyboard controls, and contrast.
- [x] Add repeatable production browser and TypeScript verification.
- [x] Document theme adoption, customization, provenance, and demo boundaries.
- [x] Confirm final test results and ten-commit handoff.

## Commit timeline

1. `254cfd1` � Plan and TODO list.
2. `78a0711` � Opt-in Kojima tokens and component skin.
3. `5e0be53` � Deterministic instrument graphics.
4. `e725623` � Intelligence branding and accessible shared shell.
5. `40fcc8e` � Interactive component laboratory.
6. `82821ca` � Editorial pages and intelligence content.
7. `9ac514b` � Pricing and local access-flow demos.
8. `5838556` � Landing page and instrument controls.
9. `31b5964` � Route integration, assets, and accessibility fixes.
10. Final verification, test tooling, and documentation.

# Animation system (Anime.js)

## Confirmed direction

- Attribute-driven presets: `data-animation`, `data-desktop-animation`, `data-mobile-animation` (+ `data-anim-*` tuning).
- Glitchy, techy spy-agency presets: text decode, glitch reveals, scan/wipe reveals, ambient + hover loops.
- Moderate application; scroll-once by default; mobile inherits desktop unless overridden (`none` disables).
- Reduced motion and no-JS keep all content visible; hydration-safe with React islands.

## TODO

- [x] Install animejs v4 and define shared contracts (types, config, registry).
- [x] Engine, attribute parsing, `anim()` helper, head wiring, base CSS.
- [x] Text presets (decode, typewriter).
- [x] Glitch presets (glitch-in, slice, flicker-in).
- [x] Reveal presets (fade-up, scan-wipe, redact, boot-stagger).
- [x] Ambient/hover presets (blink, pulse, flicker, counter, glitch-hover).
- [x] Animation lab on /components.
- [x] Apply to homepage.
- [x] Apply to secondary pages, navbar, footer.
- [x] Documentation (docs/animations.md).
- [x] Playwright animation tests + full verification.
- [x] Code review fixes.

## Animation commit timeline

1. Contracts, config tokens, registry, animejs v4.
2. Attribute-driven engine, `anim()` helper, pre-hide CSS.
3. Text decode + glitch presets.
4. Reveal + ambient presets.
5. Fix: anime v4 `steps()` easing functions (found via browser smoke test).
6. Docs (`docs/animations.md`).
7. Animation lab on /components.
8. Homepage animations.
9. Secondary pages + shell; axe audits settled state.
10. Animation e2e suite; fix island hydration race (React #418).
11. Review fixes: shared lifecycle helper, detached-entry cleanup, `data-anim-hide` marker, breakpoints module.
