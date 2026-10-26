// svg.js: the doodle profile paints no pixels during the frame. paint(), inkLine() and glow() append SVG elements to
// a per-frame scene (_S), each wrapped in a <g> that carries the current p5 transform (drawingContext.getTransform():
// the camera, the Character's pose and the render scale), so every element is written in its own frame units.
// STYLE.underlay() starts the scene, STYLE.flush(img) drops the queued lettering into it as an <image>, and
// STYLE.post() closes the document, rasterises it (a Blob URL into an Image) and draws it onto the canvas.
//
// What SVG does for the look (the static defs, made once in setup):
//   #wob, #wobF, #wobW   feTurbulence + feDisplacementMap: ragged felt-tip edges. The noise lives in each element's own user
//                 space, so it moves with the element: a still thing wobbles the same every frame
//   #letters      Sound Words: hatched with stripes of their own colour (feImage + feTile), a faint wash under them, two
//                 wobbly feMorphology rings round the word and a line where the face meets its drop, on a paper halo
//   #rules, #dots <pattern>s: the notebook ruling (multiplied over the finished page) and the washi tape's polka dots
//   #hole         the punched holes down the left edge (a radial gradient), cut through everything at the end
//   ink blobs     <marker>s at the ends of ballpoint strokes (made per colour, per frame, in _D)

let _S = [], _D = [], _UID = 0, _BLOB = new Map();
const _f = v => String(Math.round(v * 10) / 10);
const _fm = v => String(Math.round(v * 1e4) / 1e4);
// the current transform as an SVG attribute
function _M() { const m = drawingContext.getTransform(); return `matrix(${_fm(m.a)},${_fm(m.b)},${_fm(m.c)},${_fm(m.d)},${_f(m.e)},${_f(m.f)})`; }
// a point list as path data: straight segments, or smooth quadratic curves through the midpoints
function _d(P, closed = false, smooth = false) {
  const n = P.length; if (n < 2) return '';
  if (!smooth || n < 3) { let s = `M${_f(P[0][0])} ${_f(P[0][1])}`; for (let i = 1; i < n; i++) s += `L${_f(P[i][0])} ${_f(P[i][1])}`; return closed ? s + 'Z' : s; }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s;
  if (closed) {
    const m0 = mid(P[n - 1], P[0]); s = `M${_f(m0[0])} ${_f(m0[1])}`;
    for (let i = 0; i < n; i++) { const m = mid(P[i], P[(i + 1) % n]); s += `Q${_f(P[i][0])} ${_f(P[i][1])} ${_f(m[0])} ${_f(m[1])}`; }
    return s + 'Z';
  }
  s = `M${_f(P[0][0])} ${_f(P[0][1])}`;
  for (let i = 1; i < n - 1; i++) { const m = mid(P[i], P[i + 1]); s += `Q${_f(P[i][0])} ${_f(P[i][1])} ${_f(m[0])} ${_f(m[1])}`; }
  return s + `L${_f(P[n - 1][0])} ${_f(P[n - 1][1])}`;
}
// An invisible rect that pads a group's bounding box, so a filter region (objectBoundingBox) never clips a stroke.
function _pad(b, p) { return `<rect x="${_f(b[0] - p)}" y="${_f(b[1] - p)}" width="${_f(b[2] - b[0] + 2 * p)}" height="${_f(b[3] - b[1] + 2 * p)}" fill="none"/>`; }
// One element group in the current transform.
// inner may be a function, called when the frame is rendered (a backdrop that has to know what's drawn after it).
function _emit(inner) {
  if (!inner) return;
  const t = `<g transform="${_M()}">`;
  _S.push(typeof inner === 'function' ? () => t + inner() + '</g>' : t + inner + '</g>');
}
// A ballpoint blob for the ends of strokes in this colour (an SVG marker, made once a frame per colour).
function _blob(col) {
  let id = _BLOB.get(col);
  if (!id) {
    id = 'b' + _BLOB.size; _BLOB.set(col, id);
    _D.push(`<marker id="${id}" viewBox="-2 -2 4 4" markerWidth="4" markerHeight="4" orient="auto" markerUnits="strokeWidth"><ellipse cx="0" cy="0" rx=".95" ry=".75" fill="${col}"/></marker>`);
  }
  return id;
}

