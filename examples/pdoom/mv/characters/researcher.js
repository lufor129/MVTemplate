// researcher.js: the Researcher, a Lead of the P(doom) MV: the "I" who sings. A small human in a lab coat with round
// glasses, ported from PDoomVideo/src/cast.js to the Character Contract (engine/acting.js).
// researcher(x, y, s, pose): (x, y) is the ground point between the feet, s is the unit. About 13.2s to the top of the
// hair (Clawd is 8u tall), so s = u * .75 puts the head at Clawd's eye line.
//
// Local coordinates (for the o.draw / o.handL / o.handR hooks): feet at y 0, hips -2.3s, shoulders (±1.75s, -7.6s),
// head centre (0, -10.7s) radius 2.35s. Arm angles as Clawd's: 0 = straight out, positive = raised, about -1.25 hangs.
// Hand hooks are called at the hand centre in arm space (x = outward).
//
// Its own pose fields, beyond the standard ones: view (front | back), eyes ('dot','wide','star','swirl','closed','sad',
// 'x','heart','look'), brows ('worried','angry','up'), mouth ('smile','o','O','flat','wobble','grin'), run (phase),
// sit, hairUp (0..1, hair stands on end), glassesTilt, bowtie, blush, coat / pants / shirt colours, spin (0..1, squashes x).

const R_SKIN = '#F2C4A0', R_HAIR = '#3A2B38', R_COAT = '#FBF4E6', R_PANTS = '#3D4A7A';

