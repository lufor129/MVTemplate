# thumbnail.py: the cover (the YouTube thumbnail, 1280 × 720) for a finished 16:9 MV: a still of the picture alone,
# with the title lettered on it in the Style Profile's fonts, or with no lettering at all.
#
#   python3 tools/publish/thumbnail.py --mv=<dir> --at=60.9,72,130 [--title="BIG LINE|smaller line"] [--where=bottom]
#   python3 tools/publish/thumbnail.py --mv=<dir> --loop=curtain-call --where=none
#   python3 tools/publish/thumbnail.py --mv=<dir> --still=out/stills/t60_90.png --where=top
#
# --at renders the MV at those song times without the karaoke (render.mjs --stills --no-karaoke); --loop renders a
# loop's first frame (a cover drawn for the purpose: the whole cast out for a curtain call, say); --still takes a
# picture you already have. --title: "|" breaks it into a big line and a smaller one (mv.json's title by default).
# --where: bottom or top puts the title there over a dark band; none leaves the picture bare. Several --at times make
# several candidates and out/publish/thumbs_compare.jpg, to choose from with the person.
# Writes <mv>/out/publish/thumb_<name>.jpg (1280 × 720) and the full-size picture beside it. The fonts come from the
# Style Profile's Google Fonts, cached in <mv>/out/shorts/fonts/ (shared with tools/shorts/make_short.py).
# Needs Pillow and, for --at or --loop, Node and Chrome.
import argparse, json, re, subprocess, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(description='the cover for a finished MV')
ap.add_argument('--mv', default='.', help='the MV folder (the template root by default)')
src = ap.add_mutually_exclusive_group(required=True)
src.add_argument('--at', help='song times for the still, comma list (several make several candidates)')
src.add_argument('--loop', help='a loop in the MV (LOOPS) whose first frame is the cover')
src.add_argument('--still', help='a picture you already have (16:9)')
ap.add_argument('--title', help='"BIG LINE|smaller line" (default: mv.json title)')
ap.add_argument('--where', default='bottom', choices=['bottom', 'top', 'none'], help='where the title goes, or none')
ap.add_argument('--name', help='output name: out/publish/thumb_<name>.jpg (default: the time or the loop)')
ap.add_argument('--font', help='the big line\'s font family (default: the profile\'s first font)')
ap.add_argument('--font2', help='the smaller line\'s font family (default: one that has its characters)')
ap.add_argument('--colour', default='#FFD84A', help='the big line\'s colour')
o = ap.parse_args()

