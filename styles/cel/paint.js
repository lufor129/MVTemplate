// paint.js: the cel Style Profile's drawing primitives: flat cel fills a little off-register, hard-edged shadow tones,
// and variable-width ink lines that boil, on animation paper. See STYLE.md for the rules of the look.

const INK_W = 5.6;   // stroke width in frame units per unit of `sw`: a bold line, the cel's signature
const SHADE = '#3B2E6E';   // where shadow tones lean: cool, toward violet

// Cel paint is clean and saturated: every colour that reaches paint() is pushed that way, Characters' own included.
const _toned = new Map();
function tone(c) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let v = _toned.get(c);
  if (!v) { const [h, s, l] = hexHsl(c); v = hslHex(h, Math.min(1, s * 1.3 + .05), .5 + (l - .5) * 1.06); _toned.set(c, v); }
  return v;
}
// The shadow side, found by itself: the part of the shape that the same shape, moved toward the light, doesn't cover.
// One hard-edged flat tone, like a cel painter's shadow line, on the side away from LIGHT (frame.js); big shapes also
// get a thin lit edge on the other side. Skips shapes too small to shade and backdrops (sky, ground, wipes): anything
// wider than 60% of the frame.
function _shade(P, col, a) {
  const [x0, y0, x1, y1] = _bounds(P), m = Math.min(x1 - x0, y1 - y0), M = Math.max(x1 - x0, y1 - y0);
  if (m < 14 || M > Math.max(W, H) * .6 || hexHsl(col)[2] < .22) return;
  const side = (d, c, k) => {
    // p5 sends our triangles after endClip(), so the mask would also land on the frame: draw it all but transparent
    push(); beginClip({ invert: true }); _fillPoly(P.map(([x, y]) => [x - LIGHT[0] * d, y - LIGHT[1] * d]), '#000000', .002); endClip();
    _fillPoly(P, mixCol(col, c, k), a); pop();
  };
  side(Math.min(120, m * .34), SHADE, .42);
  if (m > 60 && hexHsl(col)[2] > .35) side(-Math.min(30, m * .07), '#FFF8E8', .5);   // not on dark silhouettes
}
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
// One call = one shape: an optional flat colour (wash) with its shadow side found by itself (o.shade: false skips it),
// a flat tone over it (fill: shading, light, cast shadows), optional hatching, and an ink outline unless ink is null.
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const P = o.curv ? _smooth(pts, o.curv) : pts;
  if (o.wash) {   // printed a little off the line, like hand colouring
    const dx = 1.6 + jit(.6), dy = 1.2 + jit(.6), Q = P.map(([x, y]) => [x + dx, y + dy]), col = tone(o.wash), a = (o.washOp ?? 255) / 255;
    _fillPoly(Q, col, a);
    if (a > .9 && o.shade !== false) _shade(Q, col, a);
  }
  if (o.fill) _fillPoly(P, tone(o.fill), Math.min(.85, (o.fillOp ?? 170) / 255 * .8));
  if (o.hatch) {
    const h = o.hatch, rand = (h.o && h.o.rand) || 0;
    for (const L of _hatchLines(P, h.d || 12, h.a || 0, rand)) _ink(L, (h.w || 1) * .45, tone(h.c || PAL.ink), h.b || 'HB', false);
  }
  if (o.ink !== null) _ink(P, o.sw ?? 1, tone(o.ink || PAL.ink), o.br || 'ink', true);
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  _ink(pts.length > 2 ? _smooth(pts, curv, false) : pts, sw, tone(col), br, false);
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
const KARAOKE_FONT = '"Chiron GoRound TC", "Klee One", sans-serif';
const STYLE = {
  fonts: ['Bangers', 'Chiron GoRound TC', 'Klee One'],
  async setup() { _paperG = _makePaper(); _grainC = _makeGrain(); },
  underlay() { image(_paperG, 0, 0, W, H); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush() {},
  // cel acting is broad: squash, stretch and smears go further
  pose: o => ({ ...o, sq: (o.sq || 0) * 1.25, smear: Math.min(1, (o.smear || 0) * 1.3) }),
  letterFont: size => `${size}px "Bangers", "Chiron GoRound TC", "Klee One", cursive`,
  karaoke: {
    size: MV.format === '9:16' ? 58 : 54,
    // no band: bold rounded letters with a thick ink edge, like a broadcast subtitle; nothing to paint here
    band(K) {
      const c = outX; c.font = `800 ${this.size}px ${KARAOKE_FONT}`;
      K.rows = karaokeRows(c, K.text, W - 160);
    },
    // cream letters in a thick ink edge, turning yellow as they are sung
    text(c, K) {
      const sz = this.size; c.font = `800 ${sz}px ${KARAOKE_FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
      const rows = K.rows || [{ from: 0, to: K.text.length }], y0 = K.top + 8 + 44 - (rows.length - 1) * sz * .6;
      rows.forEach((r, ri) => {
        const s = K.text.slice(r.from, r.to), w = c.measureText(s).width, x = W / 2 - w / 2, y = y0 + ri * sz * 1.2;
        c.lineWidth = sz * .26; c.strokeStyle = PAL.ink; c.strokeText(s, x, y);
        c.fillStyle = PAL.cream; c.fillText(s, x, y);
        const n = clamp(K.sung - r.from, 0, s.length);
        if (n > 0) {
          const i = Math.floor(n), cw = c.measureText(s.slice(0, i)).width, nw = c.measureText(s.slice(0, Math.min(s.length, i + 1))).width;
          c.save(); c.beginPath(); c.rect(x - 2, y - sz, lerp(cw, nw, n - i) + 2, sz * 2); c.clip(); c.fillStyle = tone('#FFD84A'); c.fillText(s, x, y); c.restore();
        }
      });
    },
  },
};
