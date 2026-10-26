# Doodle

A doodle in a lined school notebook, seen as a flat scan of the page: casual and funny. Everything is outlined twice in
wobbly black fineliner whose strokes run on past the corners. Colour comes only from a few felt-tip markers and a
yellow highlighter, scribbled back and forth with white between the strokes: things are coloured in almost to their
line, big areas (sky, hills) only along their top edge, and most of the page stays white. A hatched shape (a rock), a
dark tone and a cast shadow are ballpoint cross-hatching instead. The page has pale blue ruling, a double red margin
and a column of punched holes. It is built as **SVG**: `paint()`, `inkLine()` and `glow()` write SVG elements into a
per-frame scene, and `STYLE.post()` rasterises the scene onto the Canvas 2D (`"renderer": "2d"`). The approved target
image is [target.jpg](target.jpg). This file holds the rules of the medium and its drawing API;
[GUIDE.md](../../GUIDE.md) and [docs/](../../docs/) hold everything that doesn't depend on the look.

## Signature features

What makes it read as doodle at a glance. The Style Sample Gate checks these.

- **A notebook page, mostly white**: cool white paper, pale blue ruled lines, a double red margin line, and **punched
  holes** down the left edge that go through everything (the wipe too). Ruling shows through all the ink.
- **Black fineliner traced twice**: two passes that don't quite agree, each bending the same way every frame, strokes
  that **overshoot the corners** and cross.
- **Marker scribble, never flat colour**: back-and-forth strokes of a light, see-through marker, **darker where they
  overlap**, white showing between them. A thing is coloured in nearly to its line, with a thin bare sliver on its lit
  edge and a second layer across the first on the side away from `LIGHT`.
- **Big areas only along their top**: the sky is a blue strip scribbled along the top of the page (starting a little
  below its edge), a hill is a green band under its outline that thins out downwards, the ground gets a few strokes.
  The scribble leaves room round a light (`glow()`).
- **Clouds are outlines**: a big pale haze with no line of its own becomes a row of clouds, each a run of overlapping
  humps over a long flat bottom line, white inside.
- **Highlighter yellows**: any clear yellow (a sun, a "!") is a dense fluorescent highlighter fill; light rays are thick
  highlighter strokes.
- **Ballpoint**: a hatched shape is blue-black cross-hatching (sparser on the lit side, three layers in the deepest
  shadow), and a cast shadow a dense ballpoint scribble with a thin rim; ink blobs where the strokes start and end.
- **Doodler's marks**: little dashes round a Character in the air and drop lines under its feet; burst dashes and two
  little stars round a Sound Word.
- **Lettering**: Sound Words as bubble letters outlined twice in fineliner, hatched with stripes of their own colour,
  the drop side hatched dark; the karaoke handwritten in navy ballpoint on a strip of **pink polka-dot washi tape**
  with torn ends, a **yellow highlighter** over what's been sung.
- **Still lines**: style.json sets `boil: 0`, and every wobble is seeded by the element, so a still thing draws the same
  in every frame and a moving thing keeps its strokes as it moves.

## The rules of the medium

- **Colours are markers.** `tone()` lifts a mid colour to marker lightness (a marker is never dark: a dark comes from
  layering, which `paint()` does for you); colours already light stay as they are. PAL holds the target's markers:
  orange `clay`, green `sap`, blue `sky`, pink `rose`, and `hilite`, the highlighter.
- **What a colour is decides its tool.** Pen-dark (lightness under ~.3): solid felt-tip fill as a wash, ballpoint as a
  fill. Near-white: bare paper (wash) or white gel pen (fill). A clear yellow (hue ~36°–68°, saturated): highlighter.
  Anything else: marker. A Character's own colours therefore keep their meaning in this look.
- **Seed every element.** Each `paint()`/`inkLine()`/`glow()` takes one number from p5's seeded `random()`; call
  `boilSeed(key)` before each separate element (Characters seed themselves). Never `Math.random()`.
