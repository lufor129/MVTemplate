# Style Profiles

A Style Profile is one complete way of putting paint on the frame: its drawing primitives, its palette and its rules of what the look forbids. An MV picks one with `"style"` in `mv/mv.json`. Only `watercolor/` exists so far.

A profile is a folder `styles/<name>/` with:

- **`style.json`**: `libraries` (scripts loaded before everything, e.g. p5), `fonts` (a stylesheet URL), `scripts` (the profile's own files, loaded after the engine).
- **`STYLE.md`**: the rules of the medium and its drawing API, written for the model, with a "What to check" list of what the look forbids. GUIDE.md sends the model here for the rules and from its review loop for the checks. GUIDE.md keeps no rules of its own about the look; where it needs an example, it uses watercolour.
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

The engine (geometry, boil, camera, timeline, acting, emotes) only calls these, so a new profile works with every Character and Chapter that keeps to them, though each Character's own colours and shapes were designed for one look.
