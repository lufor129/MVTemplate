// paint.js: a doodle in a lined school notebook, built as SVG (svg.js). Most of the page stays white. Everything is
// outlined twice with a wobbly black fineliner whose strokes run on past the corners. Colour comes from a few felt-tip
// markers scribbled back and forth, darker where strokes overlap: a thing is coloured in almost to its line, a big
// area (sky, hills) only along its top edge, trailing off into bare page. Yellows are highlighter. A hatched shape (a
// rock), a dark tone and a cast shadow are ballpoint cross-hatching instead; a big pale haze (a cloud) is only its
// scalloped outline. The ruling shows through everything.
//
// Every element takes ONE number from p5's seeded random() (its seed) and builds all its wobble from that seed and
// from positions along its own outline or hatch grid, never from the frame: a still thing draws the same every frame,
// and a moving thing keeps its wobble as it moves (the SVG noise filters live in its own user space too).

// ---------- colour ----------
// Every colour that reaches paint(), inkLine() and glow() passes through tone(): a marker is light and clean (a dark
// comes from layering), so a mid colour is lifted towards marker lightness; pen ink, paper and greys stay as they are.
const _toned = new Map();
function tone(c) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let v = _toned.get(c);
  if (!v) {
    const [h, s, l] = hexHsl(c);
    v = l < .27 || l > .9 || s < .08 ? c : hslHex(h, Math.min(1, s * 1.08 + .04), l >= .62 ? Math.min(l, .86) : .62 - (.62 - l) * .35);
    _toned.set(c, v);
  }
  return v;
}
// what a colour is drawn with: 'pen' (dark: fineliner or ballpoint), 'gel' (near white: gel pen, bare paper) or 'mk'
const _kinds = new Map();
function _kind(c) { let k = _kinds.get(c); if (!k) { const l = hexHsl(c)[2]; k = l < .3 ? 'pen' : l > .84 ? 'gel' : 'mk'; _kinds.set(c, k); } return k; }
// ballpoint ink: a dark colour goes blue-black
const _bic = c => _kind(c) === 'pen' ? mixCol(c, PAL.bic, .7) : c;
// a clear yellow is drawn with the highlighter
const _his = new Map();
function _isHi(c) { let v = _his.get(c); if (v === undefined) { const [h, s, l] = hexHsl(c); v = h > .1 && h < .19 && s > .45 && l > .4 && l < .9; _his.set(c, v); } return v; }

// ---------- seeded wobble ----------
const _h = (s, k) => hash(s * 3.17 + k * 1.713);                       // 0..1 for (element seed, index)
function _n1(s, x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i * 1.37 + s), hash((i + 1) * 1.37 + s), u) * 2 - 1; }

// ---------- outlines ----------
// Arc lengths along a polyline, and the point + unit tangent at arc length a (an open path is carried straight on
// past its ends, which is how a quick pen stroke overshoots).
function _arc(P, closed) {
  const n = P.length, m = closed ? n + 1 : n, cum = new Float64Array(m);
  for (let i = 1; i < m; i++) { const a = P[i - 1], b = P[i % n]; cum[i] = cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return cum;
}
function _at(P, cum, closed, a) {
  const n = P.length, L = cum[cum.length - 1];
  if (closed) a = ((a % L) + L) % L;
  let i;
  if (!closed && a <= 0) i = 0; else if (!closed && a >= L) i = n - 2;
  else { let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= a) lo = m; else hi = m; } i = lo; }
  const p = P[i], q = P[(i + 1) % n], sl = (cum[i + 1] - cum[i]) || 1e-6, tx = (q[0] - p[0]) / sl, ty = (q[1] - p[1]) / sl, u = a - cum[i];
  return [p[0] + tx * u, p[1] + ty * u, tx, ty];
}
// Where a closed outline turns a real corner (not the even turning of a polygon standing in for a curve).
function _corners(P, closed) {
  const n = P.length, tn = [];
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { tn.push(0); continue; }
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    let d = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0])); if (d > Math.PI) d = TAU - d;
    tn.push(d);
  }
  const out = [];
  for (let i = 0; i < n; i++) { const nb = Math.max(tn[(i - 1 + n) % n], tn[(i + 1) % n]); if (tn[i] > 1.02 || (tn[i] > .55 && tn[i] > nb * 1.8)) out.push(i); }
  return out;
}
// One pen stroke from arc a0 to a1, run on e0 before and e1 after, nudged sideways by slow noise along the arc (so it
// bends the same way every frame), bowed a little, and drifting `drift` to one side by its end.
// The run-on carries straight on along the stroke's own direction (past a corner, it doesn't turn it), except for a
// loop (wrap), whose overlap follows the outline round past where it began.
function _strokePts(P, cum, closed, a0, a1, s, amp, e0, e1, drift = 0, sway = 0, wrap = false) {
  const len = a1 - a0 + e0 + e1, k = Math.max(2, Math.ceil(len / 8)), out = [];
  const bow = (_h(s, a0 * .01 + 7) - .5) * 2 * Math.min(5, (a1 - a0) * .018), lam = 70, eps = Math.min(.5, (a1 - a0) / 4);
  const S0 = _at(P, cum, closed, a0 + eps), S1 = _at(P, cum, closed, a1 - eps);
  for (let j = 0; j <= k; j++) {
    const a = a0 - e0 + len * j / k, u = j / k;
    let x, y, tx, ty;
    if (!wrap && a < a0) [x, y, tx, ty] = [S0[0] - S0[2] * (a0 + eps - a), S0[1] - S0[3] * (a0 + eps - a), S0[2], S0[3]];
    else if (!wrap && a > a1) [x, y, tx, ty] = [S1[0] + S1[2] * (a - a1 + eps), S1[1] + S1[3] * (a - a1 + eps), S1[2], S1[3]];
    else [x, y, tx, ty] = _at(P, cum, closed, a);
    const off = amp * _n1(s, a / lam) + sway * _n1(s + 77, a / 240) + bow * Math.sin(Math.PI * u) + drift * u * u;
    out.push([x - ty * off, y + tx * off]);
  }
  return out;
}
// A hand-drawn outline: the path split into pen strokes at its corners (each runs on past the corner, so they cross)
// and wherever a long run would need the pen lifted; a loop with no corners goes round once and overlaps its start.
function _roughPass(P, closed, s, w, amp, sway = 0) {
  const cum = _arc(P, closed), L = cum[cum.length - 1], out = []; if (L < 1) return out;
  const C = _corners(P, closed), runs = [];
  if (closed && !C.length) {
    const a0 = _h(s, 1) * L, ov = clamp(L * .07, 6, 46) * (.7 + .6 * _h(s, 2));
    if (L < 900) { out.push(_strokePts(P, cum, true, a0, a0 + L, s, amp, 0, ov, (_h(s, 3) > .5 ? 1 : -1) * w * 1.1, sway, true)); return out; }
    runs.push([a0, a0 + L]);
  } else if (closed) for (let i = 0; i < C.length; i++) runs.push([cum[C[i]], i + 1 < C.length ? cum[C[i + 1]] : cum[C[0]] + L]);
  else { const cs = [0, ...C.map(i => cum[i]), L]; for (let i = 0; i + 1 < cs.length; i++) runs.push([cs[i], cs[i + 1]]); }
  runs.forEach(([a0, a1], r) => {
    const m = Math.max(1, Math.round((a1 - a0) / (330 + 220 * _h(s, r + 9))));
    for (let q = 0; q < m; q++) {
      const b0 = lerp(a0, a1, q / m), b1 = lerp(a0, a1, (q + 1) / m), hk = _h(s, r * 13 + q * 3 + 11), hj = _h(s, r * 13 + q * 3 + 12);
      const atCorner0 = q === 0 && (closed || r > 0), atCorner1 = q === m - 1 && (closed || r < runs.length - 1);
      // corners: the stroke runs on past them, by less on short edges (a leg isn't a hash mark)
      const cap = Math.min(4 + (b1 - b0) * .09, 2 + w * 3.4), e0 = atCorner0 ? cap * (.35 + .65 * hk) : q ? w * (.6 + hk) : 0, e1 = atCorner1 ? cap * (.35 + .65 * hj) : q < m - 1 ? w * .4 : 0;
      out.push(_strokePts(P, cum, closed, b0, b1, s + q * 5.1 + r * 2.3, amp, e0, e1, (hk - .5) * w * .7, sway));
    }
  });
  return out;
}