MV_DIR = (ROOT / o.mv).resolve()
OUT = MV_DIR / 'out' / 'publish'; OUT.mkdir(parents=True, exist_ok=True)
FONTS = MV_DIR / 'out' / 'shorts' / 'fonts'; FONTS.mkdir(parents=True, exist_ok=True)
MV = json.loads((MV_DIR / 'mv' / 'mv.json').read_text(encoding='utf-8')) if (MV_DIR / 'mv' / 'mv.json').exists() else {}
if MV.get('format') == '9:16': sys.exit('thumbnail.py makes 16:9 covers; a 9:16 MV uses a frame of itself')
sdir = ROOT / 'styles' / MV.get('style', 'watercolor')
style = json.loads((sdir / 'style.json').read_text())
fams = [(f.replace('+', ' '), (w or '').split(';')[-1]) for f, w in re.findall(r'family=([^&:]+)(?::wght@([\d;]+))?', style.get('fonts', ''))]
weights = dict(fams)
PAL = dict(re.findall(r"(\w+): '(#[0-9A-Fa-f]{6})'", (sdir / 'palette.js').read_text())) if (sdir / 'palette.js').exists() else {}
PAL.update(MV.get('palette', {}))
rgb = lambda c: tuple(int(PAL.get(c, c).lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
INK, CREAM = rgb(PAL.get('ink', '#262033')), rgb(PAL.get('cream', '#FFF7E6'))
CJK = re.compile(r'[぀-ヿ㐀-䶿一-鿿가-힯]')
CJK_FAMILY = re.compile(r' (TC|SC|JP|KR|HK)$|WenKai|Klee|DotGothic|M PLUS')

def font_file(family):
    """The family's TTF at the weight style.json asks for, from Google Fonts (the same cache and names as make_short.py)."""
    w = weights.get(family) or ''
    f = FONTS / (re.sub(r'\W', '', family) + w + '.ttf')
    if not f.exists():
        q = family.replace(' ', '+') + (f':wght@{w}' if w else '')
        css = urllib.request.urlopen(urllib.request.Request(f'https://fonts.googleapis.com/css2?family={q}', headers={'User-Agent': 'Wget/1.21'}), timeout=120).read().decode()
        url = re.search(r'url\((https://[^)]+\.ttf)\)', css).group(1)
        print(f'downloading {family} …', flush=True); f.write_bytes(urllib.request.urlopen(url, timeout=300).read())
    return str(f)

def font(family, px):
    F = ImageFont.truetype(font_file(family), px)
    try: F.set_variation_by_axes([int(weights.get(family) or 400)])   # a variable font: at the weight asked for
    except Exception: pass
    return F

def family_for(text, first):
    if not CJK.search(text): return first
    return next((f for f, _ in fams if CJK_FAMILY.search(f)), first)

def band(im, top, bottom, a0, a1):   # a dark ink gradient behind the lettering: alpha a0 at `top` to a1 at `bottom`
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for y in range(top, bottom):
        d.line([(0, y), (im.width, y)], fill=INK + (int(a0 + (a1 - a0) * (y - top) / max(1, bottom - top)),))
    return Image.alpha_composite(im, ov)

def letter(im, where):
    big, _, small = (o.title or MV.get('title', 'Untitled MV')).partition('|')
    big, small = big.strip(), small.strip()
    d, x = ImageDraw.Draw(im), 60
    fb = font(o.font or family_for(big, fams[0][0]), 170)
    while d.textlength(big, font=fb) > im.width - 2 * x and fb.size > 60: fb = font(o.font or family_for(big, fams[0][0]), fb.size - 6)
    fs = font(o.font2 or family_for(small, fams[min(1, len(fams) - 1)][0]), int(fb.size * .73)) if small else None
    h = fb.size * (1.95 if small else 1.1)
    y = 26 if where == 'top' else im.height - 60 - h
    d.text((x, y), big, font=fb, fill=rgb(o.colour), stroke_width=round(fb.size * .075), stroke_fill=INK)
    if small:
        zy = y + fb.size
        d.text((x + 6, zy), small, font=fs, fill=CREAM, stroke_width=round(fs.size * .14), stroke_fill=INK)
        d.text((x + 6, zy), small, font=fs, fill=CREAM, stroke_width=round(fs.size * .025), stroke_fill=CREAM)   # a bolder face
    return im

def cover(src, name):
    im = Image.open(src).convert('RGBA').resize((1920, 1080), Image.LANCZOS)
    if o.where == 'bottom': im = letter(band(im, 600, 1080, 0, 220), 'bottom')
    elif o.where == 'top': im = letter(band(im, 0, 460, 220, 0), 'top')
    im.convert('RGB').save(OUT / f'thumb_{name}_1920.jpg', quality=93)
    im.convert('RGB').resize((1280, 720), Image.LANCZOS).save(OUT / f'thumb_{name}.jpg', quality=92)
    print('wrote', OUT / f'thumb_{name}.jpg')
    return OUT / f'thumb_{name}.jpg'

render = lambda *a: subprocess.run(['node', str(ROOT / 'engine' / 'render.mjs'), f'--mv={MV_DIR}', '--no-karaoke', *a], check=True)
stills = OUT / 'stills'
if o.at:
    ts = [float(t) for t in o.at.split(',')]
    render(f'--stills={",".join(map(str, ts))}', f'--out={stills}')
    made = [cover(stills / ('t' + f'{t:.2f}'.replace('.', '_') + '.png'),   # render.mjs names a still t60_90.png
                  o.name if o.name and len(ts) == 1 else (f'{o.name}_' if o.name else '') + f'{t:g}') for t in ts]
elif o.loop:
    render(f'--loop={o.loop}', '--stills=0', f'--out={stills / o.loop}')
    made = [cover(stills / o.loop / 't0_00.png', o.name or o.loop)]
else:
    made = [cover(o.still, o.name or Path(o.still).stem)]
if len(made) > 1:
    ims = [Image.open(p) for p in made]
    sheet = Image.new('RGB', (1280 * len(ims) + 20 * (len(ims) - 1), 720), 'white')
    for i, t in enumerate(ims): sheet.paste(t, (i * 1300, 0))
    sheet.save(OUT / 'thumbs_compare.jpg', quality=88); print('wrote', OUT / 'thumbs_compare.jpg')
