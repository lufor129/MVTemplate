# Pixel

Pixel art, like an old game: the frame is drawn as clean flat shapes, then cut into big square pixels (`MV.pixel`
frame units each: 6 by default, 320×180 at 16:9), and every pixel snaps to a small palette, with ordered dithering
where two colours blend. The karaoke is a game dialog box lettered in a pixel font. Nothing boils, and the picture moves
on twos. This file holds the rules of the medium and its drawing API; [GUIDE.md](../../GUIDE.md) holds everything that
doesn't depend on the look.

## Signature features

What makes it read as pixel art at a glance. The Style Sample Gate checks these.

- **Big square pixels**, the same size everywhere on screen.
- A **small palette**: PAL's colours, plus a shade and a light of each. Nothing else appears.
- **Ordered dithering** (a checker of two colours) wherever colours blend: glows, see-through fills, skies.
- **Dark one-pixel outlines** on Characters and props.
- A **dialog box** for the karaoke, lettered in a pixel font.
- **Nothing boils, on twos** (style.json sets `boil: 0`, `hold: 2`).

## The rules of the medium

- **Think in pixels.** At 6 frame units a pixel, a Character with `u` = 24 is 40 pixels wide: enough for a face, not for fine detail. Design faces as a few dark pixels: slit eyes, a short mouth line, a blush as a dithered patch.
- **Snap what stands still.** Positions that aren't moving should sit on the pixel grid (`pix(x)` rounds a value to it), or their edges shimmer when the camera drifts. Camera moves read best in whole pixels, or held.
- **Colours come from PAL.** The grid snaps every colour to the palette, so pick an MV's colours as PAL entries (`"palette"` in mv.json): a colour that isn't one dithers between its two nearest.
- **Use fills for in-between tones.** A see-through `fill` (or `glow()`) becomes a dithered patch: that's how pixel art shades.
- **Everything is flat 2D. Never project 3D.** Characters turn through drawn key views (`ch.turn()`).
- **No pure black or white.** `PAL.ink` for black, `PAL.cream` for white.

## What to check

GUIDE.md's review loop sends you here. Look at sheets at full size (`--w=1920`), where pixels are clear. Look for:

- faces or props too small to read at the pixel size: make them bigger, or simpler
- outlines broken into dots (a line weight under a pixel); dithering on a flat colour that should be one PAL entry
- edges that shimmer in a strip while nothing moves (snap them with `pix()`)
- stray pixels of an unrelated colour along edges
- 3D rotation or projected turns; pure black or white

## Painting

`paint(pts, o)` paints one shape from a point list `[[x, y], ...]`; the frame lands on the pixel grid afterwards:

| option | meaning |
|---|---|
| `wash, washOp` | flat colour (opacity 0–255; see-through dithers) |
| `fill, fillOp` | a flat tone over it, dithered: shade, light, cast shadow |
| `hatch: { d, a, c }` | one-pixel lines at spacing `d` (at least two pixels) and angle `a` |
| `ink, sw` | outline colour (default `PAL.ink`) and weight; never thinner than a pixel. **`ink: null` means no outline.** |
| `curv` | 0–1: smooth the outline through the points |

- **Lines:** `inkLine(pts, sw, colour, brush, curvature)`, at least a pixel wide. `pix(v)` snaps a value to the grid.
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts`, `starPts`, `heartPts`, `through(P)`, `ribbon(P, w0, w1)`.
- **Light:** `glow(x, y, r, colour, a)`: dithers into rings of light.
- **Palette** `PAL`: `paper, ink, clay, clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky`, bright, plus the MV's own.
- **Pixel size:** `"pixel"` in mv.json (frame units per pixel). 6 is 320×180; 4 is 480×270, finer.

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`). The Storyboard decides which Seam gets which.

- `brushWipe(p, [c1, c2])`: a block wipe: a checkerboard of squares grows in a diagonal sweep to cover the frame (p 0 → .5), then shrinks away (.5 → 1). Cut under full cover.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: shaped reveals, stepped on the grid.
- `flash(k, colour)`: a full-frame flash that dithers in and out.

## Karaoke and lettering

- The karaoke is a dark dialog box with a light border; the line is lettered after the pixel grid, in DotGothic16 on a finer grid (3 frame units a pixel), so Chinese and Japanese stay readable. Sung letters turn ochre a letter at a time.
- Sound Words (`letter()`, `sfx()`) use Press Start 2P and land on the pixel grid like the picture. Lettering under 40 px (labels on Model Sheets) is lettered after the grid, crisp.

## Quirks

- The grid is applied to the finished frame (`STYLE.overlay`), so any Character or Chapter written for another style becomes pixel art unchanged; what doesn't change is how much detail fits.
- Anti-aliasing is off for this style, so edges sample as one colour or the other.
- The palette grows with every PAL entry (three colours each): keep an MV's palette small, or the look loses its limits.