// The outline of a shape (or an open line), as SVG: two passes of the fineliner, the second a little off the first.
// [width per unit of sw, opacity, kind]: 'pen' fineliner, 'bic' ballpoint (an ink blob where each stroke starts and
// ends), 'mk' marker, 'dry' a marker running dry, 'dot' dotted.
const BRUSHES = {
  ink: [1.9, .92, 'pen'], inkfine: [1.3, .92, 'pen'], pen: [1.5, .92, 'pen'], rotring: [1.3, .95, 'pen'],
  HB: [1.1, .82, 'bic'], '2B': [1.4, .86, 'bic'], cpencil: [1.2, .8, 'bic'],
  marker: [5, .72, 'mk'], charcoal: [4.2, .85, 'mk'], dry: [4.4, .7, 'dry'], spray: [2.2, .75, 'dot'],
};
function _lineSvg(P, closed, sw, col, br, s, double = true) { return _linesSvg([P], closed, sw, col, br, s, double); }
// Several lines drawn with the same pen, in one group.
function _linesSvg(Ps, closed, sw, col, br, s, double = true) {
  const [bw, ba, bk] = BRUSHES[br] || BRUSHES.ink;
  let kind = bk; if (kind === 'pen' && _kind(col) !== 'pen') kind = 'cpen';
  const c = kind === 'bic' ? _bic(col) : col, w = Math.max(kind === 'pen' ? 1.5 : .9, sw * bw);
  const amp = Math.min(2, .5 + w * .3) * (kind === 'bic' ? .7 : 1), two = double && (kind === 'pen' || kind === 'cpen');
  const cap = 'stroke-linecap="round" stroke-linejoin="round" fill="none"';
  let p1 = '', p2 = '', bic = '', x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const m = kind === 'bic' ? _blob(c) : '';
  Ps.forEach((P, i) => {
    const cum = _arc(P, closed), L = cum[cum.length - 1]; if (L < .5) return;
    const si = s + i * 31.7, pieces = _roughPass(P, closed, si, w, amp), b = _bounds(P);
    x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
    // ballpoint: every pen stroke its own path, so the ink blob (an SVG marker) lands where the pen went down and lifted
    if (kind === 'bic') bic += pieces.map(Q => `<path d="${_d(Q)}" marker-start="url(#${m})" marker-end="url(#${m})"/>`).join('');
    else p1 += pieces.map(Q => _d(Q)).join('');
    if (two && L > 40) p2 += _roughPass(P, closed, si + 17.3, w, amp * 1.15, w * .8 + 1.1).map(Q => _d(Q)).join('');
  });
  if (x1 < x0) return '';
  const pad = _pad([x0, y0, x1, y1], w * 2 + 12);
  if (kind === 'bic') return `<g style="mix-blend-mode:multiply" filter="url(#wob)">${pad}<g stroke="${c}" stroke-width="${_f(w)}" stroke-opacity="${ba}" ${cap}>${bic}</g></g>`;
  let inner = `<path d="${p1}" stroke="${c}" stroke-width="${_f(w)}" opacity="${ba}" ${kind === 'dry' ? cap.replace('round"', 'butt"') : cap}`;
  if (kind === 'dry') inner += ` stroke-dasharray="${_f(w * 3.2)} ${_f(w * .9)} ${_f(w * 1.4)} ${_f(w * .7)}" stroke-dashoffset="${_f(_h(s, 4) * w * 6)}"`;
  if (kind === 'dot') inner += ` stroke-dasharray="0 ${_f(w * 2.3)}"`;
  inner += '/>';
  if (p2) inner += `<path d="${p2}" stroke="${c}" stroke-width="${_f(w * .9)}" opacity="${_f(ba * .9)}" ${cap}/>`;
  return `<g style="mix-blend-mode:multiply" filter="url(#wob)">${pad}${inner}</g>`;
}

