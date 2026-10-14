// The troupe: small Clawds in hats (backup dancers, stagehands, the judging panel). Shared by every Chapter that has
// them in the background. Uses clawd.js's eyes / mouth / hat. pose: { key (a stable boil key), dy, sq, rot, sx, aL, aR,
// col, dk, eyes, mouth, hat, noShadow }.
// A cheaper Clawd for small background dancers: same silhouette, face and hats, flat washes only.
function miniClawd(x, y, u, o = {}) {
  boilSeed('mini ' + o.key);
  const dy = (o.dy || 0) * u, sq = o.sq || 0, sw = clamp(u / 15, .45, 2.4), J = u * .07;
  const col = o.col || PAL.clay, dk = o.dk || PAL.clayDk;
  if (!o.noShadow) paint(ellPts(x, y + u * .15, u * 5.4, u * .95, 10), { wash: PAL.ink, washOp: 55, ink: null });
  push(); translate(x, y + dy); if (o.rot) rotate(o.rot);
  scale((o.sx ?? 1) * (1 + sq * .6), 1 - sq);
  [-4, -2, 1, 3].forEach(lx => paint(rectPts(lx * u, -2.4 * u, u, 2.2 * u, J * .6), { wash: dk, ink: PAL.ink, sw: sw * .8 }));
  for (const side of [-1, 1]) {
    const a = side < 0 ? (o.aL ?? .2) : (o.aR ?? .2);
    push(); translate(side * 4.9 * u, -4.5 * u); rotate(side < 0 ? a : -a);
    paint(rectPts(side < 0 ? -2.2 * u : 0, -.5 * u, 2.2 * u, u, J * .6), { wash: col, ink: PAL.ink, sw: sw * .8 }); pop();
  }
  const body = rectPts(-5 * u, -8 * u, 10 * u, 6 * u, J);
  paint(body, { wash: col, ink: null });
  paint(rectPts(-4.8 * u, -3.7 * u, 9.6 * u, 1.5 * u, J), { wash: dk, washOp: 120, ink: null });
  paint(ellPts(-1.6 * u, -6.5 * u, 3 * u, 1.1 * u, 10), { wash: '#F5B394', washOp: 120, ink: null });
  paint(body, { ink: PAL.ink, sw });
  if (Math.abs(o.sx ?? 1) > .3) {
    for (const bx of [-3.6, 3.6]) paint(ellPts(bx * u, -4.6 * u, u * .8, u * .4, 8), { wash: PAL.rose, washOp: 150, ink: null });
    eyes(u, o, sw, [-1, 1], 0); mouth(u, o.mouth, sw);
  }
  hat(u, o.hat, sw);
  pop();
}
