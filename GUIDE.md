# Making an MV

Read this whole file before you do anything, then the Style Profile's `STYLE.md` (`styles/<style>/STYLE.md`, watercolour by default). This file covers how to make a hand-made-looking music video from a song: the workflow and its five Gates, the rules and animation principles that make it look good, and the engine. [GLOSSARY.md](GLOSSARY.md) defines the words used here (MV, Song, Lyric Line, Section, Chapter, Shot, Seam, Gate…); use them as defined.

The person decides **what** the MV is about, and may say no more than one sentence. This guide decides **how** it's made. If they ask for something the rules below forbid, do what they ask.

**No design here is final.** Clawd, the Researcher, the emotions, the props and the helpers are examples, not limits. Each MV designs its own Characters and props, with the same tools and rules, so everything belongs together.

---

## The three goals

- **Handmade.** It should look made by hand, frame by frame, in the Style Profile's medium, with no lettering beyond a few Sound Words.
- **Alive.** Something is always moving and something is always happening. Faces act instead of snapping, and Characters are big enough to feel.
- **One piece.** It's one film cut to one song, not a pile of clips. Plan it before you draw it, and link every Shot to the next.

Underneath all three, the viewer has to be able to follow it, at full speed, the first time. Timing (rule 4) is the rule models get wrong most often.

## The workflow

An MV is one copy of this template. The person puts `song.mp3` (any audio format named `song.*`) and `lyric.txt` in `song/`, and gives you a sentence. You then go through these steps in order. At each 🚦 **Gate**, stop: show the person what's there, say what you need from them, and wait for their approval before going on. Changes they ask for at a Gate are made before you pass it.

| # | step | makes | Gate |
|---|---|---|---|
| 1 | Analyse the Song | `song/song.json`, `out/check/songcheck.mp4` | 🚦 Song Check |
| 2 | Lyric Reading, then the Storyboard | `mv/STORYBOARD.md` | 🚦 Storyboard |
| 3 | Build the Leads | `mv/characters/*.js`, their Model Sheets | 🚦 Model Sheets |
| 4 | Shared pieces and the first Chapter | `mv/chapters/c01_*.js` | 🚦 First Chapter |
| 5 | The other Chapters, in parallel | `mv/chapters/*.js` | — |
| 6 | The Rough Cut | `out/rough/rough.mp4` | 🚦 Rough Cut |
| 7 | The final render | `out/final/<title>.mp4` | — |

### 1. Analyse the Song

`lyric.txt` holds the words as the person wrote them, one Lyric Line per line, with `[Verse 1]`, `[Chorus]`, `[Bridge]`… marks for Sections (without marks, blank lines separate them). It is the only source of words: the analysis only finds when they are sung (ADR 0003).

```bash
uv run --project tools/song python tools/song/analyze.py song      # first run downloads models; a few minutes
node engine/render.mjs --songcheck                                 # → out/check/songcheck.mp4
```

The analysis separates the vocals, places each line with Whisper, re-times it by forced alignment, finds every beat and bar start (the Beat Grid, ADR 0002), and makes the Sections, adding Intro / Interlude / Outro for unsung stretches. It prints every line with a confidence; below 0.5 means the two timing methods disagreed.

🚦 **Song Check.** Give the person `out/check/songcheck.mp4`: the song with a click on every beat (higher on bar starts), the Section name, a disc that flashes on each beat, a strip of lines and beats, and the karaoke lighting up word by word. Low-confidence lines show in red. Ask them to check that the clicks sit on the beat, the words light up as they're sung, the Sections change where the song does, and the tempo feels right (a beat tracker can lock onto half, double or 1.5× the felt tempo). Fix what they report by editing `song/song.json` by hand (a line's `start`, `end` and `tokens`; a Section's `start`/`end`; or the beat lists), then render the Song Check again. Don't re-run the analysis after hand edits: it would overwrite them.

### 2. Lyric Reading, then the Storyboard

First, the **Lyric Reading**: for each Lyric Line, what it means and what pictures it could become. Look up references and in-jokes you aren't sure of (the web is fine). Write what you're unsure of under "Open questions"; they go to the person at the Storyboard Gate.

Then write `mv/STORYBOARD.md` before any scene code:

```
Logline: one sentence. <who> wants ___, but ___, so ___.
Format: 16:9 or 9:16 · Karaoke: on/off · Style: watercolor
World: the settings, a small palette, light, and how the colour changes across the MV (the colour arc).
Motif: the thing that recurs and pays off.
Cast: Leads (designed first, approved on Model Sheets) and Guests (designed by the Chapter that introduces them).
Arc: the Leads' emotion keys across the whole song.
Sound Words: the handful of painted words in the whole MV, and where (or "none").
Lyric Reading: one line per Lyric Line: what it means · picture ideas.
Open questions: what you need the person to decide.

Chapter 1 · <name> · <Section(s)> · <start>–<end>
  A  start–end  [Seam in: ___]  line(s) sung · what's seen · the EVENT · the reaction · camera
     reads:  start–end  the first thing the viewer must understand
             start–end  the next one (where is the viewer's eye when it starts?)
  B  start–end  [Seam: ___]  ...
Chapter 2 · ...
  [Seam out of the MV: ___]
```

Structure:
- **Chapters follow Sections.** By default one Section is one Chapter. You may merge Sections into one Chapter or split one into two, but a Chapter's edges always fall on Section edges (`chapter()` checks). Each Chapter happens in one setting, and the camera moves through it.
- **Every Lyric Line gets at least one Shot**, with its own event. A long line can take several Shots; a very short line may share a Shot with the next. Unsung stretches (Intro, Interlude, Outro) get Shots too.
- **Every Seam gets a transition** chosen for it here, Chapter edges included. Nothing is added automatically.
- Repeated Sections (choruses) should rhyme: the same setting or motif, escalating each time.
- Times come from `song.json`: Shot starts on line starts or beats, big changes on bar starts.

Check it against the rules: an event in every Shot? Every read has time to land? A transition at every Seam? Any text beyond the listed Sound Words? Does the ending rhyme with the opening?

🚦 **Storyboard.** Show the person the Storyboard (and the Open questions). Revise it until they approve.

### 3. Build the Leads

Write each Lead as `mv/characters/<name>.js`, drawn to the Character Contract (see Characters, below). To use an example Character as-is, list it in `mv/mv.json` instead: `"characters": ["examples/clawd/clawd.js"]`; to change it, copy it into `mv/characters/`. Every Character gets a Model Sheet loop automatically:

```bash
node engine/render.mjs --loop=<name>-sheet --sheet=0.3,1.05,2.6 --cols=1 --w=1600 --out=out/check/<name>_sheet.jpg
```

Look at the sheet yourself first: every view on model, every emotion readable at a glance and different from the others, the turn steps through the views, the emotion changes act (squint, take, settle).

🚦 **Model Sheets.** Show the person each Lead's sheet. Guests don't need this Gate: the Chapter that introduces a Guest designs it.

### 4. Shared pieces and the first Chapter

Build what several Chapters share (the palette in mv.json, recurring props, sets the choruses return to) in `mv/characters/` (any shared script there loads before the Chapters), then the first Chapter, Shot by Shot, using the review loop below. This Chapter sets the look for the rest: scale of the Characters, density of the backgrounds, the camera's energy, the pace of the reads.

🚦 **First Chapter.** Render it as a clip with the song (`node engine/render.mjs --clip=<start>:<end>`) and show the person.

### 5. The other Chapters, in parallel

For a short MV, build the remaining Chapters yourself, in order. For a long one, use subagents, at most three at a time (each one renders in its own headless Chrome). Give each subagent:

- this file, the Style Profile's STYLE.md, GLOSSARY.md, the Storyboard, and the first Chapter's file as the example to match;
- its Chapter: the file name, its start and end, its Shots, the Seams into and out of it (and what the neighbouring Chapters show at those Seams);
- the rules: **edit only your own Chapter file.** If a shared helper is missing, write it privately inside your IIFE. If a shared file has a bug, report it; don't edit it. Guests your Chapter introduces live in your file; one that a later Chapter brings back goes on `CAST` (`CAST.name = (x, y, u, pose) => …`).
- the review loop below, and its budget.

When they're done, check every Seam between Chapters yourself (a strip across each one), and fix what doesn't join.

### 6. The Rough Cut

```bash
node engine/render.mjs --rough       # half size, 12 fps, with the song → out/rough/rough.mp4 (resumable)
```

Watch the rhythm against the song: does each line's picture land on its line, do the hits land on beats, is there any dead stretch?