// ---------- hachure ----------
// The lines of a hatch at angle ang, `gap` apart on a grid fixed in the shape's own space (so they never crawl), cut
// to polygon P: spans [x0, x1] along each line, in the frame where the lines run along x.
function _rot(P, ang) { const c = Math.cos(-ang), s = Math.sin(-ang); return P.map(([x, y]) => [x * c - y * s, x * s + y * c]); }
function _spansAt(R, y) {
  const xs = [];
  for (let k = 0, n = R.length; k < n; k++) { const a = R[k], b = R[(k + 1) % n]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); }
  xs.sort((p, q) => p - q); const out = []; for (let k = 0; k + 1 < xs.length; k += 2) out.push([xs[k], xs[k + 1]]); return out;
}
function _minus(A, B) {
  let out = A;
  for (const [b0, b1] of B) {
    const nx = [];
    for (const [a0, a1] of out) { if (b1 <= a0 || b0 >= a1) nx.push([a0, a1]); else { if (b0 > a0) nx.push([a0, b0]); if (b1 < a1) nx.push([b1, a1]); } }
    out = nx;
  }
  return out;
}
function _and(A, B) {
  const out = [];
  for (const [a0, a1] of A) for (const [b0, b1] of B) { const x0 = Math.max(a0, b0), x1 = Math.min(a1, b1); if (x1 > x0) out.push([x0, x1]); }
  return out.sort((p, q) => p[0] - q[0]);
}
// One layer of hachure over P: strokes `gap` apart, stopping short of the edge by about `inset`, broken into pen
// strokes no longer than `run`, bowed and tilted a little, minus the polygons in `cut`, within those in `keep`. Neighbouring
// lines go into two separate paths, so where they overlap they darken (multiply), like a marker going over itself.
function _hatch(P, { ang, gap, inset, s, run = 320, cut = [], keep = [], jag = .3, bowK = 1, phase = 0, paths = 2, spread = 0, fade = null }) {
  const R = _rot(P, ang), Cs = cut.map(Q => _rot(Q, ang)), Ks = keep.map(Q => _rot(Q, ang)), [, y0, , y1] = _bounds(R);
  const c = Math.cos(ang), sn = Math.sin(ang), back = (x, y) => [x * c - y * sn, x * sn + y * c];
  const D = Array(paths).fill('');
  const ph = phase + _h(s, 99) * gap;
  for (let k = Math.ceil((y0 - ph) / gap) - 1; (k - 1) * gap + ph < y1; k++) {
    const y = k * gap + ph + (_h(s, k * 1.37 + 50) - .5) * gap * spread;   // spread: lines unevenly spaced
    let sp = _spansAt(R, y); for (const Q of Cs) sp = _minus(sp, _spansAt(Q, y)); for (const Q of Ks) sp = _and(sp, _spansAt(Q, y));
    for (let j = 0; j < sp.length; j++) {
      let [a, b] = sp[j];
      a += inset * (.35 + 1.1 * _h(s, k * 7.1 + j)); b -= inset * (.35 + 1.1 * _h(s, k * 7.1 + j + 3.3));
      if (b - a < gap * .4) continue;
      // where the pen lifts and starts again: scattered, so the restarts (a darker overlap) never line up
      const m = Math.max(1, Math.round((b - a) / (run * (.75 + .5 * _h(s, k * 2.9))))), cutAt = q => q <= 0 ? a : q >= m ? b : lerp(a, b, (q + (_h(s, k * 4.3 + q * 1.9) - .5) * .7) / m);
      for (let q = 0; q < m; q++) {
        const xa = cutAt(q) - (q ? 2 + 8 * _h(s, k + q * 31) : 0), xb = cutAt(q + 1);
        const ya = y + (_h(s, k * 3.3 + q) - .5) * gap * jag, yb = y + (_h(s, k * 5.7 + q + 1) - .5) * gap * jag;
        const bw = (_h(s, k * 11.3 + q) - .5) * Math.min(7, (xb - xa) * .035) * bowK;
        const p0 = back(xa, ya), p1 = back(xb, yb), pm = back((xa + xb) / 2, (ya + yb) / 2 + bw * 2);
        if (fade && _h(s, k * 9.1 + q * 2.3 + 500) > fade(pm)) continue;   // left uncoloured here
        const seg = `M${_f(p0[0])} ${_f(p0[1])}Q${_f(pm[0])} ${_f(pm[1])} ${_f(p1[0])} ${_f(p1[1])}`;
        D[(((k + q) % paths) + paths) % paths] += seg;
      }
    }
  }
  return D;
}
// The paths of a hatch as SVG; with more than two, each gets its own width (a marker pressed harder or lighter).
const _WK = [1, .78, 1.2, .9];
// blob: ballpoint ink blobs (SVG markers) at both ends of every line (a hatch path is only M/Q segments, so marker-mid
// lands exactly on the ends in between).
function _hatchSvg(d, col, w, op, blend = 'multiply', filter = 'wobF', pad = '', blob = false) {
  if (!d.some(Boolean)) return '';
  const mk = blob ? (m => ` marker-start="url(#${m})" marker-mid="url(#${m})" marker-end="url(#${m})"`)(_blob(col)) : '';
  const st = i => `stroke="${col}" stroke-width="${_f(w * (d.length > 2 ? _WK[i % 4] : 1))}" stroke-linecap="round" fill="none" opacity="${_f(op)}"${mk}`;
  return `<g${blend ? ` style="mix-blend-mode:${blend}"` : ''}${filter ? ` filter="url(#${filter})"` : ''}>${filter ? pad : ''}` +
    d.map((p, i) => p ? `<path d="${p}" ${st(i)}/>` : '').join('') + '</g>';
}
const _shift = (P, dx, dy) => P.map(([x, y]) => [x + dx, y + dy]);

