"""analyze.py: turn a song folder (song.mp3 + lyric.txt) into song.json, the timing every other step uses.

  uv run --project tools/song python tools/song/analyze.py song            # or examples/pdoom/song
  options: --lang=zh|en|ja (Whisper's language; guessed from lyric.txt), --redo=vocals,asr,refine,beats (ignore those caches)

Steps (each cached in <song>/.analysis/, so a re-run only redoes what changed):
  1. vocals   HTDemucs separates the voice from the band (Whisper mishears sung lines over a full mix).
  2. asr      Whisper large-v3 transcribes the vocals with a time for every word.
  3. align    lyric.txt is the only source of WORDS (ADR 0003): its lines are aligned to the transcript token by token,
              and the transcript only lends them rough times. Lines Whisper missed are placed between their neighbours.
  4. refine   each line is re-timed by forced alignment of its known words (torchaudio's MMS aligner) on the vocals;
              where that disagrees with Whisper, the line keeps Whisper's time and is flagged for the Song Check.
  5. beats    beat_this finds every beat and bar start on the full mix: the Beat Grid (ADR 0002).
  6. sections lyric.txt's [Section] marks (or blank lines) group the lines; unsung stretches of a bar or more become
              intro / interlude / outro sections, and every section edge is snapped to a bar start when one is near.
Writes <song>/song.json and <song>/.analysis/check_mix.wav (the song with a click on every beat, for the Song Check).
"""
import argparse, json, re, subprocess, sys, unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

SR = 44100


# ---------- audio ----------
def load_audio(path, sr=SR, mono=False):
    """Decode any audio file with ffmpeg to float32 [channels, samples]."""
    ch = 1 if mono else 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', str(ch), '-ar', str(sr), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).T.copy()


def device():
    import torch
    return 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'


def separate(song, cache):
    import soundfile as sf
    out = cache / 'vocals.flac'
    if out.exists(): return out
    import torch
    from demucs.api import Separator
    print('[vocals] separating with HTDemucs …', flush=True)
    sep = Separator(model='htdemucs', device=device(), progress=True)
    _, stems = sep.separate_tensor(torch.from_numpy(load_audio(song)), SR)
    sf.write(out, stems['vocals'].cpu().numpy().T, SR)
    return out


def transcribe(vocals, cache, lang):
    out = cache / 'asr.json'
    if out.exists(): return json.loads(out.read_text())
    import whisper, torch
    print(f'[asr] Whisper large-v3, language={lang} …', flush=True)
    audio = load_audio(vocals, 16000, mono=True)[0]
    model = whisper.load_model('large-v3', device='cpu')   # openai-whisper's alignment heads don't run on MPS
    res = model.transcribe(audio, language=lang, word_timestamps=True, condition_on_previous_text=False,
                           fp16=False, verbose=False, no_speech_threshold=.4)
    words = [{'t0': round(w['start'], 3), 't1': round(w['end'], 3), 'w': w['word'], 'p': round(w.get('probability', 0), 3)}
             for s in res['segments'] for w in s.get('words', [])]
    out.write_text(json.dumps({'language': res.get('language'), 'words': words}, ensure_ascii=False, indent=0))
    return json.loads(out.read_text())


def beat_grid(song, cache):
    out = cache / 'beats.json'
    if out.exists(): return json.loads(out.read_text())
    from beat_this.inference import Audio2Beats
    print('[beats] beat_this …', flush=True)
    sig = load_audio(song, 22050, mono=True)[0]
    try: beats, downs = Audio2Beats(checkpoint_path='final0', device=device())(sig, 22050)
    except Exception as e:
        print(f'[beats] {device()} failed ({e}); using the CPU', flush=True)
        beats, downs = Audio2Beats(checkpoint_path='final0', device='cpu')(sig, 22050)
    res = {'beats': [round(float(b), 3) for b in beats], 'downbeats': [round(float(b), 3) for b in downs]}
    out.write_text(json.dumps(res))
    return res


# ---------- lyric sheet ----------
SECTION_KINDS = ['pre-chorus', 'prechorus', 'intro', 'verse', 'chorus', 'hook', 'bridge', 'interlude', 'break', 'solo', 'outro', 'refrain']

def kind_of(name):
    n = name.lower()
    for k in SECTION_KINDS:
        if k in n: return 'pre-chorus' if k == 'prechorus' else k
    return 'section'