// ---------- the static defs ----------
function _defs() {
  const k = 1;   // the lettering filter works in the Sound Word's own space (frame units: see _svgLetters)
  return `
<filter id="wob" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="wobF" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="8" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="wobW" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="2" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="letters" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${_fm(.03 / k)}" numOctaves="2" seed="5" result="n1"/>
  <feTurbulence type="fractalNoise" baseFrequency="${_fm(.045 / k)}" numOctaves="2" seed="11" result="n2"/>
  <feMorphology in="SourceAlpha" operator="dilate" radius="${_f(5 * k)}" result="h0"/>
  <feDisplacementMap in="h0" in2="n1" scale="${_f(6 * k)}" xChannelSelector="R" yChannelSelector="G" result="halo"/>
  <feFlood flood-color="${PAL.paper}"/><feComposite in2="halo" operator="in" result="paperHalo"/>
  <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .55 0" result="tint"/>
  <feBlend in="tint" in2="paperHalo" mode="multiply" result="b1"/>
  <feImage href="${_stripeTile(RS * 2)}" x="0" y="0" width="9" height="9" preserveAspectRatio="none" result="tile"/>
  <feTile in="tile" result="stripes"/>
  <feDisplacementMap in="stripes" in2="n2" scale="${_f(5 * k)}" xChannelSelector="R" yChannelSelector="G" result="stripesW"/>
  <feComposite in="SourceGraphic" in2="stripesW" operator="in" result="hatch"/>
  <feBlend in="hatch" in2="b1" mode="multiply" result="coloured"/>
  <feMorphology in="SourceAlpha" operator="dilate" radius="${_f(2.8 * k)}" result="o1"/>
  <feDisplacementMap in="o1" in2="n1" scale="${_f(5 * k)}" xChannelSelector="R" yChannelSelector="G" result="o1w"/>
  <feMorphology in="o1w" operator="erode" radius="${_f(3 * k)}" result="o1i"/>
  <feComposite in="o1w" in2="o1i" operator="out" result="ring1"/>
  <feMorphology in="SourceAlpha" operator="dilate" radius="${_f(4 * k)}" result="o2"/>
  <feDisplacementMap in="o2" in2="n2" scale="${_f(8 * k)}" xChannelSelector="G" yChannelSelector="R" result="o2w"/>
  <feMorphology in="o2w" operator="erode" radius="${_f(2.1 * k)}" result="o2i"/>
  <feComposite in="o2w" in2="o2i" operator="out" result="ring2"/>
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.2 1.2 1.2 0 -1.1" result="face0"/>
  <feComposite in="face0" in2="SourceAlpha" operator="in" result="face"/>
  <feComposite in="SourceAlpha" in2="face" operator="out" result="drop"/>
  <feMorphology in="drop" operator="dilate" radius="${_f(1.6 * k)}" result="dropD"/>
  <feMorphology in="face" operator="dilate" radius="${_f(1.3 * k)}" result="faceD"/>
  <feComposite in="faceD" in2="face" operator="out" result="fe0"/>
  <feComposite in="fe0" in2="dropD" operator="in" result="fe1"/>
  <feDisplacementMap in="fe1" in2="n1" scale="${_f(3 * k)}" xChannelSelector="R" yChannelSelector="G" result="faceEdge"/>
  <feMerge result="rings"><feMergeNode in="ring1"/><feMergeNode in="ring2"/><feMergeNode in="faceEdge"/></feMerge>
  <feFlood flood-color="${PAL.ink}"/><feComposite in2="rings" operator="in" result="inkRings"/>
  <feMerge><feMergeNode in="coloured"/><feMergeNode in="inkRings"/></feMerge>
</filter>
<pattern id="rules" patternUnits="userSpaceOnUse" x="0" y="${_f(RULE0 * RS)}" width="${_f(W * RS)}" height="${_f(RULE * RS)}">
  <rect x="0" y="0" width="${_f(W * RS)}" height="${_f(2.1 * RS)}" fill="${RULE_COL}"/>
</pattern>
<pattern id="dots" patternUnits="userSpaceOnUse" width="46" height="42">
  <circle cx="11" cy="10" r="6.6" fill="#E9A090"/><circle cx="34" cy="31" r="6.2" fill="#E9A090"/>
</pattern>
<radialGradient id="hole" cx=".56" cy=".57" r=".52">
  <stop offset="0" stop-color="#919191"/><stop offset=".62" stop-color="#8B8B8B"/><stop offset=".86" stop-color="#727272"/><stop offset="1" stop-color="#525252"/>
</radialGradient>`;
}
// Marker hatching for the Sound Words: a tile of opaque diagonal stripes, 9 units square drawn at k pixels a unit
// (feImage -> feTile); the letter's own colour shows through them.
function _stripeTile(k) {
  const s = Math.round(9 * k), cv = _canvas(s, s), c = cv.getContext('2d');
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 3.1 * k; c.lineCap = 'butt';
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s - 1, s + 1); c.lineTo(i * s + s + 1, -1); c.stroke(); }
  return cv.toDataURL('image/png');
}

