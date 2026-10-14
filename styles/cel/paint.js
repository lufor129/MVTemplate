// paint.js: the cel Style Profile's drawing primitives: flat cel fills a little off-register, hard-edged shadow tones,
// and variable-width ink lines that boil, on animation paper. See STYLE.md for the rules of the look.

const INK_W = 4.4;   // stroke width in frame units per unit of `sw`
// Brushes: width, opacity, and how broken the line is (0 = solid). Names match the watercolour profile, so Characters
// written for one draw in the other.
const BRUSHES = { ink: [1, 1, 0], inkfine: [.6, 1, 0], dry: [1.5, .6, .35], '2B': [.75, .85, 0], HB: [.5, .7, 0], charcoal: [1.3, .65, .3],
  marker: [1.2, .9, 0], pen: [.7, 1, 0], rotring: [.6, 1, 0], cpencil: [.6, .75, .1], spray: [1.6, .3, .2] };

// The ink: a closed or open path, resampled and nudged on every boil drawing, thick and thin like a pressed brush.
function _ink(P, sw, col, br, closed) {
  const [bw, ba, broken] = BRUSHES[br] || BRUSHES.ink, w = Math.max(.6, sw * INK_W * bw);
  const S = _resample(P, Math.max(5, w * 1.6), closed).map(([x, y]) => [x + jit(w * .14), y + jit(w * .14)]);
  if (S.length < 2) return;
  const n = S.length, ph = jit(Math.PI), taper = Math.min(n / 3, 4);
  const width = i => w * (.78 + .3 * Math.sin(i * .55 + ph)) * (closed ? 1 : clamp(Math.min(i + .6, n - .4 - i) / taper, .35, 1));
  if (!broken) return _stroke(S, width, col, ba, closed);
  for (let i = 0; i < S.length - 1; i++) if (random() > broken) _stroke([S[i], S[i + 1]], width, col, ba, false);
}

// ---------- paint ----------
// One call = one shape: an optional flat colour (wash), a flat tone over it (fill: shading, light, cast shadows),
// optional hatching, and an ink outline unless ink is null.
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const P = o.curv ? _smooth(pts, o.curv) : pts;
  if (o.wash) {   // printed a little off the line, like hand colouring
    const dx = 1.6 + jit(.6), dy = 1.2 + jit(.6);
    _fillPoly(P.map(([x, y]) => [x + dx, y + dy]), o.wash, (o.washOp ?? 255) / 255);
  }
  if (o.fill) _fillPoly(P, o.fill, Math.min(.85, (o.fillOp ?? 170) / 255 * .8));
  if (o.hatch) {
    const h = o.hatch, rand = (h.o && h.o.rand) || 0;
    for (const L of _hatchLines(P, h.d || 12, h.a || 0, rand)) _ink(L, (h.w || 1) * .45, h.c || PAL.ink, h.b || 'HB', false);
  }
  if (o.ink !== null) _ink(P, o.sw ?? 1, o.ink || PAL.ink, o.br || 'ink', true);
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  _ink(pts.length > 2 ? _smooth(pts, curv, false) : pts, sw, col, br, false);
}

// ---------- paper ----------
function _makePaper() {
  const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext, rnd = _lcg(23), A = W * H / (1920 * 1080);
  c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  c.lineWidth = 1;
  for (let i = 0; i < 900 * A; i++) { const x = rnd() * W, y = rnd() * H, l = 4 + rnd() * 18, a = rnd() * TAU; c.strokeStyle = `rgba(120,100,70,${.025 + rnd() * .04})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  return g;
}
function _makeGrain() {
  const cv = document.createElement('canvas'); cv.width = W * RS; cv.height = H * RS; const c = cv.getContext('2d'), rnd = _lcg(9), d = c.createImageData(cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = 255 - (rnd() < .4 ? rnd() * 18 : 0); d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v - 2; d.data[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  return cv;
}

// ---------- the Style Profile's hooks ----------
let _paperG = null, _grainC = null;
const KARAOKE_FONT = '"Shantell Sans", "LXGW WenKai TC", "Klee One", sans-serif';
const STYLE = {
  fonts: ['Permanent Marker', 'Shantell Sans', 'LXGW WenKai TC', 'Klee One'],
  async setup() { _paperG = _makePaper(); _grainC = _makeGrain(); },
  underlay() { image(_paperG, 0, 0, W, H); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush() {},
  letterFont: size => `${size}px "Permanent Marker", "LXGW WenKai TC", "Klee One", cursive`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // an inked band with a boiling outline, growing in from the centre
    band(K) {
      const c = outX, sz = this.size; c.font = `800 ${sz}px ${KARAOKE_FONT}`;
      const rows = karaokeRows(c, K.text, W - 160), tw = Math.max(...rows.map(r => c.measureText(K.text.slice(r.from, r.to)).width));
      const w = (tw + 110) * K.grow, hh = 88 + (rows.length - 1) * sz * 1.25;
      boilSeed('karaoke');
      paint(rrPts(W / 2 - w / 2, K.top + 8, w, hh, Math.min(28, w / 2), 2), { wash: PAL.ink, washOp: 235, fill: PAL.violet, fillOp: 40, ink: PAL.ink, sw: 1.2 });
      K.rows = rows;
    },
    // cream letters, turning ochre as they are sung
    text(c, K) {
      const sz = this.size; c.font = `800 ${sz}px ${KARAOKE_FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
      const rows = K.rows || [{ from: 0, to: K.text.length }], y0 = K.top + 8 + 44;
      rows.forEach((r, ri) => {
        const s = K.text.slice(r.from, r.to), w = c.measureText(s).width, x = W / 2 - w / 2, y = y0 + ri * sz * 1.25;
        c.fillStyle = PAL.cream; c.fillText(s, x, y);
        const n = clamp(K.sung - r.from, 0, s.length);
        if (n > 0) {
          const i = Math.floor(n), cw = c.measureText(s.slice(0, i)).width, nw = c.measureText(s.slice(0, Math.min(s.length, i + 1))).width;
          c.save(); c.beginPath(); c.rect(x - 2, y - sz, lerp(cw, nw, n - i) + 2, sz * 2); c.clip(); c.fillStyle = PAL.ochre; c.fillText(s, x, y); c.restore();
        }
      });
    },
  },
};
