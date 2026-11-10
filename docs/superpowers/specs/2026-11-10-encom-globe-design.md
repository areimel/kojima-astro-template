# EncomGlobe — Three.js Encom globe component + `/globe-demo` page

## Context

The Kojima Astro template (Astro 7, React 19 islands, Tailwind 4, shadcn, Kojima charcoal/orange/ivory theme, corporate-intelligence / geopolitical-risk demo brand) needs a signature 3D element: a faithful modern rebuild of Rob Scanlon's **encom-globe** (MIT, © 2014-2017 Robert Scanlon; used by github.com/arscan/encom-boardroom). The original is pinned to three r66 and uses removed APIs (`Geometry`, `ParticleSystem`, `LinePieces`, `geometry.offsets`, ShaderMaterial `attributes`, tween.js globals, `setTimeout` animation chains), so it's rebuilt from scratch in TypeScript on `three@0.187`, reusing its algorithms, shader logic, timings and option names.

The component must be reusable many times per site with per-instance data (JSON objects/files rather than dozens of props). It must be split into small sub-modules (each file ≲300 lines). A `/globe-demo` styleguide page will showcase it and serve as its test bench.

### Decisions (user)
- **Colors:** Kojima tokens by default (light/dark aware). Original Encom palette is available as a preset.
- **Elements:** hex-tile land with west→east build-in intro, intro lines, pins (line + label + top dot + smoke), markers with animated connecting arcs, satellites and constellations (animated sprite-sheet radar rings), smoke particles.
- **Drones:** dropped (the original has none).
- **Optional additions:** atmosphere fresnel glow (off by default) and a fly-to lat/lng API. Satellites stay static, as in the original. No orbit motion.
- **Scope:** globe plus a light Encom-style HUD frame (corner brackets, title, legend, readout). No boardroom dashboard panels.
- **Interaction:** auto-rotate (the original's `dayLength` orbit), drag to rotate with inertia, and hover/click on pins and markers that shows the label and fires `onSelect`.
- **Process:** 5–10+ commits, DRY, Sonnet + Haiku subagents (≤20) on a TODO list. Parent owns integration and commits.

### My calls (flag if wrong)
- **Rendering:** vanilla three in a framework-agnostic engine class, wrapped by a thin React component. No react-three-fiber: it's smaller, avoids an extra layer per instance, and maps 1:1 to the original.
- **Hex grid:** regenerate rather than ship the original 962 KB `grid.js`. A build script runs `hexasphere.js(radius, 35, .45)`, the same parameters as the original's `bin/buildgrid`, against Natural Earth `land-110m` (public domain, via `world-atlas`). It keeps tiles with land coverage > .1, sized by coverage like the original. Output is `public/globe/hex-grid.json` with `[lat, lng, size, rotation]` per tile (~4k tiles, ~60 KB, ~20 KB gzipped). Runtime draws one `InstancedMesh` (one draw call); the intro is driven by an instanced `lng` attribute in the shader.
- **Labels:** `CSS2DRenderer` DOM labels in the site mono font. They're crisp, theme-styled through CSS tokens and easy to hover. Labels are hidden on the back side by a dot-product test (the original's fog does this). They're collision-thinned like the original's quadtree, using an angular-distance check with no dependency. Pin tops, marker rings and satellites stay canvas sprites, as in the original.
- **Animation:** no tween.js. A tiny time-based `animate(from, to, duration, ease)` helper, with `elasticOut` ported from tween.js easing. All animation runs off the engine clock.
- **Coordinates:** *(changed during implementation)* the original encom-globe `mapPoint` convention (Y up, θ = 180 − lng) is used everywhere — grid script, pins, arcs and flyTo — so ported math stays literal (`engine/utils/geo.ts`).
- **Reduced motion:** no auto-rotate, the intro is skipped (tiles shown settled), smoke is hidden and satellites freeze on one frame. Drag and select still work. The globe reacts to live media-query changes.
- **Fallbacks:** without WebGL (or with JS off), a static styled placeholder shows the HUD frame and a "3D view unavailable" note, and the pin list stays in a visually-hidden `<ul>` for screen readers.
- **Performance:** one WebGL context per instance. Each instance:
  - hydrates with `client:load` and lazy-starts its engine via an `IntersectionObserver`,
  - pauses the loop via `IntersectionObserver` when offscreen and `visibilitychange` when the tab is hidden,
  - sizes with `ResizeObserver` and caps DPR at 2,
  - disposes fully on unmount (geometries, materials, textures, `forceContextLoss`).

  The grid JSON is fetched once through a module-level cached promise shared by all instances.
