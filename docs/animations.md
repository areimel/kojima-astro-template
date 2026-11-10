# Animations

Attribute-driven motion for the Kojima template, built on Anime.js v4. Pages and components opt in with `data-*` attributes; the engine finds them, resolves a preset for the current breakpoint, and plays it. Nothing animates unless an element asks for it.

The system has a fixed, approved pool of presets. The look is deliberately spy-agency: decoded text, typewriter transmissions, glitch tears, scanner sweeps, redaction bars, status lights. The pool is small on purpose so the site reads as one system.

Global tuning lives in one place. Changing `DURATION.base` or the glitch colours in `config.ts` updates every preset and every page that uses it. Individual elements override only what they need.

## Quick reference

- Add `data-animation="<preset>"` to any element, or use `anim()` from React.
- Breakpoint overrides: `data-desktop-animation`, `data-mobile-animation`. Use `"none"` to switch an effect off.
- Presets are listed in `PRESET_NAMES` (`src/lib/animations/types.ts`). Unknown names log a dev warning and do nothing.

## Attribute reference

| Attribute | Values | Effect |
| --- | --- | --- |
| `data-animation` | preset name or `none` | Base preset at every breakpoint. |
| `data-desktop-animation` | preset name or `none` | Overrides the base at 768px and wider. |
| `data-mobile-animation` | preset name or `none` | Overrides the base below 768px. |
| `data-anim-trigger` | `load`, `scroll`, `hover`, `loop` | Overrides the preset's default trigger. Invalid values are ignored. |
| `data-anim-delay` | milliseconds | Delay before the first target starts. Default `0`. |
| `data-anim-duration` | milliseconds | Overrides the preset's default duration. |
| `data-anim-stagger` | milliseconds | Gap between targets. Default `70` (`STAGGER`). |
| `data-anim-children` | CSS selector | Animates matching descendants instead of the element. Falls back to the element if nothing matches. |

The engine also writes `data-anim-pending` (hides a target until its preset starts) and `data-anim-state` (`armed`, `done`, or `none`). Do not set these by hand.

### Resolution order

Mobile (below the breakpoint):

1. `data-mobile-animation`, if present (`"none"` disables).
2. The base preset's `mobileFallback`, if it has one.
3. `data-animation`.

Desktop (768px and up):

1. `data-desktop-animation`, if present.
2. `data-animation`.

If nothing resolves, or the value is `"none"`, the element is left alone.

### Breakpoint

`MOBILE_BREAKPOINT = 768` in `src/lib/animations/config.ts`. Mobile means `(max-width: 767px)`. The same constant is used by `src/hooks/use-mobile.ts` (`useIsMobile`), so React and the engine agree. The media queries in `src/styles/animations/base.css` hardcode 768 and 767; change them together with the constant.

## Usage

### React / TSX

`anim()` returns the data attributes as a plain object to spread onto a DOM element. It is typed with the same names as the preset list.

```tsx
import { anim } from "@/lib/animations/attributes";

<h1 {...anim({ animation: "decode" })}>Threat briefing</h1>

<p
  {...anim({
    animation: "fade-up",
    desktop: "scan-wipe",
    mobile: "fade-up",
    delay: 120,
  })}
>
  Regional summary
</p>

<ul {...anim({ animation: "boot-stagger", children: "li" })}>
  <li>Feed alpha</li>
  <li>Feed bravo</li>
</ul>
```

Importing `anim()` pulls the preset registry (and Anime.js) into the island bundle. The engine itself is started once by `BaseHead`.

### Astro

Astro markup takes the attributes directly. Any layout that renders `BaseHead` loads the engine.

```astro
<section data-animation="fade-up" data-mobile-animation="none">
  <h2 data-animation="scan-wipe">Coverage</h2>
  <span data-animation="counter">2,418</span>
</section>
```

### Plain HTML

```html
<h1 data-animation="decode" data-anim-duration="1200">Briefing</h1>
<p data-desktop-animation="typewriter" data-mobile-animation="fade-up">
  Transmission received.
</p>
<div data-animation="pulse" data-mobile-animation="none"></div>
<button data-animation="glitch-hover" data-anim-trigger="hover">Open</button>
```

## Presets

Defaults come from each preset file. "Mobile" is the preset's `mobileFallback`; "same" means no fallback, so the preset runs unchanged on mobile.