// A big area is coloured the way a doodler does it: along its top edge, trailing off into bare page below. Returns
// fade(point) = how likely a stroke there is drawn: k within d0 of the shape's top edge, 0 beyond d1.
function _topFade(P, s, d0, d1, k = 1, lead = 0, avoid = null) {
  const [x0, , x1] = _bounds(P), n = Math.max(2, Math.ceil((x1 - x0) / 16)), top = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) top[i] = _topAt(P, lerp(x0, x1, i / n));
  return ([x, y]) => {
    const u = clamp((x - x0) / (x1 - x0)) * n, i = Math.min(n - 1, Math.floor(u)), t = lerp(top[i], top[i + 1], u - i);
    if (!isFinite(t)) return 0;
    const wav = (d1 - d0) * .45 * _n1(s + 333, x / 230);   // the colouring stops at an uneven line
    return k * (1 - ease((y - t - d0 - wav) / (d1 - d0))) * (lead ? ease((y - t - lead + 16 * _n1(s + 444, x / 170)) / 40) : 1) * (avoid ? avoid(x, y) : 1);
  };
}
// the highest point of polygon P above x (Infinity where P doesn't reach)
function _topAt(P, x) {
  let t = Infinity;
  for (let j = 0, m = P.length; j < m; j++) { const a = P[j], b = P[(j + 1) % m]; if ((a[0] > x) !== (b[0] > x)) t = Math.min(t, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])); }
  return t;
}
const _paperGap = (P, m) => `<path d="${_d(m > 30 ? _offset(P, clamp(m * .03, 1, 4)) : P, true)}" fill="${PAL.paper}"/>`;

// ---------- marker ----------
// A thing coloured in with a marker, almost to its line: a paper gap round it where it covers what's behind, strokes
// back and forth across it (darker where they overlap), a bare sliver on the lit edge, and a second layer across the
// first on the side away from LIGHT. A yellow is highlighter: denser, flat, unshaded.
function _marker(P, col, a, solid, s, m, o, pad) {
  const hi = _isHi(col), c = hi ? PAL.hilite : col, mw = hi ? clamp(m * .1, 5, 14) : clamp(m * .075, 4.2, 12);
  const Q = _shift(P, (_h(s, 31) - .5) * 3, (_h(s, 32) - .5) * 3), ang = -.72 + (_h(s, 21) - .5) * .3;   // a little off the line
  const lit = !hi && solid && m > 36 && o.shade !== false, ld = Math.min(5, m * .035);
  let g = solid ? _paperGap(P, m) : '';
  g += _hatchSvg(_hatch(Q, { ang, gap: mw * (hi ? .75 : .86), inset: mw * .3 + 1, s, run: 300, jag: .35, spread: .25, paths: 3, keep: lit ? [_shift(Q, LIGHT[0] * ld, LIGHT[1] * ld)] : [] }), c, mw, a * (hi ? .88 : .82), 'multiply', 'wobF', pad);
  if (!hi && solid && o.shade !== false && m > 14) {
    const r = Math.min(110, m * .32 * (typeof o.shade === 'number' ? o.shade : 1));
    g += _hatchSvg(_hatch(Q, { ang: ang + 1.15, gap: mw * 1.05, inset: mw * .4 + 1, s: s + 50, cut: [_shift(Q, -LIGHT[0] * r, -LIGHT[1] * r)], run: 200, jag: .4 }), c, mw, a * .7, 'multiply', 'wobF', pad);
  }
  return g;
}
// A big area (sky, hills, ground) is scribbled only along its top edge, trailing off into bare page. Where that edge
// is above the frame (a sky) it's a strip along the top of the page; an outlined edge (a hill) gets a band under its
// line; an edge with no line (the ground) only a few strokes.
const BANDS = {
  sky: { ang: -.22, mw: 12, gap: 12.5, run: 180, jag: 1.2, d0: h => clamp(h * .17, 40, 150), d1: h => clamp(h * .47, 120, 420), k: 1, lead: 55 },
  edge: { ang: -.38, mw: 11, gap: 9.5, run: 115, jag: 1.6, d0: h => clamp(h * .15, 25, 55), d1: h => clamp(h * .5, 100, 180), k: 1 },
  bare: { ang: -.12, mw: 11, gap: 15, run: 110, jag: 1.2, d0: () => 0, d1: () => 60, k: .4 },
};
function _bandOf(b, o) {
  const mt = drawingContext.getTransform(), top = (mt.b * (b[0] + b[2]) / 2 + mt.d * b[1] + mt.f) / RS, h = b[3] - b[1];
  const B = BANDS[top < 4 ? 'sky' : o.ink === null ? 'bare' : 'edge'];
  return { ...B, d0: B.d0(h), d1: B.d1(h) };
}
function _band(P, col, a, s, B, avoid, pad) {
  const d = _hatch(P, { ang: B.ang + (_h(s, 21) - .5) * .1, gap: B.gap, inset: B.mw * 1.2, s, run: B.run, jag: B.jag, spread: .9, paths: 3, fade: _topFade(P, s, B.d0, B.d1, B.k, B.lead, avoid) });
  return _hatchSvg(d, col, B.mw, a * .92, 'multiply', 'wobF', pad);
}

