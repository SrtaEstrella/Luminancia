# Luminancia Wallpaper Generator

Generate smooth gradient wallpapers with six vertical strips and anisotropic color blending. Fully customizable parameters, live preview.

[中文说明](README_zh.md)

<p align="center"><img src="preview.jpeg" alt="Preview" width="80%"></p>

## Quick Start

Open `luminancia.html` in a modern browser. Zero dependencies.

## Features

- 2-12 custom colors from a 35-color palette
- 4 aspect ratios + custom export resolution
- 4 symmetry modes: X, Translate, Y, Center
- 7 Gaussian segments per strip with independent angle and spread
- Day/night theme
- Chinese/English locale
- Export PNG wallpaper and JSON presets

## Project Files

```
luminancia.html        - Main app
css/style.css         - Styles with CSS custom properties
js/config.js          - Constants, palette, locale
js/params.js          - Parameters, preset, symmetry
js/renderer.js        - Rendering engine
js/ui-params.js       - Sidebar controls
js/ui-preview.js      - Preview area
js/main.js            - Init and wiring
fonts/                - Inter variable font
```

## License

MIT
