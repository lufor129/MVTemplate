# Style Profiles

A Style Profile is one complete look: not only how paint lands on the frame (its drawing primitives) but how it tones every colour that reaches them, how light shades a shape, what lines do, how Characters move, its lettering, a pass over the finished frame, and its rules of what the look forbids. An MV picks one with `"style"` in `mv/mv.json`:

| profile | the look | drawn with |
|---|---|---|
| [watercolor/](watercolor/STYLE.md) | light, soft watercolour: pigment pooling at edges and settling in blotches, sepia lines lost where the light hits | p5.brush, then a pigment pass |
| [cel/](cel/STYLE.md) | TV cel: bold brush ink that holds still, saturated flat colour, a hard shadow tone found from the light, broad acting | plain p5 shapes |
| [cutout/](cutout/STYLE.md) | paper cut-out: muted fibrous paper cut in straight snips, no outlines, shadows, halftone; nothing boils or squashes | plain p5 shapes, textured |
| [pixel/](pixel/STYLE.md) | pixel art: 320×180 grid, small palette, dithering, a dialog-box karaoke | plain p5 shapes, then a pixel grid |
| [paper-theatre/](paper-theatre/STYLE.md) | paper theatre: matte card pieces with soft rounded cut edges laid in layers, one thin soft shadow each, powder blue and sage, no outlines | Canvas 2D |
| [doodle/](doodle/STYLE.md) | notebook doodle: wobbly fineliner traced twice, markers scribbled along the tops of things, ballpoint hatching, the page left mostly white | SVG, rasterised onto a Canvas 2D |

## A look of its own

Two profiles that only paint the same picture with different texture look the same from across the room. What tells a look at a glance is everything above the brush, so a profile decides all of it, for every Character and Chapter, without them changing:

| at a glance | where the profile decides it | watercolor · cel · cutout · pixel · paper-theatre · doodle |
|---|---|---|
| colour and value | its `tone()`, which every colour going into `paint()` passes through | lifted and soft · saturated · muted and warm · snapped to the palette · soft and matte, no cast · light marker colours |
| light and shade | its `paint()`, reading `LIGHT` | pigment pools at edges · a hard shadow side found from the light · halftone and shadows under pieces · dithering · one thin soft shadow under each piece, pencil shading at its edges · a second marker layer on the shadow side, ballpoint for darks |
| lines | its `paint()` and `inkLine()` | sepia, lost on the lit side · bold, still · none round a piece · one dark pixel · none; printed lines for details only · black fineliner traced twice, running past the corners |
| edges and shapes | its `paint()` | soft, drifting · clean · straight scissor snips · stepped · rounded die-cut card with a pale cut edge · scribbled, never flat |
| motion | `STYLE.pose` | as acted · squash and smears pushed · no squash, no smears · no smears · stiff card: little squash or smear · a touch more squash, motion marks in the air |
| lettering | `STYLE.karaoke`, `letterFont` | handwriting on a pale wash · rounded subtitle letters, no band · heavy serif on a paper strip · pixel font in a dialog box · rounded print on a cream card · ballpoint on washi tape, highlighter on the sung part |
| the whole frame | `STYLE.post`, `STYLE.overlay` | the pigment pass, paper grain · paper grain · paper fibre · the pixel grid · paper grain · ruled notebook paper, red margin, punched holes |

`node engine/lineup.mjs` renders one moment of the `style-sample` loop in every profile, small, side by side (`out/check/style_lineup.jpg`). A new profile has to be told from the others there; one that can't isn't a look of its own yet.

A profile is a folder `styles/<name>/` with:

- **`style.json`**: `description` (one line; the Brief offers it when asking for the style), `renderer` (the canvas the look paints on: `"webgl"`, p5's WEBGL, the default; or `"2d"`, a plain Canvas 2D the profile paints through `drawingContext`, for paths, gradients, soft shadows, blur and blend modes; p5's transforms and the camera apply to both), `libraries` (scripts loaded before everything, e.g. p5), `fonts` (a stylesheet URL), `scripts` (the profile's own files, loaded after the engine), and `defaults`: mv.json settings the look needs, which an MV's own mv.json still overrides (`"boil": 0` so nothing boils, `"pixel": 6` for pixel's grid).
- **`STYLE.md`**: the rules of the medium and its drawing API, written for the model, with a "Signature features" list (what makes the look recognisable at a glance; the Style Sample Gate checks it) and a "What to check" list of what the look forbids. GUIDE.md sends the model here for the rules once the Brief has picked the style, and docs/review-loop.md for the checks. GUIDE.md and docs/ keep no rules of their own about the look; where they need an example, they use watercolour.
- **`target.jpg`** (profiles made since the Style Target Gate): the picture of the look the person approved before any code, which the profile was coded toward ([docs/new-style.md](../docs/new-style.md)).
- **Scripts** that define these globals, which the engine, the Characters and the Chapters all draw with:

| global | what it is |
|---|---|
| `PAL` | the palette, merged with mv.json's `"palette"`; must include `paper`, `ink`, `cream` |
| `paint(pts, o)` | paints one shape from a point list |
| `inkLine(pts, sw, colour, brush, curvature)` | draws a stroke along a path |
| `glow(x, y, r, colour, a)` | adds light |
| `flash`, `iris`, `irisShape`, and any transitions of its own | marks for crossing a Seam |
| `STYLE.setup()` | async; runs once, after the canvas exists (brushes, paper, textures) |
| `STYLE.underlay()` | draws what lies under every frame (paper), in frame units |
| `STYLE.overlay(ctx, w, h)` | runs on the final 2D canvas after everything (grain, vignette) |
| `STYLE.flush(img)` | makes everything painted so far land before the queued lettering (`img`, a canvas) is drawn over it. A profile that doesn't paint straight onto the canvas (an SVG scene) places `img` in its own picture and returns `true` |
| `STYLE.letterFont(size)` | the CSS font for Sound Words |
| `STYLE.fonts` | font family names to wait for before rendering |
| `STYLE.karaoke.band(K)`, `.text(ctx, K)` | paint the karaoke band during the frame; letter it on the 2D canvas. `K` = `{ text, sub, a, b, grow, sung, top }` (see engine/karaoke.js). `sub` is the line's translation (song/translation.txt), lettered on a row above the sung words and never lit; `karaokeLayout(ctx, K, font, size)` works out where every row goes (`K.rows`, `K.subY`, `K.subSize`, `K.box`), so a profile only paints and letters |
| `STYLE.post()` | optional, and may be async: runs on the painted frame once it's done, before the lettering (watercolour's pigment pass, a `filter()` shader; an SVG scene rasterised onto the canvas) |
| `STYLE.pose(o)` | optional: takes every Character's pose and returns it the way the look moves (cut-out paper doesn't squash; cel squashes more) |

Besides these, each profile keeps its own `tone(hex)`, which every colour going into its `paint()`, `inkLine()` and karaoke passes through, and reads the engine's `LIGHT` (frame.js: the way light travels, from the upper left unless a Shot or mv.json `"light"` says otherwise) wherever it shades.

Profiles drawn with plain p5 shapes share `shapes.js` (filled polygons, variable-width strokes, hatching, offsets, `glow()`), and profiles painted on a Canvas 2D share `canvas.js` (paths, gradients, `_with()` for alpha, blend modes, blur, soft shadows and clips, variable-width strokes, offscreen layers); each keeps its own identical copy, so a profile folder stays self-contained. Start a new profile from the existing one closest to the look, show it off with the engine's `style-sample` loop and check it against the others with `engine/lineup.mjs` ([docs/new-style.md](../docs/new-style.md)).

The engine (geometry, boil, camera, timeline, acting, emotes) only calls these, so a new profile works with every Character and Chapter that keeps to them, though each Character's own colours and shapes were designed for one look.