🚦 **Rough Cut.** Give the person `out/rough/rough.mp4`. Make the changes they ask for, then render the final.

### 7. The final render

```bash
node engine/render.mjs --final --workers=3     # full size, mv.json fps, with the song → out/final/<title>.mp4 (resumable)
```

`--rough` and `--final` keep frames already on disk. After changing a Chapter, delete its frames (or the whole `frames/` folder) so they're rendered again.

---

## The rules

### 1. The medium is solid

Draw only with the Style Profile's primitives (`paint()`, `inkLine()`, `glow()`…) and follow its STYLE.md. Everything is flat 2D: Characters turn through drawn key views, and depth comes from overlap, scale and colour, never from a 3D projection.

### 2. No text, except a few Sound Words

- **Show it, don't write it.** No captions, no titles, no labels on objects, no signs, no speech bubbles with words, no words on screens. The karaoke (when it's on) already carries the lyrics, under the picture.
- **A sign that repeats the lyric is the classic failure.** If the line is "I'm lost" and a Character holds a sign saying "I'm lost", the Shot has failed. Act it: look left, then right, the map upside down, a sweat drop.
- **Reactions are painted marks, never letters**: `!`, `?`, zzz, sweat, hearts, a bulb, a rain cloud (emotes).
- **Sound Words** are the only lettering inside the picture: a painted FOOM, CHOMP or SLAM, or a single word the joke needs (`sfx()`, `letter()`). A handful in the whole MV, each listed in the Storyboard.

### 3. Something happens in every Shot

- **Every Shot needs an event:** something changes between its first frame and its last. A Character wants something, finds something, tries, fails, reacts or gets it. "Clawd stands in a meadow being cute" is not a Shot.
- **One focal action at a time**, staged with a clear silhouette and nothing competing for attention.
- **Cause, then reaction.** The reaction is often the funniest part, so give it time.
- **Pay it off.** Whatever you set up gets resolved on screen, in that Shot or a later one.
- **Act the line, don't illustrate the word.** A Shot shows what the Lyric Line means (from the Lyric Reading), as an event.

### 4. Timing: model the viewer

You know what happens because you wrote the code. The viewer doesn't: they see it once, at full speed, for the first time, while listening to the song. **For every moment, ask what the viewer needs to understand and how long that will take them, and time it for that.**

- **Write the reads.** For each Shot, list in order what the viewer has to understand. Every read needs time for the eye to find it, time to understand it, and a moment to register before the next starts. Small, distant, fast or subtle things take longer.
- **One read at a time.** When two things happen at once, the viewer sees only one. Put a cause and its reaction in sequence.
- **Fast actions, slow meanings.** A motion can be very quick if it's anticipated, but what it means needs held time. That contrast between quick and held is what gives a film rhythm.
- **Lead the eye.** The viewer looks at whatever moves, is bright, is big or is being looked at. Get their eye to the right place before an important read.
- **The song sets the clock.** A Shot lasts as long as its line, so fit the reads to the line, not the line to the reads: if a line is too short for its idea, simplify the idea or carry it into the next Shot. Land hits on beats and big changes on bar starts.

### 5. Alive

- **Nothing is ever still.** Every emotion has its own idle motion, cameras drift or push, backgrounds stir, and the linework boils. A frozen frame reads as a bug.
- **Faces act, they never snap.** Change moods with `ch.emotions()`, which does anticipation, a squint, a take and overshoot around every change.
- **Characters are big.** In a medium shot a Character fills a good share of the frame height (Clawd: u ≈ 20–28; in chorus and dance Shots the lead fills about 40% of the frame). Tiny Characters are for wide establishing Shots only.
- **Everything moves on the beat.** Idles, bounces and dances all read the Beat Grid, so the whole film shares the song's pulse, drift and all.

### 6. Every Seam has a transition

- Into the first Shot, between every pair of Shots, and out of the last: never start on a hard frame, and never just stop.
- **Pick a transition that belongs to the story**, and don't default to the same one every time: a brush wipe, an iris or shaped iris, a whip pan with a smear, a match cut (the same shape or motion across the cut), a cut on action (finish the move in the next Shot), a camera move that carries through, a fade or push from paper.
- A plain cut is fine only when it's on action, on a beat, or a deliberate smash cut.
- **Changes inside a Shot are transitions too:** emotions go through `ch.emotions()`, turns through `ch.turn()`, and props arrive and leave on arcs, never popping in.

