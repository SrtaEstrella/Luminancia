# CLAUDE.md - Luminancia Wallpaper Generator

## Overview

Single-page vanilla JS app for generating gradient wallpapers with anisotropic Gaussian color blending. Inspired by Apple's Pride Luminance aesthetic - six vertical strips, each with independently parameterized Gaussian segments creating organic, fluid color transitions.

## Architecture

No framework, no build step, no npm. 7 JS files loaded in order via `<script>` tags (not modules). All functions are global scope. CSS uses custom properties for theming (`:root` dark, `:root.light`).

### Load order (dependency chain)
1. `config.js` - PALETTE, CONFIG, ACTIVE_COLORS, LSEQ/RSEQ, T (locale), PARAM_DEFS, T_ZH/T_EN, switchLang()
2. `params.js` - P[6][7], _baseP0[7], step[7], presetAsDefault(), deriveAll(), genRandom()
3. `renderer.js` - renderToCanvas(), drawGuides(), getTrimPct(), exportWallpaper(), drawRuler()
4. `ui-params.js` - buildSegmentUI(), buildColorUI(), all sidebar controls, color picker, popups
5. `ui-preview.js` - zoom, ref image, markers, scheduleRender(), isolate, theme toggle, lang toggle
6. `main.js` - init(), window.* exports, event wiring, sidebar resize drag

### Key global state
- `P[6][7]` - full parameter matrix (6 strips × 7 segments × {cy, cx, sy, sxr, ang, p, dcy, dsy})
- `_baseP0[7]` - strip 1 baseline (without offsets); deriveAll() recomputes all strips from this
- `step[7]` - per-segment {dcy, dsy} tolerance arrays
- `window._symMode` - 0=X-symmetry, 1=Translate, 2=Y-symmetry, 3=Center-symmetry
- `window._aspectRatio`, `_exportWidth`, `_vScale`, `_globalOffset`, `_stagger`
- `window._isolatedSeg` - null=show all, 0-6=isolate specific segment
- `window._markerPct` - null or percentage for Y-position marker line
- `window._viewStrip` - -1=all strips, 0-5=single strip preview
- `ACTIVE_COLORS`, `ACTIVE_N`, `LSEQ`, `RSEQ` - dynamic color system
- `zoomLevel` - current zoom (0.08-1.0)

### Data flow
1. User adjusts a slider → event handler updates `_baseP0[g][key]` (for strip1 params) or `step[g]` (for tolerance) → calls `deriveAll()` + `scheduleRender()`
2. `deriveAll()` recomputes P[0..5] from _baseP0 + step × off + offsets + symmetry mode
3. `scheduleRender()` debounces 40ms → `renderPreview()` → `renderToCanvas()` + `drawGuides()` + `applyZoom()`
4. Color changes (LSEQ/RSEQ/ACTIVE_COLORS) → `updateColorMeta()` → `deriveAll()` → `scheduleRender()`

## Rendering model

Weight = exp(-dist^p × 4.5) where dist is anisotropic Mahalanobis distance:
1. For each segment, transform pixel to segment-local coords (centerX offset via seg.cx)
2. Rotate by seg.ang (in radians)
3. Scale anisotropically: sigmaX = sigmaY × sxr
4. Compute dist = sqrt((u/sigmaX)² + (v/sigmaY)²)
5. weight = exp(-dist^p × 4.5) — p controls "center fullness" (not edge sharpness)
6. All 7 segments contribute via weighted average (not alpha compositing)

### Symmetry modes (deriveAll)
Derives right-group strips (3,4,5) from left-group (0,1,2):
- **Mode 0 (X)**: strips 0→5, 1→4, 2→3. ang reversed. dcy inherits naturally.
- **Mode 1 (Translate)**: strips 0→3, 1→4, 2→5. No reversal.
- **Mode 2 (Y)**: strips 0→3, 1→4, 2→5. Segment index inverted (6-g). cy flipped (100-cy). ang reversed.
- **Mode 3 (Center)**: strips 0→5, 1→4, 2→3. Index inverted. cy flipped. ang NOT reversed.

Colors always follow RSEQ[g] — the renderer calls `colorIdx(s,g)` which returns `RSEQ[g]` for right strips regardless of symmetry mode.

## Common tasks

### Adding a new global control
1. Add a new entry to the `forEach` array in `buildSegmentUI()` (ui-params.js)
2. If it affects rendering, update `deriveAll()` (params.js)
3. If it needs a window global, set it in `presetAsDefault()`

### Adding a new preset
Modify `spec[]` array and `step[]` array in `presetAsDefault()` (params.js). The spec defines {cy, L} for each segment. step defines {dcy, dsy} for arithmetic progression.

### Adding locale strings
Add entries to both `T_ZH` and `T_EN` in config.js. Reference via `T.key` in JS. For HTML elements, set text in `init()` (main.js) or `buildColorUI()` (ui-params.js).

### Debugging rendering issues
- Use the "isolate" eye button to view individual segments
- Toggle symmetry modes to verify strip mapping
- Check `P[s][g]` values via the segment parameter sliders
- The ruler shows -50% to 150% coordinate system; trim lines at 0% and 100%

## Known pitfalls
- **Never use `innerHTML +=`** when DOM children have JS event handlers — it destroys all existing nodes and their handlers. Use `appendChild` or `insertAdjacentHTML` instead.
- **Edit tool truncates large files** (~80+ lines). Use Write tool for complete file rewrites. Bash `cat` heredoc is the most reliable method for writing files from the VM.
- **Node `new Function()` may report false positives** on browser-valid code (getters via `Object.defineProperty`, hoisted function declarations, etc.).
- **CSS relative paths in `@font-face`** resolve relative to the CSS file location, not the HTML file.
- **Font**: Inter variable font in `fonts/` (woff2). CSS `@font-face` inline in style.css.
- **Locale strings**: all in `T_ZH`/`T_EN` dictionaries. `switchLang()` copies entries into the active `T` object. Must call `buildSegmentUI()` + `buildColorUI()` after switching to rebuild all UI elements that display text.

## Project files
```
luminance-demo.html   - Main application
css/style.css         - All styles (CSS custom properties, @font-face)
js/config.js          - Constants, 35-color PALETTE, locale T_ZH/T_EN, PARAM_DEFS
js/params.js          - P[][], _baseP0[], step[], deriveAll(), preset, symmetry
js/renderer.js        - Gaussian mixture renderer, ruler, guides, export
js/ui-params.js       - Sidebar: sliders, color picker, popups, sequence editor
js/ui-preview.js      - Preview area: zoom, reference image, markers, view modes
js/main.js            - Initialization, window.* exports, event wiring
fonts/                - Inter variable font (InterVariable.woff2 ×2)
README.md / README_zh.md
```