| Preset | Family | Default trigger | Mobile | Duration (ms) | Behaviour |
| --- | --- | --- | --- | --- | --- |
| `decode` | Text | scroll | same | 900 | Scrambled glyphs resolve left to right into the real text. |
| `typewriter` | Text | scroll | same | 1000 | Characters appear one at a time with a block cursor that blinks for about 1.2s after. |
| `glitch-in` | Glitch | scroll | `fade-up` | 600 | Stepped opacity, jitter, and an RGB channel split that settle onto the element. |
| `slice` | Glitch | scroll | `fade-up` | 600 | Clipped horizontal bands slide into one full frame. |
| `flicker-in` | Glitch | scroll | same | 600 | Failing-monitor flicker with vertical scale and brightness. |
| `fade-up` | Reveal | scroll | same | 600 | Fades in while rising 16px. |
| `scan-wipe` | Reveal | scroll | same | 1000 | Clip reveal with a glowing scanline. |
| `redact` | Reveal | scroll | same | 600 | An opaque bar collapses to the right, uncovering the text. |
| `boot-stagger` | Reveal | scroll | same | 480 | Dim, flicker, and slide in from the left, one child after another. |
| `blink` | Ambient | loop | `none` | 1200 | Hard on/off status light with random gaps between loops. |
| `pulse` | Ambient | loop | `none` | 1600 | Radar ring expanding from the element. |
| `flicker` | Ambient | loop | `none` | 3000 | Mostly steady, with brief opacity dips at random intervals. |
| `counter` | Ambient | scroll | same | 1000 | Counts up the first number in the text, then restores the exact original text. |
| `glitch-hover` | Ambient | hover | same | 250 | Short jitter and RGB split on every hover or focus. |

## Triggers

- **`load`**: plays as soon as the element is armed, which is normally on page load. One-shot.
- **`scroll`**: plays once, the first time the element is at least 15% visible (bottom 8% of the viewport excluded). Elements already in view when armed play immediately. Until then their targets stay hidden, and the 4s safety net does not release them.
- **`hover`**: plays on every `pointerenter` and `focusin`. Not one-shot. A new run reverts the previous one first.
- **`loop`**: starts when armed and repeats until the element is reverted (page swap, reduced motion, or breakpoint change).

One-shot presets (`load`, `scroll`) are remembered per element. A finished one-shot does not replay when the viewport crosses the breakpoint. Memory is cleared on view-transition swaps and when reduced motion turns on, so the next page starts fresh.

## Accessibility and robustness

- **Reduced motion.** When `(prefers-reduced-motion: reduce)` matches, the engine arms nothing, the head script does not add `anim-ready`, and `base.css`, `ambient.css`, `glitch.css`, `reveal.css`, and `text.css` disable their motion. Content is shown at full opacity. Toggling the preference at runtime starts or stops the engine.
- **No JavaScript.** Hiding rules only apply under `html.anim-ready`. That class is added by an inline script in `BaseHead.astro` (or by the engine), so without JS the content is visible and unmodified.
- **React islands.** Island content is not touched before hydration. Until Astro removes the `ssr` attribute from `astro-island`, `base.css` hides the island's animated elements in CSS, and the engine skips anything inside `astro-island[ssr]`. A MutationObserver watches for the attribute change and arms the element in the same tick, so there is no flash.
- **Failsafe.** Anything hidden by a prehide preset is revealed after 4s. The CSS does this for unhydrated islands; the engine does it for its own targets. Targets waiting on a scroll trigger are exempt, since they are meant to stay hidden until scrolled to.
- **Errors.** A preset that throws is caught; its targets are shown and the error is logged in development.
- **Text presets.** `decode` and `typewriter` write only to existing text nodes. While they run, `aria-label` holds the real text (only if the element had none), so screen readers do not read glyph noise. On finish or revert, every text node gets its original string back, and the label is removed. `counter` does the same with its single number node.
- **Use text presets on static text only.** They write directly to DOM text nodes and restore the original string afterwards. Do not use them on text that React, a form, or another script updates during the animation.

## Tuning tokens

All in `src/lib/animations/config.ts`.

| Token | Current value | Used for |
| --- | --- | --- |
| `MOBILE_BREAKPOINT` | `768` | Mobile/desktop split (shared with `use-mobile.ts`). |
| `READY_CLASS` | `"anim-ready"` | Set on `<html>` when motion is available. Must match the inline script in `BaseHead.astro`. |
| `ATTR` | attribute names | Single source for every `data-*` name the engine and CSS use. |
| `EASE` | `out` = `outExpo`, `inOut` = `inOutQuad`, `linear`, `steps` = `steps(6)`, `hold` = `steps(1)` | Easing. `hold` gives the mechanical snap used by most glitch and ambient presets. |
| `DURATION` | `fast` 240, `base` 600, `slow` 1000, `decode` 900 | Default durations. |
| `STAGGER` | `70` | Default gap between targets. |
| `GLYPHS` | `A-Z0-9` plus symbols | Character pool for `decode`. |
| `SCROLL_OBSERVER` | threshold `0.15`, rootMargin `0px 0px -8% 0px` | When `scroll` presets fire. |
| `GLITCH_COLORS` | `a` = `var(--primary)`, `b` = `var(--chart-2, #5ad1e6)` | RGB channel split colours. |

