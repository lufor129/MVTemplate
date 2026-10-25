// frame.js: the canvas, the boil, the camera, lettering, and the hooks render.mjs and the studio call.
//
// The canvas is 1920×1080 (or 1080×1920 for a 9:16 MV), origin top-left, y down. Everything is drawn in those
// units; a low-resolution render (?scale=0.5, the Rough Cut) shrinks the whole frame without changing any of them.
//
// The Style Profile (styles/<name>/) supplies the paint itself: paint(), inkLine(), glow(), the palette PAL, and
// STYLE = { setup, underlay, overlay, flush, letterFont, fonts, karaoke, and optionally post and pose } (see
// styles/README.md).
const [W, H] = MV.format === '9:16' ? [1080, 1920] : [1920, 1080];
const RS = +(new URLSearchParams(location.search).get('scale') || 1);   // render scale
// The canvas the frame is painted on: p5's WEBGL (every profile but those whose style.json says "renderer": "2d"), or
// a plain Canvas 2D one, which the profile paints through drawingContext. p5's transforms (push, translate, the camera)
// apply to both; only WEBGL puts the origin at the canvas centre, so frame space starts with _origin().
const GL = MV.renderer !== '2d';
function _origin() { if (GL) translate(-W * RS / 2, -H * RS / 2); }
const BOIL = MV.boil ?? 12;                                              // boil drawings per second
// The light: the way it travels, as a unit vector (from the upper left by default, or mv.json "light": [x, y]). Style
// Profiles that shade by themselves (cel) read it. A Shot may set LIGHT for its own frames; every frame starts from
// the MV's.
const LIGHT0 = (([x, y]) => { const d = Math.hypot(x, y) || 1; return [x / d, y / d]; })(MV.light || [.55, .83]);
let LIGHT = LIGHT0;

// Seeded by the boil frame, so linework "boils" at BOIL fps like hand-drawn animation.
// MV.boilAmp scales how far edges wander as they boil (1 = the Style Profile's own amount, .5 = half as far).
const BOIL_AMP = MV.boilAmp ?? 1;
const jit = a => (random() * 2 - 1) * a * BOIL_AMP;
// Each boil drawing holds for several frames, so whatever isn't moving must draw the same until the next one. But a moving
// thing uses a different amount of randomness each frame, which shifts the stream for everything drawn after it and makes
// that re-boil every frame (jitter). boilSeed(key) restarts the stream from the boil frame and a key (any string or
// number) that's the same every frame: call it before each separate element. Characters do this for themselves.
let BOILN = 0, CHAR_N = 0;
const boilSeed = key => { let h = 2166136261; for (const c of key + '|' + BOILN) h = Math.imul(h ^ c.charCodeAt(0), 16777619); randomSeed(h >>> 0); };

// Put the p5 matrix back to frame space (top-left origin, frame units), whatever transforms are active.
function frameSpace() { resetMatrix(); _origin(); scale(RS); }

// ---------- camera ----------
// camBegin(cx, cy, zoom, rot): world point (cx, cy) lands at screen centre. Letters queued while a camera is
// active are placed through it automatically (pass {screen:true} to opt out). One level only: always pair with camEnd().
// LAST_CAM stays set after camEnd(), until the next frame: renderSheet's crops that follow a world point use it.
let CAM = null, LAST_CAM = null;
function camBegin(cx = W / 2, cy = H / 2, zoom = 1, rot = 0) { push(); translate(W / 2, H / 2); rotate(rot); scale(zoom); translate(-cx, -cy); CAM = LAST_CAM = { cx, cy, zoom, rot }; }
function camEnd() { pop(); CAM = null; }
function toScreen(x, y, cam = CAM) {
  if (!cam) return [x, y];
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), dx = (x - cam.cx) * cam.zoom, dy = (y - cam.cy) * cam.zoom;
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
}

// ---------- lettering (drawn on the 2D compositor, under the paper grain) ----------
// Use sparingly: the only lettering inside the picture is a Sound Word (see docs/rules.md, rule 2, "No text").
let LETTERS = [];
function letter(txt, x, y, size, color, o = {}) {
  if (CAM && !o.screen) { [x, y] = toScreen(x, y); size *= CAM.zoom; o = { ...o, rot: (o.rot || 0) + CAM.rot }; if (o.font) o.font = o.font.replace(/(\d+(\.\d+)?)px/, (m, v) => (v * CAM.zoom) + 'px'); }
  LETTERS.push({ txt, x, y, size, color, ...o });
}
// Comic sound effect: pops in at age 0, wobbles, fades by `life` seconds.
function sfx(txt, x, y, size, color, age, o = {}) {
  const life = o.life ?? 1.2; if (age < 0 || age > life) return;
  letter(txt, x, y, size, color, { pop: age * 5, rot: (o.rot ?? -.08) + Math.sin(age * 20) * .03 * (1 - age / life), alpha: 1 - seg(age, life - .25, life), ...o });
}
function drawLetters(c) {
  for (const L of LETTERS) {
    const k = L.pop != null ? backOut(L.pop) : 1; if (k <= .01) continue;
    c.save(); c.translate(L.x, L.y); c.rotate(L.rot || 0); c.scale(k, k); c.globalAlpha = L.alpha ?? 1;
    c.font = L.font || STYLE.letterFont(L.size);
    c.textAlign = L.align || 'center'; c.textBaseline = 'middle';
    if (L.stroke) { c.lineJoin = 'round'; c.lineWidth = L.size * .12; c.strokeStyle = L.stroke; c.strokeText(L.txt, 0, 0); }
    if (L.ink !== false) { c.fillStyle = PAL.ink; c.fillText(L.txt, L.size * .045, L.size * .055); }
    c.fillStyle = L.color; c.fillText(L.txt, 0, 0);
    c.restore();
  }
}
// Paint the queued lettering into the scene itself, so later layers (wipes) cover it. drawWorld calls this after each
// shot; call it yourself before a wipe or iris if the shot has lettering, or the letters will sit on top of it.
let letG = null;
function flushLetters() {
  if (!LETTERS.length) return;
  letG.clear(); const c = letG.drawingContext; c.save(); c.scale(RS, RS); drawLetters(c); c.restore(); LETTERS = [];
  // the profile lands what it has painted so far; one that doesn't paint straight onto the canvas (an SVG scene) takes
  // the letters' canvas and places it itself, returning true
  if (STYLE.flush(c.canvas) === true) return;
  push(); resetMatrix(); _origin(); image(letG, 0, 0); pop();
}

