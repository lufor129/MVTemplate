// paint.js: the watercolour Style Profile's drawing primitives, on p5.brush: toned washes, bleeding watercolour fills,
// boiling ink outlines, additive light, and the paper everything sits in. See STYLE.md for the rules of the look.

// ---------- paint ----------
// One call = one painted shape: optional flat wash, optional watercolour fill, optional hatch, optional ink outline.
// p5.brush loses strokes drawn far from the origin under a zoomed camera (from zoom ~2, an outline or a line leaves
// only a dot at its first vertex), so every shape and line is drawn around its own centre.
function centred(pts, draw) {
  if (!pts.length) return;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  push(); translate(cx, cy); draw(pts.map(([x, y]) => [x - cx, y - cy])); pop();
}
// Watercolour is light and soft: every colour that reaches paint() is lifted toward the paper and calmed a little,
// Characters' own included; the darks stay dark. Lines are a warm sepia ink, not black.
const _toned = new Map(), SEPIA = '#7A5240', LINE_W = .8;
function tone(c) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let v = _toned.get(c);
  if (!v) { const [h, s, l] = hexHsl(c), k = clamp((l - .15) / .25); v = hslHex(h, s * lerp(1, .8, k), l + (1 - l) * .16 * k); _toned.set(c, v); }
  return v;
}
const _lined = new Map();
// dark lines go sepia; a coloured stroke (a trim, a highlight) keeps its colour, toned like a wash
function lineCol(c) { let v = _lined.get(c); if (!v) { v = hexHsl(c)[2] < .35 ? mixCol(c, SEPIA, .6) : tone(c); _lined.set(c, v); } return v; }

// Smooth a closed point list through its points (Catmull-Rom), k = 0 (as given) .. 1 (fully smooth). p5.brush's own
// curved shapes (beginShape(curvature)) sometimes leave the wash out and keep only the outline, so curves are smoothed
// here and painted as a plain polygon, which always fills.
function smoothPts(P, k, n = 5) {
  if (!k || P.length < 3) return P;
  const N = P.length, at = i => P[(i + N) % N], out = [];
  for (let i = 0; i < N; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < n; s++) {
      const u = s / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(d => lerp(lerp(p1[d], p2[d], u), .5 * (2 * p1[d] + (p2[d] - p0[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * u3), k)));
    }
  }
  return out;
}
function paint(pts, o = {}) { centred(pts, (P) => paintAt(o.curv ? smoothPts(P, o.curv) : P, o)); }
function paintAt(pts, o) {
  if (o.wash || o.fill || o.hatch) {
    if (o.wash) brush.wash(tone(o.wash), o.washOp ?? 255); else brush.noWash();
    if (o.fill) { brush.fill(tone(o.fill), o.fillOp ?? 170); brush.fillBleed(o.bleed ?? .1); brush.fillTexture(o.tex ?? .4, o.border ?? .35); } else brush.noFill();
    if (o.hatch) { brush.hatch(o.hatch.d, o.hatch.a, o.hatch.o || { rand: .15 }); brush.hatchStyle(o.hatch.b || 'HB', lineCol(o.hatch.c || PAL.ink), o.hatch.w || 1); } else brush.noHatch();
    brush.noStroke();
    brush.polygon(pts);
  }
  if (o.ink !== null) lostEdges(pts, 0, (o.sw ?? 1) * LINE_W, lineCol(o.ink || PAL.ink), o.br || 'ink');
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, (P) => { brush.noFill(); brush.noWash(); brush.noHatch(); brush.set(br, lineCol(col), sw * LINE_W); brush.spline(P, curv); });
}
// A watercolourist's outline is lost where the light hits: the edge facing LIGHT (frame.js) is left unlined and the
// shape reads by its wash alone there; the rest is one tapered stroke per run, not a stroke per side. Small shapes
// (eyes, buttons) keep their whole line.
function lostEdges(pts, curv, sw, col, br) {
  brush.noWash(); brush.noFill(); brush.noHatch(); brush.set(br, col, sw);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, A = 0;
  for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i], q = pts[(i + 1) % pts.length]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); A += x * q[1] - q[0] * y; }
  if (Math.min(x1 - x0, y1 - y0) < 30 || pts.length < 4) { brush.beginShape(curv); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true); return; }
  // resample, then keep the points whose outward normal doesn't face the light
  const S = [], n0 = pts.length, step = Math.max(6, Math.hypot(x1 - x0, y1 - y0) / 40), sg = A > 0 ? 1 : -1;
  for (let i = 0; i < n0; i++) { const a = pts[i], b = pts[(i + 1) % n0], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let j = 0; j < k; j++) S.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]); }
  const n = S.length, lit = S.map((p, i) => { const a = S[(i - 1 + n) % n], b = S[(i + 1) % n], nx = sg * (b[1] - a[1]), ny = -sg * (b[0] - a[0]), d = Math.hypot(nx, ny) || 1; return -(nx * LIGHT[0] + ny * LIGHT[1]) / d > .45; });
  if (!lit.some(v => v)) { brush.beginShape(curv); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true); return; }
  if (lit.every(v => v)) return;
  const s0 = lit.findIndex(v => v);   // walk round once from a lit point, so every run starts and ends at a gap
  let run = [];
  const end = () => { if (run.length > Math.max(2, n * .08)) brush.spline(run, .5); run = []; };   // a scrap of line left between two gaps reads as a smudge: leave it out
  for (let k = 1; k <= n; k++) { const i = (s0 + k) % n; if (lit[i]) end(); else run.push(S[i]); }
  end();
}

