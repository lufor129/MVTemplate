# Making an MV

This file covers how to make a hand-made-looking music video from a song: the four goals, and the workflow with its Gates. Read it whole before you do anything. The rest is in [docs/](docs/), one file per job, and each step below says when to read which; you don't need them all at once. [GLOSSARY.md](GLOSSARY.md) defines the words used here (MV, Song, Lyric Line, Section, Chapter, Shot, Seam, Gate…); use them as defined.

The person decides **what** the MV is about, and may say no more than one sentence. This guide decides **how** it's made. If they ask for something the rules forbid, do what they ask.

**Talk with the person through the AskUserQuestion tool.** Whenever they have to decide something (the Brief, the Open questions, each Gate's approval, a choice between fixes), put it to them as a question with 2–4 options, the one you recommend first and marked "(Recommended)". Show what they're judging (the video, the Storyboard, the sheet) before the question. Talk in the person's language.

**No design here is final.** Clawd, its emotions, the props and the helpers are examples, not limits. Each MV designs its own Characters and props, with the same tools and rules, so everything belongs together.

## Contents

- [The four goals](#the-four-goals)
- [What to read when](#what-to-read-when)
- [The workflow](#the-workflow): the steps, the Log, and steps 0–9
  - [0. The Brief](#0-the-brief) · [1. Analyse the Song](#1-analyse-the-song) · [2. Lyric Reading, then the Storyboard](#2-lyric-reading-then-the-storyboard) · [3. Build the Leads](#3-build-the-leads) · [4. Shared pieces and the first Chapter](#4-shared-pieces-and-the-first-chapter) · [5. The other Chapters, in parallel](#5-the-other-chapters-in-parallel) · [6. The Rough Cut](#6-the-rough-cut) · [7. The final render](#7-the-final-render) · [8. Publish](#8-publish) · [9. Harvest](#9-harvest)

---

## The four goals

- **Handmade.** It should look made by hand, frame by frame, in the Style Profile's medium (watercolour by default), keeping every rule its STYLE.md sets, with no lettering beyond what the Storyboard lists.
- **Alive.** Something is always moving and something is always happening. Faces act instead of snapping, and Characters are big enough to feel.
- **Refined.** Every frame should hold up as a still. Spend detail where the viewer's eye lands and where the camera is close: a face in close-up, the prop the line is about, the ground under the feet. Leave the rest simple on purpose. What counts as detail depends on the Shot, the style and the song: decide it each time.
- **One piece.** It's one film cut to one song, not a pile of clips. Plan it before you draw it, and link every Shot to the next. The viewer must always know where they are and who is where. Each Shot continues what the last one left in their eye: the place, the direction, the light, the state of things.

Underneath all four, the viewer has to be able to follow it, at full speed, the first time. Timing (rule 4 in docs/rules.md) is the rule models get wrong most often.

## What to read when

| file | what's in it | read it |
|---|---|---|
| this file | the goals, the workflow, the Gates | first, whole |
| [docs/rules.md](docs/rules.md) | the seven rules and the animation principles: what makes it look good, and what makes it look generated | before the Storyboard (step 2) |
| the Style Profile's `styles/<style>/STYLE.md` | the medium's rules, its drawing API, its Signature features and "What to check" | once the Brief has picked the style |
| [docs/engine.md](docs/engine.md) | the engine's API: Chapters and Shots, the Song, time and motion, Characters | before the first line of scene code (step 3, or step 4 without Leads) |
| [docs/review-loop.md](docs/review-loop.md) | how to render and look at what you made, and how much | with the engine |
| [docs/new-style.md](docs/new-style.md) | making a Style Profile the Brief asked for | only when the person wants a look no profile has |
| [docs/chapter-brief.md](docs/chapter-brief.md) | the common Chapter brief | when you start Chapter subagents (step 5) |
| [docs/publish.md](docs/publish.md), [docs/harvest.md](docs/harvest.md) | steps 8 and 9 | when you get there |

---

## The workflow

An MV is one copy of this template. Make it with `node tools/new_mv.mjs <folder> --song=<folder with the song> --title="<title>"`: it copies the template without anything left from other MVs, puts the song and its lyrics in `song/`, and checks that Node, Chrome, ffmpeg, uv and Pillow are there. The person gives you `song.mp3` (any audio format named `song.*`) and `lyric.txt` (or `lyrics.txt`), and a sentence; `song/translation.txt` is optional (see the Brief). Both of the first two are required: the template makes MVs for sung songs, and the Lyric Sheet drives the timing, the Sections and the Shots. If either is missing, ask for it before anything else; when the lyrics come as a Suno sheet or notes, write `lyric.txt` from it (the sung lines and the Section marks only, without performer or style tags) and show it at the Song Check.

You then go through these steps in order. At each 🚦 **Gate**, stop: show the person what's there, say what you need from them, and wait for their approval before going on. Changes they ask for at a Gate are made before you pass it.

| # | step | makes | Gate |
|---|---|---|---|
| 0 | The Brief, and a new Style Profile if one is asked for | `mv/mv.json`, `styles/<name>/` | 🚦 Style Sample (only with a new style) |
| 1 | Analyse the Song | `song/song.json`, `out/check/songcheck.mp4` | 🚦 Song Check |
| 2 | Lyric Reading, then the Storyboard | `mv/STORYBOARD.md` | 🚦 Storyboard |
| 3 | Build the Leads (if any) | `mv/characters/*.js`, their Model Sheets | 🚦 Model Sheets (only with Leads) |
| 4 | Shared pieces and the first Chapter | `mv/chapters/c01_*.js` | 🚦 First Chapter |
| 5 | The other Chapters, in parallel | `mv/chapters/*.js` | — |
| 6 | The Rough Cut | `out/rough/rough.mp4` | 🚦 Rough Cut (or your own review, when the person handed it over) |
| 7 | The final render | `out/final/<title>.mp4` | — |
| 8 | Publish (when the person wants to post it) | `out/shorts/*_9x16.mp4`, `out/publish/description.txt` | — |
| 9 | Harvest: what this MV taught, back into the template | a branch of the template | each item is the person's call |

**The Log.** `mv/LOG.md` is the MV's memory: the steps as a checklist, every decision the person makes (and what they turned down), and the Harvest candidates. Read it before anything else when you pick an MV up, put its checklist in your task list, and write to it as things happen, not at the end: tick a step when its Gate passes, note a decision with the date and, where it matters, the person's own words, and note anything the template could learn the moment you find it (a fix to a shared file, a helper two Chapters both wanted, a rule learned the hard way). A new session should be able to carry on from the Log and the files alone.

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

Also ask whether they have references (a character to reuse, photos, colours, an MV they love). Put any files in `mv/refs/` and look at them. Write the answers into `mv/mv.json` (`title`, `mode`, `format`, `karaoke`, `style`) and the Log. Now read the Style Profile's STYLE.md.

**A new style.** If the person asked for a look no Style Profile has, make one in this MV's copy before going on, as [docs/new-style.md](docs/new-style.md) describes, and render its Style Sample.

🚦 **Style Sample.** Show the person the sheet and ask whether this is the look. Revise it until they approve. If it turns out well, note it in the Log as a Harvest candidate so the next MV can pick it.

### 1. Analyse the Song

`lyric.txt` holds the words as the person wrote them, one Lyric Line per line, with `[Verse 1]`, `[Chorus]`, `[Bridge]`… marks for Sections (without marks, blank lines separate them). It is the only source of words: the analysis only finds when they are sung (ADR 0003). If it has neither marks nor blank lines, add the marks yourself from the lyrics' structure (verses, the repeated chorus, the bridge, spoken bits) before the analysis, change nothing else, and show them at the Song Check. Section names come out unique: a repeated name is numbered (`Chorus`, `Chorus 2`; `Interlude`, `Interlude 2`), so `sec('Interlude 2')` finds the second one.

```bash
uv run --project tools/song python tools/song/analyze.py song      # first run downloads models; a few minutes
node engine/render.mjs --songcheck                                 # → out/check/songcheck.mp4
```

The analysis separates the vocals, places each line with Whisper, re-times it by forced alignment, finds every beat and bar start (the Beat Grid, ADR 0002), and makes the Sections, adding Intro / Interlude / Outro for unsung stretches. It prints every line with a confidence; below 0.5 means the two timing methods disagreed.

On a sung vocal (a generated one above all) Whisper can skip a whole stretch, or hear words nobody sings ("see you next time"), and a prompt doesn't fix it. So wherever lyric lines fail to match, the analysis hears that stretch again in chunks of at most 8 s and keeps the first try in `song/.analysis/asr.orig.json` (`--no-rescue` skips this). The beat tracker, for its part, can put a bar start in a stop-time break or on a pickup: the analysis lists every bar without the usual number of beats, and the Song Check draws those in red.

🚦 **Song Check.** Give the person `out/check/songcheck.mp4`: the song with a click on every beat (higher on bar starts), the Section name, a disc that flashes on each beat, a strip of lines and beats, and the karaoke lighting up word by word. Low-confidence lines show in red. Ask them to check that the clicks sit on the beat, the high click on each bar start (listen hardest at the red bars), the words light up as they're sung, the Sections change where the song does, and the tempo feels right (a beat tracker can lock onto half, double or 1.5× the felt tempo). Fix what they report by editing `song/song.json` by hand (a line's `start`, `end` and `tokens`; a Section's `start`/`end`; or the beat lists), then render the Song Check again. Don't re-run the analysis after hand edits: it would overwrite them; note each hand fix in the Log.

### 2. Lyric Reading, then the Storyboard

Read [docs/rules.md](docs/rules.md) first: the Storyboard is where most of its rules are kept or broken.

First, the **Lyric Reading**: for each Lyric Line, what it means and what pictures it could become. Look up references and in-jokes you aren't sure of (the web is fine). Write what you're unsure of under "Open questions"; they go to the person at the Storyboard Gate.

Then write `mv/STORYBOARD.md` before any scene code, in this form. `node engine/storyboard.mjs` reads it, so keep the field names, the `Chapter` and Shot lines, the `L<n>` line numbers and the `EVENT:` and `camera:` labels as they are here:

```
Logline: one sentence. Narrative: <who> wants ___, but ___, so ___. Other modes: what changes from the first frame to the last.
Mode: ___ · Format: ___ · Karaoke: on/off · Style: ___ (from the Brief)
World: the settings, a small palette, light, and how the colour changes across the MV (the colour arc).
Motif: the thing that recurs and pays off.
Cast: Leads (designed first, approved on Model Sheets) and Guests (designed by the Chapter that introduces them), or "none".
Arc: the Leads' emotion keys across the whole song (no Leads: the world's arc).
Sound Words: the handful of painted words in the whole MV, and where (or "none"). Lyric mode: also which lines are painted in, and how they arrive and leave.
Lyric Reading: one line per Lyric Line: L<n> · what it means · picture ideas.
Open questions: what you need the person to decide.

Chapter 1 · <name> · <Section>[ + <Section>…] · <start>–<end> · <setting, light>
  A  <start>–<end>  [Seam in: ___]  L00 · what's seen · EVENT: ___ · the reaction · camera: ___
     reads:  <start>–<end>  the first thing the viewer must understand
             <start>–<end>  the next one (where is the viewer's eye when it starts?)
  B  <start>–<end>  [Seam: ___]  L01–L02 · ...
  [Seam out to Chapter 2: ___]
Chapter 2 · ...
  [Seam out of the MV: ___]
```

Times are song seconds from `song.json` (two decimals); `L<n>` is `LINES[n]` (from 0), and a Shot with no sung line says what plays instead, `(Intro, banjo alone)`. A field may run on for several lines or become a `## Heading` with paragraphs under it.

Structure:
- **Chapters follow Sections.** By default one Section is one Chapter. You may merge Sections into one Chapter or split one into two, but a Chapter's edges always fall on Section edges (`chapter()` checks). Each Chapter happens in one setting, and the camera moves through it.
- **Every Lyric Line gets at least one Shot**, with its own event. A long line can take several Shots; a very short line may share a Shot with the next. Unsung stretches (Intro, Interlude, Outro) get Shots too.
- **Every Seam gets a transition** chosen for it here, Chapter edges included. Nothing is added automatically.
- Repeated Sections (choruses) should rhyme: the same setting or motif, escalating each time.
- Times come from `song.json`: Shot starts on line starts or beats, big changes on bar starts.

As you write each Shot, think what it needs to look refined, and how it continues the one before.

Then check it:

```bash
node engine/storyboard.mjs          # against song.json: Chapters on Section edges, every line and Seam covered, reads, Sound Words
```

It stops on what breaks the rules (✗) and warns about what might (⚠): fix every ✗, and look at each ⚠. What a script can't judge is yours: an event in every Shot, every read with time to land, an ending that rhymes with the opening.

🚦 **Storyboard.** Show the person the Storyboard (and the Open questions). Revise it until they approve, checking it again after each revision.

### 3. Build the Leads

Skip this step and its Gate when the Storyboard has no Leads. Read [docs/engine.md](docs/engine.md) and [docs/review-loop.md](docs/review-loop.md) now.

Write each Lead as `mv/characters/<name>.js`, drawn to the Character Contract (docs/engine.md › Characters). To use an example Character as-is, list it in `mv/mv.json` instead: `"characters": ["examples/clawd/clawd.js"]`; to change it, copy it into `mv/characters/`. Every Character gets a Model Sheet loop automatically:

```bash
node engine/render.mjs --loop=<name>-sheet --sheet=0.3,1.05,2.6 --cols=1 --w=1600 --out=out/check/<name>_sheet.jpg
```

Look at the sheet yourself first: every view on model, every emotion readable at a glance and different from the others (by face, or by body and colour for a Character without one), the turn steps through the views, the emotion changes act (squint, take, settle). A small sheet hides detail: to show how refined a Lead is, add loops of your own (a big turnaround, the face close up through its emotions) and show those too.

🚦 **Model Sheets.** Show the person each Lead's sheet. Guests don't need this Gate: the Chapter that introduces a Guest designs it.

### 4. Shared pieces and the first Chapter

Build what several Chapters share (the palette in mv.json, recurring props, sets the choruses return to) in `mv/characters/` (any shared script there loads before the Chapters), then the first Chapter, Shot by Shot, using the review loop. This Chapter sets the look for the rest: scale of the Characters, density of the backgrounds, the camera's energy, the pace of the reads.

🚦 **First Chapter.** Render it as a clip with the song (`node engine/render.mjs --clip=<start>:<end>`) and show the person. Besides approving it, offer to carry the rest yourself: the other Chapters with N subagents at once (step 5, N for this machine), your own review of the Rough Cut instead of its Gate, then the final render, reporting at the end. Many people hand it over here. If they do, still stop for anything only they can decide.

### 5. The other Chapters, in parallel

For a short MV, build the remaining Chapters yourself, in order. For a long one, use subagents. Each renders in its own headless Chrome, so the machine sets how many run at once: about one per CPU core less one, fewer if memory runs short (`sysctl -n hw.ncpu hw.memsize` on a Mac, `nproc` and `free -g` on Linux); nine ran well on a 10-core Mac with 16 GB. Start a new one whenever one finishes.

Before the first one starts, move anything two Chapters will both draw (a troupe of background dancers, a set the choruses return to) into `mv/characters/`, and the transitions too: a Seam two Chapters share is drawn by one helper there (a whip smear, swinging doors, a cloud of steam, in the MV's own world), so both sides draw the same thing. Then write the Chapter briefs:

```bash
node engine/storyboard.mjs --briefs    # → mv/briefs/cNN.md for every Chapter not yet built: its file, chapter() call, Shots, Sound Words, neighbours
```

Each subagent gets the common brief, [docs/chapter-brief.md](docs/chapter-brief.md) (what to read, the API, the rules, the review budget, what to report), plus its own `mv/briefs/cNN.md`. The script fills in what the Storyboard already says; you add the rest to each before it goes out:

- **a contract for each Seam it shares.** Neighbours are built at the same time and can't look at each other, so write down the exact frame where they meet, the same text in both Chapter briefs. Examples that worked:
  - a wipe split in half: the earlier Chapter ends with `brushWipe((lt - (dur - .3)) / .6, cols)` (covering the frame exactly at its end), the later one starts with `brushWipe(.5 + lt / .6, cols)`, the same `cols`;
  - a full-frame colour: "at the edge the whole frame is `flash(1, '#F4B6C2')` with a white highlight arc upper left"; the later Chapter starts on it and breaks it;
  - a camera state: "rolled +0.35 rad and solid red at the edge"; "zoom z = 1 − .06·k², ending at .94";
  - a held tableau: the earlier Chapter writes the exact positions, scales and camera formula in a comment block `SEAM OUT TO CHAPTER n` at the top of its file, and the later one, started after it, copies them.

  A contract that meets on a full cover (a flash, a solid wipe, black) must be reached by the earlier Chapter's last drawing and still be there at the later one's first; say so in both Chapter briefs (on twos the last drawing comes early: docs/engine.md › Time and motion).
- **the shared helpers it uses**, by name and signature, and anything the MV does its own way (plates, a second Lead, the karaoke's height).
- **Guests:** a Guest a later Chapter brings back (a curtain call, a callback) goes on `CAST` as `CAST.<name> = (x, y, s, t, o) => …`, standing on (x, y), with `s` on the Lead's size scale. Its subagent reports the signature and options. A Chapter that uses several Guests starts after the Chapters that define them.

A subagent that stops at the usage limit keeps what it has written: when the limit resets, send it a message (SendMessage, by its name) to carry on, rather than starting a new one. Many running at once tend to reach the limit together.

When a subagent reports, put what it found wrong in shared files and what it had to work around in the Log, as Harvest candidates. When they're all done, check every Seam between Chapters yourself, as the final will show it:

```bash
node engine/render.mjs --seams     # → out/check/seams.jpg: each Chapter edge, the drawings the viewer sees on either side
```

It flags (⚠) a full cover no frame shows (the earlier Chapter reaches it after its last drawing, or the later one has left it by its first) and (•) a jump across the edge much bigger than the motion around it, which is fine only where the Storyboard asks for a cut, a flash or a smash. Fix what doesn't join.

### 6. The Rough Cut

```bash
node engine/render.mjs --rough       # half size, 12 fps, with the song → out/rough/rough.mp4 (resumable)
```

`--rough` runs the Seam check too when its frames are done: read its report before you watch. Then watch the rhythm against the song: does each line's picture land on its line, do the hits land on beats, is there any dead stretch?

🚦 **Rough Cut.** Give the person `out/rough/rough.mp4`. Make the changes they ask for, then render the final. If they handed the rest over at the First Chapter, this is your review: sheet every Chapter at its reads, fix what fails, and go on.

### 7. The final render

```bash
node engine/render.mjs --final --workers=3     # full size, mv.json fps, with the song → out/final/<title>.mp4 (resumable)
```

`--rough` and `--final` keep frames already on disk. After changing a Chapter, delete its frames (or the whole `frames/` folder) so they're rendered again.

### 8. Publish

When the person wants to post the MV, follow [docs/publish.md](docs/publish.md): a vertical short, and the YouTube description.

### 9. Harvest

When the MV is done, bring what it taught back to the template, item by item, as [docs/harvest.md](docs/harvest.md) describes. The Log's Harvest candidates are where the list starts.
