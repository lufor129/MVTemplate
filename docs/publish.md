# Publishing an MV

GUIDE.md step 8. When the person wants to post the MV, ask which of these they need:

- **A vertical short** (Reels, Threads, TikTok, Shorts). Choose a stretch with them that stands on its own (the opening, a chorus, the ending), then:

  ```bash
  python3 tools/shorts/make_short.py --mv=<dir> --from=2 --to=34.5 --name=open --title="BIG LINE|smaller line"
  ```

  A cut inside a sung line moves out to take the whole line in, and the tool prints the times it used (`--exact` keeps yours). A 16:9 MV becomes its picture in the middle of a 9:16 frame over a blurred copy of itself, the title above and the lyric below in the Style Profile's fonts and colours, each word lighting up as it is sung → `out/shorts/<name>_9x16.mp4`. A 9:16 MV is cut as it is.
- **The cover** (the YouTube thumbnail, 1280 × 720): a still of the picture without its karaoke, with the title lettered on it in the Style Profile's fonts over a dark band, or bare:

  ```bash
  python3 tools/publish/thumbnail.py --mv=<dir> --at=60.9,72,130 --title="BIG LINE|smaller line"   # candidates + thumbs_compare.jpg
  python3 tools/publish/thumbnail.py --mv=<dir> --loop=curtain-call --where=none                   # a cover drawn for it
  ```

  Pick the candidates with the person: a moment that shows the Leads and the idea at a glance. Offer a cover drawn for the purpose too, once the Leads and sets exist it's cheap: the whole cast out for a curtain call in front of the set, in a one-frame loop (`LOOPS['curtain-call'] = t => …; LOOPS['curtain-call'].len = 1 / 24;` in `mv/characters/`). One person chose that, with no lettering at all, over every still with a title.
- **The YouTube description**: the chapters from the Storyboard, the lyrics and the translation, within YouTube's rules (chapters from 0:00, each at least 10 s; no angle brackets; at most 5000 characters, past which the translation moves to a pinned comment):

  ```bash
  python3 tools/publish/description.py --mv=<dir> --intro=intro.txt --about=about.txt --tags="#MusicVideo"
  ```

  The opening (`--intro`) is the person's: who or what the song is for. Write it with them, and check every fact in it and in the notes against a source (list the sources under the notes when the song makes claims). The translation comes out in one language: a line already sung in it (an English line in a Chinese song) stays as sung. A translation into English runs longer than the Chinese it translates; when the description passes 5000 characters, ask the person whether to move the translation to a pinned comment or shorten the notes.

Tools letter text into PIL images that ffmpeg overlays, never with ffmpeg's `drawtext`, which many ffmpeg builds don't have.