- **Flat 2D, never projected 3D.** Characters turn through drawn key views.
- **Light is `glow()`**: highlighter rays, and the page left white round the source. It doesn't brighten what's under it.
- **No pure black or white.** `PAL.ink` (fineliner) and `PAL.bic` (ballpoint) for dark, `PAL.paper` / `PAL.cream` for white.
- **Big shapes** (wider than 60% of the frame) are backdrops, coloured along their top edge only (see Painting).
- **A few colours.** Keep an MV's palette to a handful of light marker colours plus the highlighter.

## Painting

`paint(pts, o)` paints one shape from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | marker colouring nearly to the line, a paper gap round the shape (when opaque), a bare sliver on the lit edge, a second layer on the shadow side. Yellow: highlighter, flat. Pen-dark: a solid felt-tip fill (keep those small: eyes, mouths). Near-white: bare paper. On a backdrop: a band along its top edge only (below) |
| `shade` | `false`: no shadow layer or lit sliver (a screen, a sign); a number scales how far the shadow layer reaches |
| `fill, fillOp` | a tone over the shape, by the lightness of the colour as given: dark → ballpoint scribble (cross-hatched above fillOp ~65; with no wash and no ink, a thin ballpoint rim too: a cast shadow); light (over ~.72) → white gel-pen streaks on small shapes, nothing on a highlighter or anything over 120 px; else another marker layer across the first (on a backdrop, a second layer of its own marker close under the top edge). A big light fill with no wash and `ink: null` is a **cloud** (below). `bleed`, `tex`, `border` are ignored |
| `hatch: { d, a, o: { rand }, b, c, w }` | on its own: hatching lines (spacing, angle, randomness, brush, colour, weight); pencil and pen brushes draw ballpoint. **With a wash, the shape becomes ballpoint cross-hatching instead and the wash colour is dropped** (a rock) |
| `ink, sw, br` | outline colour (default `PAL.ink`), weight (~.4–2), brush. **`ink: null` means no outline.** A dark outline is the double fineliner; a coloured one a marker line |
| `curv` | 0–1: smooth the outline through the points |

- **Backdrops** pick their band from where their top edge is on screen: above the frame → a sky strip along the top of
  the page; an outlined edge → a band under the line (a hill); an edge with `ink: null` → a few strokes (the ground).
  A backdrop is built when the frame is rendered (`_emit` takes a function), so it can leave room round the lights
  `glow()` adds later in the frame.
- **Clouds:** a light `fill` with no wash, `ink: null`, over 240 px: the haze is split into clouds no more than about
  four times as wide as tall, each a run of humps along the haze's top edge (each stroke stops where the next hump
  starts; the last may curl under), over a flat bottom at about the middle of the haze, white inside.
- **Lines:** `inkLine(pts, sw, colour, brush = 'ink', curvature)`. Brushes (the names every profile shares): `'ink'`
  (fineliner, traced twice), `'inkfine'`, `'pen'`, `'rotring'` (fineliners), `'HB'`, `'2B'`, `'cpencil'` (ballpoint,
  with an ink blob where each stroke starts and ends), `'marker'`, `'charcoal'` (fat marker), `'dry'` (a marker running
  dry: broken dashes, good for speed lines), `'spray'` (dotted).
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts`, `starPts`, `heartPts`, `through(P)`, `ribbon(P, w0, w1)`.
- **Light:** `glow(x, y, r, colour, a)`: highlighter rays from about .33r to .64r, each gone over twice, a few pen dashes
  between them; backdrop scribble is left out within about .45–.75r. A yellow (or a pen-dark or near-white colour) gives
  highlighter rays, another colour marker rays.
- **Palette** `PAL`: `paper, ink, bic, clay, clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky,
  hilite`, plus the MV's own. The notebook (palette.js): `RULE`, `RULE0`, `MARGIN`, `RULE_COL`, `MARGIN_COL`, `HOLES`.
- **Characters in the air** (`dy` under −.9) get motion dashes by their top corners, and drop lines under their feet
  above `dy` −1.6, through `STYLE.pose` wrapping the Character's `o.draw` hook (body-local units as in examples/clawd).
  A Character that doesn't call `o.draw` gets none.

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`).

- `brushWipe(p, [c1, c2])`: one fat marker scribbles a zigzag across the page until it's covered (p 0 → .5), then lifts
  off from where it began (.5 → 1); the stroke is revealed along its length with `stroke-dasharray`. Cut under full
  cover. The punched holes stay on top.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: solid felt-tip outside a hole, its edge drawn round twice.
