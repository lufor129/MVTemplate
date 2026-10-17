// paint.js: the pixel Style Profile: everything is drawn as clean flat shapes, then the finished frame is cut into big
// square pixels (MV.pixel frame units each, 6 by default: 320×180 at 16:9), snapped to a small palette made from PAL,
// with ordered dithering where colours blend. Nothing boils, and the picture moves on twos. The karaoke is lettered after
// that, in a pixel font on a finer grid, so it stays readable. See STYLE.md for the rules of the look.

const PIX = MV.pixel || 6;       // frame units per pixel
const INK_W = 4.4;               // line width in frame units per unit of `sw`; never thinner than a pixel
const TEXT_PX = 3;               // frame units per pixel of the karaoke's pixel font (16 px font → 48 frame units)
const pix = v => Math.round(v / PIX) * PIX;   // snap a position to the pixel grid: keeps still things from shimmering
const _lineW = sw => Math.max(PIX * 1.15, sw * INK_W);

// ---------- paint ----------
// One call = one shape: flat colour (wash), a flat tone over it (fill: dithered where it is see-through), hatching,
// and an outline unless ink is null. All of it lands on the pixel grid at the end of the frame.
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const P = o.curv ? _smooth(pts, o.curv) : pts;
  if (o.wash) _fillPoly(P, o.wash, (o.washOp ?? 255) / 255);
  if (o.fill) _fillPoly(P, o.fill, Math.min(.9, (o.fillOp ?? 170) / 255 * .85));
  if (o.hatch) { const h = o.hatch; for (const L of _hatchLines(P, Math.max(PIX * 2, h.d || 12), h.a || 0, 0)) _stroke(L, () => PIX, h.c || PAL.ink, 1, false); }
  if (o.ink !== null) _stroke(_resample(P, PIX * 2, true), () => _lineW(o.sw ?? 1), o.ink || PAL.ink, 1, true);
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  _stroke(_resample(pts.length > 2 ? _smooth(pts, curv, false) : pts, PIX * 2, false), () => _lineW(sw * (br === 'inkfine' ? .6 : 1)), col, 1, false);
}