- **Validation:** JSON data is validated with **zod** (already a dependency). Invalid entries are dropped with one `console.warn` listing them, in dev only.
- **Unit tests:** add **vitest** for the pure engine utils (geo, arc path, schema, palette, collision). Playwright covers the page.

## Architecture

```
src/components/encom-globe/
  EncomGlobe.tsx            React parent: props → engine; observers; HUD + fallback (~200)
  EncomGlobeFrame.tsx       HUD frame: corner brackets, title, legend, readout (~120)
  use-globe-engine.ts       hook: create/dispose engine, sync config/data/palette (~150)
  schema.ts                 zod schemas + exported TS types (GlobeConfig, GlobeData, Pin…) (~150)
  presets.ts                palette presets (kojima | encom | mono) + default config (~80)
  index.ts                  public exports
  engine/
    globe-engine.ts         scene, renderer, CSS2D renderer, clock/loop, layer registry, resize, pause, dispose, events (~280)
    camera-rig.ts           orbit-angle camera (dayLength, viewAngle, scale) + drag inertia + flyTo (~180)
    picking.ts              raycast pins/markers → hover/select events (~100)
    types.ts                GlobeLayer interface, EngineContext, Palette (~80)
    layers/
      hex-grid.ts           InstancedMesh tiles, per-tile shade, intro shader, fog (~200)
      intro-lines.ts        60 spinning intro polylines (~100)
      pins.ts               pin lines/tops/labels, elastic rise, collision thinning, maxPins FIFO (~250)
      smoke.ts              Points + shader, ring buffer setFire/extinguish (~150)
      markers.ts            marker rings + labels + arcs (cos-bent path, drawRange animation), maxMarkers (~250)
      satellites.ts         satellite planes, billboarding, constellations (~180)
      satellite-texture.ts  50-frame sprite-sheet canvas + TextureAnimator equivalent (~150)
      atmosphere.ts         optional fresnel BackSide additive shell (~70)
    shaders/                hex-grid.glsl.ts, smoke.glsl.ts, atmosphere.glsl.ts (template strings)
    utils/
      geo.ts                latLngToVector3, slerp/arc path, angular distance (~100)
      animate.ts            time-based tweens + easings (elasticOut, linear) (~80)
      canvas.ts             DPR-aware canvas → CanvasTexture, circle/ring drawers (~100)
      dispose.ts            recursive dispose of Object3D trees (~40)
      palette.ts            resolve palette from CSS vars / preset, hue-shade generation (~120)
src/hooks/use-reduced-motion.ts   matchMedia hook using REDUCED_MOTION_QUERY from src/lib/animations/config.ts
src/hooks/use-is-dark.ts          MutationObserver on <html class> (extracted from theme-toggle.tsx, which is refactored to use it)
src/components/kojima/panel-heading.tsx  extracted PanelHeading + `meta` class (now used 3×: component-showcase, animation-lab, globe-demo)
scripts/build-globe-grid.mjs      Node grid generator (devDeps: hexasphere.js, world-atlas, topojson-client, d3-geo)
public/globe/hex-grid.json        generated, committed
src/data/globe/*.json             demo datasets (cities, routes, satellites, risk-hotspots)
src/components/kojima/globe-demo/ demo page sections (gallery, playground, data reference, event log)
src/pages/globe-demo.astro
docs/globe.md
```

**Layer contract** (`engine/types.ts`). Every element implements:
```ts
interface GlobeLayer {
  readonly object: THREE.Object3D;
  update(ctx: FrameContext): void;    // { time, delta, camera, reducedMotion }
  setPalette(p: Palette): void;
  dispose(): void;
}
```
Engine imperative API (also exposed through a React `ref`): `addPin`, `removePin`, `addMarker`, `addSatellite`, `addConstellation`, `setData`, `setPalette`, `setConfig`, `flyTo(lat, lng, {duration})`, `pause`, `resume`, `dispose`, plus `on('select' | 'hover', cb)`.

