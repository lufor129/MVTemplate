// transitions.js (cel): full-frame marks for crossing a Seam, in screen space (call them outside a camera). Which one, and
// where, is the Storyboard's choice: nothing here runs on its own.

// A flash: a full-frame wash at strength k.
function flash(k, col = '#FFFDF6') { if (k > .01) paint(rectPts(-60, -60, W + 120, H + 120), { wash: col, washOp: 255 * clamp(k), ink: null }); }

// Paint everything OUTSIDE a star-shaped hole (irises, mouth-shaped reveals, keyholes).
function irisShape(pts, col = PAL.ink, far = 4000) {
  const n = pts.length; let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const out = p => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return [cx + dx / d * far, cy + dy / d * far]; };
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], ex = (b[0] - a[0]) * .06, ey = (b[1] - a[1]) * .06;
    const a2 = [a[0] - ex, a[1] - ey], b2 = [b[0] + ex, b[1] + ey];
    paint([a2, b2, out(b2), out(a2)], { wash: col, washOp: 255, ink: null });
  }
}
function iris(cx, cy, r, col = PAL.ink) { if (r < 4) paint(rectPts(-60, -60, W + 120, H + 120), { wash: col, ink: null }); else irisShape(ellPts(cx, cy, r, r, 40), col); }

// A brush wipe: fat inked cel strokes sweep across to cover the frame (p 0 → .5), then drag off (p .5 → 1).
// Cut to the next shot at p = .5, under full cover. Call it last in both shots:
//   end of shot A:   if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6);
//   start of shot B: if (lt < .3) brushWipe(.5 + lt / .6);
// Colours: pick them from the two sides of the Seam, so the colour arc carries through it.
function brushWipe(p, cols = [PAL.clayDk, PAL.clay]) {
  if (p <= 0 || p >= 1) return;
  boilSeed('brushWipe');
  const [c1, c2] = cols, n = 5, span = Math.max(W, H), bh = (H + 420) / n + 40;
  push(); translate(W / 2, H / 2); rotate(-.1); translate(-W / 2, -H / 2);
  for (let i = 0; i < n; i++) {
    const y0 = -230 + i * (H + 420) / n, d = [0, .14, .06, .18, .1][i];
    const q = p < .5 ? easeOut(clamp((p * 2 - d) / (1 - d))) : ease(clamp(((p - .5) * 2 - d) / (1 - d)));
    const x0 = p < .5 ? -300 : lerp(-300, W + 400, q), x1 = p < .5 ? lerp(-300, W + 400, q) : W + 400;
    if (x1 - x0 < 30) continue;
    const pts = [], rag = k => 40 + 50 * hash(i * 31 + k) + jit(12), segs = Math.ceil(8 * span / 1920);
    for (let k = 0; k <= segs; k++) pts.push([lerp(x0, x1, k / segs), y0 + Math.sin(k * .9 + i) * 14 + jit(5)]);
    for (let k = 1; k < 9; k++) pts.push([x1 + rag(k) - 40, y0 + bh * k / 9]);
    for (let k = segs; k >= 0; k--) pts.push([lerp(x0, x1, k / segs), y0 + bh + Math.sin(k * .8 + i * 2) * 14 + jit(5)]);
    if (p >= .5) for (let k = 8; k > 0; k--) pts.push([x0 - rag(k + 20) + 40, y0 + bh * k / 9]);
    paint(pts, { wash: i % 2 ? c1 : c2, washOp: 255, ink: PAL.ink, sw: 1.6,
      hatch: { d: 40, a: .3, o: { rand: .5 }, b: 'dry', c: i % 2 ? c2 : PAL.cream, w: 1 } });
  }
  pop();
}
