# Style Profiles

A Style Profile is one complete way of putting paint on the frame: its drawing primitives, its palette and its rules of what the look forbids. An MV picks one with `"style"` in `mv/mv.json`:

| profile | the look | drawn with |
|---|---|---|
| [watercolor/](watercolor/STYLE.md) | watercolour washes and boiling ink on paper | p5.brush |
| [cel/](cel/STYLE.md) | hand-drawn cel: boiling ink, flat colour off-register, hard shadow tones, on twos | plain p5 shapes |
| [cutout/](cutout/STYLE.md) | paper cut-out: scissor-cut pieces with shadows, halftone, kraft card; nothing boils | plain p5 shapes |
| [pixel/](pixel/STYLE.md) | pixel art: 320×180 grid, small palette, dithering, a dialog-box karaoke | plain p5 shapes, then a pixel grid |

A profile is a folder `styles/<name>/` with:

- **`style.json`**: `description` (one line; the Brief offers it when asking for the style), `libraries` (scripts loaded before everything, e.g. p5), `fonts` (a stylesheet URL), `scripts` (the profile's own files, loaded after the engine), and `defaults`: mv.json settings the look needs, which an MV's own mv.json still overrides (`"hold": 2` to move on twos, `"boil": 0` so nothing boils).
- **`STYLE.md`**: the rules of the medium and its drawing API, written for the model, with a "Signature features" list (what makes the look recognisable at a glance; the Style Sample Gate checks it) and a "What to check" list of what the look forbids. GUIDE.md sends the model here for the rules and from its review loop for the checks. GUIDE.md keeps no rules of its own about the look; where it needs an example, it uses watercolour.
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
| `STYLE.flush()` | makes everything painted so far land before p5 draws an image over it |
| `STYLE.letterFont(size)` | the CSS font for Sound Words |
| `STYLE.fonts` | font family names to wait for before rendering |
| `STYLE.karaoke.band(K)`, `.text(ctx, K)` | paint the karaoke band during the frame; letter it on the 2D canvas. `K` = `{ text, a, b, grow, sung, top }` (see engine/karaoke.js) |

Profiles drawn with plain p5 shapes share `shapes.js` (filled polygons, variable-width strokes, hatching, offsets, `glow()`); each keeps its own identical copy, so a profile folder stays self-contained. Start a new profile from the existing one closest to the look, and show it off with the engine's `style-sample` loop (GUIDE.md step 0).

The engine (geometry, boil, camera, timeline, acting, emotes) only calls these, so a new profile works with every Character and Chapter that keeps to them, though each Character's own colours and shapes were designed for one look.