// ---------- ballpoint ----------
// A hatched shape (a rock) gets no marker at all but ballpoint cross-hatching inside a paper gap: a sparse layer all
// over, a dense one short of the lit edge, a second across it on the side away from LIGHT, a third in the deepest shadow.
function _ballpoint(P, s, m, h, pad) {
  const c = _bic(tone(h.c || PAL.ink)), a0 = h.a ?? .7, g0 = clamp(m * .036, 3, 6), w = 1.25, r0 = m * .16, r1 = m * .42, r2 = m * .2;
  const o = { inset: 2, run: 70, jag: .9, bowK: 1.3, spread: .5 }, L = (q, op) => _hatchSvg(q, c, w, op, 'multiply', 'wob', pad, true);
  return _paperGap(P, m) +
    L(_hatch(P, { ...o, ang: a0 + .3, gap: g0 * 2.2, s: s + 3 }), .7) +   // only this sparse layer reaches the lit edge
    L(_hatch(P, { ...o, ang: a0, gap: g0, s, keep: [_shift(P, LIGHT[0] * r0, LIGHT[1] * r0)] }), .8) +
    L(_hatch(P, { ...o, ang: a0 - 1.3, gap: g0 * 1.05, s: s + 1, cut: [_shift(P, -LIGHT[0] * r1, -LIGHT[1] * r1)] }), .8) +
    L(_hatch(P, { ...o, ang: a0 + .6, gap: g0 * .8, s: s + 2, cut: [_shift(P, -LIGHT[0] * r2, -LIGHT[1] * r2)] }), .85);
}
// A dark tone or a cast shadow: dense ballpoint scribble, a second layer across it where it's darker; with `rim`, a
// thin ballpoint line round it too.
function _penFill(P, col, a, s, pad, fade, rim) {
  const c = _bic(col), gp = lerp(4.2, 2.2, a), ang = -.06 + (_h(s, 41) - .5) * .1, o = { inset: 1.5, run: 90, jag: .7, bowK: .4, spread: .4, fade };
  let g = _hatchSvg(_hatch(P, { ...o, ang, gap: gp, s: s + 70 }), c, 1.3, .85, 'multiply', 'wob', pad, true);
  if (a > .25) g += _hatchSvg(_hatch(P, { ...o, ang: ang + .5, gap: gp * 1.25, s: s + 71 }), c, 1.2, .75, 'multiply', 'wob', pad, true);
  if (rim) g += _lineSvg(P, true, .9, c, 'HB', s + 72);
  return g;
}
// A tone over a shape, by what it's for (from the colour as given): a dark is ballpoint, a light is white gel pen
// (a marker can't lighten), anything else another layer of marker across the first.
function _fill(P, o, s, m, back, pad, B, hiWash, avoid, washCol) {
  const col = tone(o.fill), l0 = hexHsl(o.fill)[2], k = l0 < .3 ? 'pen' : l0 > .72 ? 'gel' : 'mk', a = clamp((o.fillOp ?? 170) / 255);
  if (k === 'pen') return _penFill(P, col, a, s, pad, back ? _topFade(P, s + 7, 20, 160) : null, !o.wash && o.ink === null && !back);
  if (k === 'gel') {   // not on a highlighter, nor anything big: there it would only grey the colour
    if (hiWash || back || m >= 120) return '';
    const w = clamp(m * .06, 2.4, 6), d = _hatch(P, { ang: -.78, gap: w * 2.6, inset: w * 1.6, s: s + 80, run: 90, jag: .6 });
    return _hatchSvg(d, PAL.cream, w, Math.min(.55, a * 1.1), null, null);
  }
  if (back) {   // a big area: a second layer of its marker close under its top edge, darker where they cross
    const d0 = B ? B.d0 : 30, d1 = B ? B.d1 : 160;
    const d = _hatch(P, { ang: -.7, gap: 17, inset: 14, s: s + 90, run: 110, jag: .8, spread: .6, paths: 2, fade: _topFade(P, s + 9, d0 * .3, d1 * .5, .8, 0, avoid) });
    return _hatchSvg(d, washCol || col, 11, Math.min(.6, a * .9), 'multiply', 'wobF', pad);
  }
  const fw = clamp(m * .075, 4.2, 12), d = _hatch(P, { ang: .23 + (_h(s, 21) - .5) * .3, gap: fw * 1.1, inset: fw * .6 + 2, s: s + 90, run: 240, jag: .4 });
  return _hatchSvg(d, _isHi(col) ? PAL.hilite : col, fw, Math.min(.85, a * 1.15), 'multiply', 'wobF', pad);
}

// ---------- clouds ----------
// A big pale haze with no line of its own is a cloud: a row of humps along its top, each its own stroke (some curl
// under at the end), and a long flat line underneath; paper inside, so the sky's scribble stops at it.
function _cloud(P, s, b) {
  const [x0, y0, x1, y1] = b, h = y1 - y0, yb = y0 + h * .56, n = Math.max(1, Math.round((x1 - x0) / (h * 4.2))), sw = (x1 - x0) / n;
  const knock = [], lines = [];
  for (let ci = 0; ci < n; ci++) {   // a long haze is a row of clouds, none much more than four times as wide as tall
    const sa = x0 + sw * (ci + .06 + .05 * _h(s, ci)), sb = x0 + sw * (ci + .94 - .05 * _h(s, ci + 9)), cs = s + ci * 71;
    // the cloud's top follows the haze's own top edge, sinking to the flat bottom at both ends
    const base = x => { const t = Math.min(yb, _topAt(P, x)), e = Math.sin(Math.PI * clamp((x - sa) / (sb - sa))) ** .5; return lerp(yb, isFinite(t) ? lerp(t, yb, .35) : yb, e); };
    const cw = clamp(h * .5, 40, 150), edge = [], hs = [];
    let prev = null;
    for (let xa = sa, k = 0; xa < sb - 4; k++) {
      const env = Math.sin(Math.PI * clamp((xa - sa) / (sb - sa) + .1));   // the biggest humps in the middle
      let xb = Math.min(sb, xa + cw * (.45 + .55 * env + .4 * _h(cs, k)));
      if (sb - xb < cw * .2) xb = sb;
      // each hump starts on the flank of the last, so their strokes cross
      const A = prev ? prev[9] : [xa, base(xa)], Z = [xb, base(xb)], dx = Z[0] - A[0], dy = Z[1] - A[1], L = Math.hypot(dx, dy), tx = dx / L, ty = dy / L, H = [];
      let nx = ty, ny = -tx; if (ny > 0) { nx = -nx; ny = -ny; }
      const bul = L * (.3 + .16 * _h(cs, k + 50)) * (.8 + .4 * env);
      for (let j = 0; j <= 12; j++) { const u = j / 12, e = Math.sin(Math.PI * u) ** .7 * bul; H.push([A[0] + dx * u + nx * e, A[1] + dy * u + ny * e]); }
      edge.push(...H); prev = H; hs.push({ H, Z, nx, ny, tx, ty, L }); xa = xb;
    }
    // a hump's stroke stops just past where the next one starts (the rest would be inside it); the last one comes
    // down to the bottom and may curl under, like a quick hand going round
    hs.forEach(({ H, Z, nx, ny, tx, ty, L }, i) => {
      if (i < hs.length - 1) return lines.push(H.slice(0, 11));
      const Q = H.slice(), r = L * .09;
      if (_h(cs, 90) > .4) Q.push([Z[0] - nx * r * .9 + tx * r * .3, Z[1] - ny * r * .9 + ty * r * .3], [Z[0] - nx * r * 1.5 - tx * r * .5, Z[1] - ny * r * 1.5 - ty * r * .5], [Z[0] - nx * r * 1.1 - tx * r * 1.3, Z[1] - ny * r * 1.1 - ty * r * 1.3]);
      lines.push(Q);
    });
    const bot = [], xe = sa - sw * .04;
    for (let x = sb + sw * .04; x > xe; x -= 40) bot.push([x, yb + 3 * _n1(cs + 5, x / 130)]);
    bot.push([xe, yb + 3 * _n1(cs + 5, xe / 130)]);
    knock.push(`<path d="${_d([...edge, ...bot], true)}" fill="${PAL.paper}"/>`); lines.push(bot);
  }
  return knock.join('') + _linesSvg(lines, false, 1.1, PAL.ink, 'ink', s + 5);
}

