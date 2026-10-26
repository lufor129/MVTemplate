// transitions.js (doodle): full-frame marks for crossing a Seam, in screen space (call them outside a camera). Which
// one, and where, is the Storyboard's choice: nothing here runs on its own. They are SVG too (svg.js).

// A flash: the page goes to a flat colour at strength k (default: blank paper).
function flash(k, col = PAL.paper) {
  if (k > .01) _emit(`<rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="${tone(col)}" opacity="${_f(clamp(k))}"/>`);
}

// Fill everything OUTSIDE a shape with solid felt-tip (irises, mouth-shaped reveals, keyholes), the hole's edge drawn
// round twice with the pen.
function irisShape(pts, col = PAL.ink, far = 4000) {
  const s = random() * 1000, c = tone(col);
  _emit(`<path d="M${-far} ${-far}H${W + far}V${H + far}H${-far}Z${_d(pts, true)}" fill="${c}" fill-rule="evenodd"/>` +
    _lineSvg(pts, true, 1.6, _kind(c) === 'pen' ? PAL.ink : mixCol(c, PAL.ink, .5), 'ink', s));
}
function iris(cx, cy, r, col = PAL.ink) {
  if (r < 4) _emit(`<rect x="-60" y="-60" width="${W + 120}" height="${H + 120}" fill="${tone(col)}"/>`);
  else irisShape(ellPts(cx, cy, r, r, 40), col);
}

// A scribble wipe: one fat marker zigzags across the page until it's covered (p 0 → .5), then lifts off again from
// where it began (p .5 → 1); the stroke is revealed along its length with stroke-dasharray, so it's drawn on, not slid.
// Cut to the next shot at p = .5, under full cover. Call it last in both shots:
//   end of shot A:   if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6);
//   start of shot B: if (lt < .3) brushWipe(.5 + lt / .6);
// Colours: pick them from the two sides of the Seam, so the colour arc carries through it.
function brushWipe(p, cols = [PAL.clayDk, PAL.clay]) {
  if (p <= 0 || p >= 1) return;
  const [c1, c2] = cols.map(tone), Z = [];
  // an uneven zigzag: each sweep bowed, at its own slant and stride, turning round off the page
  let x = -420, prev = null;
  for (let i = 0; x < W + 520; i++) {
    const down = i % 2 === 0, sl = 220 + 200 * hash(i * 5.3);
    const p1 = [x + (down ? 0 : sl), down ? -230 - hash(i) * 110 : H + 230 + hash(i + 9) * 110];
    if (prev) { const bow = (hash(i * 3.3) - .5) * 160; for (let k = 1; k < 8; k++) { const u = k / 8; Z.push([lerp(prev[0], p1[0], u) + bow * Math.sin(Math.PI * u), lerp(prev[1], p1[1], u)]); } }
    Z.push(p1); prev = p1;
    x += 100 + 60 * hash(i * 2.1 + 4);
  }
  const cum = _arc(Z, false), L = cum[cum.length - 1];
  const q = p < .5 ? ease(p * 2) : ease((p - .5) * 2), s0 = p < .5 ? 0 : L * q, s1 = p < .5 ? L * q : L + 600;
  const dash = (k = 0) => `stroke-dasharray="${_f(Math.max(.1, s1 - s0))} ${_f(L * 2 + 3000)}" stroke-dashoffset="${_f(-s0 + k)}"`;
  const along = (dx, dy = 0) => _d(Z.map(([x, y], i) => [x + dx + (hash(i * 7.7) - .5) * 30, y + dy]));
  const st = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
  // the marker's own streaks: narrower passes of each colour along the sweeps, multiplied, so overlaps go darker
  let streaks = '';
  for (let j = 0; j < 4; j++) streaks += `<path d="${along(-110 + j * 70, j * 25)}" stroke="${c1}" stroke-width="${30 + 22 * hash(j * 4.1)}" opacity=".42" ${st} ${dash(-30 - j * 25)}/>`;
  _emit(`<g filter="url(#wobW)"><path d="${_d(Z)}" stroke="${c1}" stroke-width="330" ${st} ${dash()}/>` +
    `<g style="mix-blend-mode:multiply">${streaks}</g>` +
    `<path d="${along(20, 30)}" stroke="${c2}" stroke-width="58" opacity=".92" ${st} ${dash(-120)}/>` +
    `<g style="mix-blend-mode:multiply"><path d="${along(36, 20)}" stroke="${c2}" stroke-width="22" opacity=".5" ${st} ${dash(-150)}/>` +
    `<path d="${along(-30, 60)}" stroke="${c2}" stroke-width="18" opacity=".55" ${st} ${dash(-200)}/></g></g>`);
}
