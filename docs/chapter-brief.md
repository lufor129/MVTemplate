# Building one Chapter in parallel mode: the common brief

Give this file to every Chapter subagent (GUIDE.md step 5), with its own Chapter brief, `mv/briefs/cNN.md` (`node engine/storyboard.mjs --briefs` starts them; you add the Seam contracts, the shared helpers and the Guests). Replace `<mv>` with the MV folder.

---

You are building one Chapter of a music video, in parallel mode. Other subagents are building other Chapters at the same time. Every render command takes `--mv=<mv>` when the MV isn't the template root.

## Read first, in this order
1. Your Chapter brief (`<mv>/mv/briefs/cNN.md`), then any MV-wide notes next to it (`<mv>/mv/briefs/common.md`).
2. docs/rules.md (the rules and the animation principles), docs/engine.md (the API) and docs/review-loop.md (how to look at what you make). You don't need GUIDE.md: it is the workflow, and you are one step of it.
3. The Style Profile's STYLE.md (`styles/<style>/STYLE.md`, the style in `<mv>/mv/mv.json`)
4. GLOSSARY.md
5. `<mv>/mv/STORYBOARD.md`: the whole thing (Logline, Mode, Motif, Cast, Sound Words, Lyric Reading, the answered questions), then your Chapter's Shots and its neighbours'.
6. The Chapters already built in `<mv>/mv/chapters/`, first of all the first Chapter: the example to match in look, Character scale, background density, camera energy, boilSeed discipline, and how timing hangs off Lyric Lines, words and the Beat Grid.
7. The shared files you'll use (read, never edit): everything in `<mv>/mv/characters/`, the Characters listed in `<mv>/mv/mv.json`, engine/acting.js, engine/song.js, engine/timeline.js, and the Style Profile's scripts (its transitions above all).

## Timing
- Print the Lyric Lines with their indices, times and word times before you start (`node -e` over `<mv>/song/song.json`).
- Start each Shot at the time the Storyboard gives (a line's start, or the beat or bar it names). Anchor events to words (`wordAt(i, k)`), lines (`LINES[i].start`), Sections (`sec('Verse 2').start`) and beats (`beatAt`, `bpOf`, `nearestBeat`, `nearestBar`, `beatsAfter`, `pulse`), never hard-coded seconds. Put them in a "when things happen" block at the top of your file.

## Rules
- Edit ONLY your own Chapter file. If a shared helper is missing, write it privately inside your IIFE. If a shared file (engine, style, Characters, props, other Chapters, render.mjs…) has a bug, don't edit it: report it.
- Frames are pure functions of t: no state between frames, no `Math.random()`.
- Text: only the Sound Words (and, in lyric Mode, the painted lines) the Storyboard lists for your Chapter. Everything else is pictures.
- Keep every rule in the Style Profile's STYLE.md, and run its "What to check" list on your sheets.
- Call `boilSeed('<unique key>')` before each separate background element, prop or effect; give Characters that come and go a stable `boilKey`.
- Keep faces and key action above `KARAOKE_TOP` while a line is showing.
- Don't name a local variable after a p5 global (`pop`, `push`, `fill`, `color`, `scale`, `image`, `text`, `line`, `key`…): it breaks p5 calls in that scope. Keep every helper inside your IIFE: the build refuses a top-level name the browser, p5, the engine or the Style Profile already has.
- Make your Seams with the shared transition helpers in `<mv>/mv/characters/` when your Chapter brief names one; don't write your own version of it.
- A Seam out must reach its contract state by your last drawing; a Seam in that starts on a full cover must still show it at your first. MVs move on ones, so those are the frames at your edges (on twos they move: docs/engine.md › Time and motion).
- Guests you introduce are designed in your file. If your Chapter brief says one goes on `CAST`, define `CAST.<name> = (x, y, s, t, o) => …`, standing on (x, y), `s` on the Lead's size scale.
- Don't commit to git.

## Review loop (budget)
Use docs/review-loop.md and actually look at every image with the Read tool. Once a neighbour's Chapter exists, check your shared edge as the final will show it: `node engine/render.mjs --mv=<mv> --seams`. At least: one contact sheet per Shot; a strip for every key motion and every Seam (each Shot boundary, and the first and last 0.5 s of the Chapter, which must meet your Seam contracts exactly); a crop for every Guest's face and every face that carries the story. Fix what you find and look again. Name every check image with your Chapter's prefix (`c04_…`) under `<mv>/out/check/`. Keep frames under ~1.5 s each. At most one render process at a time from you.

## When you're done
Reply with: the Shot list with final times; what each Seam does and how you checked it; the Sound Words used; the CAST entries you added (signature and options); any changes from the Storyboard and why; shared-file bugs; what you had to work around that the template could do for the next MV; what you couldn't make work; the paths of 2–3 check images that best show the Chapter.
