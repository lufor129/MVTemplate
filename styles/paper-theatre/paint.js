// paint.js: paper theatre, a layered papercraft diorama filmed with a real camera. Every shape is a flat piece of matte
// card cut with soft rounded edges, laid in its own layer a little above the one behind it: it casts one thin, soft
// shadow there, nothing heavier. The card has a fine paper grain, very gentle pencil shading toward its edges (a little
// more on the side away from the light) and a slightly lighter cut edge. No outlines and no craft hardware (no
// stitching, no pins): only small details (eyes, mouths, brows) are printed lines. Far scenery fades a little toward a
// pale lavender-blue air; actors stay crisp. Calm, clean and tidy. Painted through drawingContext with canvas.js.

const INK_W = 3.4;                  // printed line width in frame units per unit of `sw`
const LIT = '#FFFDF7';              // the pale core of the card, showing at a cut edge
const SHADOW = '#2F302E';           // card shadows: a neutral dark grey, thin
const HAZE = '#CDD1E2';             // the air at the back of the stage: pale lavender-blue

// ---------- colour ----------
// Every colour that reaches paint(), inkLine() and the karaoke passes through tone(): soft, matte card: a little less
// saturated, the values pulled gently toward the middle. No cast: blues stay blue, greens green.
const _toned = new Map();
function tone(c) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let v = _toned.get(c);
  if (!v) { const [h, s, l] = hexHsl(c); v = hslHex(h, s * .94, .5 + (l - .5) * .93 + .012); _toned.set(c, v); }
  return v;
}
// The card's pencil shade: the same hue, a little darker and a touch richer.
const _shades = new Map();
function cardShade(c) {
  let v = _shades.get(c);
  if (!v) { const [h, s, l] = hexHsl(c); v = hslHex(h, Math.min(1, s * 1.04 + .02), l * .8); _shades.set(c, v); }
  return v;
}
// A shape's bounds on screen (frame units), whatever the camera and the Character's transform.
function _screenBox([x0, y0, x1, y1]) {
  const m = _ctx().getTransform(), X = [], Y = [];
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) { X.push((m.a * x + m.c * y + m.e) / RS); Y.push((m.b * x + m.d * y + m.f) / RS); }
  return [Math.min(...X), Math.min(...Y), Math.max(...X), Math.max(...Y)];
}
// How far back a piece stands (0 .. .14): flats wider than half the stage are scenery, and the higher on the stage
// they start, the farther back they are and the more they fade into the air. Narrower pieces are actors and props.
const _depth = ([x0, y0, x1]) => clamp(((x1 - x0) / W - .45) / .45) * clamp((H * .8 - y0) / (H * .45)) * .14;

// ---------- the card piece ----------
// The card's grain laid over a piece in soft-light (neutral grey changes nothing), so it travels with the piece.
function _cardFill(path, a, k = 1) {
  if (_card) _with({ blend: 'soft-light', alpha: k * a }, c => { c.fillStyle = _card; c.fill(path); });
}
// the one shadow a piece casts on the layer behind it: thin and soft, a little below and away from the light
const _drop = (d, a = .4) => ({ blur: d * 1.6, x: LIGHT[0] * d * .2, y: LIGHT[1] * d * .3, col: SHADOW, a, screen: true });