def read_lyrics(path):
    """[Section] marks start a section; without marks, blank lines do. Returns [(name, [line, ...]), ...]."""
    sections, cur, marked = [], None, False
    for raw in Path(path).read_text(encoding='utf-8').splitlines():
        s = raw.strip()
        m = re.fullmatch(r'\[(.+?)\]', s)
        if m:
            marked = True; cur = (m.group(1).strip(), []); sections.append(cur); continue
        if not s:
            if not marked and cur and cur[1]: cur = None
            continue
        if cur is None: cur = (f'Part {len(sections) + 1}', []); sections.append(cur)
        cur[1].append(s)
    return [s for s in sections if s[1]]


def guess_lang(text):
    kana = len(re.findall(r'[぀-ヿ]', text)); han = len(re.findall(r'[一-鿿]', text))
    latin = len(re.findall(r'[A-Za-z]+', text))
    return 'ja' if kana > 5 else 'zh' if han > latin else 'en'


# ---------- tokens and alignment ----------
_t2s = None
def norm_cjk(s):
    global _t2s
    if _t2s is None:
        import opencc; _t2s = opencc.OpenCC('t2s')
    return _t2s.convert(s)

CJK = re.compile(r'[぀-ヿ㐀-䶿一-鿿가-힯]')

def tokens(text):
    """Characters for CJK, lower-case words for everything else; punctuation dropped."""
    text = unicodedata.normalize('NFKC', text).lower().replace("'", '').replace('’', '')
    out, word = [], ''
    for c in text:
        if CJK.match(c):
            if word: out.append(word); word = ''
            out.append(norm_cjk(c))
        elif c.isalnum(): word += c
        elif word: out.append(word); word = ''
    if word: out.append(word)
    return out


def asr_tokens(words):
    """Whisper words → [(token, t0, t1)]; a multi-token word shares its time out evenly."""
    out = []
    for w in words:
        tk = tokens(w['w'])
        if not tk: continue
        d = (w['t1'] - w['t0']) / len(tk)
        out += [(t, w['t0'] + i * d, w['t0'] + (i + 1) * d) for i, t in enumerate(tk)]
    return out


def sim(a, b):
    if a == b: return 1.
    if CJK.match(a) or CJK.match(b): return 0.
    return SequenceMatcher(None, a, b).ratio()


def align(L, A):
    """Needleman-Wunsch over two token lists with fuzzy word matches. Returns {lyric index: asr index}."""
    n, m = len(L), len(A)
    GAP = -1.
    score = np.zeros((n + 1, m + 1)); back = np.zeros((n + 1, m + 1), np.int8)
    score[:, 0] = GAP * np.arange(n + 1); score[0, :] = GAP * np.arange(m + 1); back[1:, 0] = 1; back[0, 1:] = 2
    S = {}
    for i in range(1, n + 1):
        li = L[i - 1]
        for j in range(1, m + 1):
            key = (li, A[j - 1])
            s = S.get(key)
            if s is None:
                r = sim(*key); s = S[key] = 2. if r >= .8 else 1. if r >= .55 else -1.
            d, u, l = score[i - 1, j - 1] + s, score[i - 1, j] + GAP, score[i, j - 1] + GAP
            if d >= u and d >= l: score[i, j] = d; back[i, j] = 0
            elif u >= l: score[i, j] = u; back[i, j] = 1
            else: score[i, j] = l; back[i, j] = 2
    pairs, i, j = {}, n, m
    while i > 0 or j > 0:
        b = back[i, j]
        if i > 0 and j > 0 and b == 0:
            if sim(L[i - 1], A[j - 1]) >= .55: pairs[i - 1] = j - 1
            i -= 1; j -= 1
        elif i > 0 and (j == 0 or b == 1): i -= 1
        else: j -= 1
    return pairs