// ---------- paint ----------
// One call = one shape. wash: coloured in (see _marker; a big area, see _band; a dark, filled solid with the pen; a near
// white, bare paper). fill: a tone over it (see _fill). hatch: ballpoint lines; with a wash, the whole shape is
// ballpoint cross-hatched instead (see _ballpoint). ink: the double fineliner outline.
function paint(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const s = random() * 1000;
  const P = o.curv ? _smooth(pts, o.curv) : pts, closed = P.length > 2;
  const b = _bounds(P), m = Math.min(b[2] - b[0], b[3] - b[1]), M = Math.max(b[2] - b[0], b[3] - b[1]);
  const back = M > Math.max(W, H) * .6, pad = _pad(b, 16);   // back: a backdrop (sky, ground, a wall)
  if (closed && !o.wash && o.ink === null && o.fill && M > 240 && hexHsl(o.fill)[2] > .84) return _emit(_cloud(P, s, b));
  const B = back ? _bandOf(b, o) : null, mt = drawingContext.getTransform();
  // a backdrop is built when the frame is rendered, so its scribble can leave room round the lights drawn after it
  const build = () => {
    const avoid = back && _GLOWS.length ? _avoidGlows(mt) : null;
    let g = '', hiWash = false;
    if (closed && o.wash && o.hatch) g += _ballpoint(P, s, m, o.hatch, pad);
    else if (closed && o.wash) {
      const col = tone(o.wash), k = _kind(col), a = (o.washOp ?? 255) / 255, solid = a > .85;
      hiWash = _isHi(col);
      if (k === 'pen') g += `<path d="${_d(P, true)}" fill="${col}" opacity="${_f(a)}" filter="url(#wob)"/>`;
      else if (k === 'gel') g += `<path d="${_d(P, true)}" fill="${solid ? PAL.paper : col}" opacity="${_f(solid ? 1 : a)}"/>`;
      else if (back) g += (solid ? `<path d="${_d(P, true)}" fill="${PAL.paper}"/>` : '') + _band(P, col, a, s, B, avoid, pad);
      else g += _marker(P, col, a, solid, s, m, o, pad);
    }
    if (o.fill && closed) g += _fill(P, o, s, m, back, pad, B, hiWash, avoid, o.wash && tone(o.wash));
    if (o.hatch && closed && !o.wash) {
      const h = o.hatch, rand = (h.o && h.o.rand) || 0, c = tone(h.c || PAL.ink), br = h.b || 'HB';
      const bic = (BRUSHES[br] || BRUSHES.HB)[2] !== 'mk', w = (h.w || 1) * (bic ? 1.4 : 4);
      const d = _hatch(P, { ang: h.a || 0, gap: h.d || 12, inset: 3, s: s + 60, run: 160, jag: .3 + rand, bowK: .6 });
      g += _hatchSvg(d, bic ? _bic(c) : c, w, .85, 'multiply', 'wob', pad, bic);
    }
    if (o.ink !== null) g += _lineSvg(P, closed, o.sw ?? 1, tone(o.ink || PAL.ink), o.br || 'ink', s + 3);
    return g;
  };
  _emit(back ? build : build());
}
// The lights drawn this frame, in screen units (glow() adds them), and how likely a backdrop's stroke is drawn at a
// point of its own space (transform mt): not near a light, where the page is left white.
let _GLOWS = [];
function _avoidGlows(mt) {
  return (x, y) => {
    const sx = (mt.a * x + mt.c * y + mt.e) / RS, sy = (mt.b * x + mt.d * y + mt.f) / RS;
    let v = 1; for (const g of _GLOWS) v *= ease((Math.hypot(sx - g.x, sy - g.y) / g.r - .42) / .3);
    return v;
  };
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  if (!pts || pts.length < 2) return;
  const s = random() * 1000;
  _emit(_lineSvg(pts.length > 2 ? _smooth(pts, curv, false) : pts, false, sw, tone(col), br, s));
}

