// transitions.js (paper theatre): full-frame marks for crossing a Seam, in screen space (call them outside a camera).
// Which one, and where, is the Storyboard's choice: nothing here runs on its own.

// A flash: the theatre's lights thrown full up, at strength k.
function flash(k, col = '#FFF8EA') { if (k > .01) _fillPoly(rectPts(-60, -60, W + 120, H + 120), col, clamp(k)); }

// A card over the whole stage with a die-cut hole (irises, keyholes): a rounded hole, the card's thin soft shadow
// thrown into it, the grain and a pale cut edge.
function irisShape(pts, col = PAL.ink, far = 4000) {
  const base = tone(col), [x0, y0, x1, y1] = _bounds(pts), mn = Math.min(x1 - x0, y1 - y0), hole = _roundPath(pts, clamp(mn * .12, 0, 14));
  const card = new Path2D(); card.rect(x0 - far, y0 - far, x1 - x0 + far * 2, y1 - y0 + far * 2); card.addPath(hole);
  _with({ shadow: _drop(Math.min(9, mn * .04 + 3), .45) }, () => _fillPoly(card, base, 1, 'evenodd'));
  const c = _ctx(); c.save(); c.clip(card, 'evenodd');
  _fillPoly(card, _radial((x0 + x1) / 2, (y0 + y1) / 2, mn * .5, mn * 1.6 + 200, [[0, LIT, .1], [1, cardShade(base), .25]]), 1, 'evenodd');
  _cardFill(card, 1);
  c.lineWidth = 3.2; c.strokeStyle = _css(LIT, .5); c.stroke(hole);
  c.restore();
}
function iris(cx, cy, r, col = PAL.ink) { if (r < 4) _fillPoly(rectPts(-60, -60, W + 120, H + 120), tone(col)); else irisShape(ellPts(cx, cy, r, r, 40), col); }

// The card wipe (called brushWipe, the name every Chapter knows): five tall plain card strips dealt onto the stage
// from the left, the far one first, each landing a little askew and a little over the one before, so their edges
// show the thin soft shadows of stacked layers. They cover the frame (p 0 → .5), then slide on off to the right, the
// top one first, sweeping the next shot in from the left (.5 → 1).
// Cut to the next shot at p = .5, under full cover. Call it last in both shots:
//   end of shot A:   if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6);
//   start of shot B: if (lt < .3) brushWipe(.5 + lt / .6);
// Colours: pick them from the two sides of the Seam, so the colour arc carries through it; the theatre adds its own
// soft sage, cream and mustard strips between them.
function brushWipe(p, cols = [PAL.clayDk, PAL.clay]) {
  if (p <= 0 || p >= 1) return;
  const N = 5, ov = 70, sw = (W + ov * 2) / N, lag = .11, dur = 1 - lag * (N - 1);
  const C = [tone(cols[0]), mixCol(tone(PAL.sap), tone(PAL.stone), .35), tone(PAL.cream), mixCol(tone(PAL.gold), tone(PAL.cream), .2), tone(cols[1] ?? cols[0])];
  for (let s = N - 1; s >= 0; s--) {   // the far right strip lies at the bottom, the left one on top
    const slot = -ov + s * sw - 30, tilt = (hash(s * 4.1) - .5) * .03, dy = (hash(s * 2.7) - .5) * 30;
    let x;
    if (p < .5) { const e = easeOut(clamp((p * 2 - (N - 1 - s) * lag) / dur)); x = lerp(-sw - 160, slot, e); }
    else { const e = ease(clamp(((p - .5) * 2 - s * lag) / dur)); x = slot + e * (W + 200 - slot); }
    if (x > W + 40 || x + sw + 60 < -40) continue;
    const cx = x + (sw + 60) / 2, cy = H / 2 + dy, hw = (sw + 60) / 2, hh = H / 2 + 90, ca = Math.cos(tilt), sa = Math.sin(tilt);
    const at = (u, v) => [cx + ca * u - sa * v, cy + sa * u + ca * v];
    _piece([at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)], C[s], 1, { haze: 0 });
  }
}
