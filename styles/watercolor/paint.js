// paint.js: the watercolour Style Profile's drawing primitives, on p5.brush: flat washes, bleeding watercolour fills,
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
function paint(pts, o = {}) { centred(pts, (P) => paintAt(P, o)); }
function paintAt(pts, o) {
  if (o.wash || o.fill || o.hatch) {
    if (o.wash) brush.wash(o.wash, o.washOp ?? 255); else brush.noWash();
    if (o.fill) { brush.fill(o.fill, o.fillOp ?? 170); brush.fillBleed(o.bleed ?? .1); brush.fillTexture(o.tex ?? .4, o.border ?? .35); } else brush.noFill();
    if (o.hatch) { brush.hatch(o.hatch.d, o.hatch.a, o.hatch.o || { rand: .15 }); brush.hatchStyle(o.hatch.b || 'HB', o.hatch.c || PAL.ink, o.hatch.w || 1); } else brush.noHatch();
    brush.noStroke();
    if (o.curv) { brush.beginShape(o.curv); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true); }
    else brush.polygon(pts);
  }
  // the outline is one continuous tapered stroke, not a stroke per side
  if (o.ink !== null) {
    brush.noWash(); brush.noFill(); brush.noHatch(); brush.set(o.br || 'ink', o.ink || PAL.ink, o.sw ?? 1);
    brush.beginShape(o.curv || 0); for (const p of pts) brush.vertex(p[0], p[1]); brush.endShape(true);
  }
}
function inkLine(pts, sw = 1, col = PAL.ink, br = 'ink', curv = .5) {
  centred(pts, (P) => { brush.noFill(); brush.noWash(); brush.noHatch(); brush.set(br, col, sw); brush.spline(P, curv); });
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

// ---------- the Style Profile's hooks ----------
let paperG = null, grainC = null;
const KARAOKE_FONT = '"Shantell Sans", "LXGW WenKai TC", "Klee One", sans-serif';
const STYLE = {
  fonts: ['Permanent Marker', 'Shantell Sans', 'LXGW WenKai TC', 'Klee One'],
  async setup() {
    brush.scaleBrushes(5);
    brush.add('ink', { type: 'default', weight: 5, scatter: .25, sharpness: .8, grain: 40, opacity: 235, spacing: .2, pressure: [1.15, .75], rotate: 'natural', noise: .15 });
    brush.add('inkfine', { type: 'default', weight: 2.6, scatter: .15, sharpness: .85, grain: 40, opacity: 230, spacing: .2, pressure: [1.1, .8], rotate: 'natural', noise: .1 });
    brush.add('dry', { type: 'default', weight: 14, scatter: 3, sharpness: .3, grain: 6, opacity: 90, spacing: .6, pressure: [1, .6], rotate: 'natural', noise: .4 });
    paperG = makePaper(); grainC = makeGrain(); glowTex = makeGlowTex();
  },
  underlay() { image(paperG, 0, 0, W, H); },
  overlay(c, w, h) { c.globalCompositeOperation = 'multiply'; c.drawImage(grainC, 0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
  flush: flushBrush,
  letterFont: size => `${size}px "Permanent Marker", "LXGW WenKai TC", "Klee One", cursive`,
  karaoke: {
    size: MV.format === '9:16' ? 54 : 50,
    // a ragged ink-and-violet brushstroke behind the line, growing in from the centre
    band(K) {
      const c = outX, sz = this.size; c.font = `800 ${sz}px ${KARAOKE_FONT}`;
      const rows = karaokeRows(c, K.text, W - 160), tw = Math.max(...rows.map(r => c.measureText(K.text.slice(r.from, r.to)).width));
      const w = (tw + 110) * K.grow, x0 = W / 2 - w / 2, y0 = K.top + 8, hh = 88 + (rows.length - 1) * sz * 1.25;
      boilSeed('karaoke');
      const pts = [[x0 + jit(8), y0 + jit(4)], [x0 + w / 2, y0 - 4 + jit(4)], [x0 + w + jit(8), y0 + jit(4)], [x0 + w + 14 + jit(8), y0 + hh / 2], [x0 + w + jit(8), y0 + hh + jit(4)], [x0 + w / 2, y0 + hh + 4 + jit(4)], [x0 + jit(8), y0 + hh + jit(4)], [x0 - 14 + jit(8), y0 + hh / 2]];
      paint(pts, { wash: PAL.ink, washOp: 225, fill: PAL.violet, fillOp: 60, tex: .7, border: .4, ink: null });
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