- `flash(k, colour)`: the page goes to a flat colour (default: blank paper).

## Karaoke and lettering

- The line is handwritten in navy ballpoint (Patrick Hand; LXGW WenKai TC for Chinese), the whole line at once, on a
  strip of pink polka-dot washi tape with torn ends that unrolls under it; a yellow highlighter runs along under the
  sung words. The translation row is in the same ink above it.
- Sound Words (`letter()`, `sfx()`) use Luckiest Guy, then the `#letters` SVG filter makes them bubble letters: a paper
  halo, a faint wash of the colour, stripes of the colour itself (feImage + feTile), two wobbly fineliner rings round the
  word and a line where the face meets its drop. The filter works in the word's own space (`letterFont()` notes the
  transform each word is drawn with), so the hatching turns and pops with the word; burst dashes and two outline stars
  are drawn round it in the same space. A fading word is redrawn at full strength and faded as a whole, so its colour
  doesn't mix with the pen copy under it. A word with its own `font` gets the filter but no marks.

## How it's built (svg.js)

- `STYLE.underlay()` starts the scene with the paper. Every element is a `<g transform="matrix(…)">` carrying
  `drawingContext.getTransform()` (camera, pose and render scale), so it is written in its own frame units.
- Filters `#wob` (fineliner, ballpoint and small fills), `#wobF` (marker layers and bands), `#wobW` (the wipe):
  feTurbulence + feDisplacementMap. The noise lives in each element's user space, so it moves with the element. Each
  filtered group carries an invisible padding rect so the filter region never clips a stroke.
- Colour multiplies with `mix-blend-mode: multiply` on each marker or ink group; neighbouring scribble lines go into
  separate paths so their overlaps darken.
- `STYLE.flush(img)` crops each Sound Word's canvas to what's on it and places it as an `<image href="data:…">` under
  `#letters`, then its marks.
- `STYLE.post()` calls the deferred backdrops, adds the ruling (a `<pattern>`) and margin (multiplied) and the holes (a
  radial gradient, a shadow and a lit lip), serialises the scene, loads it through a Blob URL, `await img.decode()`, and
  draws it onto the canvas. A frame whose SVG doesn't parse throws, and leaves the source in `window._badSVG`.
- The scene is a string: attribute values are written by the profile, never from user text, so nothing needs escaping
  (keep it that way: no lettering goes into the SVG as text).

## What to check

The review loop ([docs/review-loop.md](../../docs/review-loop.md)) sends you here. In every sheet and strip, look for:

- flat, even colour anywhere (a shape should always show its strokes), scribble running over its outline, or a backdrop
  coloured all the way down (the page should stay mostly white)
- outlines that are a single clean line, or corners that don't run on
- a shadow layer on the lit side (set `LIGHT`), or on something that should be flat (`shade: false`)
- a yellow you meant as orange turning highlighter (move its hue below ~36°), or a dark meant as marker drawn as pen
- a cloud where you meant a pale pool of light (give it a wash or an outline)
- strokes that change from frame to frame on still things (a missing `boilSeed`)
- 3D rotation, perspective boxes or projected turns
- pure black or white instead of `PAL.ink` / `PAL.paper`
- outlines grown into thick bars under a zoomed camera: scale `sw` down with the zoom

## Quirks

- Line weight, scribble spacing and filter displacement are in world units, so they grow with the camera's zoom.
- The scribble grid is fixed in each shape's own space; a shape whose points change size every frame (a leg changing
  length) slides its strokes a little.
- A backdrop's band follows its own top edge; which band it gets (sky or edge) is decided from where that edge is on
  screen, so a camera move that brings a sky's top edge into the frame changes it from a strip to an edge band.
- The sample renders in about 25–75 ms a frame at 1920×1080 here (Chrome rasterises the SVG image on the GPU); the
  4-second clip takes 7.5 s including start-up and encoding. Cost grows with the number of filtered groups; a frame of
  a few hundred shapes should stay well under 300 ms. If a machine rasterises on the CPU, the per-group filters are the
  first thing to drop (`filter` in `_hatchSvg` / `_linesSvg`).
