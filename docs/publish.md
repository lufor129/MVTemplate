# Publishing an MV

GUIDE.md step 8. When the person wants to post the MV, ask which of these they need:

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
