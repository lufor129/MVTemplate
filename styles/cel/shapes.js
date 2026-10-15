// shapes.js: the drawing helpers every Style Profile drawn with plain p5 shapes uses (cel, cutout, pixel): filled
// polygons, variable-width strokes, hatching, offsets and light, on the engine's WEBGL canvas, with no p5.brush. Each of
// those profiles keeps its own identical copy, so a profile folder stays self-contained (ADR 0001).

const _rgba = (hex, a = 1) => { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255 * clamp(a)]; };
function _centre(P) { let x = 0, y = 0; for (const p of P) { x += p[0]; y += p[1]; } return [x / P.length, y / P.length]; }
function _area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function _bounds(P) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
function _inside(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}
// A fan from the centre works for any shape every edge of which faces it (rects, ellipses, blobs); anything else is
// tessellated by p5, which is much slower.
function _starShaped(P, c) {
  let sign = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], cr = (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]);
    if (Math.abs(cr) < 1e-9) continue; const s = Math.sign(cr); if (sign && s !== sign) return false; sign = s;
  }
  return true;
}
function _fillPoly(P, col, a = 1) {
  if (!P || P.length < 3 || a <= 0) return;
  noStroke(); fill(..._rgba(col, a));
  const c = _centre(P);
  if (_starShaped(P, c)) {
    beginShape(TRIANGLES);
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; vertex(c[0], c[1]); vertex(p[0], p[1]); vertex(q[0], q[1]); }
    endShape();
  } else { beginShape(); for (const p of P) vertex(p[0], p[1]); endShape(CLOSE); }
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
// A stroke along a path as triangles: w(i) is the full width at point i. Round joins and (when round) round caps.
// Overlapping joins darken a translucent stroke, so those skip the joins.
function _stroke(P, w, col, a = 1, closed = false, round = true) {
  const n = P.length; if (n < 2 || a <= 0) return;
  noStroke(); fill(..._rgba(col, a)); beginShape(TRIANGLES);
  const disc = (x, y, r) => { const m = r < 2.5 ? 6 : 12; for (let k = 0; k < m; k++) { const a0 = k / m * TAU, a1 = (k + 1) / m * TAU; vertex(x, y); vertex(x + Math.cos(a0) * r, y + Math.sin(a0) * r); vertex(x + Math.cos(a1) * r, y + Math.sin(a1) * r); } };
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p = P[i], q = P[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy); if (d < 1e-6) continue;
    const nx = -dy / d, ny = dx / d, h0 = w(i) / 2, h1 = w((i + 1) % n) / 2;
    vertex(p[0] + nx * h0, p[1] + ny * h0); vertex(q[0] + nx * h1, q[1] + ny * h1); vertex(q[0] - nx * h1, q[1] - ny * h1);
    vertex(p[0] + nx * h0, p[1] + ny * h0); vertex(q[0] - nx * h1, q[1] - ny * h1); vertex(p[0] - nx * h0, p[1] - ny * h0);
  }
  for (let i = 0; i < n; i++) {
    const end = !closed && (i === 0 || i === n - 1);
    if (end ? !round : a < 1) continue;
    if (!end) {   // only where the path turns enough to leave a gap
      const p = P[(i - 1 + n) % n], c = P[i], q = P[(i + 1) % n], ux = c[0] - p[0], uy = c[1] - p[1], vx = q[0] - c[0], vy = q[1] - c[1];
      const cos = (ux * vx + uy * vy) / ((Math.hypot(ux, uy) * Math.hypot(vx, vy)) || 1); if (cos > .97) continue;
    }
    disc(P[i][0], P[i][1], w(i) / 2);
  }
  endShape();
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
// Light: glow(x, y, r, colour, a) ADDS a soft halo of light for anything that shines. It lands on what's drawn so far,
// under anything drawn after it, and follows the camera. Keep a = 1 on dark grounds; on light grounds it barely shows.
let _glowTex = null;
function glow(x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  _glowTex = _glowTex || (() => {
    const g = createGraphics(256, 256); g.pixelDensity(1); const c = g.drawingContext, gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 1], [.18, .8], [.45, .32], [.75, .08], [1, 0]].forEach(([s, al]) => gr.addColorStop(s, `rgba(255,255,255,${al})`));
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256); return g;
  })();
  const [cr, cg, cb] = _rgba(col);
  push(); blendMode(ADD); tint(cr, cg, cb, 150 * clamp(a)); image(_glowTex, x - r, y - r, 2 * r, 2 * r); noTint(); blendMode(BLEND); pop();
}
// A seeded generator for textures made once in setup.
function _lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