// ---------- the pixel grid ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let _pal = [], _lowC = null, _lowX = null;
// The palette: every PAL colour, plus a shade (toward ink) and a light (toward cream) of each.
function _makePalette() {
  const seen = new Set(), out = [];
  for (const c of Object.values(PAL)) for (const v of [c, mixCol(c, PAL.ink, .45), mixCol(c, PAL.cream, .45)]) if (!seen.has(v)) { seen.add(v); out.push(_rgba(v).slice(0, 3)); }
  return out;
}
function _pixelate(c, w, h) {
  const ps = PIX * w / W, lw = Math.max(1, Math.round(w / ps)), lh = Math.max(1, Math.round(h / ps));
  if (!_lowC || _lowC.width !== lw || _lowC.height !== lh) { _lowC = document.createElement('canvas'); _lowC.width = lw; _lowC.height = lh; _lowX = _lowC.getContext('2d', { willReadFrequently: true }); }
  _lowX.imageSmoothingEnabled = false; _lowX.drawImage(c.canvas, 0, 0, w, h, 0, 0, lw, lh);   // one sample per pixel
  const id = _lowX.getImageData(0, 0, lw, lh), d = id.data;
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    // the nearest two palette colours; a colour between them dithers, one on a palette colour stays flat
    const i = (y * lw + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    let best = 0, bd = Infinity, next = 0, nd = Infinity;
    for (let k = 0; k < _pal.length; k++) {
      const p = _pal[k], dr = r - p[0], dg = g - p[1], db = b - p[2], dd = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (dd < bd) { nd = bd; next = best; bd = dd; best = k; } else if (dd < nd) { nd = dd; next = k; }
    }
    const p1 = _pal[best], p2 = _pal[next], ex = p2[0] - p1[0], ey = p2[1] - p1[1], ez = p2[2] - p1[2], L2 = ex * ex + ey * ey + ez * ez;
    const k = L2 ? ((r - p1[0]) * ex + (g - p1[1]) * ey + (b - p1[2]) * ez) / L2 : 0;
    const c = k > .12 && k > (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 ? p2 : p1;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  _lowX.putImageData(id, 0, 0);
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(_lowC, 0, 0, w, h); c.restore();
}

// ---------- the karaoke's pixel lettering ----------
const KARAOKE_FONT = '"DotGothic16", "LXGW WenKai TC", monospace';
let _textC = null, _textX = null, _sungK = null;
function _pixelText(c, K, rs) {
  // the translation (K.sub) gets a row of its own above the sung rows, in sky blue: it has no word times, so it never lights
  const fs = 16, sz = fs * TEXT_PX, rows = K.rows || [{ from: 0, to: K.text.length }], sub = K.sub ? 1 : 0;
  const tw = Math.ceil(W / TEXT_PX), th = Math.ceil((sz * 1.25 * (rows.length + sub) + 40) / TEXT_PX);
  if (!_textC || _textC.width !== tw || _textC.height !== th) { _textC = document.createElement('canvas'); _textC.width = tw; _textC.height = th; _textX = _textC.getContext('2d', { willReadFrequently: true }); }
  const x0c = _textX; x0c.clearRect(0, 0, tw, th); x0c.font = `${fs}px ${KARAOKE_FONT}`; x0c.textBaseline = 'middle'; x0c.textAlign = 'left';
  if (sub) { x0c.fillStyle = PAL.sky; x0c.fillText(K.sub, Math.round(tw / 2 - x0c.measureText(K.sub).width / 2), Math.round(40 / TEXT_PX)); }
  rows.forEach((r, ri) => {
    const s = K.text.slice(r.from, r.to), w = x0c.measureText(s).width, x = Math.round(tw / 2 - w / 2), y = Math.round(40 / TEXT_PX + (ri + sub) * fs * 1.25);
    x0c.fillStyle = PAL.cream; x0c.fillText(s, x, y);
    const n = clamp(K.sung - r.from, 0, s.length);
    if (n > 0) {   // sung letters turn ochre, a whole letter at a time
      const cw = x0c.measureText(s.slice(0, Math.round(n))).width;
      x0c.save(); x0c.beginPath(); x0c.rect(x - 1, y - fs, cw + 1, fs * 2); x0c.clip(); x0c.fillStyle = PAL.ochre; x0c.fillText(s, x, y); x0c.restore();
    }
  });
  const id = x0c.getImageData(0, 0, tw, th), d = id.data;   // hard pixel edges: no anti-aliased fringe
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 100 ? 255 : 0;
  x0c.putImageData(id, 0, 0);
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(_textC, 0, K.boxY * rs, tw * TEXT_PX * rs, th * TEXT_PX * rs); c.restore();
}

// Small lettering (labels on Model Sheets and other reference loops) would melt on the pixel grid, so it is kept aside
// and lettered after it, crisp. Sound Words are big, and land on the grid like everything else.
let _smallLetters = [];
const _flushAllLetters = flushLetters;
flushLetters = function () { _smallLetters.push(...LETTERS.filter(L => L.size < 40)); LETTERS = LETTERS.filter(L => L.size >= 40); _flushAllLetters(); };

// ---------- the Style Profile's hooks ----------
const STYLE = {
  fonts: ['DotGothic16', 'Press Start 2P', 'LXGW WenKai TC'],
  // no anti-aliasing: a soft edge would sample as an in-between colour and snap to a stray one
  async setup() { setAttributes('antialias', false); _pal = _makePalette(); },
  underlay() { _smallLetters = []; _fillPoly(rectPts(-10, -10, W + 20, H + 20), PAL.paper, 1); },
  overlay(c, w, h) {
    _pixelate(c, w, h);
    if (_smallLetters.length) { const keep = LETTERS; LETTERS = _smallLetters; c.save(); c.scale(w / W, w / W); drawLetters(c); c.restore(); LETTERS = keep; _smallLetters = []; }
    if (_sungK) { _pixelText(c, _sungK, w / W); _sungK = null; }
  },
  flush() {},
  // sprites don't smear: a fast move is a jump between drawings
  pose: o => ({ ...o, smear: 0 }),
  letterFont: size => size < 40 ? `${size}px "DotGothic16", monospace` : `${size}px "Press Start 2P", "DotGothic16", monospace`,
  karaoke: {
    // a dialog box, like an old game's: dark, with a light border, opening from the centre
    band(K) {
      const c = outX, sz = 16 * TEXT_PX; c.font = `${sz}px ${KARAOKE_FONT}`;
      const rows = karaokeRows(c, K.text, W - 200), n = rows.length + (K.sub ? 1 : 0);
      const tw = Math.max(...rows.map(r => c.measureText(K.text.slice(r.from, r.to)).width), K.sub ? c.measureText(K.sub).width : 0);
      const h = 80 + (n - 1) * sz * 1.25, w = pix((tw + 96) * K.grow), hh = pix(h), x0 = pix(W / 2 - w / 2), y0 = pix(Math.min(K.top + 8, H - 14 - h));
      if (w > PIX * 3) paint(rectPts(x0, y0, w, hh), { wash: PAL.night, ink: PAL.cream, sw: 1.3 });
      K.rows = rows; K.boxY = y0;
    },
    // lettered later, after the pixel grid (see overlay)
    text(c, K) { _sungK = K; },
  },
};
