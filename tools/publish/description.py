# description.py: the YouTube description for a finished MV, from its Storyboard and lyric sheet.
#
#   python3 tools/publish/description.py --mv=<dir> [--intro=intro.txt] [--about=about.txt] [--tags="#AI #MusicVideo"]
#
# In order: the opening (--intro: a text file the person writes or approves, e.g. who the song is for; a placeholder
# if missing), the chapters (one per Storyboard "Chapter N · Name · … · start–end" line), the notes on how it was made
# (--about), the lyrics as lyric.txt has them, then the translation (song/translation.txt) laid out in the same
# blocks without the [Section] marks, then the hashtags.
# YouTube's rules are kept: the chapters start at 0:00, there are at least three, each at least 10 s long (a shorter
# one joins the one before it); no "<" or ">" anywhere; at most 5000 characters. When it runs over, the translation
# moves to out/publish/pinned_comment.txt (post it as a pinned comment) and the description says so.
# Writes <mv>/out/publish/description.txt.
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(description='the YouTube description for a finished MV')
ap.add_argument('--mv', default='.', help='the MV folder (the template root by default)')
ap.add_argument('--intro', help='a text file: the opening paragraph(s)')
ap.add_argument('--about', help='a text file: how the MV was made, credits')
ap.add_argument('--tags', default='', help='hashtags for the last line, e.g. "#AI #MusicVideo"')
o = ap.parse_args()
d = (ROOT / o.mv).resolve()
out = d / 'out' / 'publish'; out.mkdir(parents=True, exist_ok=True)
read = lambda p: Path(p).read_text(encoding='utf-8').strip() if p else ''

# the chapters, from the Storyboard
sb = (d / 'mv' / 'STORYBOARD.md').read_text(encoding='utf-8')
ch = sorted((float(m[3]), float(m[4]), m[2].strip()) for m in re.finditer(r'^Chapter (\d+) · ([^·\n]+?) · [^·\n]+ · ([\d.]+)\s*[–-]\s*([\d.]+)', sb, re.M))
merged = []
for i, (t, end, name) in enumerate(ch):
    if merged and (ch[i + 1][0] if i + 1 < len(ch) else end) - t < 10: continue   # too short for YouTube: it joins the one before
    merged.append([0. if not merged else t, name])
mmss = lambda t: f'{int(t) // 60}:{int(t) % 60:02d}'
chapters = '\n'.join(f'{mmss(t)} {name}' for t, name in merged) if len(merged) >= 3 else ''
if not chapters: print('note: fewer than three chapters long enough for YouTube; the description has none', file=sys.stderr)

# the lyrics, and the translation in the same blocks
lyr = next((d / 'song' / n for n in ('lyric.txt', 'lyrics.txt') if (d / 'song' / n).exists()), None)
lyric_lines = lyr.read_text(encoding='utf-8').strip().splitlines() if lyr else []
lyrics = '\n'.join(s.rstrip() for s in lyric_lines)
trp = d / 'song' / 'translation.txt'
translation = ''
if trp.exists():
    tr = iter([s.strip() for s in trp.read_text(encoding='utf-8').splitlines() if s.strip() and not re.fullmatch(r'\[.+\]', s.strip())])
    blocks, cur = [], []
    for s in lyric_lines:
        s = s.strip()
        if not s or re.fullmatch(r'\[.+\]', s):
            if cur: blocks.append(cur); cur = []
            continue
        cur.append(next(tr, ''))
    if cur: blocks.append(cur)
    translation = '\n\n'.join('\n'.join(b) for b in blocks)

def build(with_translation):
    parts = [read(o.intro) or '(the opening: who or what this song is for, in a sentence or two)']
    if chapters: parts.append('⏱ Chapters\n' + chapters)
    if o.about: parts.append(read(o.about))
    if lyrics: parts.append('📜 Lyrics\n' + lyrics)
    if translation: parts.append('📜 ' + ('Translation\n' + translation if with_translation else 'Translation: in the pinned comment'))
    if o.tags: parts.append(o.tags.strip())
    return '\n\n'.join(parts).replace('<', '‹').replace('>', '›') + '\n'   # YouTube refuses angle brackets

text = build(True)
if len(text) > 5000 and translation:
    text = build(False)
    (out / 'pinned_comment.txt').write_text('📜 Translation\n' + translation + '\n', encoding='utf-8')
    print(f'the translation moved to {out / "pinned_comment.txt"} (post it as a pinned comment)')
(out / 'description.txt').write_text(text, encoding='utf-8')
print(f'wrote {out / "description.txt"}: {len(text)} characters' + (' — still over 5000: shorten the opening or the notes' if len(text) > 5000 else ''))
