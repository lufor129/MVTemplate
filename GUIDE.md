# Making an MV

Read this whole file before you do anything, then the Style Profile's `STYLE.md` (`styles/<style>/STYLE.md`, watercolour by default). This file covers how to make a hand-made-looking music video from a song: the workflow and its five Gates, the rules and animation principles that make it look good, and the engine. [GLOSSARY.md](GLOSSARY.md) defines the words used here (MV, Song, Lyric Line, Section, Chapter, Shot, Seam, Gate…); use them as defined.

The person decides **what** the MV is about, and may say no more than one sentence. This guide decides **how** it's made. If they ask for something the rules below forbid, do what they ask.

**Talk with the person through the AskUserQuestion tool.** Whenever they have to decide something (the Brief, the Open questions, each Gate's approval, a choice between fixes), put it to them as a question with 2–4 options, the one you recommend first and marked "(Recommended)". Show what they're judging (the video, the Storyboard, the sheet) before the question. Talk in the person's language.

**No design here is final.** Clawd, its emotions, the props and the helpers are examples, not limits. Each MV designs its own Characters and props, with the same tools and rules, so everything belongs together.

---

## The four goals

- **Handmade.** It should look made by hand, frame by frame, in the Style Profile's medium (watercolour by default), keeping every rule its STYLE.md sets, with no lettering beyond what the Storyboard lists.
- **Alive.** Something is always moving and something is always happening. Faces act instead of snapping, and Characters are big enough to feel.
- **Refined.** Every frame should hold up as a still. Spend detail where the viewer's eye lands and where the camera is close: a face in close-up, the prop the line is about, the ground under the feet. Leave the rest simple on purpose. What counts as detail depends on the Shot, the style and the song: decide it each time.
- **One piece.** It's one film cut to one song, not a pile of clips. Plan it before you draw it, and link every Shot to the next. The viewer must always know where they are and who is where. Each Shot continues what the last one left in their eye: the place, the direction, the light, the state of things.

Underneath all four, the viewer has to be able to follow it, at full speed, the first time. Timing (rule 4) is the rule models get wrong most often.

## The workflow

An MV is one copy of this template. The person puts `song.mp3` (any audio format named `song.*`) and `lyric.txt` (or `lyrics.txt`) in `song/`, and gives you a sentence; `song/translation.txt` is optional (see the Brief). Both of the first two are required: the template makes MVs for sung songs, and the Lyric Sheet drives the timing, the Sections and the Shots. If either is missing, ask for it before anything else. You then go through these steps in order. At each 🚦 **Gate**, stop: show the person what's there, say what you need from them, and wait for their approval before going on. Changes they ask for at a Gate are made before you pass it.

| # | step | makes | Gate |
|---|---|---|---|
| 0 | The Brief, and a new Style Profile if one is asked for | `mv/mv.json`, `styles/<name>/` | 🚦 Style Sample (only with a new style) |
| 1 | Analyse the Song | `song/song.json`, `out/check/songcheck.mp4` | 🚦 Song Check |
| 2 | Lyric Reading, then the Storyboard | `mv/STORYBOARD.md` | 🚦 Storyboard |
| 3 | Build the Leads (if any) | `mv/characters/*.js`, their Model Sheets | 🚦 Model Sheets (only with Leads) |
| 4 | Shared pieces and the first Chapter | `mv/chapters/c01_*.js` | 🚦 First Chapter |
| 5 | The other Chapters, in parallel | `mv/chapters/*.js` | — |
| 6 | The Rough Cut | `out/rough/rough.mp4` | 🚦 Rough Cut |
| 7 | The final render | `out/final/<title>.mp4` | — |
| 8 | Publish (when the person wants to post it) | `out/shorts/*_9x16.mp4`, `out/publish/description.txt` | — |
| 9 | Harvest: what this MV taught, back into the template | a branch of the template | each item is the person's call |

### 0. The Brief

The sentence says what the MV is about; settle what it leaves open before anything else, in one AskUserQuestion call (skip what the person already said):

- **Mode**: what kind of MV it is. It decides what counts as an event (rule 3) and how the Logline reads. A mode is a lean, not a cage: a narrative MV can have a performance chorus.

  | mode | what carries it | an event is |
  |---|---|---|
  | narrative | Characters with a want, through a story | a Character wants, tries, fails, finds, reacts |
  | performance | someone performing the song: a singer, a band, dancers | the performance builds: a new player, a move, a lift the camera finds |
  | mood | a place, light, weather or abstract forms, maybe no Characters at all | the world transforms: light, colour, form, season, scale |
  | lyric | the sung words, painted into the picture | words arrive, act out what they say, and leave |

- **Format**: 16:9 or 9:16.
- **Karaoke**: on or off (usually off in lyric mode, where the words are already in the picture). With it on, a translation can sit on a row above the sung words: `song/translation.txt`, one translated line per Lyric Line, in order (`[Section]` marks and blank lines are skipped; the build stops if the counts differ). Ask whether they want one, and write it (or take theirs) before the Song Check.
- **Style**: always ask, even while `styles/` holds only one. Offer each existing Style Profile (its `style.json` `description`), the one that fits the sentence best first; the person may also describe a look that isn't there yet (cut paper, pixel art, pastel, ink line…).

Also ask whether they have references (a character to reuse, photos, colours, an MV they love). Put any files in `mv/refs/` and look at them. Write the answers into `mv/mv.json` (`title`, `mode`, `format`, `karaoke`, `style`).

**A new style.** If the person asked for a look no Style Profile has, make one in this MV's copy before going on, as [styles/README.md](styles/README.md) describes: `styles/<name>/` with its `style.json`, a `STYLE.md` (the rules of the medium, its drawing API, its "Signature features" and a "What to check" list) and scripts that define every global in that table, so the engine, the Characters and the Chapters draw with it unchanged. Start from a copy of the profile closest to the look (`watercolor/` paints with p5.brush; `cel/`, `cutout/` and `pixel/` draw plain p5 shapes) and change what the look needs: not only the texture, but everything styles/README.md lists under "A look of its own" (how it tones colour, shades with the light, draws lines, moves, letters), or it will look like the profile it came from. The engine's `style-sample` loop shows any profile off: a sky, hills, a hatched rock, a sun and its light, a Character acting and jumping (the Lead, or Clawd, when mv.json lists it in `characters`), an emote, a Sound Word, a brush wipe and the karaoke band. Render it and check it against the Signature features:

```bash
node engine/render.mjs --loop=style-sample --sheet=0.5,1.6,2.75,3.5 --cols=2 --w=1600 --out=out/check/style_sample.jpg
node engine/lineup.mjs                     # the squint test: every profile, small, side by side → out/check/style_lineup.jpg
```

In the lineup, the new profile must be told from every other at a glance. If it can't, change more than the texture.

🚦 **Style Sample.** Show the person the sheet and ask whether this is the look. Revise it until they approve. If it turns out well, bring the profile back to the template afterwards so the next MV can pick it.

### 1. Analyse the Song

`lyric.txt` holds the words as the person wrote them, one Lyric Line per line, with `[Verse 1]`, `[Chorus]`, `[Bridge]`… marks for Sections (without marks, blank lines separate them). It is the only source of words: the analysis only finds when they are sung (ADR 0003). If it has neither marks nor blank lines, add the marks yourself from the lyrics' structure (verses, the repeated chorus, the bridge, spoken bits) before the analysis, change nothing else, and show them at the Song Check. Section names come out unique: a repeated name is numbered (`Chorus`, `Chorus 2`; `Interlude`, `Interlude 2`), so `sec('Interlude 2')` finds the second one.

```bash
uv run --project tools/song python tools/song/analyze.py song      # first run downloads models; a few minutes
node engine/render.mjs --songcheck                                 # → out/check/songcheck.mp4
```

The analysis separates the vocals, places each line with Whisper, re-times it by forced alignment, finds every beat and bar start (the Beat Grid, ADR 0002), and makes the Sections, adding Intro / Interlude / Outro for unsung stretches. It prints every line with a confidence; below 0.5 means the two timing methods disagreed.

On a sung vocal (a generated one above all) Whisper can skip a whole stretch, or hear words nobody sings ("see you next time"), and a prompt doesn't fix it. So wherever lyric lines fail to match, the analysis hears that stretch again in chunks of at most 8 s and keeps the first try in `song/.analysis/asr.orig.json` (`--no-rescue` skips this). The beat tracker, for its part, can put a bar start in a stop-time break or on a pickup: the analysis lists every bar without the usual number of beats, and the Song Check draws those in red.

🚦 **Song Check.** Give the person `out/check/songcheck.mp4`: the song with a click on every beat (higher on bar starts), the Section name, a disc that flashes on each beat, a strip of lines and beats, and the karaoke lighting up word by word. Low-confidence lines show in red. Ask them to check that the clicks sit on the beat, the high click on each bar start (listen hardest at the red bars), the words light up as they're sung, the Sections change where the song does, and the tempo feels right (a beat tracker can lock onto half, double or 1.5× the felt tempo). Fix what they report by editing `song/song.json` by hand (a line's `start`, `end` and `tokens`; a Section's `start`/`end`; or the beat lists), then render the Song Check again. Don't re-run the analysis after hand edits: it would overwrite them.

### 2. Lyric Reading, then the Storyboard

First, the **Lyric Reading**: for each Lyric Line, what it means and what pictures it could become. Look up references and in-jokes you aren't sure of (the web is fine). Write what you're unsure of under "Open questions"; they go to the person at the Storyboard Gate.

Then write `mv/STORYBOARD.md` before any scene code:

```
Logline: one sentence. Narrative: <who> wants ___, but ___, so ___. Other modes: what changes from the first frame to the last.
Mode: ___ · Format: ___ · Karaoke: on/off · Style: ___ (from the Brief)
World: the settings, a small palette, light, and how the colour changes across the MV (the colour arc).
Motif: the thing that recurs and pays off.
Cast: Leads (designed first, approved on Model Sheets) and Guests (designed by the Chapter that introduces them), or "none".
Arc: the Leads' emotion keys across the whole song (no Leads: the world's arc).
Sound Words: the handful of painted words in the whole MV, and where (or "none"). Lyric mode: also which lines are painted in, and how they arrive and leave.
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

As you write each Shot, think what it needs to look refined, and how it continues the one before.

Check it against the rules: an event in every Shot? Every read has time to land? A transition at every Seam? Any lettering beyond what it lists (Sound Words, and painted lines in lyric mode)? Does the ending rhyme with the opening?

🚦 **Storyboard.** Show the person the Storyboard (and the Open questions). Revise it until they approve.

### 3. Build the Leads

Skip this step and its Gate when the Storyboard has no Leads.

Write each Lead as `mv/characters/<name>.js`, drawn to the Character Contract (see Characters, below). To use an example Character as-is, list it in `mv/mv.json` instead: `"characters": ["examples/clawd/clawd.js"]`; to change it, copy it into `mv/characters/`. Every Character gets a Model Sheet loop automatically:

```bash
node engine/render.mjs --loop=<name>-sheet --sheet=0.3,1.05,2.6 --cols=1 --w=1600 --out=out/check/<name>_sheet.jpg
```

Look at the sheet yourself first: every view on model, every emotion readable at a glance and different from the others (by face, or by body and colour for a Character without one), the turn steps through the views, the emotion changes act (squint, take, settle).

🚦 **Model Sheets.** Show the person each Lead's sheet. Guests don't need this Gate: the Chapter that introduces a Guest designs it.

### 4. Shared pieces and the first Chapter

Build what several Chapters share (the palette in mv.json, recurring props, sets the choruses return to) in `mv/characters/` (any shared script there loads before the Chapters), then the first Chapter, Shot by Shot, using the review loop below. This Chapter sets the look for the rest: scale of the Characters, density of the backgrounds, the camera's energy, the pace of the reads.

🚦 **First Chapter.** Render it as a clip with the song (`node engine/render.mjs --clip=<start>:<end>`) and show the person.

### 5. The other Chapters, in parallel

For a short MV, build the remaining Chapters yourself, in order. For a long one, use subagents, at most three at a time (each one renders in its own headless Chrome). Start a new one whenever one finishes.

Before the first one starts, move anything two Chapters will both draw (a troupe of background dancers, a set the choruses return to) into `mv/characters/`, and the transitions too: a Seam two Chapters share is drawn by one helper there (a whip smear, swinging doors, a cloud of steam, in the MV's own world), so both sides draw the same thing. Each subagent gets the common brief, [docs/chapter-brief.md](docs/chapter-brief.md) (what to read, the API, the rules, the review budget, what to report), plus its own:

- **its Chapter:** the file name, `chapter('<name>', start, end, …)` with the Section names, the Shots it takes from the Storyboard, its Sound Words, its Guests;
- **a contract for each Seam it shares.** Neighbours are built at the same time and can't look at each other, so write down the exact frame where they meet, the same text in both briefs. Examples that worked:
  - a wipe split in half: the earlier Chapter ends with `brushWipe((lt - (dur - .3)) / .6, cols)` (covering the frame exactly at its end), the later one starts with `brushWipe(.5 + lt / .6, cols)`, the same `cols`;
  - a full-frame colour: "at the edge the whole frame is `flash(1, '#F4B6C2')` with a white highlight arc upper left"; the later Chapter starts on it and breaks it;
  - a camera state: "rolled +0.35 rad and solid red at the edge"; "zoom z = 1 − .06·k², ending at .94";
  - a held tableau: the earlier Chapter writes the exact positions, scales and camera formula in a comment block `SEAM OUT TO CHAPTER n` at the top of its file, and the later one, started after it, copies them.

  On twos (`"hold": 2`) the last drawing a Chapter shows is at its end − 1/12 s (end − hold/fps), and the next Chapter's first drawing can come a little after its start. A contract that meets on a full cover (a flash, a solid wipe, black) must be reached by the earlier Chapter's last drawing and still be there at the later one's first; say so in both briefs.
- **Guests:** a Guest a later Chapter brings back (a curtain call, a callback) goes on `CAST` as `CAST.<name> = (x, y, s, t, o) => …`, standing on (x, y), with `s` on the Lead's size scale. Its subagent reports the signature and options. A Chapter that uses several Guests starts after the Chapters that define them.

A subagent that stops at the usage limit keeps what it has written: when the limit resets, send it a message (SendMessage, by its name) to carry on, rather than starting a new one.

When they're done, check every Seam between Chapters yourself, as the final will show it:

```bash
node engine/render.mjs --seams     # → out/check/seams.jpg: each Chapter edge, the drawings the viewer sees on either side
```

It flags (⚠) a full cover no frame shows (the earlier Chapter reaches it after its last drawing, or the later one has left it by its first) and (•) a jump across the edge much bigger than the motion around it, which is fine only where the Storyboard asks for a cut, a flash or a smash. Fix what doesn't join.

### 6. The Rough Cut

```bash
node engine/render.mjs --rough       # half size, 12 fps, with the song → out/rough/rough.mp4 (resumable)
```

`--rough` runs the Seam check too when its frames are done: read its report before you watch. Then watch the rhythm against the song: does each line's picture land on its line, do the hits land on beats, is there any dead stretch?

🚦 **Rough Cut.** Give the person `out/rough/rough.mp4`. Make the changes they ask for, then render the final.

### 7. The final render

```bash
node engine/render.mjs --final --workers=3     # full size, mv.json fps, with the song → out/final/<title>.mp4 (resumable)
```

`--rough` and `--final` keep frames already on disk. After changing a Chapter, delete its frames (or the whole `frames/` folder) so they're rendered again.

### 8. Publish

When the person wants to post the MV, ask which of these they need:

- **A vertical short** (Reels, Threads, TikTok, Shorts). Choose a stretch with them that stands on its own (the opening, a chorus, the ending), then:

  ```bash
  python3 tools/shorts/make_short.py --mv=<dir> --from=2 --to=34.5 --name=open --title="BIG LINE|smaller line"
  ```

  A 16:9 MV becomes its picture in the middle of a 9:16 frame over a blurred copy of itself, the title above and the lyric below in the Style Profile's fonts and colours, each word lighting up as it is sung → `out/shorts/<name>_9x16.mp4`. A 9:16 MV is cut as it is.
- **The YouTube description**: the chapters from the Storyboard, the lyrics and the translation, within YouTube's rules (chapters from 0:00, each at least 10 s; no angle brackets; at most 5000 characters, past which the translation moves to a pinned comment):

  ```bash
  python3 tools/publish/description.py --mv=<dir> --intro=intro.txt --about=about.txt --tags="#MusicVideo"
  ```

  The opening (`--intro`) is the person's: who or what the song is for. Write it with them.

Tools letter text into PIL images that ffmpeg overlays, never with ffmpeg's `drawtext`, which many ffmpeg builds don't have.

### 9. Harvest

An MV is a copy of the template, so what it taught stays in the copy unless someone brings it back. When the MV is done, compare the copy with the template (`diff -r` over `engine/`, `styles/`, `tools/` and `docs/`; what the Chapters and their briefs had to work around; what the person changed their mind about after seeing it) and list what could come back: engine and Style Profile changes, rules learned the hard way, tools made for this MV. Put each item to the person as its own question (bring it back as it is, generalised, or not), then make the chosen ones on a branch of the template and show them before anything is merged.

---

## The rules

### 1. The medium is solid

Draw only with the Style Profile's primitives (watercolour: `paint()`, `inkLine()`, `glow()`…) and keep every rule its STYLE.md sets, above all what the look forbids. Whatever the style, Characters turn through drawn key views (the Character Contract), never a 3D projection.

### 2. No text, except a few Sound Words (and the lyrics, in lyric mode)

- **Show it, don't write it.** No captions, no titles, no labels on objects, no signs, no speech bubbles with words, no words on screens. The karaoke (when it's on) already carries the lyrics, under the picture.
- **A sign that repeats the lyric is the classic failure.** If the line is "I'm lost" and a Character holds a sign saying "I'm lost", the Shot has failed. Act it: look left, then right, the map upside down, a sweat drop.
- **Reactions are painted marks, never letters**: `!`, `?`, zzz, sweat, hearts, a bulb, a rain cloud (emotes).
- **Sound Words** are the only lettering inside the picture: a painted FOOM, CHOMP or SLAM, or a single word the moment needs (`sfx()`, `letter()`). A handful in the whole MV, each listed in the Storyboard.
- **Lyric mode** is the one exception: the sung words are the picture. The Storyboard lists which lines are painted in (`letter()`), and they act out what they say instead of sitting there as captions. Everything else in this rule still holds.

### 3. Something happens in every Shot

- **Every Shot needs an event:** something changes between its first frame and its last. What changes depends on the mode (step 0): a Character wants something, finds something, tries, fails, reacts or gets it (narrative); the performance builds (performance); the light, colour, weather or form transforms (mood); the words arrive, act and leave (lyric). "Clawd stands in a meadow being cute" is not a Shot, and neither is a pretty landscape that only drifts.
- **One focal action at a time**, staged with a clear silhouette and nothing competing for attention.
- **Cause, then reaction.** The reaction is often what the viewer remembers, so give it time.
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

- **Nothing is ever still.** Every emotion has its own idle motion, cameras drift or push, backgrounds stir, and the Style Profile's texture moves (watercolour: the linework boils). A frozen frame reads as a bug.
- **Faces act, they never snap.** Change moods with `ch.emotions()`, which does anticipation, a squint, a take and overshoot around every change.
- **Characters are big.** In a medium shot a Character stands about 15–20% of the frame's shorter side tall; in chorus and dance Shots the Lead fills about 40% of it. Tiny Characters are for wide establishing Shots only.
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
- **Timing:** render a Shot at a fixed step (every 0.1–0.15 s) and read it like a viewer: where are they looking, do they understand it yet? Count the frames each read gets (at mv.json's `fps`: 24 frames = 1 s by default). Does each line's picture start with the line?
- **Motion:** in strips, does every move have anticipation and follow-through? Any pops or snaps? Parts moving at different times? Anything at constant speed, or mirrored left and right?
- **Boil:** in a strip, still things change only on boil frames. Anything still that changes every frame needs its own `boilSeed()`.
- **Contacts:** feet on the ground, held things touching the hand, thrown things leaving from it.
- **Seams:** the first and last 0.5 s of every Shot. Does each open and close with its transition? Between Chapters, `--seams` shows the edge as the final will.
- **Refined, and continuous:** look at each Shot as a still and next to its neighbours: is it refined where the eye goes, and does it follow on from the last Shot?
- **Rules:** any lettering the Storyboard doesn't list? Any dead stretch?
- **Style:** the "What to check" list in the Style Profile's STYLE.md.

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
| `engine/stylesample.js` | the `style-sample` loop, for the Style Sample Gate |
| `engine/build.mjs`, `engine/render.mjs` | gather the MV into `.build/mv.js` (refusing top-level names the page already has); render sheets, clips, the Gates' videos, the Seam check |
| `engine/globals.json`, `engine/globals.mjs` | the names the browser and p5 already take; refresh after a Chrome or p5 update (`node engine/globals.mjs`) |
| `engine/lineup.mjs` | the style-sample in every Style Profile, side by side, for the Style Sample Gate |
| `styles/<name>/` | the Style Profile: STYLE.md, its primitives, transitions, karaoke look |
| `examples/clawd/` | Clawd, an example Character |
| `tools/song/` | the song analysis |
| `tools/shorts/`, `tools/publish/` | the vertical short and the YouTube description (step 8) |
| `studio.html` | open it in Chrome to scrub or play along (`node engine/build.mjs` first; `?t=`, `?loop=`, `?songcheck`) |

### Frames are pure functions of time

- **Frames render in parallel and out of order.** A Shot is `fn(t, lt, dur)` and must draw the same frame for the same `t`, every time. No state carried between frames, no counters, no `Math.random()`, no physics that integrates frame by frame. Compute everything from `t`, in closed form.
- Randomness: `hash(i)` for stable per-object values, `jit(a)`/`random()` for boil.
- **Each Shot paints the whole frame**, background included.
- **Top-level names.** Keep helpers inside the file's IIFE. A name an MV script declares at its top level must not be one the page already has: the browser's (`var fence = …` or `name = …` fails silently, or turns the value into a string), p5's (`line`, `text`, `map`…), or the engine's and the Style Profile's (a second `function paint` quietly replaces the first). The build refuses them.
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
| `wordAt(i, k)` | when word k of Lyric Line i starts (CJK: character k): anchor events to words |
| `beatsAfter(t, n)` | n beats after the beat nearest t |
| `BEAT`, `BAR` | typical beat and bar length in seconds, for sizing motions |
| `lineAt(t)`, `sectionAt(t)` | the Lyric Line or Section at t: `{ i, line/section, k }` (k = 0..1 through it) |
| `LINES`, `SECTIONS`, `DUR`, `SONG` | the raw data |

### Time and motion

- **On twos:** `"hold": 2` in mv.json holds every drawing two frames, the whole picture at once (cel, cut-out and pixel set it); `onTwos(t)` does it for one Shot.
- **Progress and keys:** `seg(t, a, b)` (0..1 through [a, b]), `kf(t, [[t0, v0], [t1, v1], ...], ease)` (keyframes; values may be arrays), `lerp`, `clamp`, `frac`, `wob(t, freq, phase)`, `TAU`.
- **Easing:** `ease`, `easeIn`, `easeOut`, `backOut` (overshoot), `elasticOut`.
- **Acting:** `jump(t, t0, t1, h)` → `{dy, sq}`; `take(t, t0, amt)` → `{sq, dy}`; `spring(t, t0, k, w)`; `ring(t, [t0, …])`; `arcPt(p0, p1, h, k)`; `onTwos(t)` (hold each drawing two frames).
- **Light:** `LIGHT = [x, y]`, the way the light travels in this Shot (from the upper left by default, or mv.json `"light"`). Style Profiles that shade by themselves read it: cel puts its shadow sides away from it, watercolour loses its lines toward it.
- **Camera:** `camBegin(cx, cy, zoom, rot)` … `camEnd()` (world point to screen centre; one level; always pair them); `toScreen(x, y)`; `shakeXY(t, amount)`.
- **Boil:** mv.json `"boil"` is how many times a second still lines are redrawn (0: drawn once and still, cel's default; 12: a lively hand-drawn boil) and `"boilAmp"` how far their edges wander (1 = the Style Profile's own amount, .3 = gentle). Try other values for one render with `--boil=6 --boil-amp=.3`.
- **Karaoke:** while a Chapter letters the sung line itself (a closing caption), `KARAOKE_HIDE.push([t0, t1])` hides the band. `--no-karaoke` renders the picture alone, for re-cuts that letter it their own way (the vertical short).
- **Lettering** (Sound Words, and painted lines in lyric mode): `letter(txt, x, y, size, colour, {pop, rot, alpha, screen})`, `sfx(txt, x, y, size, colour, age)`. Composited at `flushLetters()`, after the Shot; call it yourself before a wipe that must cover them.
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
- A Character doesn't need a face. An electron, a spark or a lamp leaves out eyes and mouth; its emotions are body motion, colour and emotes, and `ch.emotions()` still acts every change.
- Keep every Character on model in every Shot: the same shape and features throughout.
- Characters that come and go mid-Shot need a stable `boilKey`.
- Two optional fields keep one name across Characters, so Chapters ask for them the same way: `sit` (0..1, seated: the hips drop to a seat) and `held(u, sw)` (a prop held against the body, over it and under the hands in front). A Character that can sit or hold things takes them under these names, lists them (and its seat height) in its header, and shows a seated pose and a held prop on its Model Sheet.

Clawd (examples/clawd/clawd.js) is a full example: 5 views, 31 emotions, hats, a lunchbox mouth, arm hooks for held props.

## Common failures

These make an MV look generated. Check your Storyboard and sheets against them:

- signs, captions, labels or speech bubbles with words; a sign that repeats the lyric
- a picture that illustrates a word of the line instead of acting what it means
- a Character standing still and smiling while nothing happens, or a landscape that only drifts
- everything moving at one brisk speed, with events stacked on top of each other and no holds
- moments that are over before the viewer understands them; a Shot whose picture starts late or early against its line
- a tiny Character in a big empty landscape for the whole MV
- faces that snap from one expression to another
- mechanical motion: linear moves, every part moving at once, arms or dancers in sync
- timid poses and takes that barely read
- jittery linework (`boilSeed`)
- hard cuts everywhere, or an MV that just starts and stops
- anything the Style Profile's STYLE.md forbids (watercolour: 3D rotation or perspective, plain p5 shapes, pure black or white)
- props floating near a hand instead of touching it
- every Chapter a different world with nothing linking them; choruses that don't rhyme
- action or faces hidden under the karaoke band