// ---------- the frame ----------
let _DEFS = '';
function _svgBegin() { _S = []; _D = []; _UID = 0; _BLOB = new Map(); }
// The bounding box of what's on the lettering canvas: scanned on a small copy, so it costs a few ms, not a full read.
const _LBOX = { cv: null };
function _alphaBox(img) {
  const q = 8, w = Math.ceil(img.width / q), h = Math.ceil(img.height / q);
  if (!_LBOX.cv) { _LBOX.cv = _canvas(w, h); _LBOX.c = _LBOX.cv.getContext('2d', { willReadFrequently: true }); }
  const c = _LBOX.c; c.clearRect(0, 0, w, h); c.drawImage(img, 0, 0, w, h);
  const a = c.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const p = 3;
  x0 = Math.max(0, (x0 - p) * q); y0 = Math.max(0, (y0 - p) * q); x1 = Math.min(img.width, (x1 + 1 + p) * q); y1 = Math.min(img.height, (y1 + 1 + p) * q);
  return [x0, y0, x1 - x0, y1 - y0];
}
// A lettering canvas goes into the scene under the #letters filter. The filter works in the word's own space (m: the
// transform the word was drawn with, which flush notes; else plain frame units), so its hatching, wobble and outline
// turn and pop with the word; the image sits in that space through m's inverse. a: the word's fade.
function _svgLetters(img, m = new DOMMatrix([RS, 0, 0, RS, 0, 0]), a = 1) {
  const b = _alphaBox(img); if (!b) return;
  const [x, y, w, h] = b, cv = _canvas(w, h); cv.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
  const M = q => `matrix(${_fm(q.a)},${_fm(q.b)},${_fm(q.c)},${_fm(q.d)},${_fm(q.e)},${_fm(q.f)})`;
  _S.push(`<g transform="${M(m)}" filter="url(#letters)"${a < 1 ? ` opacity="${_f(a)}"` : ''}><image href="${cv.toDataURL('image/png')}" x="${x}" y="${y}" width="${w}" height="${h}" transform="${M(m.inverse())}"/></g>`);
}
async function _svgRender() {
  // the notebook ruling and margin, printed under the ink but showing through it: multiplied over the whole page
  const k = RS;
  _S.push(`<g style="mix-blend-mode:multiply"><rect width="${W * k}" height="${H * k}" fill="url(#rules)" opacity=".9"/>` +
    `<rect x="${_f(MARGIN * k)}" y="0" width="${_f(1.4 * k)}" height="${H * k}" fill="${MARGIN_COL}"/>` +
    `<rect x="${_f((MARGIN + 4.6) * k)}" y="0" width="${_f(1.3 * k)}" height="${H * k}" fill="${MARGIN_COL}" opacity=".9"/></g>`);
  // the punched holes go through everything: a shadow where the page's edge overhangs, a lit lip below and right
  let holes = '';
  for (let y = HOLES.y0; y - HOLES.r < H; y += HOLES.dy) {
    const cx = HOLES.x * k, cy = y * k, r = HOLES.r * k;
    holes += `<circle cx="${_f(cx - .8 * k)}" cy="${_f(cy - .8 * k)}" r="${_f(r + 2.2 * k)}" fill="#3A3A3A" opacity=".1"/>` +
      `<circle cx="${_f(cx + 1.6 * k)}" cy="${_f(cy + 1.6 * k)}" r="${_f(r)}" fill="#FBFBFA"/>` +
      `<circle cx="${_f(cx)}" cy="${_f(cy)}" r="${_f(r)}" fill="url(#hole)"/>`;
  }
  _S.push(holes);
  const body = _S.map(e => typeof e === 'function' ? e() : e).join('');   // first, as it may add to the defs
  const src = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * RS}" height="${H * RS}" viewBox="0 0 ${W * RS} ${H * RS}"><defs>${_DEFS}${_D.join('')}</defs>${body}</svg>`;
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); img.src = url;
    try { await img.decode(); } catch (e) { window._badSVG = src; throw new Error(`doodle: this frame's SVG doesn't parse (window._badSVG holds it): ${e.message}`); }
    const c = drawingContext; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'copy'; c.drawImage(img, 0, 0, W * RS, H * RS); c.restore();
  } finally { URL.revokeObjectURL(url); }
  window._lastSVG = src.length;
}