// ---------- frame ----------
let T = 0, outC = null, outX = null;
async function setup() {
  createCanvas(W * RS, H * RS, GL ? WEBGL : P2D); pixelDensity(1); noLoop();
  await STYLE.setup();
  letG = createGraphics(W * RS, H * RS); letG.pixelDensity(1);
  outC = document.getElementById('out'); outC.width = W * RS; outC.height = H * RS; outX = outC.getContext('2d');
  const sample = 'AaBb為我畫一首小小的歌' + SONG.lines.map(l => l.text + (l.sub || '')).join('');
  await Promise.all(STYLE.fonts.map(f => document.fonts.load(`50px "${f}"`, sample).catch(() => {})));
  window.ready = true;
  if (!location.search.includes('render')) devUI();
}
// async, so a Style Profile's post may be (an SVG scene rasterised at the end of the frame); p5's redraw() awaits it
async function draw() {
  if (!window.ready) return;
  LETTERS = []; CAM = LAST_CAM = null; LIGHT = LIGHT0;
  push(); _origin(); scale(RS);
  BOILN = Math.floor(T * BOIL); CHAR_N = 0; boilSeed('frame'); noiseSeed(77);
  STYLE.underlay();
  // MV.hold > 1: every drawing holds that many frames (on twos at 2), the whole picture at once
  drawWorld(MV.hold > 1 ? Math.floor(T * MV.fps / MV.hold + 1e-6) * MV.hold / MV.fps : T);
  pop();
  if (STYLE.post) await STYLE.post();   // the Style Profile's pass over the whole painted frame (watercolour: pigment and edges)
}
function composite() {
  const c = outX;
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.drawImage(drawingContext.canvas, 0, 0, W * RS, H * RS);
  c.save(); c.scale(RS, RS); drawLetters(c); drawOverlayText(c); c.restore();
  STYLE.overlay(c, W * RS, H * RS);
}
window.renderAt = async (t, type = 'image/png', q = .92) => { T = t; await redraw(); composite(); return outC.toDataURL(type, q); };
// Contact sheet of several times, for visual checks: returns { url, ms[] }. crop = [x, y, w, h] fills each cell with just
// that region of the frame, at full resolution (for checking faces, hands and contacts up close). at = [x, y, w, h]
// instead crops w × h around the WORLD point (x, y), wherever each frame's camera put it (a foot, a splash, a prop on
// a moving shot); x and y may be expressions evaluated in the page.
window.renderSheet = async (times, cols = 3, w = 640, crop = null, at = null, tag = null) => {
  if (at) at = at.map((v) => typeof v === 'string' ? (0, eval)(v) : v);
  const [, , cw, ch] = at || crop || [0, 0, W, H], h = Math.round(w * ch / cw), rows = Math.ceil(times.length / cols), sc = document.createElement('canvas');
  sc.width = cols * w; sc.height = rows * h; const c = sc.getContext('2d'), ms = [];
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now(); T = times[i]; await redraw(); composite(); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * h;
    const [cx, cy] = at ? toScreen(at[0], at[1], LAST_CAM).map((v, j) => v - (j ? ch : cw) / 2) : crop || [0, 0];
    c.drawImage(outC, cx * RS, cy * RS, cw * RS, ch * RS, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.65)'; c.font = '15px sans-serif';
    const lab = tag ?? times[i].toFixed(2) + 's'; c.fillRect(x, y, c.measureText(lab).width + 14, 24); c.fillStyle = '#fff'; c.fillText(lab, x + 6, y + 17);
  }
  return { url: sc.toDataURL('image/jpeg', .9), ms };
};
window.gpuInfo = () => { if (!GL) return 'Canvas 2D'; const gl = drawingContext, e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };
window.lengthOf = () => window.LOOP ? window.LOOP.len : DUR;

// ---------- studio: scrub, or play along with the song ----------
function devUI() {
  const s = document.getElementById('scrub'), lab = document.getElementById('tt'), play = document.getElementById('play');
  const audio = new Audio(MV.audioPath); s.max = window.lengthOf(); s.step = 1 / 24;
  let busy = false, want = null;
  const go = async () => {
    if (busy) return; busy = true;
    while (want != null) { const t = want; want = null; const t0 = performance.now(); await window.renderAt(t); lab.textContent = `${t.toFixed(2)}s  ·  ${Math.round(performance.now() - t0)} ms/frame`; }
    busy = false;
  };
  s.addEventListener('input', () => { audio.pause(); play.textContent = '▶'; want = +s.value; go(); });
  play.addEventListener('click', () => {
    if (!audio.paused) { audio.pause(); play.textContent = '▶'; return; }
    if (window.LOOP) return;
    audio.currentTime = +s.value; audio.play(); play.textContent = '❚❚';
    const tick = async () => { if (audio.paused) return; s.value = audio.currentTime; want = audio.currentTime; await go(); requestAnimationFrame(tick); };
    tick();
  });
  want = +(new URLSearchParams(location.search).get('t') || 0); s.value = want; go();
}