### 7. One piece

- **One world** with a colour arc across the song. **One thread**: a beginning, a middle and an end, with the Leads' emotional arc following it.
- **Rhyme the ending with the opening:** the same place, pose or motif, changed.
- **Link Shots:** motion continues across cuts, screen direction stays consistent, props and characters carry over.

---

## Animation principles

Motion written as code comes out mechanical, because code moves every part at once, on the same curve, by the same amount. These principles fix that.

- **Anticipation.** Before a big move, a small move the opposite way: a crouch before a jump, a wind-up before a throw, a squint before a take. `jump()` and `ch.emotions()` build it in.
- **Squash and stretch.** Bodies squash on impact and stretch when they move fast, keeping their volume (`sq`).
- **Slow in, slow out.** Run every progress through an easing (`ease`, `easeIn`, `easeOut`, `backOut`); a plain `lerp` over time looks mechanical.
- **Weight.** Heavy things start and stop slowly and land with little bounce; light things snap, bounce and flutter.
- **Arcs.** Thrown props, hops, arm swings and head turns move on arcs (`arcPt`), not straight lines.
- **Overlapping action and follow-through.** The eyes lead, the body follows, and arms, hats, props and tails drag behind, overshoot and settle last (`spring`, `ring`, `backOut`).
- **Avoid twinning.** Give one arm the action and the other something smaller; offset timings, phases and seeds between Characters so a crowd doesn't bounce in unison.
- **Exaggeration.** Push poses, takes, squash and leans further than feels natural. In a short cartoon, subtle reads as nothing.
- **Strong key poses.** Each Shot's storytelling poses should read as stills before any motion goes between them.
- **Show the thought.** A Character notices, thinks, then acts, and the eyes move first.
- **Secondary action** supports the main one (a hat bobbing, an emote popping) but never competes with it.

---

## The review loop

You can't see motion by reading code. Render and look at every Shot, at three zoom levels (add `--mv=<dir>` when the MV isn't the template root):

```bash
node engine/render.mjs --sheet=23.1,23.8,24.5,25.2 --cols=4 --w=480 --out=out/check/a.jpg   # the shape of a Shot or Chapter
node engine/render.mjs --strip=24.1:24.6 --out=out/check/strip.jpg                          # EVERY frame of a moment
node engine/render.mjs --sheet=24.3 --crop=760,420,500,400 --w=500 --out=out/check/face.jpg  # full-resolution detail
node engine/render.mjs --strip=24.1:24.6 --crop-at=960,700,500,400 --out=out/check/feet.jpg  # detail that follows a WORLD point
node engine/render.mjs --clip=23:38.5 --out=out/check/chorus.mp4                             # a stretch with the song
```

Open each image with the Read tool and actually look at it. Check:

- **Read:** is each Shot's event clear from its sheet alone? Are the Characters big enough, and do they separate from the background? Is anything important under the karaoke band (above `KARAOKE_TOP` only)?
- **Timing:** render a Shot at a fixed step (every 0.1–0.15 s) and read it like a viewer: where are they looking, do they understand it yet? Count the frames each read gets (24 = 1 s). Does each line's picture start with the line?
- **Motion:** in strips, does every move have anticipation and follow-through? Any pops or snaps? Parts moving at different times? Anything at constant speed, or mirrored left and right?
- **Boil:** in a strip, still things change only on boil frames. Anything still that changes every frame needs its own `boilSeed()`.
- **Contacts:** feet on the ground, held things touching the hand, thrown things leaving from it.
- **Seams:** the first and last 0.5 s of every Shot. Does each open and close with its transition?
- **Rules:** any text beyond the Sound Words? Any 3D? Any dead stretch?

**Budget:** at least one sheet per Shot, a strip for every key motion and Seam, and a crop for every face that carries the story. Sheets cost about 0.1–2.5 s per frame: don't skip them.

---

## The engine

### Files

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
| `engine/build.mjs`, `engine/render.mjs` | gather the MV into `.build/mv.js`; render sheets, clips, the Gates' videos |
| `styles/<name>/` | the Style Profile: STYLE.md, its primitives, transitions, karaoke look |
| `examples/clawd/` | Clawd, an example Character |
| `examples/pdoom/` | an example MV: the P(doom) song analysed, the Researcher, and its first Chapters |
| `tools/song/` | the song analysis |
| `studio.html` | open it in Chrome to scrub or play along (`node engine/build.mjs` first; `?t=`, `?loop=`, `?songcheck`) |