// One piece of card. o: { haze, noShadow, hatch, soft, r (corner radius) }.
function _piece(P, col, a, o = {}) {
  const px = _px() / RS, b = _bounds(P), [x0, y0, x1, y1] = b, w = x1 - x0, h = y1 - y0, mn = Math.min(w, h);
  if (mn <= 0) return;
  const area = Math.abs(_area(P)), sb = _screenBox(b), hz = o.haze ?? _depth(sb), solid = a > .9;
  if (sb[2] - sb[0] > W * .9 && sb[3] - sb[1] > H * .6 && area > .8 * w * h && !o.hatch) return _backdrop(P, col, a);
  const base = hz ? mixCol(col, HAZE, hz) : col, path = _roundPath(P, o.r ?? clamp(mn * .12, 0, 14)), sm = mn * px;
  const d = clamp(Math.sqrt(area) * .035, 2.5, 9);
  if (solid && !o.noShadow) _with({ shadow: _drop(d, (.34 + d * .025) * (1 - hz * .6)) }, () => _fillPoly(path, base, a));
  else _fillPoly(path, base, a);
  if (sm < 6) return;
  const sh = cardShade(base), g = clamp(mn * .16, 2, 30) * (o.soft ?? 1);
  _with({ clip: path }, c => {
    // gentle pencil shading toward the edges, a little heavier on the side away from the light, a faint light toward it
    const ring = new Path2D(); ring.rect(x0 - g * 4, y0 - g * 4, w + g * 8, h + g * 8); ring.addPath(path);
    _with({ shadow: { blur: g, x: -LIGHT[0] * g * .35, y: -LIGHT[1] * g * .35, col: sh, a: .5 * a, screen: true } }, () => _fillPoly(ring, sh, 1, 'evenodd'));
    const cx = (x0 + x1) / 2 - LIGHT[0] * w * .25, cy = (y0 + y1) / 2 - LIGHT[1] * h * .25;
    _fillPoly(path, _radial(cx, cy, 0, Math.max(w, h) * .6, [[0, LIT, .14 * (1 - hz)], [1, LIT, 0]]), a);
    if (w > h * 2.5 && sm > 60) _fillPoly(path, _linear(P, [0, 1], [[0, LIT, .2], [.35, LIT, 0], [1, sh, .16]]), a);   // a long flat: lit along its top edge
    if (o.hatch) _crayon(P, sh, o.hatch, a);
    _cardFill(path, a);
    c.lineWidth = 3.2; c.strokeStyle = _css(LIT, .5 * a); c.stroke(path);   // the cut edge, the card's pale core
  });
}

// Coloured-pencil hatching (the hatch option): strokes of the piece's own darker pencil, soft and uneven, heavier on
// the side away from the light and fading out toward it.
function _crayon(P, col, h, a) {
  const L = _hatchLines(P, Math.max(6, (h.d || 12) * .9), h.a || 0, (h.o && h.o.rand) || .3), c = _ctx(), [x0, y0, x1, y1] = _bounds(P);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = (Math.abs(LIGHT[0]) * (x1 - x0) + Math.abs(LIGHT[1]) * (y1 - y0)) / 2 || 1;
  c.save(); c.lineCap = 'round';
  L.forEach(([p, q], i) => {
    const t = clamp(.5 + (((p[0] + q[0]) / 2 - cx) * LIGHT[0] + ((p[1] + q[1]) / 2 - cy) * LIGHT[1]) / (2 * R));   // 0 lit side, 1 far side
    c.lineWidth = 1.5 + hash(i * 3.7) * 1.5; c.strokeStyle = _css(mixCol(col, PAL.ink, .15), (.1 + .62 * t) * (.7 + .3 * hash(i * 1.3)) * a);
    c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
  });
  c.restore();
}
// The backdrop: a sheet of card as wide and tall as the stage, at the very back: flat, a touch paler toward the
// horizon, grained.
function _backdrop(P, col, a) {
  const path = _path(P), base = mixCol(col, HAZE, .08); _fillPoly(path, base, a);
  if (a < .9) return;
  _with({ clip: path }, () => {
    _fillPoly(path, _linear(P, [0, 1], [[0, cardShade(base), .08], [.4, LIT, 0], [.8, LIT, .22]]), 1);
    _cardFill(path, a, .9);
  });
}
// A cloud: a big pale shape high on the stage, cut as a plain paper cloud: rounded puffs of different sizes along the
// top, biggest left of the middle, a long low tail, a flat bottom. Traced from its centre over the shape's ellipse
// and a row of circles.
function _cloudPts(P) {
  const [x0, y0, x1, y1] = _bounds(P), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  const n = clamp(Math.round(rx / ry * .9), 3, 8), C = [], Q = [];
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, r = ry * (.66 + .62 * Math.exp(-(((t - .3) / .32) ** 2)) - .34 * t) * (.9 + .2 * hash(i * 7.3 + n));
    C.push([cx - rx * .82 + t * rx * 1.4, cy + ry * .02, r]);
  }
  for (let k = 0; k < 200; k++) {
    const a = k / 200 * TAU, dx = Math.cos(a), dy = Math.sin(a);
    let r = 1 / (Math.abs(dx / (rx * .95)) ** 3 + Math.abs(dy / (ry * (dy > 0 ? .3 : .26))) ** 3) ** (1 / 3);
    for (const [px, py, pr] of C) {
      const ox = cx - px, oy = cy - py, b = ox * dx + oy * dy, D = b * b - (ox * ox + oy * oy - pr * pr);
      if (D >= 0) r = Math.max(r, Math.min(-b + Math.sqrt(D), dy > 0 ? ry * .3 / Math.max(dy, 1e-3) : 1e9));   // never below the flat bottom
    }
    Q.push([cx + dx * r, cy + dy * r]);
  }
  return Q;
}

