# make_short.py: a vertical short (9:16, 1080 × 1920) for Instagram Reels, Threads, TikTok or YouTube Shorts, cut from
# a stretch of the MV.
#
#   python3 tools/shorts/make_short.py --mv=<dir> --from=2 --to=34.5 [--name=open] [--title="LINE ONE|LINE TWO"]
#
# A 16:9 MV: the picture is rendered again without its karaoke (render.mjs --clip --no-karaoke) and sits in the middle
# of the frame over a blurred, darkened copy of itself. The title is lettered above it (--title; "|" breaks it into a
# big line and a smaller one; mv.json's title by default), and the lyric below it, big, in the Style Profile's own
# fonts and colours: the translation (song/translation.txt) on top, then the sung line, each word lighting up as it
# is sung. Everything stays clear of the apps' captions and buttons (the bottom quarter and the right edge).
# A 9:16 MV: the stretch is rendered as it is, karaoke and all.
# Both fade in and out, picture and sound. Writes <mv>/out/shorts/<name>_9x16.mp4.
#
# Text is lettered with PIL into PNGs that ffmpeg overlays, never with ffmpeg's drawtext (many ffmpeg builds lack it).
# The fonts come from the Style Profile's Google Fonts (style.json "fonts"), downloaded once into <mv>/out/shorts/fonts/.
# Needs Pillow (pip install pillow) and ffmpeg.
import argparse, json, re, shutil, subprocess, sys, urllib.request
from itertools import combinations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(description='a vertical short from a stretch of the MV')
ap.add_argument('--mv', default='.', help='the MV folder (the template root by default)')
ap.add_argument('--from', dest='a', type=float, required=True, help='start, in song seconds')
ap.add_argument('--to', dest='b', type=float, required=True, help='end, in song seconds')
ap.add_argument('--name', default='short', help='output name: out/shorts/<name>_9x16.mp4')
ap.add_argument('--title', help='the lettering over the picture; "|" splits a big line from a smaller one')
ap.add_argument('--no-render', action='store_true', help='reuse out/shorts/<name>_raw.mp4 from a previous run')
o = ap.parse_args()

MV_DIR = (ROOT / o.mv).resolve()
OUT = MV_DIR / 'out' / 'shorts'; OUT.mkdir(parents=True, exist_ok=True)
MV = json.loads((MV_DIR / 'mv' / 'mv.json').read_text()) if (MV_DIR / 'mv' / 'mv.json').exists() else {}
STYLE = MV.get('style', 'watercolor')
FPS, W, H = int(MV.get('fps', 24)), 1080, 1920
A, B = o.a, o.b
DUR = B - A
raw, out = OUT / f'{o.name}_raw.mp4', OUT / f'{o.name}_9x16.mp4'