**React API:**
```tsx
<EncomGlobe
  config={/* GlobeConfig object, imported .json, or omitted */}
  data={/* GlobeData object or imported .json */}
  dataUrl="/globe/feeds/x.json"   // optional: fetched at runtime (large data)
  palette="kojima" | "encom" | "mono" | Partial<Palette>
  title="Threat surface" legend showFrame
  onSelect={(item) => …} ref={globeRef} className="aspect-square" />
```
- `GlobeConfig` carries the original option names and defaults: `dayLength` 28000, `scale` 1, `viewAngle` 0, `introLinesDuration` 2000, `introLinesCount` 60, `introLinesAltitude` 1.1, `maxPins` 500, `maxMarkers` 4, plus `autoRotate`, `draggable`, `atmosphere`, `layers: {grid, introLines, pins, markers, satellites, smoke, atmosphere}`.
- `GlobeData` is `{ pins: [{lat,lng,label?,color?,altitude?,id?}], markers: [{lat,lng,label,color?,connectTo?: id|'previous'}], satellites: [...], constellations: [{satellites:[{lat,lng,altitude}], ...opts}] }`.
- **Merge order:** preset defaults ← `config` ← explicit props. The original's falsy-option bug (`if (opts[i])`) is fixed.

**Kojima palette mapping** (`palette.ts`, read live from CSS vars and re-resolved on the dark toggle):