// A cast shadow (a dark fill with nothing under it): soft, like a shadow on the stage floor.
function _castShadow(P, col, k) {
  const [x0, y0, x1, y1] = _bounds(P), mn = Math.min(x1 - x0, y1 - y0);
  _with({ blur: Math.max(1.5, mn * .2), blend: 'multiply' }, () => _fillPoly(P, mixCol(col, SHADOW, .5), Math.min(.6, k)));
}
// A tone laid on a piece in pencil (a fill with no wash): a soft-edged patch, grained like the card under it.
function _tonePatch(P, col, k) {
  const [x0, y0, x1, y1] = _bounds(P), mn = Math.min(x1 - x0, y1 - y0), path = _roundPath(P, clamp(mn * .2, 0, 20));
  _with({ blur: clamp(mn * .06, .6, 6) }, () => _fillPoly(path, col, k));
  _cardFill(path, k);
}

// ---------- light ----------
// glow(x, y, r, colour, a): light the way a paper animation shows it. A faint warm light screened over what's there,
// and round anything big enough a few short rays cut from pale card, each its own piece, standing apart from it.
// (Replaces canvas.js's additive glow.)
function glow(x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const k = clamp(a);
  _with({ blend: 'screen' }, () => _fillPoly(rectPts(x - r, y - r, 2 * r, 2 * r), _radial(x, y, 0, r, [[0, col, .16 * k], [.5, col, .05 * k], [1, col, 0]])));
  if (r * _px() / RS < 90) return;
  const n = 9, r0 = r * .32, r1 = r * (.42 + .07 * k), hw = r * .034, base = mixCol(tone(col), LIT, .3);
  for (let i = 0; i < n; i++) {
    const an = (i + .5) / n * TAU + (hash(i * 5.1) - .5) * .22 - .35, ln = r1 + (i % 2 ? -r * .03 : 0), ca = Math.cos(an), sa = Math.sin(an);
    const at = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
    _piece([at(r0, -hw), at(ln, -hw * 1.15), at(ln, hw * 1.15), at(r0, hw)], base, 1, { haze: 0, r: 3 });
  }
}

// ---------- depth of field ----------
// paint(pts, { ..., blur }) defocuses a piece: the camera is focused on the actors, and a Chapter blurs its nearest
// layer (foreground bushes, a branch across the lens) by `blur` frame units. The piece is painted on a layer of its
// own and laid in through a blur filter. Nothing is blurred unless a Chapter asks.
function _defocus(r, fn) {
  const c = _ctx(), m = c.getTransform(), L = _layer('defocus'), cw = L.canvas.width, ch = L.canvas.height;
  L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, cw, ch); L.setTransform(m);
  _onCtx(L, fn);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = `blur(${_px(r).toFixed(2)}px)`; c.drawImage(L.canvas, 0, 0); c.restore();
}

