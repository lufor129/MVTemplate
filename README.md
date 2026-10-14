# MVTemplate

A template for making a hand-painted music video with Claude. Copy it once per MV, put a song and its lyrics in `song/`, and ask:

> Read GUIDE.md, then make an MV for this song: a robot learning to dance.

Both the song and `lyric.txt` are required. Claude first asks a few questions (the Brief: what kind of MV, format, karaoke, style; a style that doesn't exist yet gets made first and shown to you as a Style Sample), then analyses the song (when each line is sung, every beat and bar, the sections), writes a storyboard, designs the characters, builds the video chapter by chapter in [p5.js](https://p5js.org) and [p5.brush](https://github.com/acamposuribe/p5.brush), and renders it with the song. It stops at five Gates for you to approve (six with a new style):

| Gate | you get | you check |
|---|---|---|
| Style Sample | `out/check/style_sample.jpg`, only when you asked for a new style | the look |
| Song Check | `out/check/songcheck.mp4`: the song with beat clicks, sections and karaoke | the timing is right |
| Storyboard | `mv/STORYBOARD.md` | the idea, the shots, the open questions |
| Model Sheets | each lead character's views and emotions (skipped when there are none) | the characters |
| First Chapter | a clip of the first chapter | the look and the pace |
| Rough Cut | `out/rough/rough.mp4`, half size, 12 fps | the whole thing against the song |

Then it renders `out/final/<title>.mp4`.

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
node engine/build.mjs && open studio.html                       # scrub or play along in Chrome
node engine/render.mjs --rough                                  # the Rough Cut
node engine/render.mjs --final                                  # the MV
```

Every render command takes `--mv=<folder>` for an MV kept elsewhere.

## What's here

| path | what it is |
|---|---|
| [GUIDE.md](GUIDE.md) | The workflow, the rules and the engine. Claude reads it first. |
| [GLOSSARY.md](GLOSSARY.md) | The words the guide and code use (MV, Song, Section, Chapter, Shot, Seam, Gate…) |
| [docs/adr/](docs/adr/) | Why it's built this way |
| `song/` | Your song and lyrics, and the analysis (`song.json`) |
| `mv/` | Your MV: `mv.json` (format, style, karaoke), the storyboard, characters and chapters |
| [engine/](engine/) | Beat grid, timeline, karaoke, acting tools, build and render |
| [styles/](styles/) | Style Profiles: how paint lands on the frame. [watercolor/](styles/watercolor/STYLE.md) |
| [tools/song/](tools/song/) | The song analysis |
| [examples/clawd/](examples/clawd/) | Clawd, an example character with 31 emotions |
| `studio.html` | Scrub or play an MV in Chrome |
