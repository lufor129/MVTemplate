# Cut-out

Paper cut-out animation: every shape is a piece of coloured paper cut with scissors, laid on kraft card, casting a small
shadow on whatever lies under it. Shading is printed as halftone dots, light as tissue paper, lines as cut strips of dark
paper. Nothing boils: pieces hold their cut shapes, like puppets moved under a camera. This file holds
the rules of the medium and its drawing API; [GUIDE.md](../../GUIDE.md) and [docs/](../../docs/) hold everything that doesn't depend on the look.

## Signature features

What makes it read as cut-out at a glance. The Style Sample Gate checks these.

- **Muted craft paper** with its **fibre showing**, a different patch of it on every piece, travelling with the piece.
- **Scissor-cut edges**: curves cut as runs of short straight snips, with the paler paper core showing along each cut.
- **No outlines**: a piece's edge is its cut and its shadow. A **shadow under every piece**, so the layers read as real paper stacked on card.
- **Halftone dots** for dark shading and cast shadows; **tissue paper** for light.
- Lines (eyes, mouths, cracks) as **strips of dark paper**, of even width.
- **Nothing boils, nothing squashes** (style.json sets `boil: 0`; `STYLE.pose` takes the squash and the smears out): pieces keep their cut shapes as they move.
- The karaoke in a **heavy serif on a strip of dark paper**.

## The rules of the medium

- **Build from pieces.** A Character or prop is a few pieces of paper laid on each other: `paint` with `wash`, then smaller pieces on top. Arms, heads and tails are separate pieces that turn at a joint, like a puppet's.
- **Shade with print, not paint.** A dark `fill` prints halftone dots (for the shadow side, a cast shadow); a light `fill` lays tissue paper (a highlight, haze, mist). Keep to one or two per surface.
- **Nothing boils.** Shapes are cut once and stay cut: don't add `jit()` wobble to make them move. Motion comes from moving pieces, frame to frame.
- **No line round a piece.** `paint()` leaves out a shape's outline when it has a wash, and when it outlines the same point list a wash just used (Characters often paint a shape, then outline it). An outline with no piece under it is cut as a strip.
- **Lines are strips.** `inkLine` cuts a strip of dark paper: good for eyes, mouths, cracks and stitches. Keep them few and bold; thin hatching reads as pencil.
- **Colour is paper.** `paint()` tones every colour for you (`tone()`: muted, a little warm), Characters' own included.
- **Everything is flat 2D. Never project 3D.** Characters turn through drawn key views (`ch.turn()`); depth comes from overlap, scale and the shadows.
- **Light is `glow()`**, the one thing that isn't paper.
- **No pure black or white.** `PAL.ink` for black, `PAL.cream` for white. A small palette per MV (`"palette"` in mv.json); `PAL.paper` is the card.

## What to check

The review loop ([docs/review-loop.md](../../docs/review-loop.md)) sends you here. In every sheet and strip, look for:

- pieces with no shadow, or shadows falling different ways in one shot
- shapes that wobble or crawl between frames (jitter added on purpose, or a shape whose point count changes)
- a Character that reads as one flat sticker instead of pieces with joints
- two touching pieces of the same colour, which merge with no line between them: give them different papers
- halftone dots so dense or big that a face disappears under them
- thin lines that look drawn rather than cut (use a thicker `sw`)
- 3D rotation, perspective boxes or projected turns; pure black or white

## Painting

`paint(pts, o)` cuts one piece from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | a piece of coloured paper, with its cut edge and shadow (a see-through one, below 60%, has no shadow) |
| `fill, fillOp` | shading on it: halftone dots when the colour is dark, tissue paper when it is light; `fillOp` sets how much |
| `hatch: { d, a, o: { rand }, c, w }` | pencil lines (spacing, angle, randomness, colour, weight) |
| `ink, sw` | left out with a wash, or after a wash with the same points; otherwise a strip of paper along the outline. **`ink: null` means none.** |
| `curv` | 0–1: smooth the outline through the points |

- **Lines:** `inkLine(pts, sw, colour, brush, curvature)`: a paper strip with a shadow; `'inkfine'` cuts a narrower one.
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts`, `starPts`, `heartPts`, `through(P)`, `ribbon(P, w0, w1)`.
- **Light:** `glow(x, y, r, colour, a)`.
- **Palette** `PAL`: `paper` (the kraft card), `ink, clay, clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky`, a little muted, plus the MV's own.

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`). The Storyboard decides which Seam gets which.

- `brushWipe(p, [c1, c2])`: torn strips of coloured paper slide in to cover the frame (p 0 → .5) and slide on out (.5 → 1). Cut under full cover.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: a sheet of card with a hole cut in it.
- `flash(k, colour)`: a sheet of paper laid over the frame.

## Karaoke and lettering

- The karaoke band is a strip of dark paper with torn ends; each word turns from cream to ochre as it's sung.
- The line is lettered in Noto Serif TC Black (Klee One for what it lacks).
- Sound Words (`letter()`, `sfx()`) use Bowlby One SC with an ink drop shadow, like letters cut from a magazine.

## Quirks

- Every piece with a wash costs three fills (shadow, edge, textured colour): a few hundred pieces a frame is fine.
- A piece's patch of fibre comes from its boil stream (`boilSeed`), like `jit()`: seed each separate element, or a moving one shifts the paper of everything after it.
- The shadow offset is in world units, so it grows with the camera's zoom, as a real one would under a closer camera.
