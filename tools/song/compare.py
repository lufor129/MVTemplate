"""compare.py: measure song.json's lyric timing against a hand-timed reference (the acceptance test for analyze.py).

  uv run --project tools/song python tools/song/compare.py examples/pdoom/song/song.json examples/pdoom/song/reference.json

The reference is {"lines": [{"start", "end", "text"}, ...]} in the same order as lyric.txt. Passes when no line is
missing and the median start error is at most --tol seconds (default 0.2). End errors are reported too, but a
hand-timed subtitle usually ends when the next one starts, not when the singing stops, so they don't decide the pass.
"""
import argparse, json, sys
from statistics import median


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('song'); ap.add_argument('reference'); ap.add_argument('--tol', type=float, default=.2)
    a = ap.parse_args()
    got = json.load(open(a.song, encoding='utf-8'))['lines']
    ref = json.load(open(a.reference, encoding='utf-8'))['lines']
    if len(got) != len(ref): sys.exit(f'line count differs: song.json {len(got)}, reference {len(ref)}')
    ds, de, bad = [], [], []
    print(f"{'ref':>7} {'got':>7} {'Δstart':>7}  {'Δend':>6}  conf  line")
    for g, r in zip(got, ref):
        s, e = g['start'] - r['start'], g['end'] - r['end']
        ds.append(abs(s)); de.append(abs(e))
        flag = '  ✗' if abs(s) > a.tol else ''
        if flag: bad.append(g['text'])
        print(f"{r['start']:7.2f} {g['start']:7.2f} {s:+7.2f}  {e:+6.2f}  {g['confidence']:.2f}  {g['text'][:48]}{flag}")
    ms, me = median(ds), median(de)
    print(f'\nstart error: median {ms:.3f} s, max {max(ds):.3f} s, {len(bad)}/{len(got)} lines over {a.tol} s')
    print(f'end error:   median {me:.3f} s, max {max(de):.3f} s')
    ok = ms <= a.tol
    print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
