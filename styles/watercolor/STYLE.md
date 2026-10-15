# Watercolor

Hand-painted watercolour and boiling ink on paper, drawn with [p5.brush](https://github.com/acamposuribe/p5.brush). The look should pass for something painted by hand, frame by frame. This file holds the rules of the medium and its drawing API; [GUIDE.md](../../GUIDE.md) holds everything that doesn't depend on the look.

## Signature features

What makes it read as watercolour at a glance. The Style Sample Gate checks these.

- **Light and soft**: high-key colour, lifted toward the paper; only the darks stay dark.
- **Pigment** that settles unevenly, in big soft blotches and fine granulation, and **pools darker at the edges** where one colour meets another; every edge drifts a pixel or two with the boil.
- **Sepia ink lines, lost where the light hits**: a shape's outline stops on its lit side, and the wash carries the edge there.
- **Paper grain** under and through everything, with a soft vignette; light as an **added glow**, never painted.
- The karaoke in **handwriting on a pale wash**.

## The rules of the medium

- **Paint everything with `paint()` and `inkLine()`.** Characters and props get flat `wash` colour plus an ink outline. Backgrounds get soft watercolour `fill` shapes, usually with no outline or a thin one. Never use plain p5 shapes (`rect`, `ellipse`, `fill()`): they look like 2000s Flash.
- **The linework boils.** `jit()` and `random()` are reseeded `MV.boil` times a second (12 by default), so every drawing wobbles slightly, like hand-drawn animation. That's the look; don't fight it. For anything that must stay put from frame to frame (star positions, tuft heights), use `hash(i)`. Call `boilSeed(key)` before each separate element (each background layer, prop and effect), or one moving thing makes everything drawn after it jitter. Characters seed themselves.
- **Everything is flat 2D. Never project 3D.** Don't rotate a box in perspective, don't use `rotateY` or WEBGL 3D and don't fake depth with math. Characters turn through **drawn key views** (`ch.turn()`). Depth comes from overlap, scale and colour (farther = smaller, bluer, paler).
- **Light is the one exception.** p5.brush mixes colour like pigment, so a yellow glow painted over blue turns green, and a thin wash over it turns grey. Use `glow()` for anything that shines: it adds real light, under the paper grain.
- **Soft palette, no pure black or white.** Use `PAL.ink` for black and `PAL.cream` or `PAL.paper` for white. Pick a small palette per MV (`"palette"` in mv.json adds or replaces colours) and keep every Character clearly readable against its background. `paint()` tones every colour for you (`tone()` lifts it toward the paper and calms it; lines go sepia), so pick colours a little stronger than you want them to land.
- **The light decides the lines.** Outlines are lost on the side facing `LIGHT` (frame.js; upper left unless a Shot sets it). Set `LIGHT` to the scene's real light (a lamp on the right: `LIGHT = [-1, .3]`) and the lost edges follow it. Shapes under 30 units across keep their whole line.
- **One shape, one outline.** Build a creature or prop from as few outlines as you can, so it doesn't look like glued-on stickers: a tail is one `ribbon`, not five circles.

## What to check

GUIDE.md's review loop sends you here. In every sheet and strip, look for what makes this look fail:

- plain p5 shapes (`rect`, `ellipse`, `fill()`) instead of `paint()` and `inkLine()`
- 3D rotation, perspective boxes or projected turns
- pure black or white instead of `PAL.ink` and `PAL.cream`/`PAL.paper`
- a light painted as pigment, so yellow over blue went green: use `glow()`
- outlines lost on the wrong side for the scene's light (set `LIGHT`), or a big shape lined all the way round
- a mid-tone so blotchy that a face or a key prop reads as dirty (keep faces and key props light or flat)
- creatures and props built from many glued-on outlines
- outlines that turned into dark blobs under a zoomed camera (see the quirks below)

## Painting

`paint(pts, o)` paints one shape from a point list `[[x, y], ...]`:

| option | meaning |
|---|---|
| `wash, washOp` | flat colour (opacity 0–255, default 255). For characters, props, anything solid. |
| `fill, fillOp, bleed, tex, border` | watercolour fill with bleeding edges and pigment texture. For skies, hills, shading and shadows. `bleed` ~.05–.3, `tex` ~.3–.9. |
| `hatch: { d, a, o, b, c, w }` | hatching (distance, angle, `{rand, gradient}`, brush e.g. `'charcoal'`/`'HB'`, colour, weight). Texture, sparingly. |
| `ink, sw, br` | outline colour (default `PAL.ink`, drawn sepia), weight (~.4–2, drawn a little finer), brush; lost on the lit side. **`ink: null` means no outline.** |
| `curv` | 0–1: smooth the outline through the points. |

- **Lines:** `inkLine(pts, sw, colour, brush = 'ink', curvature)`. The style's brushes are `'ink'`, `'inkfine'` and `'dry'` (bristly); p5.brush's built-ins also work: `'2B'`, `'HB'`, `'charcoal'`, `'marker'`, `'pen'`, `'cpencil'`, `'rotring'`, `'spray'`.
- **Shapes** (engine/geometry.js): `rectPts`, `ellPts`, `rrPts` (rounded rectangle), `starPts`, `heartPts`, `through(P)` (a smooth curve through points), `ribbon(P, w0, w1)` (a tapered ribbon along a path, as one outline: tails, trails, vines, noodly arms).
- **Light:** `glow(x, y, r, colour, a)`. Draw it before the things that sit in front of the light.
- **Palette** `PAL`: `paper, ink, clay, clayDk, clayLt, night, indigo, rose, ochre, sap, teal, violet, cream, sky`, plus the MV's own. `mixCol(a, b, k)` mixes two hex colours.

## Transitions

Screen-space marks for crossing a Seam (call them after `camEnd()`). The Storyboard decides which Seam gets which; nothing runs on its own.

- `brushWipe(p, [c1, c2])`: fat strokes cover the frame (p 0 → .5) and drag off (.5 → 1). Cut under full cover; its comment in transitions.js shows the two calls. Take the colours from the two sides of the Seam.
- `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: shaped reveals (a mouth, a heart, a keyhole). Aim an iris at a character with `toScreen()`.
- `flash(k, colour)`: a full-frame flash.

## Karaoke and lettering

- The karaoke band is a pale wash laid under the picture, ragged at the ends; the line is in sepia handwriting (LXGW WenKai TC, Klee One for what it lacks), and each word turns rose as it's sung.
- Sound Words (`letter()`, `sfx()`) use Permanent Marker with an ink drop shadow, falling back to the CJK fonts.

## p5.brush quirks

- Colours mix like pigment: yellow over blue makes green. Layer light colours over dark ones with a full-opacity `wash`, or use `glow()`. `wash` at 255 is the exact colour; lower opacities mix.
- Strokes drawn far from the origin under a zoomed camera collapse to a dot; `paint()` and `inkLine()` draw each shape around its own centre to avoid it. A shape much bigger than the canvas can still lose its outline: draw long edges as `inkLine`s no bigger than the canvas.
- Outline weight is in world units, so it grows with the camera's zoom: a fine outline on a small shape becomes a dark blob in a close-up. Scale `sw` down with the zoom for small shapes.
- p5.brush drops the wash still pending when a frame's first stroke is drawn, and some curved shapes made with its own `beginShape(curvature)` keep only their outline. The profile works round both (`STYLE.underlay` draws a stroke of its own first; `paint()` smooths `curv` shapes itself and paints a plain polygon), so a wash that goes missing is a new bug: report it.
- A NaN in a point list throws `Failed to construct 'OffscreenCanvas': Value is not of type 'unsigned long'`, with a stack pointing at your scene rather than the NaN. Guard geometry that can degenerate (`Math.acos` of a ratio > 1).
- p5 `push()/pop()/translate()/rotate()/scale()` work with all brush calls.
- Cost is the number of `fill` shapes and strokes: hundreds are fine, thousands are not. Aim for ≤ 1.5 s per frame (the render log prints ms/frame). Watercolour fills are slow without a dedicated GPU; on integrated graphics, prefer washes and hatching.
- The pigment pass (`STYLE.post`) is one shader over the frame after everything is painted: it costs almost nothing, and it treats the karaoke band and the wipes like the rest of the painting.
- Some scenes make p5.brush log `WebGL: INVALID_OPERATION ... not from the associated program` warnings once per page. They're harmless. Any other page error is real.
