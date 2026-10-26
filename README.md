# MVTemplate

A template for making a hand-painted music video with Claude. Make a copy of it for each MV with the song and its lyrics in it (`node tools/new_mv.mjs ../my-mv --song=<folder>`, or copy it by hand and put them in `song/`), and in the copy ask:

> Read GUIDE.md, then make an MV for this song: a robot learning to dance.

Both the song and `lyric.txt` are required; a `translation.txt` (one line per lyric line) adds a translated row to the karaoke. Claude first asks a few questions (the Brief: what kind of MV, format, karaoke, style; a style that doesn't exist yet is first pictured with an image model and shown to you as a Style Target, then made and shown as a Style Sample), then analyses the song (when each line is sung, every beat and bar, the sections), writes a storyboard, designs the characters, builds the video chapter by chapter in [p5.js](https://p5js.org) and [p5.brush](https://github.com/acamposuribe/p5.brush), and renders it with the song. It stops at five Gates for you to approve (seven with a new style):

| Gate | you get | you check |
|---|---|---|
| Style Target | `styles/<name>/target.jpg`, a picture of the new look, only when you asked for a new style | the look, before any code |
| Style Sample | `out/check/style_sample.jpg`, and the target over the render, only when you asked for a new style | the look, coded |
| Song Check | `out/check/songcheck.mp4`: the song with beat clicks, sections and karaoke | the timing is right |
| Storyboard | `mv/STORYBOARD.md` | the idea, the shots, the open questions |
| Model Sheets | each lead character's views and emotions (skipped when there are none) | the characters |
| First Chapter | a clip of the first chapter | the look and the pace |
| Rough Cut | `out/rough/rough.mp4`, half size, 12 fps | the whole thing against the song |

Then it renders `out/final/<title>.mp4`. To post it, it can cut a vertical short for Reels, Threads or Shorts and write the YouTube description (chapters, lyrics, translation). Afterwards it lists what this MV taught that could come back into the template, and asks you about each.

It grew out of [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) (the character kit, the watercolour medium and the animation guide) and the music video [I'm Upping My P(doom)](https://github.com/JohnHeibel/PDoomVideo), which was this template's first test.

## You need

- Node.js, Google Chrome, ffmpeg
- [uv](https://docs.astral.sh/uv/) for the song analysis (Python 3.12, PyTorch, Whisper large-v3, HTDemucs, beat_this, the MMS aligner; about 5 GB of models, downloaded on first use). Apple Silicon or Linux.

```bash
npm install
uv sync --project tools/song
```

## By hand

```bash
uv run --project tools/song python tools/song/analyze.py song   # song/song.json
node engine/render.mjs --songcheck                              # the Song Check video
node engine/storyboard.mjs                                      # check mv/STORYBOARD.md against the song
node engine/storyboard.mjs --briefs                             # the Chapter briefs for parallel subagents
node engine/build.mjs && open studio.html                       # scrub or play along in Chrome
node engine/render.mjs --rough                                  # the Rough Cut (and the Seam check)
node engine/render.mjs --final                                  # the MV
python3 tools/shorts/make_short.py --from=2 --to=34 --name=open # a vertical short (needs Pillow)
python3 tools/publish/description.py --intro=intro.txt          # the YouTube description
```

Every render command takes `--mv=<folder>` for an MV kept elsewhere.

## What's here

| path | what it is |
|---|---|
| [GUIDE.md](GUIDE.md) | The goals and the workflow, with its Gates. Claude reads it first, and the rest of `docs/` as each step needs it. |
| [docs/](docs/) | The rules, the engine API, the review loop, the Chapter brief, new styles, publishing, the Harvest |
| [GLOSSARY.md](GLOSSARY.md) | The words the guide and code use (MV, Song, Section, Chapter, Shot, Seam, Gate…) |
| [docs/adr/](docs/adr/) | Why it's built this way |
| `song/` | Your song and lyrics, and the analysis (`song.json`) |
| `mv/` | Your MV: `mv.json` (format, style, karaoke), the Log (`LOG.md`: steps passed, your decisions), the storyboard, characters and chapters |
| [engine/](engine/) | Beat grid, timeline, karaoke, acting tools, build and render |
| [styles/](styles/) | Style Profiles: how paint lands on the frame. [watercolor/](styles/watercolor/STYLE.md), [cel/](styles/cel/STYLE.md), [cutout/](styles/cutout/STYLE.md), [pixel/](styles/pixel/STYLE.md), [paper-theatre/](styles/paper-theatre/STYLE.md), [doodle/](styles/doodle/STYLE.md) |
| [tools/song/](tools/song/) | The song analysis |
| [tools/shorts/](tools/shorts/), [tools/publish/](tools/publish/) | A vertical short from the MV; its YouTube description |
| [examples/clawd/](examples/clawd/) | Clawd, an example character with 31 emotions |
| `studio.html` | Scrub or play an MV in Chrome |