function drawResearcher(x, y, s, o) {
  const rs = part => boilSeed(`${o.boilKey} ${part}`);
  const sw = clamp(s / 13, .45, 2.2), J = s * .05, sq = (o.sq || 0) + (o.take || 0);
  const coat = o.coat || R_COAT, pants = o.pants || R_PANTS;
  rs('shadow');
  if (!o.noShadow) paint(ellPts(x, y + s * .1, s * 3.2, s * .7, 18), { fill: PAL.ink, fillOp: 80, bleed: .2, tex: .3, border: .1, ink: null });

  push();
  translate(x, y + (o.dy || 0) * s);
  if (o.rot) rotate(o.rot);
  const back = o.back || o.view === 'back', sx = (o.flip ? -1 : 1) * (o.spin != null ? Math.cos(o.spin * TAU) : 1) * (1 + .3 * clamp(o.smear || 0));
  scale(sx * (1 + sq * .5), 1 - sq);

  // legs
  const leg = (side, i) => {
    rs('leg' + i);
    let h = o.sit ? 1.2 : 2.4, a = 0;
    if (o.walk != null) { const ph = Math.sin((o.walk + (i ? .5 : 0)) * TAU); if (ph > 0) h -= ph * .8; }
    if (o.run != null) a = Math.sin((o.run + (i ? .5 : 0)) * TAU) * .55;
    push(); translate(side * .8 * s, -2.3 * s); rotate(a);
    paint(rectPts(-.48 * s, 0, .96 * s, h * s, J), { wash: pants, fill: PAL.indigo, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(side * .15 * s, h * s, .78 * s, .38 * s, 12), { wash: PAL.ink, ink: null });
    pop();
  };
  leg(-1, 0); leg(1, 1);

  // arms behind the coat edge
  const arm = (side, a, hook) => {
    rs('arm' + side);
    push(); translate(side * 1.75 * s, -7.6 * s); rotate(side < 0 ? a : -a);
    paint(rectPts(side < 0 ? -3 * s : 0, -.44 * s, 3 * s, .88 * s, J), { wash: coat, fill: PAL.sky, fillOp: 45, tex: .5, ink: PAL.ink, sw: sw * .7 });
    translate(side * 3.2 * s, 0);
    paint(ellPts(0, 0, .55 * s, .55 * s, 12), { wash: R_SKIN, ink: PAL.ink, sw: sw * .6 });
    if (hook) { if (side < 0) scale(-1, 1); hook(s, sw); }
    pop();
  };
  arm(-1, o.aL ?? -1.25, o.handL); arm(1, o.aR ?? -1.25, o.handR);

  // coat
  rs('coat');
  const coatPts = [[-1.95 * s, -8.2 * s], [1.95 * s, -8.2 * s], [2.45 * s, -2.1 * s], [-2.45 * s, -2.1 * s]];
  paint(coatPts, { wash: coat, fill: PAL.sky, fillOp: 60, bleed: .08, tex: .7, border: .6, ink: null });
  if (!back) {
    paint([[-.8 * s, -8.2 * s], [.8 * s, -8.2 * s], [0, -6.4 * s]], { wash: o.shirt || PAL.teal, ink: null });            // shirt V
    inkLine([[-.8 * s, -8.2 * s], [0, -6.3 * s], [.8 * s, -8.2 * s]], sw * .6, PAL.ink, 'inkfine', 0);                   // lapels
    inkLine([[0, -6.3 * s], [0, -2.2 * s]], sw * .5, PAL.ink, 'inkfine', 0);                                             // coat split
    paint(rectPts(-1.7 * s, -6.2 * s, 1.1 * s, .9 * s, J * .5), { ink: PAL.ink, sw: sw * .5 });                            // pocket
    inkLine([[-1.45 * s, -6.2 * s], [-1.4 * s, -6.9 * s]], sw * .6, PAL.rose, 'inkfine', 0);
    inkLine([[-1.05 * s, -6.2 * s], [-1.0 * s, -7.0 * s]], sw * .6, PAL.teal, 'inkfine', 0);
    for (const by of [-5.2, -4]) paint(ellPts(.35 * s, by * s, .13 * s, .13 * s, 8), { wash: PAL.ink, ink: null });
    if (o.bowtie) { paint([[0, -8 * s], [-.9 * s, -8.5 * s], [-.9 * s, -7.5 * s]], { wash: '#C8324A', ink: PAL.ink, sw: sw * .5 }); paint([[0, -8 * s], [.9 * s, -8.5 * s], [.9 * s, -7.5 * s]], { wash: '#C8324A', ink: PAL.ink, sw: sw * .5 }); }
  } else inkLine([[0, -8 * s], [0, -2.2 * s]], sw * .5, PAL.ink, 'inkfine', 0);
  paint(coatPts, { ink: PAL.ink, sw: sw * .9 });

  // head
  rs('head');
  const hx = 0, hy = -10.7 * s, R = 2.35 * s;
  paint(rectPts(-.45 * s, -8.9 * s, .9 * s, .9 * s), { wash: R_SKIN, ink: null });                                          // neck
  paint(ellPts(hx, hy, R, R * .97, 26, J * .6), { wash: R_SKIN, fill: '#E9A98A', fillOp: 50, tex: .6, border: .5, ink: PAL.ink, sw: sw * .85 });
  const up = clamp(o.hairUp || 0);
  if (back) {
    paint(ellPts(hx, hy - .1 * s, R * 1.04, R * 1.0, 24, J), { wash: R_HAIR, fill: PAL.violet, fillOp: 40, tex: .6, ink: PAL.ink, sw: sw * .8 });
  } else {
    // hair cap with bangs, plus a tuft that stands up when scared
    const hp = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * 1.06 + i / 12 * Math.PI * .88; hp.push([hx + Math.cos(a) * R * 1.08, hy + Math.sin(a) * R * 1.06]); }
    hp.push([1.7 * s, -11.1 * s], [1.1 * s, -11.8 * s], [.5 * s, -11.2 * s], [-.2 * s, -11.9 * s], [-.9 * s, -11.25 * s], [-1.5 * s, -11.9 * s], [-2.1 * s, -11.0 * s]);
    paint(hp, { wash: R_HAIR, fill: PAL.violet, fillOp: 40, tex: .6, ink: PAL.ink, sw: sw * .7 });
    inkLine([[.2 * s, -13.1 * s], [.6 * s, (-14.2 - up * 1.4) * s], [1.3 * s, (-14.1 - up * 1.2) * s]], sw * 1.1, R_HAIR, 'ink', .6);
    if (up > .05) for (let i = -2; i <= 2; i++) inkLine([[i * .9 * s, -12.9 * s], [i * 1.3 * s, (-13.4 - up * 1.8) * s]], sw * .9, R_HAIR, 'ink', 0);
    if (o.blush) for (const bx of [-1.55, 1.55]) paint(ellPts(bx * s, -9.9 * s, .55 * s, .3 * s, 12), { fill: PAL.rose, fillOp: 160, bleed: .2, ink: null });
    rFace(s, sw, o);
  }
  if (o.draw) o.draw(s, sw);
  pop();
}

