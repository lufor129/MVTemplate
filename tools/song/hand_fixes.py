# hand_fixes.py: the person's fixes to song/song.json from the Song Check (GUIDE.md step 1). Copy it into song/ the
# first time they report something, add one fix per report at the bottom, and run it:  python3 song/hand_fixes.py
# It reads the analysis's own output, song/song.auto.json, and writes song/song.json, so the fixes survive a re-run
# of tools/song/analyze.py (which writes both files, then runs this one again). L<n> is song.json's lines[n].
import json
from pathlib import Path

HERE = Path(__file__).parent
SONG, AUTO = HERE / 'song.json', HERE / 'song.auto.json'
if not AUTO.exists(): AUTO.write_text(SONG.read_text(encoding='utf-8'), encoding='utf-8')   # analysed before song.auto.json
s = json.loads(AUTO.read_text(encoding='utf-8'))
L = s['lines']

def hand(n):
    """A line timed by ear: no longer red in the Song Check."""
    L[n]['confidence'], L[n]['hand'] = max(L[n]['confidence'], .9), True

def set_words(n, starts, end):
    """Token k of line n starts at starts[k] (heard on the vocal stem); each ends where the next starts, the last at end."""
    assert len(starts) == len(L[n]['tokens']), f"L{n} has {len(L[n]['tokens'])} tokens, not {len(starts)}"
    L[n]['tokens'] = [[round(t, 3), round((starts[k + 1] - .02) if k + 1 < len(starts) else end, 3)] for k, t in enumerate(starts)]
    L[n]['start'], L[n]['end'] = round(starts[0], 3), round(end, 3)
    hand(n)

def squeeze(n, start, end):
    """Line n's words keep their rhythm, stretched or squeezed into [start, end]."""
    T = L[n]['tokens']; a, b = T[0][0], T[-1][1]
    f = lambda t: start + (t - a) * (end - start) / (b - a)
    L[n]['tokens'] = [[round(f(x), 3), round(f(y), 3)] for x, y in T]
    L[n]['start'], L[n]['end'] = round(start, 3), round(end, 3)
    hand(n)

def shift(n, dt):
    """Line n, all of it, dt seconds later (earlier when negative)."""
    squeeze(n, L[n]['start'] + dt, L[n]['end'] + dt)

def section(name, start=None, end=None):
    """Move a Section's edges (the first Section with that name, or an index)."""
    S = s['sections'][name] if isinstance(name, int) else next(x for x in s['sections'] if x['name'] == name)
    if start is not None: S['start'] = round(start, 3)
    if end is not None: S['end'] = round(end, 3)

# ---------- the fixes: one per report, with the date and what the person said ----------
# set_words(13, [50.00, 50.10, 50.18, 50.32, 50.48], 51.90)        # 2026-10-26 "請假 lights up early"
# squeeze(40, 150.08, 152.45)
# shift(23, -.12)
# section('Chorus', start=41.99)
# s['downbeats'] = [d for d in s['downbeats'] if d not in (90.54, 91.10)]   # two spurious bar starts

SONG.write_text(json.dumps(s, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('wrote', SONG)
