// canvas.js: the drawing helpers every Style Profile painted on a Canvas 2D (style.json "renderer": "2d") uses
// (paper-theatre, doodle): paths, gradients, soft shadows, blur, blend modes, variable-width strokes, hatching, offsets
// and light, straight through drawingContext. p5's push/translate/rotate/scale (the camera, the Characters' poses, the
// render scale) land on the same context, so everything here is in frame units. Each such profile keeps its own
// identical copy, so a profile folder stays self-contained (ADR 0001).
//
// Two things the context does NOT transform: shadowBlur/shadowOffset and filter lengths (blur(4px)) are in canvas
// pixels, whatever the camera's zoom or the render scale. _px(v) turns frame units into those pixels; _with() does it
// for you.

let _CTX = null;
const _ctx = () => _CTX || drawingContext;
// Run fn with every helper here drawing on another context (the 2D compositor's outX, an offscreen layer) instead.
function _onCtx(c, fn) { const o = _CTX; _CTX = c; try { fn(c); } finally { _CTX = o; } }
const _rgb = hex => { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const _css = (hex, a = 1) => { const [r, g, b] = _rgb(hex); return `rgba(${r},${g},${b},${clamp(a)})`; };
// How many canvas pixels one frame unit is right now (camera zoom × render scale).
function _px(v = 1) { const m = _ctx().getTransform(); return v * Math.hypot(m.a, m.b); }

// ---------- geometry (the same as shapes.js in the WEBGL profiles) ----------
function _centre(P) { let x = 0, y = 0; for (const p of P) { x += p[0]; y += p[1]; } return [x / P.length, y / P.length]; }
function _area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function _bounds(P) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
function _inside(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}
// Smooth a point list through its points (Catmull-Rom), k = 0 (as given) .. 1 (fully smooth).
function _smooth(P, k, closed = true, n = 5) {
  if (!k || P.length < 3) return P;
  const N = P.length, at = i => closed ? P[(i + N) % N] : P[Math.max(0, Math.min(N - 1, i))], out = [];
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < n; s++) {
      const u = s / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(d => lerp(lerp(p1[d], p2[d], u), .5 * (2 * p1[d] + (p2[d] - p0[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * u3), k)));
    }
  }
  if (!closed) out.push(P[N - 1]);
  return out;
}
// Points every `step` along the path (closed: back round to the start, which is not repeated).
function _resample(P, step, closed = true) {
  const out = [], n = closed ? P.length : P.length - 1;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % P.length], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!closed) out.push(P[P.length - 1]);
  return out;
}
// Move every point of a closed polygon `e` outward (negative: inward).
function _offset(P, e) {
  const s = _area(P) > 0 ? 1 : -1, n = P.length;
  return P.map((p, i) => {
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n];
    let nx = (p[1] - a[1]) + (b[1] - p[1]), ny = -(p[0] - a[0]) - (b[0] - p[0]); const d = Math.hypot(nx, ny) || 1;
    return [p[0] + s * nx / d * e, p[1] + s * ny / d * e];
  });
}
// Douglas-Peucker: keep only the points that stray more than tol from the straight line between their kept
// neighbours, so a curve becomes a few straight runs (a closed ring is split at its point 0 and the point farthest from it).
function _simplify(P, tol, closed = true) {
  const n = P.length; if (n <= 3) return P;
  const Q = closed ? P.concat([P[0]]) : P, m = Q.length, keep = new Uint8Array(m);
  let k = m - 1;
  if (closed) { let best = -1; for (let i = 1; i < n; i++) { const d = (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2; if (d > best) { best = d; k = i; } } }
  keep[0] = keep[k] = keep[m - 1] = 1;
  const stack = closed ? [[0, k], [k, m - 1]] : [[0, m - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); if (b - a < 2) continue;
    const [ax, ay] = Q[a], dx = Q[b][0] - ax, dy = Q[b][1] - ay, L = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((Q[i][0] - ax) * dy - (Q[i][1] - ay) * dx) / L; if (d > best) { best = d; bi = i; } }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  const out = []; for (let i = 0; i < (closed ? m - 1 : m); i++) if (keep[i]) out.push(Q[i]);
  return closed && out.length < 3 ? P : out;
}
// The parts of evenly spaced parallel lines (angle `ang`, `d` apart) that lie inside a polygon, as [[x0, y0], [x1, y1]].
function _hatchLines(P, d, ang = 0, rand = 0) {
  const c = Math.cos(-ang), s = Math.sin(-ang), R = P.map(([x, y]) => [x * c - y * s, x * s + y * c]), [, y0, , y1] = _bounds(R), out = [];
  for (let y = y0 + d / 2, i = 0; y < y1; y += d * (1 + rand * (hash(i * 7.1) - .5)), i++) {
    const xs = [];
    for (let k = 0; k < R.length; k++) { const a = R[k], b = R[(k + 1) % R.length]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) out.push([[xs[k], y], [xs[k + 1], y]].map(([x, yy]) => [x * c + yy * s, -x * s + yy * c]));
  }
  return out;
}

// ---------- paths and fills ----------
// A Path2D through the points: straight segments, or (smooth) quadratic curves through the midpoints, which rounds
// every corner without adding points.
function _path(P, closed = true, smooth = false) {
  const p = new Path2D(), n = P.length; if (n < 2) return p;
  if (!smooth || n < 3) { p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < n; i++) p.lineTo(P[i][0], P[i][1]); if (closed) p.closePath(); return p; }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (closed) {
    const m0 = mid(P[n - 1], P[0]); p.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(P[i], P[(i + 1) % n]); p.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); }
    p.closePath();
  } else {
    p.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < n - 1; i++) { const m = mid(P[i], P[i + 1]); p.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); }
    p.lineTo(P[n - 1][0], P[n - 1][1]);
  }
  return p;
}
// A Path2D through the points with every corner rounded (radius r, smaller where the edges are short or the corner
// sharp, so it never overshoots), as a die cuts card.
function _roundPath(P, r) {
  const n = P.length, p = new Path2D(); if (n < 3 || r < .3) return _path(P);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(P[n - 1], P[0]);
  p.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], v = P[i], b = P[(i + 1) % n], m = mid(v, b);
    const ax = a[0] - v[0], ay = a[1] - v[1], bx = b[0] - v[0], by = b[1] - v[1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 1e-6 || lb < 1e-6) { p.lineTo(m[0], m[1]); continue; }
    const th = Math.acos(clamp((ax * bx + ay * by) / (la * lb), -1, 1)), t = Math.tan(th / 2);
    p.arcTo(v[0], v[1], m[0], m[1], Math.max(0, Math.min(r, t * Math.min(la, lb) * .5)));
  }
  p.closePath(); return p;
}
// Fill a point list (or a Path2D) with a colour, a CanvasGradient or a CanvasPattern, at opacity a.
function _fillPoly(P, col, a = 1, rule = 'nonzero') {
  if (!P || a <= 0 || (Array.isArray(P) && P.length < 3)) return;
  const c = _ctx(); c.save();
  if (typeof col === 'string') c.fillStyle = _css(col, a); else { c.fillStyle = col; c.globalAlpha *= clamp(a); }
  c.fill(Array.isArray(P) ? _path(P) : P, rule); c.restore();
}
// A linear gradient across a shape's bounds along the unit vector dir ([x, y]; LIGHT for light-to-shadow), with
// stops [[0, '#hex'], [1, '#hex']] (a stop may carry an opacity: [s, '#hex', a]).
function _linear(P, dir, stops) {
  const [x0, y0, x1, y1] = _bounds(P), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const r = (Math.abs(dir[0]) * (x1 - x0) + Math.abs(dir[1]) * (y1 - y0)) / 2;
  const g = _ctx().createLinearGradient(cx - dir[0] * r, cy - dir[1] * r, cx + dir[0] * r, cy + dir[1] * r);
  for (const [s, col, a] of stops) g.addColorStop(clamp(s), _css(col, a ?? 1));
  return g;
}
function _radial(x, y, r0, r1, stops, fx = x, fy = y) {
  const g = _ctx().createRadialGradient(fx, fy, r0, x, y, r1);
  for (const [s, col, a] of stops) g.addColorStop(clamp(s), _css(col, a ?? 1));
  return g;
}
// Run fn with the context set up and put back after: { alpha, blend (a globalCompositeOperation: 'multiply',
// 'screen', 'overlay', 'soft-light', 'lighter'…), blur (frame units), shadow: { blur, x, y, col, a, screen } (frame units),
// clip (a point list or Path2D) }.
function _with(o, fn) {
  const c = _ctx(); c.save();
  if (o.alpha != null) c.globalAlpha *= clamp(o.alpha);
  if (o.blend) c.globalCompositeOperation = o.blend;
  if (o.blur) c.filter = `blur(${_px(o.blur).toFixed(2)}px)`;
  if (o.shadow) {
    const s = o.shadow, m = c.getTransform();
    c.shadowColor = _css(s.col || PAL.ink, s.a ?? .4); c.shadowBlur = _px(s.blur ?? 12);
    // shadow offsets are in canvas pixels and unrotated: carry the frame offset through the current transform
    // (screen: true takes x, y as a screen direction instead, e.g. away from LIGHT whatever the shape's own rotation or flip)
    if (s.screen) { const k = _px(); c.shadowOffsetX = (s.x || 0) * k; c.shadowOffsetY = (s.y || 0) * k; }
    else { c.shadowOffsetX = m.a * (s.x || 0) + m.c * (s.y || 0); c.shadowOffsetY = m.b * (s.x || 0) + m.d * (s.y || 0); }
  }
  if (o.clip) c.clip(Array.isArray(o.clip) ? _path(o.clip) : o.clip);
  try { fn(c); } finally { c.restore(); }
}

