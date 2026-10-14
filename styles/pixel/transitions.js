// transitions.js (pixel): full-frame marks for crossing a Seam, in screen space (call them outside a camera). Which one,
// and where, is the Storyboard's choice: nothing here runs on its own. All of them land on the pixel grid.

// A flash: a full-frame colour at strength k (in between, it dithers).
function flash(k, col = '#FFF6E0') { if (k > .01) _fillPoly(rectPts(-60, -60, W + 120, H + 120), col, clamp(k)); }

// Colour everywhere OUTSIDE a star-shaped hole (irises, mouth-shaped reveals, keyholes).
function irisShape(pts, col = PAL.ink, far = 4000) {
  const n = pts.length; let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const out = p => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return [cx + dx / d * far, cy + dy / d * far]; };
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; _fillPoly([a, b, out(b), out(a)], col, 1); }
}
function iris(cx, cy, r, col = PAL.ink) { if (r < 4) _fillPoly(rectPts(-60, -60, W + 120, H + 120), col, 1); else irisShape(ellPts(cx, cy, r, r, 40), col); }

// A block wipe, the old game screen change: square blocks grow in a diagonal sweep to cover the frame (p 0 → .5), then
// shrink away in the same order (p .5 → 1). Cut to the next shot at p = .5, under full cover. Call it last in both shots:
//   end of shot A:   if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6);
//   start of shot B: if (lt < .3) brushWipe(.5 + lt / .6);
// Colours: two, in a checkerboard; pick them from the two sides of the Seam.
function brushWipe(p, cols = [PAL.clayDk, PAL.clay]) {
  if (p <= 0 || p >= 1) return;
  const B = PIX * 12, nx = Math.ceil(W / B), ny = Math.ceil(H / B), span = nx + ny, k = p < .5 ? p * 2 : (p - .5) * 2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = clamp(k * 1.6 - (i + j) / span * .6), s = (p < .5 ? q : 1 - q) * B / 2;
    if (s <= 0) continue;
    const cx = (i + .5) * B, cy = (j + .5) * B, h = Math.ceil(s / PIX) * PIX;
    _fillPoly(rectPts(cx - h, cy - h, 2 * h, 2 * h), cols[(i + j) % 2], 1);
  }
}