// ---------- paint ----------
// One call = one piece of card. wash: the card's colour (washOp below ~230: tracing paper, no shadow); fill over a wash
// mixes into the card's colour; a fill alone is a cast shadow when dark, otherwise a pencil tone on what's under it (a
// big pale one is a card flat, and high on the stage a paper cloud); hatch: coloured-pencil hatching; blur: defocus
// (above). ink never draws a line round a piece; an outline with no piece under it is a thin strip of card.
const BRUSHES = { ink: 1, inkfine: .6, dry: 1.3, '2B': .75, HB: .5, charcoal: 1.2, marker: 1.15, pen: .7, rotring: .6, cpencil: .6, spray: 1.4 };
// Pieces painted so far this frame: an outline drawn alone over one of them (the same list, or a fresh one cut to the
// same size in the same transform: Characters often paint a shape, then outline it) adds nothing.
let _washed = [], _washedT = -1;
function _washMark(pts, P) {
  if (_washedT !== T) { _washed = []; _washedT = T; }
  const m = _ctx().getTransform(); _washed.push({ pts, b: _bounds(P), m: [m.a, m.b, m.c, m.d, m.e, m.f] }); if (_washed.length > 40) _washed.shift();
}
function _washedUnder(pts, P) {
  if (_washedT !== T) return false;
  const m = _ctx().getTransform(), M = [m.a, m.b, m.c, m.d, m.e, m.f], b = _bounds(P), tol = Math.max(1, (b[2] - b[0] + b[3] - b[1]) * .03);
  return _washed.some(w => w.pts === pts || (w.m.every((v, k) => Math.abs(v - M[k]) < 1e-3) && w.b.every((v, k) => Math.abs(v - b[k]) < tol)));
}
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  if (o.blur > 0) return _defocus(o.blur, () => paint(pts, { ...o, blur: 0 }));
  const P = o.curv ? _smooth(pts, o.curv) : pts, fk = o.fill ? Math.min(.85, (o.fillOp ?? 170) / 255 * .8) : 0;
  if (o.wash) {
    let col = tone(o.wash); if (o.fill) col = mixCol(col, tone(o.fill), fk);
    const a = (o.washOp ?? 255) / 255;
    _washMark(pts, P);
    _piece(P, col, a, { hatch: o.hatch, noShadow: a < .9, soft: o.shade === false ? .3 : typeof o.shade === 'number' ? o.shade : 1 });
  } else if (o.fill) {
    const col = tone(o.fill), l = hexHsl(col)[2], sb = _screenBox(_bounds(P)), sw = sb[2] - sb[0], sh = sb[3] - sb[1];
    if (l < .3) _castShadow(P, col, fk);
    else if (l > .65 && sw > W * .25 && sw * sh < W * H * .45) {   // a big pale shape: a card flat; high and long, a white paper cloud
      const cloud = sw > sh * 2.2 && (sb[1] + sb[3]) / 2 < H * .5;
      _piece(cloud ? _cloudPts(P) : P, cloud ? mixCol(col, '#FFFFFF', .45) : col, 1, { haze: 0 });
    } else _tonePatch(P, col, fk);
  } else if (o.hatch && P.length > 2) _crayon(P, tone(o.hatch.c || PAL.ink), o.hatch, 1);
  if (!o.wash && !o.fill && o.ink !== null && P.length > 2 && !_washedUnder(pts, P))
    _band(P, (o.sw ?? 1) * INK_W * (BRUSHES[o.br] || 1) * .9, tone(o.ink || PAL.ink));
}
// An outline with no piece under it: a thin band of card cut to that shape (a ring, a halo), standing off what's behind.
function _band(P, w, col) {
  const path = _path(P);
  _with({ shadow: _drop(clamp(w * .5, 1.5, 4), .35) }, c => { c.lineJoin = 'round'; c.lineWidth = w; c.strokeStyle = col; c.stroke(path); });
  _with({}, c => { c.lineJoin = 'round'; c.lineWidth = Math.max(.6, w * .25); c.strokeStyle = _css(LIT, .3); c.stroke(path); });
}
// Printed lines for the small details: eyes, mouths, brows. Dark, even, a little tapered, on the card (no shadow).
function _pen(P, w, col, closed = false, a = .92) {
  const n = P.length; if (n < 2) return;
  const S = _resample(P, Math.max(3, w), closed), m = S.length, taper = Math.min(m / 3, 3);
  _stroke(S, i => w * (closed ? 1 : clamp(Math.min(i + .7, m - .3 - i) / taper, .45, 1)), col, a, closed);
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  const w = Math.max(.6, sw * INK_W * (BRUSHES[br] || 1)), [x0, y0, x1, y1] = _screenBox(_bounds(pts)), long = Math.hypot(x1 - x0, y1 - y0) > W * .35;
  _pen(pts.length > 2 ? _smooth(pts, curv, false) : pts, long ? w * .6 : w, tone(col), false, long ? .22 : .92);   // a line across the stage is a faint pencil line, not an outline
}

