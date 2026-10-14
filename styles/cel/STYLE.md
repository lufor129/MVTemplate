# Cel

Hand-drawn cel animation: every shape inked with a brush line that boils, flat colour laid in a little off the line,
and hard-edged shadow tones, on animation paper, moving on twos. It draws with plain p5 shapes (no p5.brush), so it
renders several times faster than watercolour. This file holds the rules of the medium and its drawing API;
[GUIDE.md](../../GUIDE.md) holds everything that doesn't depend on the look.

## Signature features

What makes it read as cel at a glance. The Style Sample Gate checks these.

- Ink lines that **boil**: redrawn slightly differently 12 times a second, thick and thin like a pressed brush.
- **Flat colour** in every shape, printed a couple of pixels off its line, like hand colouring.
- **Hard-edged shadow and light tones**: one flat darker shape for shade, one lighter for a highlight, never a gradient.
- **On twos**: every drawing holds two frames (style.json sets `hold: 2`), so motion has a hand-made snap.
- Warm animation paper under everything.

## The rules of the medium

- **Ink every solid shape.** Characters and props get `wash` plus an ink outline. Backgrounds may drop the outline (`ink: null`) for distance, but the near ground keeps one.
- **Shade with flat shapes.** `fill` is a flat tone with a hard edge: use it for the shadow side, cast shadows and highlights, one or two per surface. Don't stack many translucent fills to fake a gradient.
- **The lines boil.** `jit()` and `random()` are reseeded `MV.boil` times a second (12). Call `boilSeed(key)` before each separate element, or one moving thing makes everything drawn after it jitter. Characters seed themselves.
- **Everything is flat 2D. Never project 3D.** Characters turn through drawn key views (`ch.turn()`); depth comes from overlap, scale and colour.
- **Light is `glow()`**, added on top, never a painted gradient.
- **No pure black or white.** `PAL.ink` for black, `PAL.cream` or `PAL.paper` for white. A small palette per MV (`"palette"` in mv.json).
- **One shape, one outline.** Build a creature or prop from as few outlines as you can: a tail is one `ribbon`, not five circles.

## What to check

GUIDE.md's review loop sends you here. In every sheet and strip, look for:

- solid shapes with no ink line, or a line so thin it disappears at the shot's zoom
- shading that looks like a gradient (many stacked fills) instead of one or two hard tones
- lines that don't boil in a strip, or boil every frame (a missing `boilSeed`)
- 3D rotation, perspective boxes or projected turns
- pure black or white instead of `PAL.ink` and `PAL.cream`/`PAL.paper`
- outlines that turned into thick blobs under a zoomed camera: scale `sw` down with the zoom

## Painting

`paint(pts, o)` paints one shape from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | flat colour (opacity 0–255), a little off-register |
| `fill, fillOp` | a flat tone over it, hard-edged: shade, light, cast shadow. `bleed`, `tex` and `border` are ignored |
| `hatch: { d, a, o: { rand }, b, c, w }` | hatching lines (spacing, angle, randomness, brush, colour, weight) |
| `ink, sw, br` | outline colour (default `PAL.ink`), weight (~.4–2), brush. **`ink: null` means no outline.** |
| `curv` | 0–1: smooth the outline through the points |

- **Lines:** `inkLine(pts, sw, colour, brush = 'ink', curvature)`, tapered at both ends. Brushes: `'ink'`, `'inkfine'`, `'dry'` (broken, bristly), `'2B'`, `'HB'`, `'charcoal'`, `'marker'`, `'pen'`, `'rotring'`, `'cpencil'`, `'spray'`: the same names as watercolour, so Characters move between the two.
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts`, `starPts`, `heartPts`, `through(P)`, `ribbon(P, w0, w1)`.
- **Light:** `glow(x, y, r, colour, a)`. Draw it before the things that sit in front of the light.
- **Palette** `PAL`: `paper, ink, clay, clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky`, a little brighter than watercolour's, plus the MV's own. `mixCol(a, b, k)` mixes two hex colours.

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`). The Storyboard decides which Seam gets which.

- `brushWipe(p, [c1, c2])`: fat inked strokes cover the frame (p 0 → .5) and drag off (.5 → 1). Cut under full cover. Take the colours from the two sides of the Seam.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: shaped reveals. Aim an iris at a character with `toScreen()`.
- `flash(k, colour)`: a full-frame flash.

## Karaoke and lettering

- The karaoke band is an inked rounded band under the picture; each word turns from cream to ochre as it's sung. Fonts: Shantell Sans for Latin script, LXGW WenKai TC for Chinese, Klee One for Japanese.
- Sound Words (`letter()`, `sfx()`) use Permanent Marker with an ink drop shadow.

## Quirks

- Line weight is in world units, so it grows with the camera's zoom.
- Cost is the number of shapes: a frame of a few hundred costs well under 0.5 s. Non-convex shapes (a C, a ring) are tessellated and cost more than blobs, rects and ellipses.
- To animate on ones instead (smooth camera moves, a fast whip pan), set `"hold": 1` in mv.json.