// ---------- light ----------
// glow() is light the way a doodle shows it: the page left white round the source (the sky scribbled round it), thick
// highlighter rays radiating from it (each gone over twice), and a few short pen dashes between them.
function glow(x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 8) return;
  const s = random() * 1000, c0 = tone(col), c = _isHi(c0) || _kind(c0) !== 'mk' ? PAL.hilite : c0;
  const n = Math.round(clamp(r / 22, 8, 14)), w = clamp(r * .036, 3, 10.5), dash = [];
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = (i + _h(s, i) * .35) / n * TAU + s, r0 = r * (.33 + .03 * _h(s, i + 20)), r1 = r * (i % 2 ? .52 : .64) * (.9 + .2 * _h(s, i + 40));
    for (let j = 0; j < 2; j++) {
      const o = (j - .5) * w * .45, t2 = t + j * .02, q0 = r0 + j * w * .8, q1 = r1 - j * w, px = -Math.sin(t2) * o, py = Math.cos(t2) * o;
      d += `M${_f(x + Math.cos(t2) * q0 + px)} ${_f(y + Math.sin(t2) * q0 + py)}L${_f(x + Math.cos(t2) * q1 + px)} ${_f(y + Math.sin(t2) * q1 + py)}`;
    }
    if (_h(s, i + 70) > .6) { const tt = t + Math.PI / n, a0 = r * .47, a1 = a0 + r * (.06 + .04 * _h(s, i + 80)); dash.push([[x + Math.cos(tt) * a0, y + Math.sin(tt) * a0], [x + Math.cos(tt) * a1, y + Math.sin(tt) * a1]]); }
  }
  const mt = drawingContext.getTransform();
  if (a > .3) _GLOWS.push({ x: (mt.a * x + mt.c * y + mt.e) / RS, y: (mt.b * x + mt.d * y + mt.f) / RS, r: r * Math.hypot(mt.a, mt.b) / RS });
  _emit(`<g opacity="${_f(clamp(a))}">` +
    `<g style="mix-blend-mode:multiply" filter="url(#wobF)">${_pad([x - r, y - r, x + r, y + r], 10)}<path d="${d}" stroke="${c}" stroke-width="${_f(w)}" stroke-linecap="round" fill="none" opacity=".85"/></g>` +
    (dash.length ? _linesSvg(dash, false, .9, PAL.ink, 'ink', s + 9, false) : '') + '</g>');
}

// ---------- the doodler's marks ----------
// Round a Character in the air: little dashes by its top corners and drop lines under its feet, drawn in its own body
// space through the o.draw hook (body-local units as in examples/clawd: x -5..5, body -8..-2, feet at 0).
function _emanata(u, sw, air) {
  const L = [];
  [[-6.3, -7.6, -.72, -.7, 3], [6.5, -5.4, .95, -.32, 2], [-6.2, -2.4, -.88, .45, 2]].forEach(([gx, gy, dx, dy, n], gi) => {
    for (let j = 0; j < n; j++) {
      const o = (j - (n - 1) / 2) * .6, l = (.8 + .4 * hash(gi * 7.3 + j)) * u, x = (gx - dy * o) * u, y = (gy + dx * o) * u, t = (j - (n - 1) / 2) * .15;
      const ex = dx * Math.cos(t) - dy * Math.sin(t), ey = dx * Math.sin(t) + dy * Math.cos(t);
      L.push([[x, y], [x + ex * l, y + ey * l]]);
    }
  });
  if (air > 1.6) for (const sx of [-3.3, 3.3]) for (const k of [-.3, .3]) L.push([[(sx + k) * u, (.7 + .2 * hash(sx + k)) * u], [(sx + k * 1.15) * u, (2 + .3 * hash(sx * k)) * u]]);
  _emit(_linesSvg(L, false, clamp(sw * 1.2, .8, 2.4), PAL.ink, 'ink', 4242, false));
}
// Round a Sound Word: burst marks and two little stars. letterFont() is called while drawLetters places each word on
// the letters' canvas, so it notes where the word went (that canvas's transform) and flush() draws these there.
let _LET = [];
const _MC = { c: null };
function _soundMarks() {
  for (const { L, m, a } of _LET) {
    if (!_MC.c) _MC.c = _canvas(8, 8).getContext('2d');
    const c = _MC.c; c.font = L.font || STYLE.letterFont(L.size, false);
    const z = L.size, rx = c.measureText(L.txt).width / 2 + z * .34, ry = z * .82, s = hash(L.txt.length * 7.1 + z) * 1000, T = [];
    [1.07, 1.24, 1.45, 1.66, 1.86, .04, .22, .46, .68, .9].forEach((q, i) => {
      const ex = Math.cos(q * Math.PI), ey = Math.sin(q * Math.PI), d = Math.hypot(ex * ry, ey * rx), nx = ex * ry / d, ny = ey * rx / d;
      const n = _h(s, i) > .55 ? 2 : 1, l = z * (.16 + .1 * _h(s, i + 10));
      for (let j = 0; j < n; j++) { const o = (j - (n - 1) / 2) * z * .07, x = ex * rx - ny * o, y = ey * ry + nx * o; T.push([[x, y], [x + nx * l, y + ny * l]]); }
    });
    const st = [[1.78, 1.3, .15], [.82, 1.2, .12]].map(([q, k, r]) => starPts(Math.cos(q * Math.PI) * rx * k, Math.sin(q * Math.PI) * ry * k, z * r, .45, 5));
    _S.push(`<g transform="matrix(${_fm(m.a)},${_fm(m.b)},${_fm(m.c)},${_fm(m.d)},${_f(m.e)},${_f(m.f)})" opacity="${_f(a)}">` +
      _linesSvg(T, false, 1.9, PAL.ink, 'ink', s, false) + _linesSvg(st, true, 1.05, PAL.ink, 'ink', s + 1) + '</g>');
  }
  _LET = [];
}

// A fading word is drawn again at full strength, one word at a time, and faded as a whole in the scene: drawn faded,
// its colour would mix with the pen copy under it (drawLetters puts the ink offset first) and go muddy. This mirrors
// drawLetters in engine/frame.js.
const _WC = { cv: null };
function _redrawWord({ L, m }) {
  if (!_WC.cv) _WC.cv = _canvas(W * RS, H * RS);
  const c = _WC.cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, _WC.cv.width, _WC.cv.height); c.setTransform(m);
  c.font = L.font || STYLE.letterFont(L.size, false); c.textAlign = L.align || 'center'; c.textBaseline = 'middle';
  if (L.stroke) { c.lineJoin = 'round'; c.lineWidth = L.size * .12; c.strokeStyle = L.stroke; c.strokeText(L.txt, 0, 0); }
  if (L.ink !== false) { c.fillStyle = PAL.ink; c.fillText(L.txt, L.size * .045, L.size * .055); }
  c.fillStyle = L.color; c.fillText(L.txt, 0, 0);
  return _WC.cv;
}