function rFace(s, sw, o) {
  const e = (o.squint || 0) > .5 ? 'closed' : (o.eyes || 'dot'), blink = e === 'dot' && ((T * .8 + 1.3) % 3.7) < .12;
  const gy = -10.55 * s, lx = (o.lookX || 0) * .25 * s, ly = (o.lookY || 0) * .2 * s;
  push(); translate(0, gy); rotate(o.glassesTilt || 0); translate(0, -gy);
  for (const side of [-1, 1]) {
    const cx = side * 1.0 * s, cy = gy;
    paint(ellPts(cx, cy, .82 * s, .8 * s, 18), { wash: '#FFFFFF', washOp: e === 'star' ? 0 : 70, fill: e === 'star' ? PAL.ochre : null, fillOp: 120, ink: null });
    if (e === 'dot' || e === 'look' || e === 'sad') {
      if (blink) inkLine([[cx - .3 * s, cy], [cx + .3 * s, cy]], sw * .8, PAL.ink, 'ink', 0);
      else paint(ellPts(cx + lx, cy + ly, .21 * s, .25 * s, 10), { wash: PAL.ink, ink: null });
    } else if (e === 'wide') {
      paint(ellPts(cx + lx, cy + ly, .34 * s, .38 * s, 12), { wash: PAL.ink, ink: null });
      paint(ellPts(cx + lx + .12 * s, cy + ly - .14 * s, .09 * s, .09 * s, 8), { wash: PAL.cream, ink: null });
    } else if (e === 'star') paint(starPts(cx, cy, .62 * s * (1 + .15 * Math.sin(T * 13 + side))), { wash: PAL.cream, ink: PAL.ink, sw: sw * .35 });
    else if (e === 'closed') inkLine([[cx - .35 * s, cy + .1 * s], [cx, cy - .22 * s], [cx + .35 * s, cy + .1 * s]], sw * .8, PAL.ink, 'ink', .4);
    else if (e === 'x') { inkLine([[cx - .3 * s, cy - .3 * s], [cx + .3 * s, cy + .3 * s]], sw * .7, PAL.ink, 'ink', 0); inkLine([[cx + .3 * s, cy - .3 * s], [cx - .3 * s, cy + .3 * s]], sw * .7, PAL.ink, 'ink', 0); }
    else if (e === 'heart') paint(heartPts(cx, cy, .45 * s), { wash: '#E2476E', ink: null });
    else if (e === 'swirl') { const sp = []; for (let k = 0; k < 14; k++) { const a = k * .8 + T * 7 * side, r = k * .05 * s; sp.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } inkLine(sp, sw * .5, PAL.ink, 'inkfine', .6); }
    brush.noFill(); brush.noWash(); brush.noHatch(); brush.set('inkfine', PAL.ink, sw * .9);
    brush.beginShape(0); for (const p of ellPts(cx, cy, .82 * s, .8 * s, 18)) brush.vertex(p[0], p[1]); brush.endShape(true);
  }
  inkLine([[-.2 * s, gy - .1 * s], [.2 * s, gy - .1 * s]], sw * .7, PAL.ink, 'inkfine', 0);
  pop();
  // brows
  const b = o.brows || (e === 'sad' ? 'worried' : null);
  if (b) for (const side of [-1, 1]) {
    const bx = side * 1.0 * s, by = -11.75 * s;
    const tilt = b === 'worried' ? -side * .3 : b === 'angry' ? side * .35 : 0, lift = b === 'up' ? -.35 * s : 0;
    inkLine([[bx - .45 * s, by + lift + tilt * s * .6], [bx + .45 * s, by + lift - tilt * s * .6]], sw * .8, R_HAIR, 'ink', 0);
  }
  // mouth
  const m = o.mouth || 'smile', my = -9.05 * s;
  if (m === 'smile') inkLine([[-.55 * s, my - .1 * s], [0, my + .28 * s], [.55 * s, my - .1 * s]], sw * .7, PAL.ink, 'ink', .6);
  else if (m === 'o') paint(ellPts(0, my + .1 * s, .28 * s, .34 * s, 10), { wash: '#6A2A35', ink: PAL.ink, sw: sw * .4 });
  else if (m === 'O') paint(ellPts(0, my + .25 * s, .55 * s, .7 * s, 14), { wash: '#6A2A35', ink: PAL.ink, sw: sw * .5 });
  else if (m === 'flat') inkLine([[-.45 * s, my], [.45 * s, my]], sw * .7, PAL.ink, 'ink', 0);
  else if (m === 'wobble') inkLine([[-.7 * s, my], [-.35 * s, my - .18 * s], [0, my], [.35 * s, my - .18 * s], [.7 * s, my]], sw * .6, PAL.ink, 'ink', .3);
  else if (m === 'grin') paint([[-.8 * s, my - .15 * s], [.8 * s, my - .15 * s], [.5 * s, my + .5 * s], [-.5 * s, my + .5 * s]], { wash: '#6A2A35', ink: PAL.ink, sw: sw * .5, curv: .4 });
}