// Light: glow(x, y, r, col, a) ADDS a soft halo of light for anything that shines (stars, lamps, fireflies, magic).
// p5.brush mixes every colour like pigment, so yellow painted over blue turns green and light can't be painted; this
// is the one non-paint mark in the style. It lands on what's painted so far, under anything painted after it, follows
// the camera, and boils a little. Keep a = 1 on dark grounds; on light grounds it barely shows (as light would).
let glowTex = null;
function glow(x, y, r, col = '#FFC766', a = 1) {
  if (a <= 0 || r < 1) return;
  flushBrush();
  const c = color(col), rr = r * (1 + jit(.03));
  push(); blendMode(ADD); tint(red(c), green(c), blue(c), 150 * clamp(a)); image(glowTex, x - rr, y - rr, 2 * rr, 2 * rr); noTint(); blendMode(BLEND); pop();
}
function makeGlowTex() {
  const g = createGraphics(256, 256); g.pixelDensity(1); const c = g.drawingContext, gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  [[0, 1], [.18, .8], [.45, .32], [.75, .08], [1, 0]].forEach(([s, a]) => gr.addColorStop(s, `rgba(255,255,255,${a})`));
  c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  return g;
}

// p5.brush defers washes and strokes into a mask layer; a (tiny, off-screen) watercolour fill forces it to composite
// now, so everything painted before this call really lands under whatever p5 draws next (letters, glow).
function flushBrush() {
  push(); resetMatrix(); translate(-W * RS / 2, -H * RS / 2);
  brush.noStroke(); brush.noHatch(); brush.noWash(); brush.fill('#000000', 1); brush.fillBleed(0); brush.fillTexture(0, 0);
  brush.polygon([[-50, -50], [-40, -50], [-40, -40]]); brush.noFill(); pop();
}

// ---------- paper ----------
function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function makePaper() {
  const g = createGraphics(W, H); g.pixelDensity(1); const c = g.drawingContext, rnd = lcg(11), A = W * H / (1920 * 1080);
  c.fillStyle = PAL.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70 * A; i++) { const x = rnd() * W, y = rnd() * H, r = 120 + rnd() * 380, gr = c.createRadialGradient(x, y, 0, x, y, r), a = .045 * rnd(); gr.addColorStop(0, `rgba(160,125,80,${a})`); gr.addColorStop(1, 'rgba(160,125,80,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  c.lineWidth = 1;
  for (let i = 0; i < 1400 * A; i++) { const x = rnd() * W, y = rnd() * H, l = 6 + rnd() * 26, a = rnd() * TAU; c.strokeStyle = `rgba(110,88,60,${.035 + rnd() * .06})`; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  return g;
}
// Static grain + vignette, multiplied over the painted frame so pigment sits "in" the paper.
function makeGrain() {
  const cv = document.createElement('canvas'); cv.width = W * RS; cv.height = H * RS; const c = cv.getContext('2d'), rnd = lcg(5), w = cv.width, h = cv.height;
  const id = c.createImageData(w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 255 - (rnd() < .55 ? rnd() * rnd() * 34 : 0); d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 3; d[i + 3] = 255; }
  c.putImageData(id, 0, 0);
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.max(w, h) * .6); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,95,70,.35)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  return cv;
}

// ---------- pigment ----------
// The pass over the whole painted frame (STYLE.post) that makes flat washes read as watercolour: pigment pools at the
// edges where one colour meets another, settles unevenly in big soft blotches and fine paper granulation, and every
// edge drifts a pixel or two with the boil. Darkening follows pigment, C' = C − (C − C²)(d − 1), so the paper and the
// darkest ink are left alone and the mid-tones carry the texture.
const PIGMENT_FS = `precision highp float;
uniform sampler2D tex0; uniform vec2 texelSize; uniform float seed; uniform float rs;
varying vec2 vTexCoord;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= .5; } return s; }
void main() {
  vec2 fp = vTexCoord / texelSize / rs;
  vec2 wob = (vec2(n(fp * .03 + seed * 3.1), n(fp * .03 + 41. + seed * 2.3)) - .5) * 3.2 * rs;
  vec2 uv = vTexCoord + wob * texelSize;
  vec3 c = texture2D(tex0, uv).rgb, b = vec3(0.);
  for (int i = 0; i < 8; i++) { float a = float(i) * .785; b += texture2D(tex0, uv + vec2(cos(a), sin(a)) * 3.5 * rs * texelSize).rgb; }
  b /= 8.;
  float edge = clamp(length(c - b) * 3., 0., 1.);
  float d = 1. + (fbm(fp * .005) - .5) * .55 + (n(fp * .7) - .5) * .22 + edge * .45;
  gl_FragColor = vec4(clamp(c - (c - c * c) * (d - 1.), 0., 1.), 1.);
}`;
let pigmentSh = null;

