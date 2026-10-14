// paint.js: the cut-out Style Profile's drawing primitives: shapes cut from coloured paper with scissors, each casting a
// small shadow on what lies under it, shading printed as halftone dots, lines as cut strips of dark paper, on kraft
// card. Nothing boils (style.json sets boil 0) and the picture moves on twos. See STYLE.md for the rules of the look.

const INK_W = 4.4;               // strip width in frame units per unit of `sw`
const SHADOW = [4, 6];           // how far each piece's shadow falls, in frame units
const DOT = 9;                   // halftone dot spacing

// A scissor-cut edge: the outline resampled and nudged a little, the same in every frame (nothing boils).
function _cut(P) {
  const step = Math.max(14, Math.sqrt(Math.abs(_area(P))) / 6);
  return _resample(P, step, true).map(([x, y]) => [x + jit(1.3), y + jit(1.3)]);
}
function _shadow(P) { _fillPoly(P.map(([x, y]) => [x + SHADOW[0], y + SHADOW[1]]), '#2A1A0C', .28); }
// One piece of paper: its shadow, the paler core showing at the cut edge, then the colour.
function _piece(P, col, a = 1) {
  if (a > .6) _shadow(P);
  if (a > .6) _fillPoly(_offset(P, 1.4), mixCol(col, '#FFFFFF', .4), a);
  _fillPoly(P, col, a);
}
// Shading as halftone dots on a grid anchored to the shape, so the dots travel with it.
function _halftone(P, col, k) {
  const [x0, y0, x1, y1] = _bounds(P), [cx, cy] = _centre(P), r = DOT * .5 * Math.sqrt(clamp(k)) * 1.05;
  if (r < .6 || (x1 - x0) * (y1 - y0) > W * H * 4) return;
  noStroke(); fill(..._rgba(col, 1)); beginShape(TRIANGLES);
  const i0 = Math.floor((x0 - cx) / DOT) - 1, i1 = Math.ceil((x1 - cx) / DOT) + 1, j0 = Math.floor((y0 - cy) / DOT) - 1, j1 = Math.ceil((y1 - cy) / DOT) + 1;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = cx + (i + (j & 1) * .5) * DOT, y = cy + j * DOT;
    if (!_inside(P, x, y)) continue;
    for (let s = 0; s < 6; s++) { const a0 = s / 6 * TAU, a1 = (s + 1) / 6 * TAU; vertex(x, y); vertex(x + Math.cos(a0) * r, y + Math.sin(a0) * r); vertex(x + Math.cos(a1) * r, y + Math.sin(a1) * r); }
  }
  endShape();
}
// A strip of paper along a path (open lines: eyes, mouths, details), with its shadow.
function _strip(P, sw, col, closed) {
  const w = Math.max(1.5, sw * INK_W), S = _resample(P, Math.max(6, w * 1.5), closed);
  if (S.length < 2) return;
  _stroke(S.map(([x, y]) => [x + SHADOW[0] * .6, y + SHADOW[1] * .6]), () => w, '#2A1A0C', .25, closed);
  _stroke(S, () => w, col, 1, closed);
}

// ---------- paint ----------
// One call = one shape: a piece of coloured paper (wash), shading on it (fill: halftone dots when dark, tissue paper
// when light), pencil hatching
// (hatch), and the outline (ink): a thin dark line round a piece, or a paper strip when the shape is only an outline.
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const P = _cut(o.curv ? _smooth(pts, o.curv) : pts);
  if (o.wash) _piece(P, o.wash, (o.washOp ?? 255) / 255);
  if (o.fill) {   // dark tones print as halftone dots; light ones are a sheet of tissue paper laid on top
    const [r, g, b] = _rgba(o.fill), k = (o.fillOp ?? 170) / 255;
    if ((.299 * r + .587 * g + .114 * b) / 255 > .6) _fillPoly(_offset(P, -2), o.fill, k * .7);
    else _halftone(P, o.fill, k);
  }
  if (o.hatch) { const h = o.hatch; for (const L of _hatchLines(P, h.d || 12, h.a || 0, (h.o && h.o.rand) || 0)) _stroke(L, () => 1.6 * (h.w || 1), h.c || PAL.ink, .55, false); }
  if (o.ink !== null) {
    if (o.wash) _stroke(P, () => Math.max(1, (o.sw ?? 1) * 1.6), o.ink || PAL.ink, .6, true);
    else _strip(P, (o.sw ?? 1) * .8, o.ink || PAL.ink, true);
  }
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  _strip(pts.length > 2 ? _smooth(pts, curv, false) : pts, sw * (br === 'inkfine' ? .7 : 1), col, false);
}

// ---------- kraft card ----------
function _makeCard() {
  const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext, rnd = _lcg(31), A = W * H / (1920 * 1080);
  c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 40 * A; i++) { const x = rnd() * W, y = rnd() * H, r = 150 + rnd() * 400, gr = c.createRadialGradient(x, y, 0, x, y, r), a = .05 * rnd(); gr.addColorStop(0, `rgba(120,85,45,${a})`); gr.addColorStop(1, 'rgba(120,85,45,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  c.lineWidth = 1;
  for (let i = 0; i < 2600 * A; i++) { const x = rnd() * W, y = rnd() * H, l = 3 + rnd() * 14, a = rnd() * TAU; c.strokeStyle = rnd() < .5 ? `rgba(90,60,30,${.05 + rnd() * .08})` : `rgba(255,245,225,${.05 + rnd() * .08})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  return g;
}
// Paper fibre over everything, so every piece looks like paper.
function _makeFibre() {
  const cv = document.createElement('canvas'); cv.width = W * RS; cv.height = H * RS; const c = cv.getContext('2d'), rnd = _lcg(13), d = c.createImageData(cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = 255 - (rnd() < .5 ? rnd() * 22 : 0); d.data[i] = v; d.data[i + 1] = v - 1; d.data[i + 2] = v - 4; d.data[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  const g = c.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * .45, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * .62);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(110,80,50,.3)'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

// ---------- the Style Profile's hooks ----------
let _cardG = null, _fibreC = null;
const KARAOKE_FONT = '"Shantell Sans", "LXGW WenKai TC", "Klee One", sans-serif';
const STYLE = {
  fonts: ['Bowlby One SC', 'Shantell Sans', 'LXGW WenKai TC', 'Klee One'],
  async setup() { _cardG = _makeCard(); _fibreC = _makeFibre(); },
  underlay() { image(_cardG, 0, 0, W, H); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_fibreC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush() {},
  letterFont: size => `${size}px "Bowlby One SC", "LXGW WenKai TC", "Klee One", sans-serif`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // a strip of dark paper with torn ends, sliding in from the centre
    band(K) {
      const c = outX, sz = this.size; c.font = `800 ${sz}px ${KARAOKE_FONT}`;
      const rows = karaokeRows(c, K.text, W - 160), tw = Math.max(...rows.map(r => c.measureText(K.text.slice(r.from, r.to)).width));
      const w = (tw + 110) * K.grow, x0 = W / 2 - w / 2, y0 = K.top + 8, hh = 88 + (rows.length - 1) * sz * 1.25, tear = [];
      boilSeed('karaoke');
      for (let k = 0; k <= 6; k++) tear.push([x0 + w + 6 * Math.sin(k * 2.7) + jit(6), y0 + hh * k / 6]);
      for (let k = 6; k >= 0; k--) tear.push([x0 + 6 * Math.sin(k * 1.9) + jit(6), y0 + hh * k / 6]);
      paint(tear, { wash: PAL.ink, ink: null });
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