def time_lines(sections, asr):
    """Each lyric line gets start/end from its matched tokens; unmatched tokens and lines are filled in from
    their neighbours. Returns the line list (in order) with a confidence (matched share of tokens)."""
    A = asr_tokens(asr['words'])
    lines = []
    for si, (name, ls) in enumerate(sections):
        for text in ls: lines.append({'text': text, 'section': si, 'tok': tokens(text)})
    L = [t for ln in lines for t in ln['tok']]
    pairs = align(L, [a[0] for a in A])
    # token times; unmatched ones interpolated between matched neighbours (by token count)
    T = [None] * len(L)
    for i, j in pairs.items(): T[i] = [A[j][1], A[j][2]]
    known = [i for i in range(len(L)) if T[i]]
    tok_d = float(np.median([A[j][2] - A[j][1] for j in pairs.values()])) if pairs else .3
    for i in range(len(L)):
        if T[i]: continue
        prv = max((k for k in known if k < i), default=None); nxt = min((k for k in known if k > i), default=None)
        if prv is not None and nxt is not None:
            k = (i - prv) / (nxt - prv); t = T[prv][1] + k * (T[nxt][0] - T[prv][1]); T[i] = [t, t + min(tok_d, T[nxt][0] - t)]
        elif prv is not None: t = T[prv][1] + (i - prv - 1) * tok_d; T[i] = [t, t + tok_d]
        elif nxt is not None: t = T[nxt][0] - (nxt - i) * tok_d; T[i] = [max(0, t), max(0, t) + tok_d]
        else: T[i] = [0, tok_d]
    # Whisper gives the held last note of a line to the FIRST word of the next one (sung lines often run on with no
    # silence between them), so a line-opening word can come out a second long. Cap it at the length this singer
    # usually gives a word of that size, measured on words inside lines.
    firsts, k = set(), 0
    for ln in lines: firsts.add(k); k += len(ln['tok'])
    per_char = [(T[i][1] - T[i][0]) / max(1, len(L[i])) for i in pairs if i not in firsts and i + 1 not in firsts]
    pc = float(np.median(per_char)) if per_char else .08
    for i in firsts:
        if i in pairs and i < len(L):
            cap = max(.25, 1.8 * pc * len(L[i]))
            if T[i][1] - T[i][0] > cap: T[i][0] = T[i][1] - cap
    out, k = [], 0
    for ln in lines:
        n = len(ln['tok']); idx = range(k, k + n); k += n
        hit = sum(1 for i in idx if i in pairs)
        out.append({'start': round(T[idx[0]][0], 3) if n else None, 'end': round(T[idx[-1]][1], 3) if n else None,
                    'text': ln['text'], 'tok': ln['tok'], 'section': ln['section'], 'confidence': round(hit / max(1, n), 2),
                    'tokens': [[round(T[i][0], 3), round(T[i][1], 3)] for i in idx]})
    return out


# ---------- refining with forced alignment ----------
_uroman = _kakasi = None
def units(text, toks):
    """The line as words the MMS aligner can read (romanized, a-z only), each with the lyric tokens it covers.
    Japanese goes through pykakasi (kanji need Japanese readings); everything else through uroman."""
    global _uroman, _kakasi
    clean = lambda s: re.sub(r"[^a-z']", '', s.lower())
    if re.search(r'[\u3040-\u30ff]', text):
        if _kakasi is None:
            import pykakasi; _kakasi = pykakasi.kakasi()
        out, k = [], 0
        for it in _kakasi.convert(text):
            n = len(tokens(it['orig']))
            if n and clean(it['hepburn']): out.append((clean(it['hepburn']), list(range(k, k + n))))
            k += n
        return out
    if _uroman is None:
        import uroman; _uroman = uroman.Uroman()
    return [(clean(_uroman.romanize_string(t)), [i]) for i, t in enumerate(toks) if clean(_uroman.romanize_string(t))]


