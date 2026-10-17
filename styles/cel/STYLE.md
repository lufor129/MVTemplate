# Cel

Hand-drawn cel animation: every shape inked with a brush line, flat colour laid in a little off the line,
and hard-edged shadow tones, on animation paper, moving on twos. It draws with plain p5 shapes (no p5.brush), so it
renders several times faster than watercolour. This file holds the rules of the medium and its drawing API;
[GUIDE.md](../../GUIDE.md) holds everything that doesn't depend on the look.

## Signature features

What makes it read as cel at a glance. The Style Sample Gate checks these.

- **Bold** ink lines, thick and thin like a pressed brush, a little irregular, and **still**: style.json sets `boil: 0`, so each line is drawn once and holds. (People found a boiling line distracting. An MV that wants the boil back sets `"boil": 12` in mv.json, and `"boilAmp"` below 1 to make it gentler.)
- **Saturated flat colour** in every shape, printed a couple of pixels off its line, like hand colouring.
- **A hard shadow side on every solid shape**, found from the light: one flat tone, darker and nudged toward red-violet (skin goes rosy, not grey), never a gradient; big shapes get a thin lit edge too.
- **Broad acting**: squash, stretch and smears pushed further than the Character asks (`STYLE.pose`).
- **On twos**: every drawing holds two frames (style.json sets `hold: 2`), so motion has a hand-made snap.
- The karaoke as **rounded subtitle letters** with a thick ink edge, no band.

## The rules of the medium

- **Ink every solid shape.** Characters and props get `wash` plus an ink outline. Backgrounds may drop the outline (`ink: null`) for distance, but the near ground keeps one.
- **The shadow side paints itself.** Every `wash` gets a hard shadow tone on the side away from `LIGHT` (frame.js; from the upper left unless a Shot sets it). Point `LIGHT` at the scene's real light (a window on the right: `LIGHT = [-1, .2]`); pass `shade: false` for shapes that must stay flat (a screen, a sign, a pupil). Use `fill` for what the light can't find by itself: cast shadows, one extra tone. Don't stack many translucent fills to fake a gradient.
- **Colour goes clean and saturated.** `paint()` tones every colour for you (`tone()`), Characters' own included, so a muted palette still lands bright.
- **Seed every element.** `jit()` and `random()` are reseeded `MV.boil` times a second (0 here: once), so a still line is drawn the same every frame. Call `boilSeed(key)` before each separate element, or one moving thing changes the randomness of everything drawn after it and makes it jitter. Characters seed themselves.
- **Everything is flat 2D. Never project 3D.** Characters turn through drawn key views (`ch.turn()`); depth comes from overlap, scale and colour.
- **Light is `glow()`**, added on top, never a painted gradient.
- **No pure black or white.** `PAL.ink` for black, `PAL.cream` or `PAL.paper` for white. A small palette per MV (`"palette"` in mv.json).
- **One shape, one outline.** Build a creature or prop from as few outlines as you can: a tail is one `ribbon`, not five circles.

## What to check

GUIDE.md's review loop sends you here. In every sheet and strip, look for:

- solid shapes with no ink line, or a line so thin it disappears at the shot's zoom
- shading that looks like a gradient (many stacked fills) instead of one or two hard tones
- shadow sides that contradict the scene's light (set `LIGHT`), or a shadow on something that should be flat (`shade: false`)
- still lines that change from frame to frame (a missing `boilSeed`), or, with boil on, lines that don't boil
- 3D rotation, perspective boxes or projected turns
- pure black or white instead of `PAL.ink` and `PAL.cream`/`PAL.paper`
- outlines that turned into thick blobs under a zoomed camera: scale `sw` down with the zoom

## Painting

`paint(pts, o)` paints one shape from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | flat colour (opacity 0–255), a little off-register, with its shadow side (and, on big shapes, a lit edge) found from `LIGHT` |
| `shade` | `false`: no shadow side on this shape; a number (0–1) narrows it (a face: about .45) |
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

- The karaoke has no band: the line is lettered in Chiron GoRound TC (Klee One for what it lacks), cream with a thick ink edge, like a broadcast subtitle; each word turns yellow as it's sung.
- Sound Words (`letter()`, `sfx()`) use Bangers with an ink drop shadow.

## Quirks

- Line weight is in world units, so it grows with the camera's zoom.
- The shadow side is a stencil clip per shape; it costs about as much as the shape itself.
- Cost is the number of shapes: a frame of a few hundred costs well under 0.5 s. Non-convex shapes (a C, a ring) are tessellated and cost more than blobs, rects and ellipses.
- To animate on ones instead (smooth camera moves, a fast whip pan), set `"hold": 1` in mv.json.