| Element | Dark | Light |
|---|---|---|
| Tiles | Hue-shaded set around `--primary` (the original's `hueSet` + random shade/3) | `--kojima-accent-ink` |
| Pins / labels | `--foreground` | `--foreground` |
| Markers / arcs | `--primary` | `--primary` |
| Satellites | `--chart-3` wave, `--primary` shield | `--chart-3` wave, `--primary` shield |
| Intro lines | `--muted-foreground` | `--muted-foreground` |
| Fog / clear | `--background` (transparent canvas) | `--background` (transparent canvas) |

The **encom** preset uses the original defaults verbatim: base `#ffcc00`, pins `#00eeee` / `#8FD8D8`, satellites `#ff0000`, black background.

## Execution — TODO list and subagent waves

The parent (me) owns the contracts, integration, verification and every commit. Agents edit only their assigned files.

**Wave 0 — parent (sequential):**
1. Commit the design and plan (`docs/superpowers/specs/2026-11-10-encom-globe-design.md`) and update `TODO.md`. → **commit 1**
2. Install `three@^0.187`, `@types/three`, and devDeps `vitest`, `hexasphere.js`, `world-atlas`, `topojson-client`, `d3-geo`, `@types/d3-geo`, `@types/topojson-client`. Add a `test:unit` script.
3. Write the shared contracts: `engine/types.ts`, `schema.ts`, `utils/geo.ts`, `utils/animate.ts`, `utils/dispose.ts`, `utils/canvas.ts`. Add unit tests for geo and schema. → **commit 2** (deps + contracts)

**Wave 1 — parallel. Each agent gets the contracts, the relevant encom-globe source file to port (via `gh api repos/arscan/encom-globe/contents/src/<File>.js`), and its file list:**

| Agent | Model | Tasks |
|---|---|---|
| S1 | Sonnet | `scripts/build-globe-grid.mjs` → `public/globe/hex-grid.json`; `layers/hex-grid.ts` + shader (port of `createParticles` + intro shader + fog); `layers/intro-lines.ts` |
| S2 | Sonnet | `engine/globe-engine.ts`, `camera-rig.ts` (port of the tick camera math, plus drag inertia and flyTo), `picking.ts`, `layers/atmosphere.ts` |
| S3 | Sonnet | `layers/pins.ts` (port of `Pin.js` + `Globe.addPin` collision), `layers/smoke.ts` (port of `SmokeProvider.js`) |
| S4 | Sonnet | `layers/markers.ts` (port of `Marker.js`; time-based drawRange instead of setTimeout chains; fix the remove bug) |
| S5 | Sonnet | `layers/satellites.ts` + `satellite-texture.ts` (port of `Satellite.js` + `TextureAnimator.js`) |
| H1 | Haiku | `src/hooks/use-reduced-motion.ts`, `src/hooks/use-is-dark.ts`; refactor `theme-toggle.tsx` to use `use-is-dark` |
| H2 | Haiku | Extract `panel-heading.tsx` (PanelHeading + `meta`); refactor `component-showcase.tsx` and `animation-lab.tsx` to use it |
| H3 | Haiku | Demo datasets in `src/data/globe/`: intelligence offices (pins), risk hotspots, connected marker routes, satellites/constellations, a ~300-pin "feed" in `public/globe/feeds/` for `dataUrl` |

Parent commits as the work lands:
- **commit 3** grid script + data + hex-grid/intro layers
- **commit 4** engine core + camera + picking + atmosphere
- **commit 5** pins + smoke
- **commit 6** markers + arcs
- **commit 7** satellites
- **commit 8** hooks + PanelHeading refactor + datasets

**Wave 2 (after Wave 1 is integrated and running):**

| Agent | Model | Tasks |
|---|---|---|
| S6 | Sonnet | `EncomGlobe.tsx`, `use-globe-engine.ts`, `presets.ts`, `utils/palette.ts`, `EncomGlobeFrame.tsx`, `index.ts`, WebGL/no-JS fallback, sr-only pin list |

→ **commit 9**

| Agent | Model | Tasks |
|---|---|---|
| S7 | Sonnet | `/globe-demo` page and `src/components/kojima/globe-demo/*`, each section ≲300 lines. Sections: hero (full Encom layers, Kojima palette), preset gallery (kojima / encom / mono / pins-only / satellites-only, which also proves multi-instance), playground (shadcn Switch per layer, Slider dayLength/scale/viewAngle, palette Select, add-pin form, dataset Select, flyTo buttons, atmosphere toggle), live event log (`role="status"`), JSON data-format reference with copyable examples. Add a footer link next to "UI kit". |

→ **commit 10**

**Wave 3:**

| Agent | Model | Tasks |
|---|---|---|
| S8 | Sonnet | Playwright: add `/globe-demo` to the `routes` in `tests/kojima.spec.ts` (axe, overflow, one h1, dark/light, reduced motion), add it to the console sweep in `animations.spec.ts`, and add a new `tests/globe.spec.ts` (canvas renders non-blank pixels, `client:visible` mounts, hover shows label, click logs select, reduced motion has no rotation, unmount disposes without errors, toggling layers). Vitest for palette, collision and arc path. |
| H4 | Haiku | `docs/globe.md` in the structure of `docs/animations.md` (quick reference, props/JSON schema, presets, layers, a11y and performance, provenance and MIT credit, file map); update `docs/verification.md` and `TODO.md` |
| R1 | Sonnet | `feature-dev:code-reviewer` over the full diff: DRY, file sizes, dispose leaks, perf |

→ **commit 11** tests, **commit 12** docs plus review fixes.

## Builder-check resolutions (folded in)

**Hydration and loading**
- Islands mount with `client:load`, not `client:visible`, because the existing `open()` test helper waits for every island to hydrate. `EncomGlobe` lazy-starts its engine with its own `IntersectionObserver`.
- `three` and `CSS2DRenderer` are loaded through `await import()` inside the effect, so they stay out of SSR and the hydration chunk.
- The grid URL is `import.meta.env.BASE_URL + 'globe/hex-grid.json'`.

**Wave 0 contract additions**
- `engine/types.ts` is frozen before Wave 1. It adds:
  - `DEFAULT_PALETTE` (the encom values), so Wave 1 layers aren't blocked on `palette.ts`;
  - `FrameContext`;
  - `EngineContext` (`scene`, `camera`, `labelRoot`, `addLabel`, `config`, `clock`);
  - an optional `pickables(): Object3D[]` plus `resolvePick(obj): GlobeItem` on `GlobeLayer`, so picking (S2) stays independent of pins and markers (S3/S4).
- S2 lands a minimal engine stub first.
- A throwaway `src/pages/_globe-sandbox.astro` (underscore, so it's not routed) is the integration harness for commits 3–7. It's deleted once `/globe-demo` exists.

**Hex grid generation**
- Compute lat/lng from hexasphere `centerPoint` xyz with `geo.ts`. Hexasphere's own `getLatLon` has an inverted latitude and a +90° longitude hack.
- The original `mapPoint` uses `180 - lng`. Ported code converts to our convention.
- Coverage uses `d3.geoContains` on the center plus boundary points.
- Size jitter comes from a seeded PRNG, so the committed JSON is reproducible.
- Each tile stores `[lat, lng, size, angle, sides]`. The angle is `boundary[0]` in the local east/north frame. There are two InstancedMeshes, one for hexes and one for the 12 pentagons.
- Fallback if it looks off: one merged BufferGeometry from quantized boundary offsets.
- Unit tests check that known cities land on land, and that Antarctica and the antimeridian don't flood the sphere.

**Rendering**
- With a transparent canvas, fog fades to the `--background` uniform.
- The canvas is `aria-hidden`. The container uses `overflow:hidden; contain:paint` so CSS2D labels can't cause horizontal overflow.

**Tests**
- `playwright.config.ts` gets `launchOptions.args: ['--enable-unsafe-swiftshader']`.
- The console sweep allowlists `/GL Driver Message|GPU stall|swiftshader/i`.
- The non-blank check uses element-screenshot pixels, not `readPixels`.
- Tests force DPR 1.
- There is a remount test for WebGL context loss.
- `vitest.config.ts` with `include: ['src/**/*.test.ts']` and the `@` alias, so it doesn't pick up the Playwright specs.

**Rules for parallel agents**
- Only the parent edits `package.json` and the lockfile, and installs everything in Wave 0.
- Agents run `eslint <own files>` only, never `pnpm lint` (it uses `--fix` across the repo).
- The parent owns `shaders/` and `tests/` shared files.

**Smaller decisions**
- H2 extracts both `PanelHeading` (currently only in `component-showcase.tsx`) and the `meta` string (component-showcase + animation-lab); globe-demo makes three uses.
- Demo link goes in the footer only, next to "UI kit", not the main nav.

## Reuse
- `REDUCED_MOTION_QUERY`: `src/lib/animations/config.ts`
- `useIsMobile` matchMedia pattern: `src/hooks/use-mobile.ts`
- MutationObserver dark detection: `src/components/theme-toggle.tsx`
- Kojima CSS classes `.technical-label`, `.technical-panel`, `.kicker`, `.registration-mark`: `src/styles/kojima.css`
- `DashedLine` (`src/components/dashed-line.tsx`) and `Background` (`src/components/background.tsx`) for the HUD frame and page
- Showcase layout conventions: `src/components/kojima/component-showcase.tsx`
- shadcn `ui/*` controls
- Hydration: keep the SSR markup identical, create the canvas in an effect, and avoid `data-animation` text presets on React-managed text (`src/lib/animations/hydration.ts`)

## Verification
1. `pnpm check` (tsc), `pnpm lint` and `pnpm test:unit` (vitest) all pass.
2. `pnpm build && pnpm preview`, then open `/globe-demo` with Playwright MCP:
   - screenshot dark and light,
   - compare side by side against https://www.robscanlon.com/encom-boardroom/ with the encom preset,
   - confirm the intro sweep, pin rise and labels, smoke drift, arc drawing, satellite rings, drag inertia, hover/click, flyTo, layer toggles, multi-instance, and no console errors,
   - check reduced-motion emulation.
3. `pnpm test:e2e` passes: the existing suites plus the new globe spec with axe at zero violations.
4. Check that every new file is ≤ ~300–400 lines (`wc -l`) and that `git log` shows ≥10 descriptive commits.

## Implementation notes (2026-11-10)

- Coordinates use the original `mapPoint` convention instead of three-globe's (see above).
- Islands use `client:load` and lazy-start via IntersectionObserver; the sandbox page was removed once `/globe-demo` existed.
- The original has no drones and no atmosphere; drones were dropped, atmosphere is optional (off by default).
- Hover/select picking has no e2e coverage yet (`test.fixme` in `tests/globe.spec.ts`).