// ---------- Sound Words ----------
// The lettering of a shot (Sound Words) is cut from paper: STYLE.flush finds each word on the letters' canvas (at an
// eighth of the size, its letters run together), lays a cream paper backing with a jagged cut edge behind it and a few
// mustard paper ticks around it, then the letters themselves, grained like card, with a thin soft shadow. Lettering
// under 44 px tall (a label on a model sheet) is left as it is.
let _blobC = null, _letC = null;
function _words(img) {
  const sw = _blobC.width, sh = _blobC.height, b = _blobC.getContext('2d', { willReadFrequently: true });
  b.clearRect(0, 0, sw, sh); b.filter = 'blur(1.2px)'; b.drawImage(img, 0, 0, sw, sh); b.filter = 'none';
  const d = b.getImageData(0, 0, sw, sh).data, seen = new Uint8Array(sw * sh), out = [], st = [];
  for (let i = 0; i < sw * sh; i++) {
    if (seen[i] || d[i * 4 + 3] < 30) continue;
    let x0 = sw, y0 = sh, x1 = 0, y1 = 0, n = 0, amax = 0; st.push(i); seen[i] = 1;
    while (st.length) {
      const j = st.pop(), x = j % sw, y = (j - x) / sw; n++; amax = Math.max(amax, d[j * 4 + 3]);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const k of [j - 1, j + 1, j - sw, j + sw]) if (k >= 0 && k < sw * sh && !seen[k] && Math.abs((k % sw) - x) <= 1 && d[k * 4 + 3] >= 30) { seen[k] = 1; st.push(k); }
    }
    if (n > 8 && (y1 - y0 + 1) * W / sw >= 44) { const s = W / sw; out.push({ x0: x0 * s, y0: y0 * s, x1: (x1 + 1) * s, y1: (y1 + 1) * s, a: amax / 255 }); }
  }
  return out;
}
function _wordCard(wd, k) {
  const cx = (wd.x0 + wd.x1) / 2, cy = (wd.y0 + wd.y1) / 2, hh = (wd.y1 - wd.y0) / 2, m = hh * .42, rx = (wd.x1 - wd.x0) / 2 + m, ry = hh + m;
  const tilt = -.05, ca = Math.cos(tilt), sa = Math.sin(tilt), at = (u, v) => [cx + ca * u - sa * v, cy + sa * u + ca * v];
  // the backing: a rectangle cut in short straight snips, every other point pushed out, so the edge zigzags (always 32
  // points, so the edge moves smoothly as the word pops and wobbles)
  const Q = [], per = 4 * (rx + ry), n = 32;
  for (let i = 0; i < n; i++) {
    let t = i / n * per, u, v, nx = 0, ny = 0;
    if (t < 2 * rx) { u = -rx + t; v = -ry; ny = -1; } else if ((t -= 2 * rx) < 2 * ry) { u = rx; v = -ry + t; nx = 1; }
    else if ((t -= 2 * ry) < 2 * rx) { u = rx - t; v = ry; ny = 1; } else { t -= 2 * rx; u = -rx; v = ry - t; nx = -1; }
    const e = (i % 2 ? 1 : -.35) * m * (.22 + .25 * hash(i * 3.3 + k));
    Q.push(at(u + nx * e, v + ny * e));
  }
  _piece(Q, tone(PAL.cream), wd.a, { haze: 0, r: 2, soft: .7 });
  // the ticks: short mustard paper shards radiating from round the backing
  const tick = mixCol(tone(PAL.gold), tone(PAL.cream), .15);
  [-2.75, -2.05, -.62, .12, .52, 2.62].forEach((an, i) => {
    const e = 1.18 + .1 * hash(i * 2.9 + k), px = cx + Math.cos(an) * rx * e, py = cy + Math.sin(an) * ry * (e + .18), L = hh * (.42 + .16 * hash(i * 4.4)), w0 = hh * .07, w1 = hh * .15;
    const ca2 = Math.cos(an), sa2 = Math.sin(an), p = (u, v) => [px + ca2 * u - sa2 * v, py + sa2 * u + ca2 * v];
    _piece([p(0, -w0), p(L, -w1), p(L, w1), p(0, w0)], tick, wd.a, { haze: 0, r: 2 });
  });
}