def refine(lines, vocals, cache):
    """Whisper's word times come from attention, and in a song sung without pauses it hands the held end of one line
    to the first word of the next. So each line is re-timed by CTC forced alignment (torchaudio's multilingual MMS
    aligner) of its known words against the separated vocals, with the lines before and after it in the window so
    their sound has somewhere to go. Whisper's time stays the judge: a result far from it is dropped and the line
    keeps Whisper's time with a low confidence, for a person to check at the Song Check."""
    out = cache / 'refined.json'
    key = [[l['text'], l['start'], l['end']] for l in lines]
    if out.exists():
        c = json.loads(out.read_text())
        if c['key'] == key:
            for l, r in zip(lines, c['lines']): l.update(r)
            return
    import torch, torchaudio, warnings
    warnings.filterwarnings('ignore', module='torchaudio')
    print('[refine] MMS forced alignment …', flush=True)
    B = torchaudio.pipelines.MMS_FA
    model, tok, aligner = B.get_model(with_star=False).eval(), B.get_tokenizer(), B.get_aligner()
    x = torch.from_numpy(load_audio(vocals, 16000, mono=True))
    U = [units(l['text'], l['tok']) for l in lines]
    res = []
    for i, l in enumerate(lines):
        P, N = (lines[i - 1], U[i - 1]) if i else (None, []), (lines[i + 1], U[i + 1]) if i + 1 < len(lines) else (None, [])
        a = P[0]['start'] - .3 if P[0] else max(0, l['start'] - 1.5)
        b = N[0]['end'] + .3 if N[0] else l['end'] + 1.5
        words = [w for w, _ in P[1]] + [w for w, _ in U[i]] + [w for w, _ in N[1]]
        if not U[i]: res.append({}); continue
        seg = x[:, int(max(0, a) * 16000): int(b * 16000)]
        with torch.inference_mode(): em, _ = model(seg)
        spans = aligner(em[0], tok(words)); fr = seg.shape[1] / em.shape[1] / 16000
        mine = spans[len(P[1]): len(P[1]) + len(U[i])]
        s, e = a + mine[0][0].start * fr, a + mine[-1][-1].end * fr
        if abs(s - l['start']) > 1.2 or abs(e - l['end']) > 1.5:   # disagrees with Whisper: don't trust either
            res.append({'confidence': min(l['confidence'], .4)}); continue
        T = [None] * len(l['tok'])
        for (w, idx), sp in zip(U[i], mine):
            t0, t1 = a + sp[0].start * fr, a + sp[-1].end * fr
            for k, j in enumerate(idx): T[j] = [t0 + (t1 - t0) * k / len(idx), t0 + (t1 - t0) * (k + 1) / len(idx)]
        for j in range(len(T)):   # tokens the aligner can't read (digits, symbols) sit between their neighbours
            if T[j] is None:
                prv = next((T[k][1] for k in range(j - 1, -1, -1) if T[k]), s)
                T[j] = [prv, prv]
        res.append({'start': round(s, 3), 'end': round(e, 3), 'tokens': [[round(p, 3), round(q, 3)] for p, q in T]})
    for l, r in zip(lines, res): l.update(r)
    out.write_text(json.dumps({'key': key, 'lines': res}))


def tidy(lines):
    for a, b in zip(lines, lines[1:]):   # lines never overlap
        if a['end'] > b['start']: a['end'] = b['start'] = round((a['end'] + b['start']) / 2, 3)
    for l in lines:
        if l['end'] <= l['start']: l['end'] = round(l['start'] + .3, 3)
        if l['tokens']: l['tokens'][0][0] = l['start']; l['tokens'][-1][1] = l['end']


# ---------- sections ----------
def snap(t, downs, tol):
    if not downs: return t
    d = min(downs, key=lambda x: abs(x - t))
    return d if abs(d - t) <= tol else t


def make_sections(names, lines, grid, dur):
    beats, downs = grid['beats'], grid['downbeats']
    beat = float(np.median(np.diff(beats))) if len(beats) > 1 else .5
    bar = float(np.median(np.diff(downs))) if len(downs) > 1 else 4 * beat
    sung = []
    for si, name in enumerate(names):
        ls = [l for l in lines if l['section'] == si]
        sung.append({'name': name, 'kind': kind_of(name), 'first': min(l['start'] for l in ls), 'last': max(l['end'] for l in ls)})
    out, t = [], 0.
    for i, s in enumerate(sung):
        start = snap(s['first'], downs, beat)          # a sung section starts on the bar its first line is in
        if start > s['first'] + .05: start = max((d for d in downs if d <= s['first']), default=s['first'])
        if start - t >= bar * .95:                     # an unsung stretch of a bar or more is its own section
            out.append({'name': 'Intro' if not out else 'Interlude', 'kind': 'intro' if not out else 'interlude', 'start': t})
        elif out: start = t                            # a short gap belongs to the section before it
        s['index'] = len(out)
        out.append({'name': s['name'], 'kind': s['kind'], 'start': start})
        nxt = sung[i + 1]['first'] if i + 1 < len(sung) else dur
        t = snap(s['last'] + beat * .5, downs, beat)   # where the singing of this section stops (on a bar if near)
        t = min(max(t, s['last']), nxt)
    if dur - t >= bar * .95 and out[-1]['kind'] != 'outro':   # a sung outro just runs on to the end
        out.append({'name': 'Outro', 'kind': 'outro', 'start': t})
    for a, b in zip(out, out[1:] + [{'start': dur}]): a['end'] = round(b['start'], 3); a['start'] = round(a['start'], 3)
    return out, [s['index'] for s in sung]


