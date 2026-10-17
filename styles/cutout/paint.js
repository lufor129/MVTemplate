// paint.js: the cut-out Style Profile's drawing primitives: shapes cut from coloured paper with scissors, each casting a
// small shadow on what lies under it, shading printed as halftone dots, lines as cut strips of dark paper, on kraft
// card. Nothing boils (style.json sets boil 0) and the picture moves on twos. See STYLE.md for the rules of the look.

const INK_W = 4.4;               // strip width in frame units per unit of `sw`
const SHADOW = [6, 9];           // how far each piece's shadow falls, in frame units
const DOT = 9;                   // halftone dot spacing

// Craft paper is muted and a little warm: every colour that reaches paint() is pushed that way, Characters' own included.
const _toned = new Map();
function tone(c) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let v = _toned.get(c);
  if (!v) { const [h, s, l] = hexHsl(c); v = mixCol(hslHex(h, s * .8, .04 + l * .96), '#C8A070', .07); _toned.set(c, v); }
  return v;
}
// A scissor-cut edge: curves cut as a run of short straight snips (about twenty round a piece, whatever its size),
// nudged a little, the same in every frame (nothing boils).
const _size = P => Math.sqrt(Math.abs(_area(P)));
function _cut(P) {
  const step = Math.max(4, _size(P) / 4.5), j = Math.min(1.6, step * .12);
  return _resample(P, step, true).map(([x, y]) => [x + jit(j), y + jit(j)]);
}
// The shadow a piece casts, smaller under a small piece: an eye's sits close under it.
function _shadow(P) { const k = Math.min(1, _size(P) / 80); _fillPoly(P.map(([x, y]) => [x + SHADOW[0] * k, y + SHADOW[1] * k]), '#2A1A0C', .3); }
// A sheet of paper's fibre, grey on white, seamless (every mark is drawn again across each edge): each piece is tinted
// with its colour and shows its own patch of it, which travels with the piece.
let _fibreTex = null;
const TEX = 512, TEX_SCALE = 1100;   // texture pixels; frame units one copy of it covers
function _makeFibreTex() {
  const g = createGraphics(TEX, TEX); g.pixelDensity(1); const c = g.drawingContext, rnd = _lcg(57);
  const wrap = f => { for (const dx of [-TEX, 0, TEX]) for (const dy of [-TEX, 0, TEX]) f(dx, dy); };
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, TEX, TEX);
  for (let i = 0; i < 22; i++) {
    const x = rnd() * TEX, y = rnd() * TEX, r = 50 + rnd() * 130, a = .03 + .04 * rnd();
    wrap((dx, dy) => { const gr = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); });
  }
  c.lineWidth = 1;
  for (let i = 0; i < 1800; i++) {
    const x = rnd() * TEX, y = rnd() * TEX, l = 4 + rnd() * 16, a = rnd() * TAU;
    c.strokeStyle = rnd() < .65 ? `rgba(0,0,0,${.05 + rnd() * .09})` : `rgba(255,255,255,${.4 + rnd() * .5})`;
    wrap((dx, dy) => { c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); c.stroke(); });
  }
  return g;
}
function _paperPoly(P, col, a = 1) {
  if (!P || P.length < 3 || a <= 0) return;
  // the patch of fibre comes from the element's boil stream (boilSeed), so it stays put while the piece moves
  const c = _centre(P), [r, g, b] = _rgba(col), ou = random(), ov = random(), uv = ([x, y]) => [(x - c[0]) / TEX_SCALE + ou, (y - c[1]) / TEX_SCALE + ov];
  push(); noStroke(); textureMode(NORMAL); textureWrap(REPEAT); texture(_fibreTex); tint(r, g, b, 255 * clamp(a));
  if (_starShaped(P, c)) {
    beginShape(TRIANGLES);
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; vertex(c[0], c[1], 0, ...uv(c)); vertex(p[0], p[1], 0, ...uv(p)); vertex(q[0], q[1], 0, ...uv(q)); }
    endShape();
  } else { beginShape(); for (const p of P) vertex(p[0], p[1], 0, ...uv(p)); endShape(CLOSE); }
  noTint(); pop();
}
// One piece of paper: its shadow, the paler core showing at the cut edge, then the colour.
function _piece(P, col, a = 1) {
  if (a > .6) _shadow(P);
  if (a > .6 && _size(P) > 24) _fillPoly(_offset(P, 1.6), mixCol(col, '#FFFFFF', .45), a);
  _paperPoly(P, col, a);
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
// Paper has no line round it: a piece's edge is its cut, its pale core and its shadow. So a piece's outline is left
// out, whether it comes with the wash or after it (Characters often paint a shape, then outline the same points):
// _cutPts remembers the last few pieces' point lists. An outline with no piece under it is cut as a paper strip.
const _cutPts = [];
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const P = _cut(o.curv ? _smooth(pts, o.curv * .35) : pts);
  if (o.wash) { _piece(P, tone(o.wash), (o.washOp ?? 255) / 255); _cutPts.push(pts); if (_cutPts.length > 12) _cutPts.shift(); }
  if (o.fill) {   // dark tones print as halftone dots; light ones are a sheet of tissue paper laid on top
    const col = tone(o.fill), [r, g, b] = _rgba(col), k = (o.fillOp ?? 170) / 255;
    const [x0, y0, x1, y1] = _bounds(P);
    if ((.299 * r + .587 * g + .114 * b) / 255 > .6) _fillPoly(_offset(P, -2), col, k * .7);
    else if (Math.min(x1 - x0, y1 - y0) < DOT * 6) _fillPoly(P, col, k * .45);   // too small for dots to read: a faint print
    else _halftone(P, col, k);
  }
  if (o.hatch) { const h = o.hatch; for (const L of _hatchLines(P, h.d || 12, h.a || 0, (h.o && h.o.rand) || 0)) _stroke(L, () => 1.6 * (h.w || 1), tone(h.c || PAL.ink), .55, false); }
  if (o.ink !== null && !o.wash && !_cutPts.includes(pts)) _strip(P, (o.sw ?? 1) * .8, tone(o.ink || PAL.ink), true);
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  _strip(pts.length > 2 ? _smooth(pts, curv * .35, false) : pts, sw * (br === 'inkfine' ? .7 : 1), tone(col), false);
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
const KARAOKE_FONT = '"Noto Serif TC", "Klee One", serif';
const STYLE = {
  fonts: ['Bowlby One SC', 'Noto Serif TC', 'Klee One'],
  async setup() { _cardG = _makeCard(); _fibreC = _makeFibre(); _fibreTex = _makeFibreTex(); },
  underlay() { _cutPts.length = 0; image(_cardG, 0, 0, W, H); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_fibreC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush() {},
  // paper can't squash or smear: a cut-out moves by its pieces turning and sliding, so squash and stretch shrink to a
  // hint and smears go
  pose: o => ({ ...o, sq: (o.sq || 0) * .15, smear: 0 }),
  letterFont: size => `${size}px "Bowlby One SC", "Noto Serif TC", "Klee One", sans-serif`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // a strip of dark paper with torn ends, sliding in from the centre
    band(K) {
      const c = outX, { y: y0, h: hh, tw } = karaokeLayout(c, K, s => `900 ${s}px ${KARAOKE_FONT}`, this.size);
      const w = (tw + 110) * K.grow, x0 = W / 2 - w / 2, tear = [];
      boilSeed('karaoke');
      for (let k = 0; k <= 6; k++) tear.push([x0 + w + 6 * Math.sin(k * 2.7) + jit(6), y0 + hh * k / 6]);
      for (let k = 6; k >= 0; k--) tear.push([x0 + 6 * Math.sin(k * 1.9) + jit(6), y0 + hh * k / 6]);
      paint(tear, { wash: PAL.ink, ink: null });
    },
    // the translation in a duller cream; the sung line in cream letters, turning ochre as they are sung
    text(c, K) {
      const sz = this.size; c.textBaseline = 'middle'; c.textAlign = 'left';
      if (K.sub) {
        c.font = `900 ${K.subSize}px ${KARAOKE_FONT}`; c.fillStyle = mixCol(PAL.cream, PAL.ink, .3);
        c.fillText(K.sub, W / 2 - c.measureText(K.sub).width / 2, K.subY);
      }
      c.font = `900 ${sz}px ${KARAOKE_FONT}`;
      const rows = K.rows || [{ from: 0, to: K.text.length, y: K.top + 52 }];
      rows.forEach(r => {
        const s = K.text.slice(r.from, r.to), w = c.measureText(s).width, x = W / 2 - w / 2, y = r.y;
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