// The engine letters a Sound Word over a hard drop in PAL.ink; paper letters have only the soft shadow flush gives
// them, so the drop's pixels are lifted out (only inside each word's box).
function _undrop(l, words) {
  const [ir, ig, ib] = _rgb(PAL.ink), cw = l.canvas.width, ch = l.canvas.height;
  for (const wd of words) {
    const x = Math.max(0, Math.floor(wd.x0 * RS) - 8), y = Math.max(0, Math.floor(wd.y0 * RS) - 8), w = Math.min(cw - x, Math.ceil((wd.x1 - wd.x0) * RS) + 16), h = Math.min(ch - y, Math.ceil((wd.y1 - wd.y0) * RS) + 16);
    if (w <= 0 || h <= 0) continue;
    const im = l.getImageData(x, y, w, h), d = im.data, err = i => Math.abs(d[i] - ir) + Math.abs(d[i + 1] - ig) + Math.abs(d[i + 2] - ib);
    let solid = 0, face = 0;
    for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { solid++; if (err(i) > 120) face++; }
    if (face < solid * .3) continue;   // letters in the ink's own colour: the drop doesn't show, leave them
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const e = err(i);
      if (e < 90) d[i + 3] = d[i + 3] * e / 90 * .5;
    }
    l.putImageData(im, x, y);
  }
}

