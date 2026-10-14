// transitions.js (cut-out): full-frame marks for crossing a Seam, in screen space (call them outside a camera). Which
// one, and where, is the Storyboard's choice: nothing here runs on its own.

// A flash: a full-frame sheet of paper laid over at strength k (plain, so its edge never shows).
function flash(k, col = '#FBF3E2') { if (k > .01) _fillPoly(rectPts(-60, -60, W + 120, H + 120), col, clamp(k)); }

// Card everywhere OUTSIDE a star-shaped hole (irises, mouth-shaped reveals, keyholes): one sheet with a hole cut in it.
function irisShape(pts, col = PAL.ink, far = 4000) {
  const n = pts.length; let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const hole = _cut(pts), out = p => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return [cx + dx / d * far, cy + dy / d * far]; };
  for (let i = 0; i < hole.length; i++) {
    const a = hole[i], b = hole[(i + 1) % hole.length];
    _fillPoly([a, b, out(b), out(a)], col, 1);
    _stroke([a, b], () => 3, mixCol(col, '#FFFFFF', .4), 1, false);
  }
}
function iris(cx, cy, r, col = PAL.ink) { if (r < 4) _fillPoly(rectPts(-60, -60, W + 120, H + 120), col, 1); else irisShape(ellPts(cx, cy, r, r, 40), col); }

// A paper wipe: torn strips of coloured paper slide across to cover the frame (p 0 → .5), then on off the other side
// (p .5 → 1). Cut to the next shot at p = .5, under full cover. Call it last in both shots:
//   end of shot A:   if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6);
//   start of shot B: if (lt < .3) brushWipe(.5 + lt / .6);
// Colours: pick them from the two sides of the Seam, so the colour arc carries through it.
function brushWipe(p, cols = [PAL.clayDk, PAL.clay]) {
  if (p <= 0 || p >= 1) return;
  boilSeed('brushWipe');
  const [c1, c2] = cols, n = 5, bh = (H + 420) / n + 50;
  push(); translate(W / 2, H / 2); rotate(-.08); translate(-W / 2, -H / 2);
  for (let i = 0; i < n; i++) {
    const y0 = -230 + i * (H + 420) / n, d = [0, .14, .06, .18, .1][i];
    const q = p < .5 ? easeOut(clamp((p * 2 - d) / (1 - d))) : ease(clamp(((p - .5) * 2 - d) / (1 - d)));
    const len = W + 700, x0 = p < .5 ? lerp(-len - 300, -300, q) : lerp(-300, W + 400, q), pts = [];
    for (let k = 0; k <= 8; k++) pts.push([x0 + len * k / 8, y0 + Math.sin(k * .9 + i) * 10]);
    for (let k = 1; k < 7; k++) pts.push([x0 + len + 30 * hash(i * 31 + k), y0 + bh * k / 7]);
    for (let k = 8; k >= 0; k--) pts.push([x0 + len * k / 8, y0 + bh + Math.sin(k * .8 + i * 2) * 10]);
    paint(pts, { wash: i % 2 ? c1 : c2, ink: null });
  }
  pop();
}
