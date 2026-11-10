# EncomGlobe

A 3D globe for the Kojima template, built on three.js (r187). It draws a hex-tile Earth, pins, marker arcs, satellites and an Encom-style HUD frame, with Kojima theme tokens by default. Pass it JSON data and it draws the rest: pins, markers, satellites and constellations.

It is a tribute to the boardroom globe in *Tron: Legacy*. It is not affiliated with Disney or Tron.

## Overview

- **Credit.** Based on Rob Scanlon's [encom-globe](https://github.com/arscan/encom-globe), MIT, © 2014–2017 Robert Scanlon. The code was rebuilt from scratch in TypeScript for three r187. The original's algorithms, timings and option names are kept; its three r66 APIs are not used.
- **Land data.** Natural Earth `land-110m` (public domain), via `world-atlas`. The hex grid is generated from it at build time (see [Extending](#extending)).
- **Scope.** The globe plus a light HUD: corner brackets, title, optional legend and a live readout. There are no dashboard panels.
- **Not included.** Drones, and orbital motion for satellites (they stay fixed, as in the original).

## Quick reference

```astro
---
import { EncomGlobe } from "@/components/encom-globe";
import offices from "@/data/globe/offices.json";
import hotspots from "@/data/globe/hotspots.json";
---

<EncomGlobe
  client:load
  title="Threat surface"
  subtitle="Live"
  legend
  data={{ pins: [...offices.pins, ...hotspots.pins] }}
/>
```

Callbacks (`onSelect`, `onHover`) and `ref` need React. Astro props must be serializable, so from `.astro` pass only data and config, or wrap the globe in a small React component.

### Props

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `config` | `GlobeConfigInput` | `{}` | Partial config. Merged over the preset. See [JSON data and config](#json-data-and-config). |
| `preset` | `"default" \| "boardroom" \| "ambient"` | `"default"` | Config preset applied under `config`. |
| `autoRotate` | `boolean` | config | Shorthand for `config.autoRotate`. |
| `atmosphere` | `boolean` | config | Shorthand for `config.layers.atmosphere`. |
| `layers` | `Partial<GlobeLayers>` | all on | Layer toggles. Merged over `config.layers`. |
| `data` | `GlobeDataInput` | none | Inline pins, markers, satellites and constellations. |
| `dataUrl` | `string` | none | JSON fetched at runtime and concatenated after `data`. |
| `palette` | `"kojima" \| "encom" \| "mono" \| Partial<Palette>` | `"kojima"` | Colour set. See [Palettes](#palettes). |
| `title` / `subtitle` | `string` | none | HUD meta strip. |
| `frame` | `boolean` | `true` | Show the HUD frame. |
| `legend` | `boolean` | `false` | Show the legend with item counts (in the frame). |
| `onSelect` | `(item: GlobeItem \| null) => void` | none | Fires when a pin, marker or satellite is clicked. |
| `onHover` | `(item: GlobeItem \| null) => void` | none | Fires on hover; `null` when the pointer leaves an item. |
| `className` | `string` | none | Added to the outer `figure`, which is always `aspect-square w-full`. |
| `aria-label` | `string` | `title` or "Interactive globe" | Accessible name of the figure. |
| `ref` | `Ref<EncomGlobeHandle>` | none | Imperative handle (below). |

Merge order: preset defaults, then `config`, then explicit props (`autoRotate`, `atmosphere`, `layers`). Later wins; `undefined` values are skipped, `false` and `0` are kept.

### Handle (`ref`)

| Method | Returns | Notes |
| --- | --- | --- |
| `flyTo(lat, lng, { duration? })` | `void` | Eases the camera to a point. Default 1500 ms. Instant under reduced motion. |
| `addPin(pin)` | `string \| undefined` | Validates, adds, returns the id. `undefined` if invalid or not ready. |
| `addMarker(marker)` | `string \| undefined` | As above. |
| `addSatellite(satellite)` | `string \| undefined` | As above. |
| `addConstellation(constellation)` | `string \| undefined` | As above. |
| `removePin(id)` | `void` | Removes a pin by id. |
| `pause()` / `resume()` | `void` | Stops or restarts the render loop and auto-rotate. |
| `getController()` | `GlobeController \| null` | Escape hatch to the engine controller. Null until ready. |

Runtime additions without an `id` get `pins-added-1`, `markers-added-2` and so on. Data ids are index-based (see below).

## JSON data and config

Every field is validated with zod. Data entries that fail validation are dropped. In development, one `console.warn` lists them with their collection and index. Config is different: an out-of-range config value throws during render rather than being dropped, so validate config in your own code if it comes from outside.

### Config (`GlobeConfig`)

| Field | Type / range | Default | Effect |
| --- | --- | --- | --- |
| `dayLength` | number > 0 | `28000` | Milliseconds per full auto-rotate orbit (original default). |
| `scale` | 0 < n ≤ 4 | `1` | Zoom. Camera distance is `1700 / scale`. |
| `viewAngle` | −1.2 to 1.2 (radians) | `0` | Camera elevation. The boardroom preset uses `0.1`. |
| `startLng` | −180 to 180 | original start | Initial camera longitude. |
| `intro` | boolean | `true` | Play the intro sequence on first data load. |
| `introLinesDuration` | ms ≥ 0 | `2000` | Length of the intro sweep and intro lines. |
| `introLinesCount` | integer 0–200 | `60` | Number of intro line arcs. |
| `introLinesAltitude` | 1–2 | `1.1` | Height of intro lines, in globe radii. |
| `maxPins` | integer ≥ 1 | `500` | Oldest pins are evicted (FIFO) above this. |
| `maxMarkers` | integer ≥ 1 | `4` | Oldest markers are evicted (FIFO) above this. |
| `autoRotate` | boolean | `true` | Orbit the camera. Off under reduced motion. |
| `draggable` | boolean | `true` | Drag to rotate, with inertia. |
| `gridUrl` | string | `/globe/hex-grid.json` | Grid file. The default is built from `BASE_URL`. |
| `layers` | `GlobeLayers` | see below | Layer toggles. |

Layer toggles (`layers`):

| Key | Default | Turns off |
| --- | --- | --- |
| `grid` | `true` | Hex-tile land. |
| `introLines` | `true` | Spinning intro lines. |
| `pins` | `true` | Pins, and their smoke (smoke needs pins). |
| `markers` | `true` | Marker rings, labels and arcs. |
| `satellites` | `true` | Satellites and constellations. |
| `smoke` | `true` | Smoke plumes at labelled pins. |
| `atmosphere` | `false` | Off by default. Fresnel glow shell. |

### Pins

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | no | Defaults to `pins-<index>` in the combined input. |
| `lat` / `lng` | number | yes | −90..90, −180..180. |
| `label` | string | no | Labelled pins get a DOM label, a top dot and smoke. |
| `color` | CSS colour | no | Line, top dot and label colour. |
| `altitude` | 1–2 | no | Height in globe radii. Default `1.2` labelled, about `1.1`–`1.15` unlabelled. |
| `meta` | object | no | Free-form. Returned with the item in events. |

### Markers

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | no | Defaults to `markers-<index>`. |
| `lat` / `lng` | number | yes | As pins. |
| `label` | string | no | Default `""`. Shown uppercase. |
| `color` | CSS colour | no | Ring and arc colour. Defaults to the palette marker colour. |
| `connectTo` | id or `"previous"` | no | Draws an animated arc from this marker to the target. Unknown targets are ignored. |
| `meta` | object | no | As pins. |

### Satellites and constellations

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `label`, `meta` | as pins | Optional. |
| `lat` / `lng` | number | Required. |
| `altitude` | 1–3 | Default `1.3`. |
| `numWaves` | integer 1–16 | Radar rings in the sprite. |
| `waveColor`, `coreColor`, `shieldColor` | CSS colour | Default from the palette. |
| `size` | 0 < n ≤ 4 | Sprite scale. |

A constellation is a group of satellites drawn with shared style:

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `label` | string | Optional. |
| `numWaves`, `waveColor`, `coreColor`, `shieldColor`, `size` | as satellites | Shared by every member. |
| `satellites` | `{ lat, lng, altitude? }[]` | At least one. Members have no `id` or `label`. |

### Example JSON

`config`:

```json
{
  "viewAngle": 0.1,
  "dayLength": 36000,
  "maxPins": 300,
  "layers": { "atmosphere": true, "smoke": false }
}
```

`data`:

```json
{
  "pins": [
    { "id": "office-london", "lat": 51.51, "lng": -0.13, "label": "LONDON", "meta": { "analysts": 64 } },
    { "lat": 26.57, "lng": 56.25, "label": "STRAIT OF HORMUZ", "color": "#ff4d00", "altitude": 1.3 }
  ],
  "markers": [
    { "id": "vancouver", "lat": 49.28, "lng": -123.12, "label": "VANCOUVER" },
    { "id": "tokyo", "lat": 35.68, "lng": 139.69, "label": "TOKYO", "connectTo": "previous" }
  ],
  "satellites": [
    { "id": "kj-sat-01", "label": "KJ-SAT 01", "lat": 52.1, "lng": -38.4, "altitude": 1.34, "numWaves": 4 }
  ],
  "constellations": [
    {
      "id": "kj-relay",
      "label": "KJ-RELAY",
      "satellites": [
        { "lat": 27.5, "lng": -150, "altitude": 1.35 },
        { "lat": 28.5, "lng": -78, "altitude": 1.35 }
      ]
    }
  ]
}
```

### Large data: `dataUrl`

For hundreds of pins, keep the JSON out of the page bundle and fetch it at runtime:

```tsx
<EncomGlobe dataUrl="/globe/feeds/signal-feed.json" data={{ pins: [home] }} />
```

The URL is passed to `fetch` as given. If the site has a base path, prefix it with `import.meta.env.BASE_URL`. `dataUrl` is concatenated after `data`. A failed fetch logs a warning and leaves the globe with the inline data. The repo ships a 300-pin sample at `public/globe/feeds/signal-feed.json`.

Changing `data` or `dataUrl` updates pins, markers and satellites in place. Other layers are not rebuilt.

### Dataset and config files in the repo

| File | Contents |
| --- | --- |
| `src/data/globe/offices.json` | 18 office pins with `meta.region` and `meta.analysts`. |
| `src/data/globe/hotspots.json` | 14 risk pins with colour, altitude and a summary in `meta`. |
| `src/data/globe/routes.json` | 4 markers chained with `connectTo: "previous"`. |
| `src/data/globe/satellites.json` | 6 satellites and one constellation. |
| `src/data/globe/configs/hero.json` | Demo config: slower orbit, no atmosphere. |
| `src/data/globe/configs/minimal.json` | Demo config: no intro lines, smoke or satellites. |
| `src/data/globe/configs/orbital.json` | Demo config: smaller globe, atmosphere on, no pins. |
| `public/globe/feeds/signal-feed.json` | 300 pins, for `dataUrl`. |

`datasets.test.ts` checks that every file parses with no issues and that ids are unique.

The `configs/*.json` files are plain config objects you can import. They are separate from the `preset` prop, which uses the built-in `CONFIG_PRESETS` (`default`, `boardroom`, `ambient`).

## Palettes

Colours come from a `Palette` object (`engine/types.ts`).

| Preset | Source | Notes |
| --- | --- | --- |
| `"kojima"` (default) | Read live from the site's CSS tokens | Transparent background. Re-resolved when the `dark` class on `<html>` changes. |
| `"encom"` | `DEFAULT_PALETTE`, the original encom values | Black background. The figure gets the `dark` class and an inline background so HUD text stays readable. |
| `"mono"` | Greyscale set | Black background, as `encom`. |

A partial palette is merged over the live Kojima palette for the current theme, not over `encom`:

```tsx
<EncomGlobe palette={{ tile: "#3a7afe", pin: "#ffffff" }} />
```

### Kojima token mapping

From `engine/utils/palette.ts`. Values are read from computed styles and normalised to `#rrggbb`.

| Palette field | Dark | Light |
| --- | --- | --- |
| `tile` | `--primary` | `--kojima-accent-ink` (falls back to `--primary`) |
| `pin`, `label` | `--foreground` | `--foreground` |
| `marker`, `atmosphere` | `--primary` | `--primary` |
| `satelliteWave` | `--foreground` | `--foreground` |
| `satelliteCore` | `--primary` | `--primary` |
| `satelliteShield` | `--chart-3` | `--chart-3` |
| `introLines`, `smoke` | `--muted-foreground` | `--muted-foreground` |
| `fog` | `--background` | `--background` |
| `background` | `null` (transparent over the page) | `null` |

Tile shades are derived from `tile`, and each tile picks one with a seeded RNG, so the pattern is stable.

## Layers

Layers are drawn back to front in this order: atmosphere, grid, intro lines, smoke, pins, markers, satellites.

| Layer | Toggle | What it does | Ported from |
| --- | --- | --- | --- |
| Hex grid (`hex-grid.ts`) | `grid` | One instanced mesh per tile size (hexes and pentagons), so two draw calls. Shaded by `tile`. Intro sweep runs west to east on an instanced `lng` attribute. Fogs to `fog`. | `createParticles` and the original intro shader. |
| Intro lines (`intro-lines.ts`) | `introLines` | Short latitude and longitude arcs above the globe. Each spins once while fading in and out. Merged into one `LineSegments`. | `createIntroLines`. |
| Smoke (`smoke.ts`) | `smoke` (with `pins`) | A 5,000-point pool with a shader. Each labelled pin feeds a plume. Hidden under reduced motion. | `SmokeProvider.js`. |
| Pins (`pins.ts`, `pin-assets.ts`, `pin-collision.ts`) | `pins` | Line, top dot and label per pin. Pins rise on an elastic ease. Labels are thinned by angular distance, and a pin younger than 5 s is never hidden by a newer one. Per-colour materials are shared and ref-counted. FIFO at `maxPins`. | `Pin.js` and `Globe.addPin`. The quadtree becomes a linear scan. |
| Markers (`markers.ts`, `marker-arc.ts`) | `markers` | Ring sprite and label per marker. `connectTo` draws a curved arc that reveals over 2 s. Oldest removed at `maxMarkers`. | `Marker.js`. Timeouts become draw ranges on the engine clock. |
| Satellites (`satellites.ts`, `satellite-texture.ts`) | `satellites` | Plane meshes with an animated radar-ring sprite sheet (50 frames, 80 ms each). Shared sheets keep frames in sync. Constellations share one style. Frozen on one frame under reduced motion. | `Satellite.js` and `TextureAnimator.js`. |
| Atmosphere (`atmosphere.ts`) | `atmosphere` (off) | Fresnel glow: a back-face additive shell at 1.12 times the globe radius. | Optional addition. |

Pins and markers use a DOM label (`CSS2DRenderer`) in the site mono font. Labels are hidden on the far side of the globe. Pin tops, marker rings and satellites are canvas sprites.

Events: a pointer hover on an item calls `onHover`, and a click within 5 px calls `onSelect`. Only pins, markers, satellites and constellations are pickable. Picking listens to pointer events only.

## Multiple instances and performance

- **Lazy start.** Each instance starts its engine when it comes within 200 px of the viewport (`IntersectionObserver`). The three.js engine is loaded with a dynamic `import()`, so it stays out of the initial bundle and out of SSR.
- **Offscreen and hidden tabs.** The render loop pauses when the globe leaves the viewport or the tab is hidden, and resumes when it returns. `pause()` and `resume()` add a manual pause.
- **One WebGL context each.** Every instance owns a `WebGLRenderer`. Browsers cap live WebGL contexts (about 16 in Chromium), so keep the number of simultaneously mounted globes low. Offscreen instances still hold their context.
- **Pixel ratio and sizing.** Pixel ratio is capped at 2. A `ResizeObserver` resizes the canvas.
- **Shared grid.** `loadGrid` caches the grid fetch per URL. All instances share one request and one parsed grid. A failed fetch is evicted so the next instance can retry.
- **Dispose on unmount.** Unmounting cancels the start, disposes the controller and engine, removes the canvas and label layer, disposes geometries, materials and textures, and calls `forceContextLoss()`. Container styles are restored.
- **Caps.** `maxPins` (500) and `maxMarkers` (4) bound live objects. Pins above the cap are evicted oldest first.

## Accessibility and robustness

The `<figure>` exposes `data-status` (`idle | loading | ready | unsupported | error`) for styling and tests; `ready` means every layer has been built.


- **Reduced motion.** When `(prefers-reduced-motion: reduce)` matches, the globe:
  - does not auto-rotate,
  - skips the intro and shows tiles settled,
  - draws intro lines and smoke as hidden, and places pins and markers at their final position with no animation,
  - freezes satellites on one frame.

  Drag, hover, select, `flyTo` (instant) and layer toggles still work. The globe reacts to live changes of the preference.
- **Accessible name.** The `figure` has `aria-label` (from `aria-label`, `title`, or "Interactive globe").
- **Screen reader list.** A visually hidden `figcaption` holds a `ul` with one `li` per pin, marker and satellite: kind, label, latitude and longitude. Constellations are not listed.
- **Canvas and labels hidden.** The WebGL canvas and the label layer are `aria-hidden`. The container uses `overflow: hidden` and `contain: paint`, so labels cannot cause horizontal overflow.
- **Status.** A `role="status"` overlay (`aria-live="polite"`) shows "Initialising globe…", "3D view unavailable — WebGL is disabled in this browser." or "Globe failed to load." It is hidden once the globe is ready. The HUD status readout shows the hovered item, or a `SYS | count` line.
- **WebGL unavailable.** The engine throws a `WebGLUnavailableError`. The figure keeps its frame, the sr-only list and the "3D view unavailable" note. Nothing is thrown to the page.
- **No JavaScript.** The sr-only list is in the server HTML, so screen readers and search engines get the data. The status overlay is also server-rendered and reads "Initialising globe…" until the engine starts, so without JS it stays on screen. Treat the no-JS state as a text fallback, not a visual one.
- **Keyboard.** The globe itself is not focusable and has no keyboard controls. Use the sr-only list, or give the page its own controls (the demo playground will do this).
- **Failures.** Engine errors are logged with `console.error` (WebGL unavailability is not logged). Data fetch errors are logged with `console.warn`.

## Extending

### Adding a layer

Every visual element is a `GlobeLayer` (`engine/types.ts`):

```ts
interface GlobeLayer {
  readonly name: string;
  readonly object: Object3D;
  update(frame: FrameContext): void;   // { time, delta, camera, cameraPosition, reducedMotion }
  setPalette(palette: Palette): void;
  dispose(): void;
  pickables?(): Object3D[];            // optional: objects the raycaster tests
  resolvePick?(object: Object3D, instanceId?: number): GlobeItem | null;
  setHovered?(item: GlobeItem | null): void;
}
```

1. **Write the factory.** Add `engine/layers/<name>.ts` exporting `createXLayer(ctx: EngineContext): GlobeLayer`. Read `ctx.config`, `ctx.palette` and `ctx.reducedMotion`. Use `ctx.addLabel` for DOM labels and `ctx.schedule` for delayed work. Keep the file under about 300 lines.
2. **Add the toggle.** Add a boolean with a default to `LayersSchema` in `schema.ts`. `LayerKey` is derived from that schema, so the key is rejected by TypeScript until it exists.
3. **Register it in `GlobeController`** (`engine/globe-controller.ts`):
   - add the key to `ORDER` to set its render position (back to front),
   - add a `case` to `build()`, returning the layer.

   `syncLayers` adds and removes the layer when its toggle changes.
4. **Feed it data (if needed).** Handle the collection in `setData` (the first call runs the intro cascade), and in `refill()` so the layer gets its data when it is rebuilt.
5. **Dispose everything.** `dispose()` must free geometries, materials and textures, and remove `object` from the scene. Use `disposeObject` from `engine/utils/dispose.ts`.
6. **Test pure logic.** Put maths in a separate module and cover it with vitest (`pnpm test:unit`), as the existing `*.test.ts` files do.
7. **Document it.** Add the toggle to the table in this file.

### Regenerating the hex grid

`public/globe/hex-grid.json` is generated and committed. Regenerate it after changing the grid parameters or the land dataset:

```bash
pnpm globe:grid
```

`scripts/build-globe-grid.mjs` reads `node_modules/world-atlas/land-110m.json`, builds a `hexasphere.js` sphere and keeps tiles whose land coverage is above 0.1. It writes `{ version, divisions, tileRadius, tiles }`, where each tile is `[lat, lng, size, angle, sides]`. The output is deterministic, and the script prints the tile count and file size.

Keep these in step:

- `RADIUS` (500) in the script must match `GLOBE_RADIUS` in `engine/utils/geo.ts`.
- `DIVISIONS` (35) and `TILE_RATIO` (0.45) set tile density. Changing them changes the look and the file size (about 110 KiB now).
- If you change the file format, bump `version` and update `GridFile` in `engine/types.ts`.

## Demo page

`/globe-demo` is being built. It will show the component in four sections:

- **Hero.** The full set of layers on the Kojima palette.
- **Preset gallery.** Palettes (`kojima`, `encom`, `mono`) and layer mixes (pins only, satellites only). Several instances on one page also exercise the shared grid and the context budget.
- **Playground.** Layer switches, sliders for `dayLength`, `scale` and `viewAngle`, a palette select, an add-pin form, a dataset select, `flyTo` buttons and an atmosphere toggle.
- **Data reference.** The JSON formats with copyable examples, plus a live event log for `onSelect` and `onHover`.

The page is still in progress (`src/pages/globe-demo.astro`, `src/components/kojima/globe-demo/`). The temporary `/globe-sandbox` harness has been removed.

## File map

| File | Role |
| --- | --- |
| `src/components/encom-globe/index.ts` | Public exports: component, frame, presets, parser and types. |
| `src/components/encom-globe/EncomGlobe.tsx` | React component, props, `EncomGlobeHandle`, status overlay, sr-only list. |
| `src/components/encom-globe/use-globe-controller.ts` | Hook: lazy start, live config, data and palette updates, events, dispose. |
| `src/components/encom-globe/EncomGlobeFrame.tsx` | HUD frame: brackets, meta strip, legend. |
| `src/components/encom-globe/schema.ts` | Zod schemas, exported types, `parseGlobeData`, `resolveConfig`, `DEFAULT_CONFIG`. |
| `src/components/encom-globe/presets.ts` | `PALETTE_PRESETS` and `CONFIG_PRESETS`. |
| `src/components/encom-globe/encom-globe.css` | Label styles, driven by `--encom-*` variables. |
| `src/components/encom-globe/engine/types.ts` | `Palette`, `DEFAULT_PALETTE`, `GlobeLayer`, `EngineContext`, `FrameContext`, `GridFile`. |
| `src/components/encom-globe/engine/globe-controller.ts` | Connects the engine to layers and data. Layer order, `build()`, `syncLayers`. |
| `src/components/encom-globe/engine/globe-engine.ts` | Scene, renderer, label renderer, clock, render loop, resize, pause, events, dispose. |
| `src/components/encom-globe/engine/camera-rig.ts` | Orbit camera, auto-rotate, drag inertia, `flyTo`. |
| `src/components/encom-globe/engine/picking.ts` | Raycast hover and click, emits `hover` and `select`. |
| `src/components/encom-globe/engine/utils/geo.ts` | `GLOBE_RADIUS`, lat/lng to vector, angular distance, arc path. |
| `src/components/encom-globe/engine/utils/palette.ts` | Kojima token mapping, `resolvePalette`, colour normalisation. |
| `src/components/encom-globe/engine/utils/animate.ts` | Time-based tweens and easings (`elasticOut`). |
| `src/components/encom-globe/engine/utils/canvas.ts` | DPR-aware canvas textures for dots and rings. |
| `src/components/encom-globe/engine/utils/dispose.ts` | Recursive `Object3D` disposal. |
| `src/components/encom-globe/engine/layers/grid-loader.ts` | Cached grid fetch shared by all instances. |
| `src/components/encom-globe/engine/layers/hex-grid.ts` | Hex and pentagon tiles, intro sweep, shading. |
| `src/components/encom-globe/engine/layers/tile-shades.ts` | Seeded RNG and the tile shade set. |
| `src/components/encom-globe/engine/layers/intro-lines.ts` | Spinning intro line arcs. |
| `src/components/encom-globe/engine/layers/smoke.ts` | Smoke particle pool. |
| `src/components/encom-globe/engine/layers/pins.ts` | Pin lines, tops, labels, rise, FIFO. |
| `src/components/encom-globe/engine/layers/pin-assets.ts` | Ref-counted per-colour pin materials and textures. |
| `src/components/encom-globe/engine/layers/pin-collision.ts` | Label collision thinning (pure logic). |
| `src/components/encom-globe/engine/layers/markers.ts` | Marker rings, labels, `maxMarkers` FIFO. |
| `src/components/encom-globe/engine/layers/marker-arc.ts` | Curved arc geometry and draw animation. |
| `src/components/encom-globe/engine/layers/satellites.ts` | Satellite planes and constellations. |
| `src/components/encom-globe/engine/layers/satellite-texture.ts` | Sprite sheet and frame animator. |
| `src/components/encom-globe/engine/layers/atmosphere.ts` | Optional fresnel glow shell. |
| `src/components/encom-globe/engine/shaders/*.glsl.ts` | GLSL for hex grid, smoke and atmosphere. |
| `scripts/build-globe-grid.mjs` | Generates `public/globe/hex-grid.json` (`pnpm globe:grid`). |
| `public/globe/hex-grid.json` | Generated hex grid, committed. |
| `public/globe/feeds/signal-feed.json` | 300-pin sample for `dataUrl`. |
| `src/data/globe/*.json` | Demo datasets: offices, hotspots, routes, satellites. |
| `src/data/globe/configs/*.json` | Demo config objects: hero, minimal, orbital. |
| `src/data/globe/datasets.test.ts` | Checks datasets parse and ids are unique. |
| `src/hooks/use-is-dark.ts` | `dark` class observer, used for the Kojima palette. |
| `src/hooks/use-reduced-motion.ts` | Reduced-motion hook, used for the engine. |
| `src/pages/globe-demo.astro` | `/globe-demo` page (in progress). |
| `src/components/kojima/globe-demo/*` | Demo sections: hero, preset gallery, playground, data reference. |