// ---------- card ----------
let _card = null;
const _wrap = (S, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
// The card's grain, a tile laid over every piece in soft-light: fine pencil tooth (speckle), short fibres, the
// faintest pencil strokes and soft mottling. Matte and even: it shows close up and calms down from afar.
function _makeCard() {
  const S = 512, cv = _canvas(S, S), c = cv.getContext('2d'), rnd = _lcg(31), wrap = f => _wrap(S, f);
  c.fillStyle = '#808080'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) { const x = rnd() * S, y = rnd() * S, r = 14 + rnd() * 60, v = 118 + rnd() * 20; c.fillStyle = `rgba(${v},${v},${v},.14)`; wrap((ox, oy) => { c.beginPath(); c.arc(x + ox, y + oy, r, 0, TAU); c.fill(); }); }
  c.lineCap = 'round';
  for (let i = 0; i < 900; i++) {   // the faintest pencil: short strokes, light and dark
    const x = rnd() * S, y = rnd() * S, l = 8 + rnd() * 22, a = -1.1 + (rnd() - .5) * .5, v = rnd() < .5 ? 170 + rnd() * 40 : 70 + rnd() * 30;
    c.strokeStyle = `rgba(${v},${v},${v},${.06 + rnd() * .1})`; c.lineWidth = .7 + rnd() * 1.2;
    wrap((ox, oy) => { c.beginPath(); c.moveTo(x + ox, y + oy); c.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); c.stroke(); });
  }
  for (let i = 0; i < 520; i++) {   // fibres
    const x = rnd() * S, y = rnd() * S, l = 4 + rnd() * 14, a = rnd() * TAU, b = (rnd() - .5) * l * .6, lite = rnd() < .7;
    c.strokeStyle = lite ? `rgba(225,225,225,${.2 + rnd() * .25})` : `rgba(90,90,90,${.12 + rnd() * .12})`; c.lineWidth = .5 + rnd() * .6;
    wrap((ox, oy) => { c.beginPath(); c.moveTo(x + ox, y + oy); c.quadraticCurveTo(x + ox + Math.cos(a) * l / 2 - Math.sin(a) * b, y + oy + Math.sin(a) * l / 2 + Math.cos(a) * b, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); c.stroke(); });
  }
  const d = c.getImageData(0, 0, S, S);
  for (let i = 0; i < d.data.length; i += 4) { const v = (rnd() - .5) * 60 + (rnd() < .07 ? 40 : rnd() < .07 ? -36 : 0); d.data[i] += v; d.data[i + 1] += v; d.data[i + 2] += v; }
  c.putImageData(d, 0, 0);
  const pat = _ctx().createPattern(cv, 'repeat'); pat.setTransform(new DOMMatrix().scale(1.15));
  return pat;
}
function _makePaper() {
  const cv = _canvas(W, H), c = cv.getContext('2d');
  c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'soft-light'; c.globalAlpha = .8; c.fillStyle = _card; c.fillRect(0, 0, W, H);
  return cv;
}
function _makeGrain() {
  const cv = _canvas(W * RS, H * RS), c = cv.getContext('2d'), rnd = _lcg(9), d = c.createImageData(cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = 255 - (rnd() < .3 ? rnd() * 10 : 0); d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  return cv;
}
// The camera's light, laid over the finished picture in STYLE.post: even, with the faintest neutral falloff to the
// corners, as a lens gives it.
function _makeLight() {
  const cv = _canvas(W * RS, H * RS), c = cv.getContext('2d');
  c.scale(RS, RS); c.translate(W * .5, H * .45); c.scale(1, .62);
  const g = c.createRadialGradient(0, 0, W * .3, 0, 0, W * .75);
  g.addColorStop(0, 'rgba(40,40,44,0)'); g.addColorStop(1, 'rgba(40,40,44,.2)');
  c.fillStyle = g; c.fillRect(-W, -H * 2, W * 2, H * 4);
  return cv;
}

// ---------- the Style Profile's hooks ----------
let _paperC = null, _grainC = null, _lightC = null;
const KARAOKE_FONT = '"M PLUS Rounded 1c", "Chiron GoRound TC", sans-serif';
const LETTER_FONT = '"Baloo 2", "Chiron GoRound TC", sans-serif';
const STYLE = {
  fonts: ['Baloo 2', 'M PLUS Rounded 1c', 'Chiron GoRound TC'],
  async setup() {
    _card = _makeCard(); _paperC = _makePaper(); _grainC = _makeGrain(); _lightC = _makeLight();
    _blobC = _canvas(240, 135); _letC = _canvas(W * RS, H * RS);
  },
  underlay() { _ctx().drawImage(_paperC, 0, 0, W, H); },
  post() {
    const c = _ctx(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.drawImage(_lightC, 0, 0);
    c.restore();
  },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  // Sound Words as cut paper (see _words): the backing and ticks, then the letters, grained, with a thin soft shadow
  flush(img) {
    const c = _ctx(); c.save(); c.setTransform(RS, 0, 0, RS, 0, 0);
    const words = _words(img); words.forEach((wd, k) => _wordCard(wd, k));
    const l = _letC.getContext('2d', { willReadFrequently: true }); l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'copy'; l.drawImage(img, 0, 0);
    _undrop(l, words);
    l.globalCompositeOperation = 'source-atop'; l.globalAlpha = .22; l.fillStyle = _card; l.fillRect(0, 0, _letC.width, _letC.height); l.globalAlpha = 1;
    c.shadowColor = _css(SHADOW, .4); c.shadowBlur = _px(5); c.shadowOffsetX = LIGHT[0] * _px(2); c.shadowOffsetY = LIGHT[1] * _px(3);
    c.drawImage(_letC, 0, 0, W, H);
    c.restore();
    return true;
  },
  // stiff card: a little squash, hardly any smear
  pose: o => ({ ...o, sq: (o.sq || 0) * .3, take: (o.take || 0) * .5, smear: Math.min(1, (o.smear || 0) * .2) }),
  letterFont: size => `800 ${size}px ${LETTER_FONT}`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // the line printed on a cream card laid on the stage: one thin soft shadow, the grain, a thin red printed border.
    // It rises into place as the line comes in (painted in the frame), then is painted with its letters on the 2D
    // compositor, over the picture, so a wipe never covers the words
    band(K) {
      karaokeLayout(outX, K, s => `800 ${s}px ${KARAOKE_FONT}`, this.size);
      if (K.grow <= .85) this.card(K);
    },
    card(K) {
      const box = K.box, g = easeOut(K.grow), lift = (1 - g) * 30;
      const hw = box.tw / 2 + 52, x0 = W / 2 - hw, x1 = W / 2 + hw, y0 = box.y + 2 + lift, y1 = box.y + box.h + lift;
      const face = tone(PAL.cream), red = tone(PAL.brick), c = _ctx();
      _with({ alpha: g }, () => {
        const F = rrPts(x0, y0, x1 - x0, y1 - y0, 12), path = _path(F);
        _with({ shadow: _drop(7, .38) }, () => _fillPoly(F, face));
        _with({ clip: path }, () => {
          _fillPoly(F, _linear(F, [0, 1], [[0, LIT, .25], [1, cardShade(face), .18]]));
          _cardFill(path, 1);
          c.lineWidth = 3; c.strokeStyle = _css(LIT, .6); c.stroke(path);
        });
        _with({}, () => { c.lineWidth = 3.4; c.strokeStyle = _css(red, .9); c.stroke(_path(rrPts(x0 + 8, y0 + 8, x1 - x0 - 16, y1 - y0 - 16, 8))); });
      });
    },
    text(c, K) {
      _onCtx(c, () => this.card(K));
      const sz = this.size, rest = tone('#5C5654'); c.textBaseline = 'middle'; c.textAlign = 'left';
      if (K.sub) {
        const ss = K.subSize, x = W / 2 - (c.font = `800 ${ss}px ${KARAOKE_FONT}`, c.measureText(K.sub).width) / 2;
        c.fillStyle = mixCol(rest, PAL.cream, .4); c.fillText(K.sub, x, K.subY);
      }
      c.font = `800 ${sz}px ${KARAOKE_FONT}`;
      const rows = K.rows || [{ from: 0, to: K.text.length, y: K.top + 52 }];
      rows.forEach(r => {
        const s = K.text.slice(r.from, r.to), w = c.measureText(s).width, x = W / 2 - w / 2, y = r.y + 2;
        c.fillStyle = rest; c.fillText(s, x, y);
        const n = clamp(K.sung - r.from, 0, s.length);
        if (n > 0) {
          const i = Math.floor(n), cw = c.measureText(s.slice(0, i)).width, nw = c.measureText(s.slice(0, Math.min(s.length, i + 1))).width;
          c.save(); c.beginPath(); c.rect(x - 2, y - sz, lerp(cw, nw, n - i) + 2, sz * 2); c.clip(); c.fillStyle = tone(PAL.brick); c.fillText(s, x, y); c.restore();
        }
      });
    },
  },
};
