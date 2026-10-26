# Paper theatre

A layered papercraft diorama filmed with a real camera, like a hand-made paper animation. Every shape is a flat piece
of matte cardstock cut with soft rounded edges, laid in its own layer a little above the one behind it, and each piece
casts only one thin, soft shadow on that layer. Depth comes from many layers, each lifted a little, and from far
scenery fading slightly into a pale lavender-blue air. The card has a fine matte paper grain, very gentle pencil
shading toward its edges and a slightly lighter cut edge. Nothing is outlined, and there is no craft hardware (no
stitching, no pins, no tags): only small details (eyes, mouths, brows) are printed lines. The palette is soft, muted
and clean: pale powder-blue sky, sage and leaf greens, warm light stone grey, soft lavender-grey for far things,
terracotta, and small accents of red and mustard yellow. Calm and tidy. Canvas 2D (`"renderer": "2d"`), painted through
drawingContext with canvas.js. The approved target image is [target.jpg](target.jpg). This file holds the rules of the
medium and its drawing API; [GUIDE.md](../../GUIDE.md) and [docs/](../../docs/) hold everything that doesn't depend on
the look.

## Signature features

What makes it read as a paper animation at a glance. The Style Sample Gate checks these.

- **Layers of card, one thin shadow each**: every opaque piece casts one soft shadow, close under it and a little away
  from the light, so it shows along every edge (above a hill's edge too) without ever being heavy. Hills and the ground
  are pieces; only a sheet covering the whole stage (the sky) is a shadowless backdrop.
- **Soft rounded cut edges** and a **slightly lighter cut edge** on every piece (the card's pale core).
- **Matte paper grain**: fine tooth, short fibres, the faintest pencil, travelling with each piece. Calm from afar,
  visible close up. Never glossy, never heavily textured, no halftone.
- **Gentle pencil shading** inside each piece toward its edges, a little heavier away from the light; long flats are lit
  along their top edge.
- **No outlines, no stitching, no pins.** Small details are printed lines; a line across the stage is a faint pencil
  line, not an outline.
- **Depth**: flats wider than half the frame fade a little toward pale lavender-blue, more the higher they start (the far
  hill a touch paler than the near one); actors stay crisp.
- **Paper props**: a big pale shape high on the stage is a plain white cut-paper cloud (puffs along the top, a flat
  bottom); light is a few short separate paper rays round what shines (`glow`).
- **Sound Words cut from paper**: the letters grained like card, with a thin soft shadow, on a cream paper backing with
  a zigzag cut edge, with a few mustard paper ticks around it.
- **Stiff card**: little squash (`sq` × .3), hardly any smear.
- The karaoke **printed on a cream card**: a thin red printed border, the sung part brick red, the rest dark grey, in a
  rounded sans (M PLUS Rounded 1c; Chiron GoRound TC for the CJK it lacks).

## The rules of the medium

- **Build from pieces.** A Character or prop is a few pieces of card laid on each other, each one `paint()` with a
  `wash`. Smaller pieces on top (eyes, a belt, a badge) cast their own small shadows on the piece under them.
- **Depth is layers.** Many layers, each a little in front of the last, beat one big shaded shape. Make background
  flats wide and set them high to push them back; keep actors smaller and crisp in front.
- **The shadow follows the light.** It leans away from `LIGHT` (frame.js; from the upper left unless a Shot sets it);
  the pencil shading is heavier on the far side. Point `LIGHT` at the scene's light.
- **Shade in pencil, inside the piece.** A `fill` with no wash is a soft pencil tone on the piece under it (a blush, a
  darker band); a dark one is a soft cast shadow. `hatch` is coloured-pencil hatching, heavier on the shadow side.
- **The camera can be focused.** `blur` defocuses a piece (see Painting): use it for a Chapter's nearest foreground
  layer, like the reference's out-of-focus bushes. Nothing is blurred unless a Chapter asks, and the profile never adds
  foreground scenery itself.
- **Colour is matte card.** `tone()` softens every colour a little (saturation × .94, values pulled toward the middle)
  with no colour cast, Characters' own included.
- **Seed every element** (`boilSeed(key)`); style.json sets `boil: 0`, nothing wobbles. Characters seed themselves.
- **Everything is flat 2D. Never project 3D.** Characters turn through drawn key views.
- **No pure black or white.** `PAL.ink` is a dark warm grey; `PAL.cream` / `PAL.paper` are card.

## What to check

The review loop ([docs/review-loop.md](../../docs/review-loop.md)) sends you here. In every sheet and strip, look for:

- a piece with no shadow under it (translucent `washOp` pieces have none, on purpose), or shadows that look heavy
- dark outlines round pieces, or printed lines used for anything bigger than a detail
- stitching, pins, dashed borders or other craft hardware (the person asked for none)
- an actor faded into the haze (it's too wide on screen: zoom out, or split it into pieces)
- a glossy gradient anywhere (a shape painted outside `paint()`), halftone, heavy texture, or 3D rotation
- a warm parchment or sepia cast over the frame (the palette is clean)
- a Sound Word whose backing covers an actor's face (move the word)

## Painting

`paint(pts, o)` paints one piece of card from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | the card's colour; opaque pieces cast the thin shadow, `washOp` below ~230 is tracing paper: no shadow |
| `fill, fillOp` | over a wash: mixed into the card's colour. Alone: dark → a soft cast shadow (blurred, multiplied); light and wider than a quarter of the frame → a card flat, and if it's long (over 2.2 × as wide as tall) and in the upper half, a white paper cloud; otherwise a soft pencil tone on what's under it |
| `shade` | `false`: hardly any pencil shading (a screen, a sign); a number scales how far the shading reaches in |
| `hatch: { d, a }` | coloured-pencil hatching in the piece's own darker pencil, heavier away from the light (`c` is the colour only when there's no wash) |
| `blur` | depth of field: defocus this piece by `blur` frame units (4–10 for a foreground layer). It is painted on a layer of its own and laid in through a blur filter, about 5–15 ms each, so keep it to the nearest layer |
| `ink, sw, br` | no line round a piece. An outline alone over a piece already painted adds nothing; an outline with nothing under it is a band of card `sw × 3` wide. **`ink: null`**: nothing |
| `curv` | 0–1: smooth the outline through the points (corners are rounded anyway) |
| `bleed, tex, border` | ignored |

- **Lines:** `inkLine(pts, sw, colour, brush = 'ink', curvature)`: a printed line, `sw × 3.4` wide (brush scales it:
  `inkfine` .6, `HB` .5, `dry` 1.3…), a little tapered. A line longer than about a third of the frame is drawn as a
  faint pencil line. Keep lines for details.
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts`, `starPts`, `heartPts`, `through(P)`, `ribbon(P, w0, w1)`.
- **Light:** `glow(x, y, r, colour, a)`: a faint warm light, and over ~90 px a ring of short separate paper rays round
  the light (between .32 r and .47 r). Draw it before the thing that shines. It is redefined in paint.js; canvas.js
  keeps the shared additive glow, which this profile doesn't use.
- **Colours:** `tone(hex)`, `cardShade(hex)` (the pencil shade of a card colour). Palette `PAL`: `paper, ink, clay,
  clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky`, plus `brick` (the karaoke red), `gold`
  (mustard), `stone` (light stone grey), `lavender` (far lavender-grey).

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`).

- `brushWipe(p, [c1, c2])`: five tall plain card strips, `c1`, soft sage, cream, mustard, `c2`, dealt in from the left
  (the far one first), each a little askew and landing over the one before, so their edges show the thin shadows of
  stacked layers. Full cover at p = .5; then they slide on off to the right, the top one first. Cut under full cover.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: a card over the stage with a rounded die-cut hole, its thin
  shadow thrown into the hole and a pale cut edge.
- `flash(k, colour)`: the lights thrown full up.

## Karaoke and lettering

- The line is printed in M PLUS Rounded 1c 800 (Chiron GoRound TC for CJK it lacks) on a cream card with a thin red
  printed border and one thin soft shadow; each word turns brick red as it's sung, the rest is dark grey; the
  translation row is a lighter grey. The card rises into place as the line comes in, then is painted with the letters
  on the 2D compositor, over the picture, so a wipe never covers the words.
- Sound Words (`letter()`, `sfx()`) are Baloo 2 800, cut from paper in `STYLE.flush`: each word on the letters' canvas
  is found at an eighth of the size, gets its cream zigzag backing and mustard ticks, and the engine's hard ink drop is
  lifted out of its letters, which get the card grain and a thin soft shadow instead.

## Quirks

- A piece's haze is worked out from its own size and place on screen, so one wide actor high in the frame (a long
  dragon) fades like scenery: split it.
- A big pale `fill` high on the stage becomes a cloud, whatever its outline; paint a pale flat that isn't a cloud with
  a `wash`.
- Sound Words close together merge into one backing. Lettering under 44 px tall (labels on a model sheet) and lettering
  in `PAL.ink`'s own colour keep the engine's look: no backing, no lifted drop.
- Speed: 2–15 ms a frame for the sample, about 50 ms on frames with a Sound Word (finding the word and lifting the
  drop), about 45 ms a frame with the mp4 capture.