// ---------- the Style Profile's hooks ----------
let paperG = null, grainC = null;
const KARAOKE_FONT = '"LXGW WenKai TC", "Klee One", serif';
const STYLE = {
  fonts: ['Permanent Marker', 'LXGW WenKai TC', 'Klee One'],
  post() { flushBrush(); pigmentSh.setUniform('seed', BOILN % 61); pigmentSh.setUniform('rs', RS); filter(pigmentSh); },
  async setup() {
    pigmentSh = createFilterShader(PIGMENT_FS);
    brush.scaleBrushes(5);
    brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], rotate: 'natural', noise: .15 });
    brush.add('inkfine', { type: 'default', weight: 2.6, scatter: .15, sharpness: .85, grain: 40, opacity: 230, spacing: .2, pressure: [1.1, .8], rotate: 'natural', noise: .1 });
    brush.add('dry', { type: 'default', weight: 14, scatter: 3, sharpness: .3, grain: 6, opacity: 90, spacing: .6, pressure: [1, .6], rotate: 'natural', noise: .4 });
    paperG = makePaper(); grainC = makeGrain(); glowTex = makeGlowTex();
  },
  // p5.brush loses the wash pending when a frame's first stroke is drawn, so every frame starts with a stroke of its
  // own, off-canvas, and lands it
  underlay() { image(paperG, 0, 0, W, H); brush.noWash(); brush.noFill(); brush.noHatch(); brush.set('inkfine', PAL.ink, .1); brush.line(-80, -80, -60, -60); flushBrush(); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush: flushBrush,
  letterFont: size => `${size}px "Permanent Marker", "LXGW WenKai TC", "Klee One", cursive`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // a pale wash laid behind the line, ragged at the ends, growing in from the centre
    band(K) {
      const c = outX, { y: y0, h: hh, tw } = karaokeLayout(c, K, s => `700 ${s}px ${KARAOKE_FONT}`, this.size);
      const w = (tw + 120) * K.grow, x0 = W / 2 - w / 2;
      boilSeed('karaoke');
      const pts = [[x0 + jit(8), y0 + 6 + jit(4)], [x0 + w / 2, y0 + jit(4)], [x0 + w + jit(8), y0 + 6 + jit(4)], [x0 + w + 18 + jit(8), y0 + hh / 2], [x0 + w + jit(8), y0 + hh - 6 + jit(4)], [x0 + w / 2, y0 + hh + jit(4)], [x0 + jit(8), y0 + hh - 6 + jit(4)], [x0 - 18 + jit(8), y0 + hh / 2]];
      paint(pts, { wash: PAL.cream, washOp: 230, fill: PAL.sky, fillOp: 50, bleed: .08, tex: .6, border: .7, ink: null, curv: .5 });
    },
    // the translation in a paler sepia; the sung line in sepia letters, turning rose as they are sung
    text(c, K) {
      const sz = this.size; c.textBaseline = 'middle'; c.textAlign = 'left';
      if (K.sub) {
        c.font = `700 ${K.subSize}px ${KARAOKE_FONT}`; c.fillStyle = mixCol(lineCol(PAL.ink), PAL.cream, .3);
        c.fillText(K.sub, W / 2 - c.measureText(K.sub).width / 2, K.subY);
      }
      c.font = `700 ${sz}px ${KARAOKE_FONT}`;
      const rows = K.rows || [{ from: 0, to: K.text.length, y: K.top + 52 }];
      rows.forEach(r => {
        const s = K.text.slice(r.from, r.to), w = c.measureText(s).width, x = W / 2 - w / 2, y = r.y;
        c.fillStyle = lineCol(PAL.ink); c.fillText(s, x, y);
        const n = clamp(K.sung - r.from, 0, s.length);
        if (n > 0) {
          const i = Math.floor(n), cw = c.measureText(s.slice(0, i)).width, nw = c.measureText(s.slice(0, Math.min(s.length, i + 1))).width;
          c.save(); c.beginPath(); c.rect(x - 2, y - sz, lerp(cw, nw, n - i) + 2, sz * 2); c.clip(); c.fillStyle = mixCol(PAL.rose, PAL.clayDk, .35); c.fillText(s, x, y); c.restore();
        }
      });
    },
  },
};