Anime.js v4 notes:

- Named string easings (`"outExpo"`, `"inOutQuad"`, `"linear"`) work directly.
- Stepped easing must be the function returned by `steps(n)` from `animejs`. The stepped tokens are functions for this reason; do not replace them with strings.
- `EASE.steps` is defined but not currently used by any preset. `EASE.hold` is.

## Adding or changing a preset

1. **Name it.** Add the name to `PRESET_NAMES` in `src/lib/animations/types.ts`, under its family comment.
2. **Implement it.** Write an `AnimationPreset` in the matching file under `src/lib/animations/presets/` (`text.ts`, `glitch.ts`, `reveal.ts`, `ambient.ts`). Set `defaultTrigger`, `defaults`, `prehide`, and `mobileFallback` if needed. `run()` must leave targets fully visible when it finishes, and `revert()` must restore the DOM, text, and inline styles exactly.
3. **Style it (if needed).** Add or extend the partial for that family in `src/styles/animations/`. Include a `prefers-reduced-motion` rule there.
4. **Register it.** Add the preset to the family array the file exports (`textPresets`, `glitchPresets`, `revealPresets`, `ambientPresets`). `registry.ts` already spreads those arrays. A new family also needs a spread in `registry.ts`.
5. **Prehide lists.** If `prehide: true`, add the name to every list in `src/styles/animations/base.css`: the desktop `:is()` list, the mobile `:is()` list, and the `:not()` lists for `data-animation`. The lists must match the presets with `prehide: true`.
6. **Document it.** Add a row to the table in this file.
7. **Add it to the lab.** Add an entry to `LAB_FAMILIES` in `src/components/kojima/animation-lab-data.ts`. The `/components` lab renders from that list.
8. **Test it.** Run `pnpm run check` and `pnpm run test:e2e`. Also check the preset by hand in `pnpm run dev` at a desktop width and a mobile width, with reduced motion emulated, and with JavaScript disabled.

## File map

| File | Role |
| --- | --- |
| `src/lib/animations/types.ts` | `PRESET_NAMES`, trigger and settings types, the `AnimationPreset` contract. |
| `src/lib/animations/config.ts` | Tuning tokens, attribute names, breakpoint, queries. |
| `src/lib/animations/attributes.ts` | `anim()` helper and attribute resolution (preset, settings, targets). |
| `src/lib/animations/registry.ts` | Builds the preset map from the family arrays. |
| `src/lib/animations/engine.ts` | Scanning, triggers, safety net, reduced-motion and breakpoint handling, Astro view-transition hooks. |
| `src/lib/animations/presets/text.ts` | `decode`, `typewriter`. |
| `src/lib/animations/presets/glitch.ts` | `glitch-in`, `slice`, `flicker-in`. |
| `src/lib/animations/presets/reveal.ts` | `fade-up`, `scan-wipe`, `redact`, `boot-stagger`. |
| `src/lib/animations/presets/ambient.ts` | `blink`, `pulse`, `flicker`, `counter`, `glitch-hover`. |
| `src/scripts/animations.ts` | Starts the engine. Imported by `BaseHead.astro`. |
| `src/components/BaseHead.astro` | Inline script that sets `anim-ready`; loads the engine. |
| `src/styles/animations.css` | Entry point that imports the partials below. |
| `src/styles/animations/base.css` | Pre-hydration hiding, island failsafe, reduced-motion overrides. |
| `src/styles/animations/text.css` | Typewriter cursor. |
| `src/styles/animations/glitch.css` | Glitch filter and registered custom properties. |
| `src/styles/animations/reveal.css` | Scan-wipe line and redaction bar. |
| `src/styles/animations/ambient.css` | Pulse ring and glitch-hover text shadow. |
| `src/hooks/use-mobile.ts` | React mobile check, uses the same breakpoint. |
| `src/components/kojima/animation-lab.tsx` | `/components` preview of every preset. |
| `src/components/kojima/animation-lab-data.ts` | `LAB_FAMILIES`, the lab's preset list. |