// Each emotion is a face and a way of moving, locked to the beat like Clawd's.
const _rb = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { s1, ab: Math.abs(s1), hit: pulse(t) }; };
const RESEARCHER_EMO = {
  neutral:   { eyes: 'dot', mouth: 'smile', take: .3, body: t => { const b = _rb(t); return { dy: -.15 * b.ab, aL: -1.25 + .05 * b.s1, aR: -1.25 - .05 * b.s1 }; } },
  happy:     { eyes: 'closed', mouth: 'grin', blush: .6, take: .6, body: t => { const b = _rb(t); return { dy: -.8 * b.ab, sq: .08 * b.hit, aL: -.4 + .4 * b.s1, aR: -.4 - .4 * b.s1 }; } },
  charmed:   { eyes: 'star', mouth: 'O', blush: .8, emote: 'spark', take: .9, body: t => { const b = _rb(t); return { dy: -.4 * b.ab, rot: .04 * b.s1, aL: .3, aR: .3 }; } },
  nervous:   { eyes: 'look', brows: 'worried', mouth: 'wobble', emote: 'sweat', take: .5, body: t => ({ lookX: beatN(t) % 2 ? .8 : -.8, dx: .08 * Math.sin(t * TAU * 6), aL: -.9 + .15 * Math.sin(t * TAU * 5), aR: -.9 + .15 * Math.sin(t * TAU * 5 + 1) }) },
  scared:    { eyes: 'wide', brows: 'worried', mouth: 'O', hairUp: 1, emote: '!!', take: 1.2, body: t => ({ dx: .1 * Math.sin(t * TAU * 22), sq: -.06, aL: 1.1 + .1 * Math.sin(t * TAU * 17), aR: 1.1 + .1 * Math.sin(t * TAU * 19) }) },
  surprised: { eyes: 'wide', brows: 'up', mouth: 'o', emote: '!', fade: true, take: 1.2, body: t => ({ sq: -.08, aL: .6, aR: .6 }) },
  sad:       { eyes: 'sad', mouth: 'flat', emote: 'cloud', take: .3, body: t => ({ sq: .06, lookY: .6, aL: -1.35, aR: -1.35 }) },
  love:      { eyes: 'heart', mouth: 'smile', blush: 1, emote: 'hearts', take: .7, body: t => { const b = _rb(t); return { rot: .06 * Math.sin(bpOf(t) * Math.PI / 2), dy: -.4 * b.ab, aL: -.6, aR: -.6 }; } },
  dizzy:     { eyes: 'swirl', mouth: 'wobble', glassesTilt: .3, emote: 'stars', take: .7, body: t => { const a = t * TAU * .8; return { rot: .12 * Math.sin(a), dx: .5 * Math.sin(a), aL: -.6 + .5 * Math.sin(a * 1.3), aR: -.6 - .5 * Math.sin(a * 1.3) }; } },
  angry:     { eyes: 'dot', brows: 'angry', mouth: 'flat', emote: 'anger', take: .8, body: t => { const b = _rb(t); return { dx: .06 * Math.sin(t * TAU * 18), sq: .1 * b.hit, aL: -.3, aR: -.3 }; } },
  confused:  { eyes: 'look', brows: 'up', mouth: 'wobble', emote: '?', take: .5, body: t => ({ rot: .08 * Math.sin(bpOf(t) * Math.PI / 4), lookX: .6, aL: -1.2, aR: 1.4 }) },
  ko:        { eyes: 'x', mouth: 'O', glassesTilt: -.4, emote: 'stars', take: 1, body: t => ({ sq: .2, rot: .1, aL: -1.4, aR: -1.3 }) },
};

const researcher = character({
  name: 'researcher',
  size: [5, 14],
  views: ['front', 'back'],
  emotions: RESEARCHER_EMO,
  rest: { dy: 0, sq: 0, aL: -1.25, aR: -1.25 },
  fades: ['blush', 'hairUp', 'glassesTilt'],
  draw: drawResearcher,
  emoteAt: (x, y, s, o, top) => top ? [x, y + (o.dy || 0) * s - 15.6 * s] : [x + (o.flip ? -1 : 1) * 3.2 * s, y + (o.dy || 0) * s - 13.4 * s],
});
