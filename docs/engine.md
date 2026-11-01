# The engine

The API every Character and Chapter is written against. Read it before the first line of scene code.

- [Files](#files)
- [Frames are pure functions of time](#frames-are-pure-functions-of-time)
- [Chapters and Shots](#chapters-and-shots)
- [The Song](#the-song)
- [Time and motion](#time-and-motion)
- [Plates, props and clips](#plates-props-and-clips)
- [Characters](#characters)

## Files

| file | what's in it |
|---|---|
| `engine/song.js` | the Beat Grid, Lyric Lines and Sections from song.json |
| `engine/frame.js` | the canvas (WEBGL, or Canvas 2D for a profile whose style.json says `"renderer": "2d"`), boil, camera, lettering, plates, clips that nest, render hooks, the studio |
| `engine/geometry.js` | point lists for shapes |
| `engine/math.js` | easing, keyframes, colour mixing, springs |
| `engine/acting.js` | the Character Contract, the Acting Tools, dances, Model Sheets |
| `engine/emotes.js` | painted reaction marks |
| `engine/timeline.js` | `chapter()`, `LOOPS`, what's drawn at time t |
| `engine/karaoke.js`, `engine/songcheck.js` | the karaoke and the Song Check |
| `engine/stylesample.js` | the `style-sample` loop, for the Style Sample Gate |
| `engine/build.mjs`, `engine/render.mjs` | gather the MV into `.build/mv.js` (refusing top-level names the page already has); render sheets, clips, the Gates' videos, the Seam check |
| `engine/globals.json`, `engine/globals.mjs` | the names the browser and p5 already take; refresh after a Chrome or p5 update (`node engine/globals.mjs`) |
| `engine/lineup.mjs` | the style-sample in every Style Profile, side by side, for the Style Sample Gate |
| `engine/storyboard.mjs` | checks `mv/STORYBOARD.md` against song.json; `--briefs` writes the Chapter briefs from it |
| `styles/<name>/` | the Style Profile: STYLE.md, its primitives, transitions, karaoke look |
| `examples/clawd/` | Clawd, an example Character |
| `tools/new_mv.mjs` | makes a new MV: a clean copy of the template, with the song in it |
| `tools/song/` | the song analysis, and `hand_fixes.py`, the start of an MV's `song/hand_fixes.py` (GUIDE.md step 1) |
| `tools/shorts/`, `tools/publish/` | the vertical short, the cover and the YouTube description (docs/publish.md) |
| `studio.html` | open it in Chrome to scrub or play along (`node engine/build.mjs` first; `?t=`, `?loop=`, `?songcheck`) |

## Frames are pure functions of time

- **Frames render in parallel and out of order.** A Shot is `fn(t, lt, dur)` and must draw the same frame for the same `t`, every time. No state carried between frames, no counters, no `Math.random()`, no physics that integrates frame by frame. Compute everything from `t`, in closed form.
- Randomness: `hash(i)` for stable per-object values, `jit(a)`/`random()` for boil.
- **Each Shot paints the whole frame**, background included.
- **Top-level names.** Keep helpers inside the file's IIFE. A name an MV script declares at its top level must not be one the page already has: the browser's (`var fence = …` or `name = …` fails silently, or turns the value into a string), p5's (`line`, `text`, `map`…), or the engine's and the Style Profile's (a second `function paint` quietly replaces the first). The build refuses them.
- **Local names.** Inside a Chapter, don't name a local after a value of the engine's (`W`, `H`, `PAL`, `LIGHT`, `BEAT`, `BAR`, `DUR`, `LINES`…): a `const H = …` for a hat's height hides the canvas height from everything after it in that scope, and every screen-space shape goes NaN with no error. The build lists them as a warning.
- **Canvas:** 1920×1080 for 16:9, 1080×1920 for 9:16 (`W`, `H`), origin top-left, y down. Compose for the MV's format.

## Chapters and Shots

```js
// mv/chapters/c02_chorus1.js
(() => {
  const S = sec('Chorus 1');                          // its Section: { name, kind, start, end }
  function pump(t, lt, dur) {                         // t = song time, lt = time in this Shot, dur = its length
    camBegin(960 + 20 * Math.sin(lt * .6), 540, 1.05 + .02 * pulse(t));
    // … paint the whole frame …
    camEnd();
    if (lt < .3) brushWipe(.5 + lt / .6, [PAL.indigo, PAL.rose]);                      // the Seam in, finished
  }
  function foom(t, lt, dur) { /* … */ }
  chapter('chorus1', S.start, S.end, [[S.start, pump], [LINES[7].start, foom] /* , … */]);
})();
```

`chapter(name, start, end, shots)` registers a Chapter; Shots are `[[t0, fn], ...]` in time order, the first at `start`. `sec(i)` or `sec('Name')` gives a Section; `LINES[i]` a Lyric Line (`{ start, end, text, tokens, section }`). Time not yet covered by a Chapter shows a placeholder with the Section and line, so you can see the song's shape before anything is drawn.

## The Song

| function | what it gives |
|---|---|
| `bpOf(t)` | beat position at t (12.5 = halfway between beats 12 and 13), from the real beat times |
| `beatN(t)`, `beatAt(n)` | the beat t is in; the time of beat n |
| `barOf(t)`, `barN(t)`, `barAt(n)` | the same for bars |
| `pulse(t, k)`, `pulse2(t, k)` | 1 on each beat (or eighth), then decaying: hits, bounces, flashes |
| `nearestBeat(t)`, `nearestBar(t)` | snap a time to the grid |
| `wordAt(i, k)` | when word k of Lyric Line i starts (CJK: character k): anchor events to words |
| `beatsAfter(t, n)` | n beats after the beat nearest t |
| `BEAT`, `BAR` | typical beat and bar length in seconds, for sizing motions |
| `lineAt(t)`, `sectionAt(t)` | the Lyric Line or Section at t: `{ i, line/section, k }` (k = 0..1 through it) |
| `LINES`, `SECTIONS`, `DUR`, `SONG` | the raw data |

## Time and motion

- **On ones:** every frame is a new drawing (`"hold": 1`, the default, and every Style Profile's). Don't move on twos: it reads as choppy. `"hold": 2` in mv.json would hold every drawing two frames, and `onTwos(t)` one Shot; use them only if the person asks for that look. On twos the last drawing a Chapter shows is at its end − 1/12 s (end − hold/fps), and the next Chapter's first drawing can come a little after its start, so a Seam contract that meets on a full cover has to be reached by that last drawing and still be there at that first one.
- **Progress and keys:** `seg(t, a, b)` (0..1 through [a, b]), `kf(t, [[t0, v0], [t1, v1], ...], ease)` (keyframes; values may be arrays), `lerp`, `clamp`, `frac`, `wob(t, freq, phase)`, `TAU`.
- **Easing:** `ease`, `easeIn`, `easeOut`, `backOut` (overshoot), `elasticOut`.
- **Acting:** `jump(t, t0, t1, h)` → `{dy, sq}`; `take(t, t0, amt)` → `{sq, dy}`; `spring(t, t0, k, w)`; `ring(t, [t0, …])`; `arcPt(p0, p1, h, k)`; `onTwos(t)` (hold each drawing two frames).
- **Stop-time:** `stopTime(t, hits, { hold, snap, out, flash })` → `{ t, k, zoom, wash }`: on each hit the picture freezes for `hold` (.22 s). Draw the scene at the returned `t`, lerp the camera toward hit `k`'s close-up by `zoom` (it snaps in over two frames, holds, eases out), and flash a colour at strength `wash`.

  ```js
  const st = stopTime(t, [wordAt(34, 12), wordAt(34, 16)]), c = cam(st.t), z = CLOSE[st.k] || c;
  camBegin(lerp(c[0], z[0], st.zoom), lerp(c[1], z[1], st.zoom), lerp(c[2], z[2], st.zoom));
  scene(st.t); camEnd(); if (st.wash) flash(.5 * st.wash, PAL.rose);
  ```
- **Light:** `LIGHT = [x, y]`, the way the light travels in this Shot (from the upper left by default, or mv.json `"light"`). Style Profiles that shade by themselves read it: cel puts its shadow sides away from it, watercolour loses its lines toward it.
- **Camera:** `camBegin(cx, cy, zoom, rot)` … `camEnd()` (world point to screen centre; one level; always pair them); `toScreen(x, y)`; `shakeXY(t, amount)`.
- **Boil:** mv.json `"boil"` is how many times a second still lines are redrawn (0: drawn once and still, cel's default; 12: a lively hand-drawn boil) and `"boilAmp"` how far their edges wander (1 = the Style Profile's own amount, .3 = gentle). Try other values for one render with `--boil=6 --boil-amp=.3`. With `"boilAmp": 0` lines don't wander at all; cel adds `"inkSwell"` and `"offRegister"` for a clean, even line (styles/cel/STYLE.md).
- **Karaoke:** while a Chapter letters the sung line itself (a closing caption), `KARAOKE_HIDE.push([t0, t1])` hides the band. `--no-karaoke` renders the picture alone, for re-cuts that letter it their own way (the vertical short).
- **Lettering** (Sound Words, and painted lines in lyric mode): `letter(txt, x, y, size, colour, {pop, rot, alpha, screen})`, `sfx(txt, x, y, size, colour, age)`. Composited at `flushLetters()`, after the Shot; call it yourself before a wipe that must cover them. Words painted on a prop go through `textUpright(m, x, y, f)`, which mirrors them back when the prop's frame is mirrored (`m`: a Character facing left passes it to its hand props).
- **Loops:** `LOOPS.name = t => {...}; LOOPS.name.len = 4;` makes a standalone loop (tests, GIFs, sheets), rendered with `--loop=name`.

## Plates, props and clips

- **Plates:** pictures painted outside the engine (GPT Image, in the Style Profile's look) go in `mv/plates/` (backgrounds) and `mv/props/` (props that sit still or move only as a whole), as png, jpg or webp. They load before the first frame. `plate(name, { x, y, w, over, src, alpha })` draws a plate under the camera, covering the frame by default (`over` 1.1 times, so a drifting camera shows no edge); `SPRITES[name]` is a prop's image, for `image()`. Coded Characters stand in front of them.
- **Asking without drawing:** `dry(f)` runs `f()` far off the canvas and returns what it returned, for a shared helper that only reports where things are by drawing them: `const D = dry(() => revueDance(t, x, y, u, o));`. It takes as long as drawing, so call it once a frame.
- **Clips that nest:** `clipInside(pts, f)` draws `f()` inside the closed outline `pts`: a mirror, a lens, a booth window, the detail inside a hair outline. On WEBGL p5 keeps one clip at a time (a shaded cel `paint()` makes one), so `clipInside` gives every clip opened inside it its own bit of the stencil: shaded shapes, Characters and further `clipInside`s all work in it. cel's `clipTo(pts, f, k)` is the same with a smoothed outline.

## Characters

A Character is designed for its MV and drawn to the **Character Contract**: `character(spec)` in engine/acting.js documents every field. In short, a Character provides its key views (front round to back), an emotion table (each a face, a take size and an idle `body(t)` locked to the beat), its resting pose, and `draw(x, y, u, pose)`. In return it gets the **Acting Tools**:

```js
clawd(x, y, 24, clawd.feel('happy', t));                                            // one emotion, alive
clawd(x, y, 24, { ...clawd.feel('sad', t), view: 'q', lookX: -1 });                  // with overrides
clawd(x, y, 24, clawd.emotions(t, [[0, 'sleepy'], [1.9, 'surprised', { lookX: .8 }], [2.5, 'idea']]));   // acted changes
clawd(x, y, 24, { ...clawd.feel('happy', t), ...clawd.turn(t, 1, 1.15, 0, .25) });  // a drawn turn to face right
const w = clawd.stroll(t, 2, 4, 400, 1200, 24); clawd(w.x, 860, 24, { ...clawd.feel('determined', t), ...w });
clawd.dancer(x, y, 24, 'bounce', t, { eyes: 'happy', mouth: 'grin', seed: 2 });       // beat-locked dance
```

- Poses compose by spreading; later spreads win. If an emotion and a move both set `dy` or `sq`, add them rather than letting one replace the other.
- Every Character takes the standard pose fields (`dx`, `dy`, `sq`, `rot`, `flip`, `view`, `smear`, `walk`, `aL`/`aR`, `lookX`/`lookY`, `squint`, `emote`…), plus fields of its own, documented at the top of its file.
- Emotes: `emote` + `emoteK` in a pose pops one by the head; `emote(kind, x, y, s, k, age)` draws one anywhere. Kinds: `!` `?` `!!` `!?` zzz sweat spark heart hearts anger steam bulb dots scribble music swirl stars cloud.
- Dances (`ch.dance(style, t, seed)`): bounce, hop, roof, sway, spin, wave, walk, run, idle, stomp, shimmy, mix.
- A Character doesn't need a face. An electron, a spark or a lamp leaves out eyes and mouth; its emotions are body motion, colour and emotes, and `ch.emotions()` still acts every change.
- Keep every Character on model in every Shot: the same shape and features throughout.
- Characters that come and go mid-Shot need a stable `boilKey`.
- Optional fields keep one name across Characters, so Chapters ask for them the same way: `sit` (0..1, seated: the hips drop to a seat), the other leg poses `kneel`, `crouch`, `bend` (the knees buckle) and `spread` (a wide stance), and `held(u, sw, m)` (a prop held against the body, over it and under the hands in front). A Character that can do these takes them under these names, lists them (and its seat height) in its header, and shows them on a loop beside its Model Sheet. A Lead gets every one its Storyboard Shots ask for before the Chapter subagents start.
- **Hands in the world.** A Character whose spec gives `handAt` (where a hand's grip, or its pointing fingertip, is in the world) and `hands` (the pose fields that place each hand) gets `ch.handAt(x, y, u, pose, side, tip)` → `{ p, ang }` (where a held prop is, without copying the rig's arm formula) and `ch.reach(x, y, u, pose, side, [wx, wy], tip)` → the pose fields that put the hand there (a finger on a nose, a fist on a cord): `{ ...pose, ...ch.reach(x, y, u, pose, 'R', nose, true) }`. `near` says which arm is drawn in front of the body in each view, `ch.near(view)`: the far one goes behind the body, so reach toward someone with the near one. Clawd has all three.
- **Hand props** (Clawd's `armL` / `armR`, a rig's `handL` / `handR`) get as their last argument whether their frame is mirrored on screen; lettering on them goes through `textUpright()`.
- **Tried and set aside: a GPT Image cut-out puppet** (Till Death Do Us Start). Masked edits of a head crop gave eyes and mouths that matched the drawing exactly, feathered in as patches; but the cut seams were the weak spot: crumbs of outline left on the body showed the moment a limb moved. That MV's `mv/refs/puppet_test/` holds the rig and the cutter, for a later MV that wants to try again (paint the outline out along every seam, or have each part drawn separately).

Clawd (examples/clawd/clawd.js) is a full example: 5 views, 31 emotions, hats, a lunchbox mouth, arm hooks for held props.