# ---------- click track for the Song Check ----------
def click_mix(song, grid, out):
    import soundfile as sf
    x = load_audio(song)
    downs = set(round(d, 2) for d in grid['downbeats'])
    n = int(.04 * SR); env = np.exp(-np.arange(n) / (SR * .008))
    for b in grid['beats']:
        f = 1600 if round(b, 2) in downs else 1000
        c = .35 * env * np.sin(2 * np.pi * f * np.arange(n) / SR)
        i = int(b * SR); j = min(x.shape[1], i + n)
        if i < x.shape[1]: x[:, i:j] += c[: j - i]
    sf.write(out, np.clip(x * .8, -1, 1).T, SR, subtype='PCM_16')


# ---------- main ----------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dir', help='song folder with the audio (song.mp3/.wav/…) and lyric.txt')
    ap.add_argument('--lang', help='Whisper language (default: guessed from lyric.txt)')
    ap.add_argument('--redo', default='', help='comma list of caches to ignore: vocals, asr, refine, beats')
    a = ap.parse_args()
    d = Path(a.dir); cache = d / '.analysis'; cache.mkdir(exist_ok=True)
    audio = next((p for p in sorted(d.iterdir()) if p.stem == 'song' and p.suffix.lower() in ('.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac')), None)
    if not audio: sys.exit(f'no song.* audio file in {d}')
    lyr = d / 'lyric.txt'
    if not lyr.exists(): sys.exit(f'no lyric.txt in {d}')
    for r in filter(None, a.redo.split(',')):
        for f in {'vocals': ['vocals.flac', 'asr.json', 'refined.json'], 'asr': ['asr.json', 'refined.json'], 'refine': ['refined.json'], 'beats': ['beats.json']}[r]: (cache / f).unlink(missing_ok=True)

    sections = read_lyrics(lyr)
    lang = a.lang or guess_lang(lyr.read_text(encoding='utf-8'))
    dur = load_audio(audio, 8000, mono=True).shape[1] / 8000
    vocals = separate(audio, cache)
    asr = transcribe(vocals, cache, lang)
    grid = beat_grid(audio, cache)
    lines = time_lines(sections, asr)
    refine(lines, vocals, cache)
    tidy(lines)
    secs, where = make_sections([s[0] for s in sections], lines, grid, dur)
    for l in lines: l['section'] = where[l['section']]   # an index into the final section list
    beats = grid['beats']; bpm = 60 / float(np.median(np.diff(beats))) if len(beats) > 1 else None
    song = {'audio': audio.name, 'duration': round(dur, 3), 'language': lang, 'bpm': round(bpm, 2) if bpm else None,
            'beats': beats, 'downbeats': grid['downbeats'], 'sections': secs,
            'lines': [{k: l[k] for k in ('start', 'end', 'text', 'section', 'confidence', 'tokens')} for l in lines]}
    (d / 'song.json').write_text(json.dumps(song, ensure_ascii=False, indent=1))
    click_mix(audio, grid, cache / 'check_mix.wav')

    print(f"\n{audio.name}: {dur:.1f} s, {len(beats)} beats, ~{bpm:.1f} bpm, {len(grid['downbeats'])} bars, language {lang}")
    for i, s in enumerate(secs):
        print(f"  [{s['start']:7.2f}–{s['end']:7.2f}] {s['name']}")
        for l in (l for l in lines if l['section'] == i):
            flag = '  ⚠ low confidence' if l['confidence'] < .5 else ''
            print(f"      {l['start']:7.2f}–{l['end']:7.2f}  {l['confidence']:.2f}  {l['text']}{flag}")
    low = [l for l in lines if l['confidence'] < .5]
    print(f"\nwrote {d / 'song.json'}  ({len(low)} low-confidence line{'s' * (len(low) != 1)})")


if __name__ == '__main__':
    main()