# ---------- the Style Profile's look ----------
# Per profile: the title's font, the lyric's font and the one to fall back on for characters it lacks (as the page's
# CSS font list does), and the colours of a sung word and of the translation (a palette key or a hex colour). A profile
# not listed uses the fonts in its style.json.
LOOK = {
  'cel':        dict(title='Bangers', lyric='Chiron GoRound TC', fallback='Klee One', sung='#FFD84A', sub='#CFE8FF'),
  'watercolor': dict(title='Permanent Marker', lyric='LXGW WenKai TC', fallback='Klee One', sung='rose', sub='sky'),
  'cutout':     dict(title='Bowlby One SC', lyric='Noto Serif TC', fallback='Klee One', sung='ochre', sub='sky'),
  'pixel':      dict(title='Press Start 2P', lyric='DotGothic16', fallback='LXGW WenKai TC', sung='ochre', sub='sky'),
}
sdir = ROOT / 'styles' / STYLE
style = json.loads((sdir / 'style.json').read_text())
families = re.findall(r'family=([^&:]+)(?::wght@(\d+))?', style.get('fonts', ''))
weights = {f.replace('+', ' '): w for f, w in families}
fams = list(weights)
look = LOOK.get(STYLE) or dict(title=fams[0], lyric=fams[min(1, len(fams) - 1)], fallback=fams[-1], sung='ochre', sub='sky')
PAL = dict(re.findall(r"(\w+): '(#[0-9A-Fa-f]{6})'", (sdir / 'palette.js').read_text())) if (sdir / 'palette.js').exists() else {}
PAL.update(MV.get('palette', {}))
hexrgb = lambda c: tuple(int(PAL.get(c, c).lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
INK, CREAM = hexrgb(PAL.get('ink', '#262033')), hexrgb(PAL.get('cream', '#FFF7E6'))
SUNG, SUB = hexrgb(look['sung']), hexrgb(look['sub'])

def font_file(family):
    """The family's TTF at the weight style.json asks for, from Google Fonts (cached in out/shorts/fonts/)."""
    d = OUT / 'fonts'; d.mkdir(exist_ok=True)
    f = d / (re.sub(r'\W', '', family) + (weights.get(family) or '') + '.ttf')
    if not f.exists():
        q = family.replace(' ', '+') + (f':wght@{weights[family]}' if weights.get(family) else '')
        css = urllib.request.urlopen(urllib.request.Request(f'https://fonts.googleapis.com/css2?family={q}', headers={'User-Agent': 'Wget/1.21'})).read().decode()
        url = re.search(r'url\((https://[^)]+\.ttf)\)', css).group(1)
        print(f'downloading {family} …', flush=True); f.write_bytes(urllib.request.urlopen(url).read())
    return str(f)

CJK = re.compile(r'[぀-ヿ㐀-䶿一-鿿가-힯]')

# ---------- render the stretch ----------
if MV.get('format') == '9:16':
    if not o.no_render:
        subprocess.run(['node', str(ROOT / 'engine' / 'render.mjs'), f'--mv={MV_DIR}', f'--clip={A}:{B}', f'--out={raw}'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-vf', f'fade=in:st=0:d=0.35,fade=out:st={DUR - .5:.3f}:d=0.5',
                    '-af', f'afade=in:st=0:d=0.3,afade=out:st={DUR - .6:.3f}:d=0.6', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out)], check=True)
    print('wrote', out); sys.exit(0)
if not o.no_render:
    subprocess.run(['node', str(ROOT / 'engine' / 'render.mjs'), f'--mv={MV_DIR}', f'--clip={A}:{B}', '--no-karaoke', f'--out={raw}'], check=True)

# ---------- the song's lines, with their translation ----------
song = json.loads((MV_DIR / 'song' / 'song.json').read_text())
LINES = song['lines']
trp = MV_DIR / 'song' / 'translation.txt'
if trp.exists():
    tr = [s.strip() for s in trp.read_text().splitlines()]
    tr = [s for s in tr if s and not re.fullmatch(r'\[.+\]', s)]
    if len(tr) != len(LINES): sys.exit(f'translation.txt has {len(tr)} lines, song.json {len(LINES)}')
    for l, s in zip(LINES, tr): l['sub'] = s

def token_ranges(text):   # the character ranges of the timed tokens, as engine/karaoke.js _tokenRanges() works them out
    out, i = [], 0
    while i < len(text):
        c = text[i]
        if CJK.match(c): out.append((i, i + 1)); i += 1
        elif c.isalnum():
            a = i
            while i < len(text) and ((text[i].isalnum() and not CJK.match(text[i])) or (text[i] in "'’" and i + 1 < len(text) and text[i + 1].isalnum())): i += 1
            out.append((a, i))
        else: i += 1
    return out

def sung_chars(line, t):   # how many characters have been sung at t (fractional)
    R, tk = token_ranges(line['text']), line.get('tokens') or []
    if R and len(R) == len(tk):
        s = 0
        for (c0, c1), (t0, t1) in zip(R, tk):
            if t >= t1: s = c1
            else:
                if t > t0: s = c0 + (c1 - c0) * (t - t0) / max(.05, t1 - t0)
                break
        return s
    return len(line['text']) * min(1, max(0, (t - line['start']) / max(.1, line['end'] - line['start'])))

def shown(i):   # a beat before the line starts until a moment after it ends, never over the next one
    l, nxt = LINES[i], LINES[i + 1]['start'] if i + 1 < len(LINES) else 1e9
    return l['start'] - .12, min(l['end'] + .35, nxt - .1)

# ---------- lettering ----------
BOX_Y = 520                      # the 16:9 picture: 1080 × 608 from here
BAND_Y, BAND_H = 1160, 400       # the lyric, above the apps' captions and buttons
MAIN_PX, SUB_PX, MAXW = 56, 48, 950

_fonts = {}
def load(family, px):
    if (family, px) not in _fonts:
        f = ImageFont.truetype(font_file(family), px)
        try: f.set_variation_by_axes([int(weights.get(family) or 400)])   # a variable font: the weight style.json asks for
        except Exception: pass
        _fonts[family, px] = f
    return _fonts[family, px]
_glyphs = {}
def glyph(f, c):
    if (id(f), c) not in _glyphs:
        im = Image.new('L', (f.size * 2, f.size * 2)); ImageDraw.Draw(im).text((0, 0), c, font=f, fill=255)
        _glyphs[id(f), c] = im.tobytes()
    return _glyphs[id(f), c]
def covers(f, text):   # every character has a glyph (a missing one draws the same box as a surely-missing code point)
    return all(c.isspace() or glyph(f, c) != glyph(f, '\U0010FFFD') for c in set(text))
def lyric_font(text, px):   # the lyric font, or the fallback when it lacks a character (PIL has no font fallback of its own)
    f = load(look['lyric'], px)
    return f if covers(f, text) else load(look['fallback'], px)
tw = lambda s, f: f.getlength(s)

PUNCT = set('，、。！？；：」』）,.!?;:)')
def rows_of(text, f, maxw=MAXW):   # the fewest rows (up to three) that fit, broken at spaces or between CJK characters
    cuts = [m.start() for m in re.finditer(' ', text)] + [i for i in range(1, len(text)) if CJK.match(text[i]) and (CJK.match(text[i - 1]) or text[i - 1] in PUNCT)]
    best = None
    for k in range(0, 3):
        best = None
        for cs in combinations(sorted(cuts), k):
            edges = [0, *cs, len(text)]
            rows = [(edges[j] + (1 if j and text[edges[j]] == ' ' else 0), edges[j + 1]) for j in range(k + 1)]
            # the longest row (too long rules it out), plus a little for each break not after a space or a punctuation mark
            width = max(tw(text[a:b], f) for a, b in rows)
            cost = width + sum(0 if text[c] == ' ' or text[c - 1] in PUNCT else f.size * 2 for c in cs) + (1e6 if width > maxw else 0)
            if best is None or cost < best[0]: best = (cost, rows)
        if best and best[0] < 1e6: return best[1]
    return best[1]

def band(i, t):
    l = LINES[i]; s0, s1 = shown(i)
    alpha = min(1, (t - s0) / .15, (s1 - t) / .15)
    im = Image.new('RGBA', (W, BAND_H), (0, 0, 0, 0))
    if alpha <= 0: return im
    d = ImageDraw.Draw(im)
    main_f = lyric_font(l['text'], MAIN_PX)
    rows, y = rows_of(l['text'], main_f), 46
    if l.get('sub'):   # the translation: smaller until it fits on one row (down to 40 px), else two rows
        px = SUB_PX
        while px > 40 and tw(l['sub'], lyric_font(l['sub'], px)) > MAXW: px -= 2
        sub_f = lyric_font(l['sub'], px)
        for a, b in rows_of(l['sub'], sub_f):
            d.text((W / 2, y), l['sub'][a:b], font=sub_f, fill=SUB, anchor='mm', stroke_width=7, stroke_fill=INK); y += px + 14
        y += 22
    sung = sung_chars(l, t)
    for k, (a, b) in enumerate(rows):
        s, ry = l['text'][a:b], y + k * 74
        x0 = W / 2 - tw(s, main_f) / 2
        d.text((x0, ry), s, font=main_f, fill=CREAM, anchor='lm', stroke_width=8, stroke_fill=INK)
        n = min(max(sung - a, 0), len(s))
        if n > 0:   # the sung part, clipped at the exact point reached
            j = int(n); cw = tw(s[:j], main_f); nw = tw(s[:min(len(s), j + 1)], main_f)
            hi = Image.new('RGBA', (W, BAND_H), (0, 0, 0, 0))
            ImageDraw.Draw(hi).text((x0, ry), s, font=main_f, fill=SUNG, anchor='lm')
            im.alpha_composite(hi.crop((0, 0, int(max(1, x0 + cw + (nw - cw) * (n - j))) + 1, BAND_H)), (0, 0))
    if alpha < 1: im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    return im

# the title, over the top: a big line and an optional smaller one, each sized to fit
title = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(title)
parts = (o.title or MV.get('title') or '').split('|')
for txt, px, y, col in [(parts[0].strip(), 150, 300, SUNG), *([(parts[1].strip(), 74, 425, CREAM)] if len(parts) > 1 else [])]:
    if not txt: continue
    fam = look['title'] if covers(load(look['title'], px), txt) else look['lyric'] if covers(load(look['lyric'], px), txt) else look['fallback']
    while px > 24 and tw(txt, load(fam, px)) > 980: px -= 4   # (a Latin display face has no CJK: those go in a lyric font)
    f = load(fam, px)
    d.text((W / 2 + px * .05, y + px * .07), txt, font=f, fill=INK, anchor='mm', stroke_width=int(px * .1), stroke_fill=INK)
    d.text((W / 2, y), txt, font=f, fill=col, anchor='mm', stroke_width=int(px * .1), stroke_fill=INK)
title.save(OUT / f'{o.name}_title.png')

# the lyric band, frame by frame (frames that look the same are written once and copied)
sub_dir = OUT / f'{o.name}_subs'; shutil.rmtree(sub_dir, ignore_errors=True); sub_dir.mkdir()
last_key = last_file = None
for fi in range(round(DUR * FPS)):
    t = A + fi / FPS
    i = next((k for k in range(len(LINES)) if shown(k)[0] <= t < shown(k)[1]), None)
    path = sub_dir / f'f{fi:05d}.png'
    key = None if i is None else (i, round(sung_chars(LINES[i], t), 2), round(min(1, (t - shown(i)[0]) / .15, (shown(i)[1] - t) / .15), 2))
    if key == last_key and last_file: shutil.copyfile(last_file, path); continue
    (band(i, t) if i is not None else Image.new('RGBA', (W, BAND_H), (0, 0, 0, 0))).save(path)
    last_key, last_file = key, path

fc = (f"[0:v]split[a][b];[a]scale=-2:{H},crop={W}:{H},gblur=sigma=38,eq=brightness=-0.16:saturation=1.1[bg];"
      f"[b]scale={W}:608[fg];[bg][fg]overlay=0:{BOX_Y}[v1];[v1][1:v]overlay=0:0[v2];[v2][2:v]overlay=0:{BAND_Y}[v3];"
      f"[v3]fade=in:st=0:d=0.35,fade=out:st={DUR - .5:.3f}:d=0.5,format=yuv420p[v]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-loop', '1', '-framerate', str(FPS), '-i', str(OUT / f'{o.name}_title.png'),
                '-framerate', str(FPS), '-i', str(sub_dir / 'f%05d.png'), '-filter_complex', fc, '-map', '[v]', '-map', '0:a?',
                '-af', f'afade=in:st=0:d=0.3,afade=out:st={DUR - .6:.3f}:d=0.6', '-t', f'{DUR:.3f}', '-r', str(FPS),
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out)], check=True)
print('wrote', out)
