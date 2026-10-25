# The engine

The API every Character and Chapter is written against. Read it before the first line of scene code.

- [Files](#files)
- [Frames are pure functions of time](#frames-are-pure-functions-of-time)
- [Chapters and Shots](#chapters-and-shots)
- [The Song](#the-song)
- [Time and motion](#time-and-motion)
- [Characters](#characters)

## Files

| file | what's in it |
|---|---|
| `engine/song.js` | the Beat Grid, Lyric Lines and Sections from song.json |
| `engine/frame.js` | the canvas, boil, camera, lettering, render hooks, the studio |
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
| `tools/song/` | the song analysis |
| `tools/shorts/`, `tools/publish/` | the vertical short and the YouTube description (docs/publish.md) |
| `studio.html` | open it in Chrome to scrub or play along (`node engine/build.mjs` first; `?t=`, `?loop=`, `?songcheck`) |

## Frames are pure functions of time

- **Frames render in parallel and out of order.** A Shot is `fn(t, lt, dur)` and must draw the same frame for the same `t`, every time. No state carried between frames, no counters, no `Math.random()`, no physics that integrates frame by frame. Compute everything from `t`, in closed form.
- Randomness: `hash(i)` for stable per-object values, `jit(a)`/`random()` for boil.
- **Each Shot paints the whole frame**, background included.
- **Top-level names.** Keep helpers inside the file's IIFE. A name an MV script declares at its top level must not be one the page already has: the browser's (`var fence = …` or `name = …` fails silently, or turns the value into a string), p5's (`line`, `text`, `map`…), or the engine's and the Style Profile's (a second `function paint` quietly replaces the first). The build refuses them.
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
- **Light:** `LIGHT = [x, y]`, the way the light travels in this Shot (from the upper left by default, or mv.json `"light"`). Style Profiles that shade by themselves read it: cel puts its shadow sides away from it, watercolour loses its lines toward it.
- **Camera:** `camBegin(cx, cy, zoom, rot)` … `camEnd()` (world point to screen centre; one level; always pair them); `toScreen(x, y)`; `shakeXY(t, amount)`.
- **Boil:** mv.json `"boil"` is how many times a second still lines are redrawn (0: drawn once and still, cel's default; 12: a lively hand-drawn boil) and `"boilAmp"` how far their edges wander (1 = the Style Profile's own amount, .3 = gentle). Try other values for one render with `--boil=6 --boil-amp=.3`.
- **Karaoke:** while a Chapter letters the sung line itself (a closing caption), `KARAOKE_HIDE.push([t0, t1])` hides the band. `--no-karaoke` renders the picture alone, for re-cuts that letter it their own way (the vertical short).
- **Lettering** (Sound Words, and painted lines in lyric mode): `letter(txt, x, y, size, colour, {pop, rot, alpha, screen})`, `sfx(txt, x, y, size, colour, age)`. Composited at `flushLetters()`, after the Shot; call it yourself before a wipe that must cover them.
- **Loops:** `LOOPS.name = t => {...}; LOOPS.name.len = 4;` makes a standalone loop (tests, GIFs, sheets), rendered with `--loop=name`.

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
- Two optional fields keep one name across Characters, so Chapters ask for them the same way: `sit` (0..1, seated: the hips drop to a seat) and `held(u, sw)` (a prop held against the body, over it and under the hands in front). A Character that can sit or hold things takes them under these names, lists them (and its seat height) in its header, and shows a seated pose and a held prop on its Model Sheet.

Clawd (examples/clawd/clawd.js) is a full example: 5 views, 31 emotions, hats, a lunchbox mouth, arm hooks for held props.
