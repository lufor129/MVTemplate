// karaoke.js: the optional on-screen Lyric Line (MV.karaoke), outside the painted picture. The engine works out what
// is being sung and how far; the Style Profile paints the band (STYLE.karaoke.band) and letters it
// (STYLE.karaoke.text). Each word lights up as it is sung, from the word times in song.json.
//
// KARAOKE_TOP: the band's top edge. While a line is showing, keep faces and key action above it.
// With a translation (song/translation.txt), each line's `sub` sits on a row above the sung words, so the band is taller.
const KARAOKE_SUB = SONG.lines.some(l => l.sub);
const KARAOKE_TOP = MV.format === '9:16' ? H * .7 : H - (KARAOKE_SUB ? 166 : 110);
let KARAOKE = null;
// Stretches where a Chapter letters the line itself (a closing caption): KARAOKE_HIDE.push([start, end]) hides the band.
const KARAOKE_HIDE = [];

// Character ranges of the tokens song.json timed (CJK: one per character; otherwise one per word), matching
// tools/song/analyze.py's tokens(). Returns null if they don't line up, and the highlight then runs by time.
function _tokenRanges(text) {
  const out = [], cjk = /[぀-ヿ㐀-䶿一-鿿가-힯]/, wordC = /[\p{L}\p{N}]/u;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (cjk.test(c)) { out.push([i, i + 1]); i++; }
    else if (wordC.test(c)) { const a = i; while (i < text.length && (wordC.test(text[i]) && !cjk.test(text[i]) || (/['’]/.test(text[i]) && wordC.test(text[i + 1] || '')))) i++; out.push([a, i]); }
    else i++;
  }
  return out;
}

function karaoke(t) {
  if (KARAOKE_HIDE.some(([a, b]) => t >= a && t < b)) return;
  const L = lineAt(t); if (!L) return;
  const { line } = L, a = line.start, b = line.end;
  const grow = easeOut((t - a) / .18) * (1 - ease((t - (b - .12)) / .12));
  if (grow < .02) return;
  // how many characters have been sung (fractional), from each token's own time
  const R = _tokenRanges(line.text), tk = line.tokens || [];
  let sung;
  if (R.length && R.length === tk.length) {
    sung = 0;
    for (let i = 0; i < R.length; i++) {
      const [c0, c1] = R[i], [t0, t1] = tk[i];
      if (t >= t1) sung = c1; else { if (t > t0) sung = c0 + (c1 - c0) * (t - t0) / Math.max(.05, t1 - t0); break; }
    }
  } else sung = line.text.length * clamp((t - a) / (b - a));
  KARAOKE = { text: line.text, sub: line.sub, a, b, grow, sung, top: KARAOKE_TOP };
  STYLE.karaoke.band(KARAOKE);
}
// Called from composite(), on the 2D canvas, after the painting: anything that sits over the picture (the Song
// Check's labels), then the karaoke letters.
function drawOverlayText(c) {
  if (window.OVER_TEXT) window.OVER_TEXT(c);
  if (KARAOKE && KARAOKE.grow > .85) STYLE.karaoke.text(c, KARAOKE);
}
// Split text into at most two rows that fit maxW (CJK can break anywhere, other scripts at spaces). Returns
// [{ from, to }] character ranges.
function karaokeRows(c, text, maxW) {
  if (c.measureText(text).width <= maxW) return [{ from: 0, to: text.length }];
  let best = text.length >> 1, bestD = Infinity;
  for (let i = 1; i < text.length; i++) {
    const ok = text[i] === ' ' || /[぀-ヿ㐀-鿿]/.test(text[i]);
    if (ok && Math.abs(i - text.length / 2) < bestD) { best = i; bestD = Math.abs(i - text.length / 2); }
  }
  return [{ from: 0, to: best }, { from: text[best] === ' ' ? best + 1 : best, to: text.length }];
}
// Where the karaoke's rows go, for a Style Profile's band() and text(): the translation row (K.sub, at .8 of the size,
// unlit: it has no word times) over the sung line's rows. font(size) gives the profile's CSS font. Sets K.rows
// ([{ from, to, y }]: the sung rows and their centres), K.subY, K.subSize and K.box ({ y, h, tw }: the block's top,
// height and widest row), and keeps the block inside the frame.
function karaokeLayout(c, K, font, sz) {
  const ss = K.sub ? sz * .8 : 0;
  c.font = font(sz);
  const rows = karaokeRows(c, K.text, W - 160);
  let tw = Math.max(...rows.map(r => c.measureText(K.text.slice(r.from, r.to)).width));
  if (ss) { c.font = font(ss); tw = Math.max(tw, c.measureText(K.sub).width); }
  const gap = ss ? (ss + sz) / 2 * 1.25 : 0, h = 88 + gap + (rows.length - 1) * sz * 1.25;
  const y = Math.min(K.top + 8, H - 14 - h);
  K.subY = y + 44; K.subSize = ss;
  K.rows = rows.map((r, i) => ({ ...r, y: y + 44 + gap + i * sz * 1.25 }));
  K.box = { y, h, tw };
  return K.box;
}
