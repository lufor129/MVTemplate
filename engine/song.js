// song.js: the Song as the picture sees it: the Beat Grid, the Lyric Lines and the Sections, from song/song.json
// (built into SONG by engine/build.mjs). Rhythm comes from the grid of real beat times, not from a tempo (ADR 0002):
// a played song drifts, and the picture has to drift with it.
//
//   bpOf(t)    beat position: 12.5 = halfway between beat 12 and beat 13. Before the first beat and after the last it
//              runs on at the nearest beat's length, so every t has a position.
//   beatN(t)   the beat t is in.               beatAt(n)  the time of beat n (fractional n is fine).
//   barOf(t), barN(t), barAt(n)                the same for bars (the downbeats).
//   pulse(t, k), pulse2(t, k)                  1 exactly on each beat (or eighth), decaying after: hits and bounces.
//   BEAT, BAR                                  the typical beat and bar length in seconds, for sizing motions.
//   wordAt(i, k)                               when word k of Lyric Line i starts (CJK: character k).
//   beatsAfter(t, n)                           n beats after the beat nearest t.
//   lineAt(t)  the Lyric Line being sung at t: { i, line, k } (k = 0..1 through it), or null.
//   sectionAt(t)                               the Section at t: { i, section, k }.
const DUR = SONG.duration;
const BEATS = SONG.beats, BARS = SONG.downbeats.length > 1 ? SONG.downbeats : SONG.beats.filter((b, i) => i % 4 === 0);
const LINES = SONG.lines, SECTIONS = SONG.sections;

const _median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : .5; };
const BEAT = _median(BEATS.slice(1).map((b, i) => b - BEATS[i]));
const BAR = _median(BARS.slice(1).map((b, i) => b - BARS[i])) || 4 * BEAT;

// position of t in a sorted list of times G (index + fraction), extrapolating at the edge spacing
function _gridPos(G, t) {
  const n = G.length;
  if (n < 2) return t / BEAT;
  if (t < G[0]) return (t - G[0]) / (G[1] - G[0]);
  if (t >= G[n - 1]) return n - 1 + (t - G[n - 1]) / (G[n - 1] - G[n - 2]);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (G[m] <= t) lo = m; else hi = m; }
  return lo + (t - G[lo]) / (G[lo + 1] - G[lo]);
}
// the time at grid position p (the inverse of _gridPos)
function _gridAt(G, p) {
  const n = G.length;
  if (n < 2) return p * BEAT;
  if (p < 0) return G[0] + p * (G[1] - G[0]);
  if (p >= n - 1) return G[n - 1] + (p - n + 1) * (G[n - 1] - G[n - 2]);
  const i = Math.floor(p); return lerp(G[i], G[i + 1], p - i);
}

const bpOf = t => _gridPos(BEATS, t);
const beatN = t => Math.floor(bpOf(t));
const beatAt = n => _gridAt(BEATS, n);
const barOf = t => _gridPos(BARS, t);
const barN = t => Math.floor(barOf(t));
const barAt = n => _gridAt(BARS, n);
const pulse = (t, k = 6) => Math.exp(-frac(bpOf(t)) * k);          // 1 exactly on each beat, decays after
const pulse2 = (t, k = 6) => Math.exp(-frac(bpOf(t) * 2) * k);     // same on eighth notes
const nearestBeat = t => beatAt(Math.round(bpOf(t)));
const nearestBar = t => barAt(Math.round(barOf(t)));
const wordAt = (i, k) => LINES[i].tokens[k][0];
const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);

function lineAt(t) {
  for (let i = 0; i < LINES.length; i++) {
    const L = LINES[i];
    if (t >= L.start && t < L.end) return { i, line: L, k: (t - L.start) / (L.end - L.start) };
  }
  return null;
}
function sectionAt(t) {
  for (let i = 0; i < SECTIONS.length; i++) {
    const S = SECTIONS[i];
    if (t >= S.start && t < S.end) return { i, section: S, k: (t - S.start) / (S.end - S.start) };
  }
  return null;
}