### Frames are pure functions of time

- **Frames render in parallel and out of order.** A Shot is `fn(t, lt, dur)` and must draw the same frame for the same `t`, every time. No state carried between frames, no counters, no `Math.random()`, no physics that integrates frame by frame. Compute everything from `t`, in closed form.
- Randomness: `hash(i)` for stable per-object values, `jit(a)`/`random()` for boil.
- **Each Shot paints the whole frame**, background included.
- **Canvas:** 1920×1080 for 16:9, 1080×1920 for 9:16 (`W`, `H`), origin top-left, y down. Compose for the MV's format.

### Chapters and Shots

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

### The Song

| function | what it gives |
|---|---|
| `bpOf(t)` | beat position at t (12.5 = halfway between beats 12 and 13), from the real beat times |
| `beatN(t)`, `beatAt(n)` | the beat t is in; the time of beat n |
| `barOf(t)`, `barN(t)`, `barAt(n)` | the same for bars |
| `pulse(t, k)`, `pulse2(t, k)` | 1 on each beat (or eighth), then decaying: hits, bounces, flashes |
| `nearestBeat(t)`, `nearestBar(t)` | snap a time to the grid |
| `BEAT`, `BAR` | typical beat and bar length in seconds, for sizing motions |
| `lineAt(t)`, `sectionAt(t)` | the Lyric Line or Section at t: `{ i, line/section, k }` (k = 0..1 through it) |
| `LINES`, `SECTIONS`, `DUR`, `SONG` | the raw data |

### Time and motion

- **Progress and keys:** `seg(t, a, b)` (0..1 through [a, b]), `kf(t, [[t0, v0], [t1, v1], ...], ease)` (keyframes; values may be arrays), `lerp`, `clamp`, `frac`, `wob(t, freq, phase)`, `TAU`.
- **Easing:** `ease`, `easeIn`, `easeOut`, `backOut` (overshoot), `elasticOut`.
- **Acting:** `jump(t, t0, t1, h)` → `{dy, sq}`; `take(t, t0, amt)` → `{sq, dy}`; `spring(t, t0, k, w)`; `ring(t, [t0, …])`; `arcPt(p0, p1, h, k)`; `onTwos(t)` (hold each drawing two frames).
- **Camera:** `camBegin(cx, cy, zoom, rot)` … `camEnd()` (world point to screen centre; one level; always pair them); `toScreen(x, y)`; `shakeXY(t, amount)`.
- **Lettering** (Sound Words only): `letter(txt, x, y, size, colour, {pop, rot, alpha, screen})`, `sfx(txt, x, y, size, colour, age)`. Composited at `flushLetters()`, after the Shot; call it yourself before a wipe that must cover them.
- **Loops:** `LOOPS.name = t => {...}; LOOPS.name.len = 4;` makes a standalone loop (tests, GIFs, sheets), rendered with `--loop=name`.

### Characters

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
- Keep every Character on model in every Shot: the same shape and features throughout.
- Characters that come and go mid-Shot need a stable `boilKey`.

Clawd (examples/clawd/clawd.js) is a full example: 5 views, 31 emotions, hats, a lunchbox mouth, arm hooks for held props. The Researcher (examples/pdoom/mv/characters/researcher.js) is a second, with 2 views.

## Common failures

These make an MV look generated. Check your Storyboard and sheets against them:

- signs, captions, labels or speech bubbles with words; a sign that repeats the lyric
- a picture that illustrates a word of the line instead of acting what it means
- a Character standing still and smiling while nothing happens
- everything moving at one brisk speed, with events stacked on top of each other and no holds
- moments that are over before the viewer understands them; a Shot whose picture starts late or early against its line
- a tiny Character in a big empty landscape for the whole MV
- faces that snap from one expression to another
- mechanical motion: linear moves, every part moving at once, arms or dancers in sync
- timid poses and takes that barely read
- jittery linework (`boilSeed`)
- hard cuts everywhere, or an MV that just starts and stops
- 3D rotation, perspective boxes or projected turns
- props floating near a hand instead of touching it
- every Chapter a different world with nothing linking them; choruses that don't rhyme
- action or faces hidden under the karaoke band