// ---------- strokes ----------
// A stroke along a path: w is a width, or w(i) the full width at point i. A variable width is built as one path of
// segment quads and round joins, filled once, so a translucent stroke doesn't darken where its pieces overlap.
function _stroke(P, w, col, a = 1, closed = false, round = true) {
  const n = P.length; if (n < 2 || a <= 0) return;
  const c = _ctx(); c.save();
  if (typeof w === 'number') {
    c.strokeStyle = _css(col, a); c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = round ? 'round' : 'butt';
    c.stroke(_path(P, closed)); c.restore(); return;
  }
  const p2 = new Path2D();
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p = P[i], q = P[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy); if (d < 1e-6) continue;
    const nx = -dy / d, ny = dx / d, h0 = w(i) / 2, h1 = w((i + 1) % n) / 2;
    // wound the same way as arc(), so the nonzero fill unites them instead of cutting holes
    p2.moveTo(p[0] - nx * h0, p[1] - ny * h0); p2.lineTo(q[0] - nx * h1, q[1] - ny * h1); p2.lineTo(q[0] + nx * h1, q[1] + ny * h1); p2.lineTo(p[0] + nx * h0, p[1] + ny * h0); p2.closePath();
  }
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1) && !round) continue;
    const r = w(i) / 2; p2.moveTo(P[i][0] + r, P[i][1]); p2.arc(P[i][0], P[i][1], r, 0, TAU);
  }
  c.fillStyle = _css(col, a); c.fill(p2, 'nonzero'); c.restore();
}

// ---------- light ----------
// glow(x, y, r, colour, a) ADDS a soft halo of light for anything that shines. It lands on what's drawn so far, under
// anything drawn after it, and follows the camera. Keep a = 1 on dark grounds; on light grounds it barely shows.
function glow(x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  const c = _ctx(), [R, G, B] = _rgb(col), k = .59 * clamp(a), g = c.createRadialGradient(x, y, 0, x, y, r);
  [[0, 1], [.18, .8], [.45, .32], [.75, .08], [1, 0]].forEach(([s, al]) => g.addColorStop(s, `rgba(${R},${G},${B},${al * k})`));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
}

// ---------- offscreen ----------
// A canvas of its own (textures made once in setup, or a layer a look paints into and composites: an ink plate, a
// shadow pass). layer(name) is frame-sized and keeps its context; clear it yourself each frame.
function _canvas(w, h) { const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h); return cv; }
const _layers = {};
function _layer(name) { return (_layers[name] = _layers[name] || _canvas(W * RS, H * RS).getContext('2d')); }
// A seeded generator for textures made once in setup.
function _lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