// ---------- paper ----------
function _makeGrain() {
  const cv = _canvas(W * RS, H * RS), c = cv.getContext('2d'), rnd = _lcg(9), d = c.createImageData(cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) { const v = 255 - (rnd() < .35 ? rnd() * 11 : 0); d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255; }
  c.putImageData(d, 0, 0);
  // the page's soft light falloff
  const g = c.createRadialGradient(cv.width * .4, cv.height * .35, cv.height * .3, cv.width * .5, cv.height * .5, cv.width * .75);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(206,204,201,.42)'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

// ---------- the Style Profile's hooks ----------
let _grainC = null;
const KFONT = '"Patrick Hand", "LXGW WenKai TC", cursive', KINK = '#231B62';
const STYLE = {
  fonts: ['Luckiest Guy', 'Patrick Hand', 'LXGW WenKai TC'],
  async setup() { _DEFS = _defs(); _grainC = _makeGrain(); },
  underlay() { _svgBegin(); _LET = []; _GLOWS = []; _S.push(`<rect width="${W * RS}" height="${H * RS}" fill="${PAL.paper}"/>`); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(_grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush(img) {
    if (!_LET.length) _svgLetters(img);
    else for (const e of _LET) _svgLetters(_redrawWord(e), e.m, e.a);
    _soundMarks(); return true;
  },
  post: _svgRender,
  // flip-book doodles: a touch more squash than acted, and motion marks round a Character in the air
  pose(o) {
    const q = { ...o, sq: (o.sq || 0) * 1.15 }, air = -(o.dy || 0);
    if (air > .9) { const d0 = o.draw; q.draw = (u, sw) => { if (d0) d0(u, sw); _emanata(u, sw, air); }; }
    return q;
  },
  letterFont(size, note = true) {
    if (note && letG) {
      const c = letG.drawingContext, L = LETTERS.find(l => l.size === size && !_LET.some(e => e.L === l));
      if (L) _LET.push({ L, m: c.getTransform(), a: c.globalAlpha });
    }
    return `${size}px "Luckiest Guy", "LXGW WenKai TC", cursive`;
  },
  karaoke: {
    size: 66,
    font: s => `${s}px ${KFONT}`,
    // a strip of polka-dot washi tape stuck across the page, torn at both ends; a highlighter runs along the words as
    // they're sung
    band(K) {
      karaokeLayout(outX, K, this.font, this.size);
      const { y, h, tw } = K.box, g = easeOut(K.grow), sz = this.size;
      const x0 = W / 2 - tw / 2 - 84, full = tw + 168, x1 = x0 + full * g, y0 = y - 4, y1 = y + h + 4, rot = -.006;
      const P = [], teeth = 9;
      for (let i = 0; i <= 10; i++) P.push([lerp(x0, x1, i / 10), y0 + Math.sin(i * 1.7) * 1.2]);
      for (let i = 1; i < teeth * 2; i++) P.push([x1 + (i % 2 ? 6 : -3) + hash(i * 3.1) * 5, lerp(y0, y1, i / (teeth * 2))]);
      for (let i = 10; i >= 0; i--) P.push([lerp(x0, x1, i / 10), y1 + Math.sin(i * 2.3) * 1.2]);
      for (let i = teeth * 2 - 1; i > 0; i--) P.push([x0 - (i % 2 ? 6 : -3) - hash(i * 5.3) * 5, lerp(y0, y1, i / (teeth * 2))]);
      const cx = W / 2, cy = (y0 + y1) / 2, T2 = P.map(([px, py]) => [cx + (px - cx) * Math.cos(rot) - (py - cy) * Math.sin(rot), cy + (px - cx) * Math.sin(rot) + (py - cy) * Math.cos(rot)]);
      const dT = _d(T2, true);
      let svg = `<path d="${dT}" fill="#EBDDCE" opacity=".9"/>` +
        `<g style="mix-blend-mode:multiply"><path d="${dT}" fill="url(#dots)" opacity=".85"/>` +
        `<path d="${dT}" fill="none" stroke="#D3BFAC" stroke-width="1.3" opacity=".6"/></g>`;
      // the highlighter over what's been sung
      if (K.grow > .85) {
        const c = outX; c.font = this.font(sz);
        let hl = '';
        for (const r of K.rows) {
          const str = K.text.slice(r.from, r.to), w = c.measureText(str).width, x = W / 2 - w / 2, n = clamp(K.sung - r.from, 0, str.length);
          if (n <= 0) continue;
          const i = Math.floor(n), sw = lerp(c.measureText(str.slice(0, i)).width, c.measureText(str.slice(0, Math.min(str.length, i + 1))).width, n - i);
          const ya = r.y - sz * .28, yb = r.y + sz * .3, xa = x - 10, xb = x + sw + 6;
          hl += `M${_f(xa + 5)} ${_f(ya)}L${_f(xb + 5)} ${_f(ya + 1.5)}L${_f(xb - 3)} ${_f(yb)}L${_f(xa - 3)} ${_f(yb - 1)}Z`;
        }
        if (hl) svg += `<g style="mix-blend-mode:multiply" filter="url(#wobF)"><path d="${hl}" fill="${PAL.hilite}" opacity=".85"/></g>`;
      }
      _emit(svg);
    },
    // handwritten in ballpoint, the whole line at once (the highlighter shows how far it's got)
    text(c, K) {
      const sz = this.size; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = KINK;
      const hand = (str, x0, y, k) => {
        for (let i = 0; i < str.length; i++) {
          const x = x0 + c.measureText(str.slice(0, i)).width, j = hash(i * 7.3 + k);
          c.save(); c.translate(x, y + (j - .5) * sz * .06); c.rotate((hash(i * 3.9 + k) - .5) * .07); c.fillText(str[i], 0, 0); c.restore();
        }
      };
      if (K.sub) { c.font = this.font(K.subSize); hand(K.sub, W / 2 - c.measureText(K.sub).width / 2, K.subY, 5); }
      c.font = this.font(sz);
      for (const r of K.rows || []) { const s = K.text.slice(r.from, r.to); hand(s, W / 2 - c.measureText(s).width / 2, r.y, r.from); }
    },
  },
};
