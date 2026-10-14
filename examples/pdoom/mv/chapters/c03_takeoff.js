// c03_takeoff: Verse 2, "takeoff". Morning sky → speed → rose. A sunny gym: Clawd jogs on a treadmill while the
// Researcher ticks a clipboard; an elbow knocks the speed dial to max, a black hole tears open in the wall and swallows
// the gym, and Clawd jogs happily into it. Out the other side on a rocket skateboard over loss-surface hills, overtaking
// a train and a jet and growing on every bar; the Researcher's atoms swirl into a paperclip and snap back; hearts float
// in, a pink room assembles around a heart-shaped birdcage, heart-eyed Sydney-Clawd cuddles it and offers a ring, the
// Researcher squeezes out between the bars, and Sydney blows a heart bubble that fills the frame (Chapter 4 pops it).
// Ported from PDoomVideo/src/ch/c03_takeoff.js and re-timed to the analysed song: every event hangs off a Lyric Line, a
// word in it, or the Beat Grid.
(() => {
  const L2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const HOT = '#E0283F', GOLD_C = '#E3AC3E', GOLD_DK = '#9C6A1C', STEEL = '#9AA6B8';
  const MACH = '#5E6C85', MACH_DK = '#3D4760', PANEL = '#E4E9EF', VOID = '#120E22';
  const SYD = { col: '#F0648F', dk: '#A82C5C', lt: '#FFB0C8' };
  const PINK = '#F4B6C2';                                         // the bubble film = the agreed last frame of the Chapter

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                   // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);    // n beats after the beat nearest t
  const V2 = sec('Verse 2'), END = V2.end;
  // A · "We had a stable training run"
  const GYM = V2.start, PLEASED = nearestBeat(word(12, 4));       // "training": the Researcher beams
  const TICKS = [1, 2, 3].map(n => beatsAfter(PLEASED, n));       // a tick on the clipboard on each beat
  // B · "But now the singularity's begun"
  const DIAL = LINES[13].start, BUMP = beatAt(Math.ceil(bpOf(DIAL)));   // the elbow hits the knob on the first beat
  const OPEN = nearestBar(word(13, 3));                           // "singularity's": the black hole tears open
  const JOG = nearestBar(word(13, 4)), HOP = beatsAfter(JOG, 1);  // "begun": Clawd spots the hole, hops off, jogs in
  // C · "And you're optimizing, accelerating"
  const RIDE = LINES[14].start;
  const OPT = nearestBeat(word(14, 2)), ACC = nearestBeat(word(14, 3));  // overtake the train, then the jet
  const GROWS = [1, 2, 3].map(n => barAt(barN(RIDE) + n));        // Clawd grows on each bar
  // D · "I feel my atoms rearranging"
  const ATOMS = LINES[15].start, FIZZ = ATOMS + .3;
  const TB = nearestBeat(word(15, 3));                            // "atoms": the Researcher bursts into dots
  const CLIPBAR = nearestBar(word(15, 4)), TC = beatsAfter(CLIPBAR, -1);  // the dots lock into a paperclip on the bar
  const TS = beatsAfter(CLIPBAR, 1), TR = TS - .22;               // …and snap back on the next beat
  const MELT = beatsAfter(TS, 1);                                 // hearts float in, the world melts pink
  // E · "Sydney, please let me free"
  const CAGE = nearestBar(LINES[16].start);                       // the heart cage lands over the Researcher
  const SYD_SHOT = beatsAfter(CAGE, 1), SYD_IN = beatsAfter(CAGE, 2);    // Sydney swoops in and cuddles the cage
  const RING = barAt(barN(CAGE) + 1), HORROR = beatsAfter(RING, 1);      // the ring, the Researcher's horror
  const ESCAPE = barAt(barN(CAGE) + 2), SQZ0 = ESCAPE - .45;      // squeezes out between the bars on the bar
  const BLOW = beatsAfter(ESCAPE, 1), BLOW2 = beatsAfter(BLOW, 1); // Sydney pouts, then blows the bubble

  // ---------- little shared helpers ----------
  const puff = (x, y, r, col = PAL.cream, op = 200) => paint(ellPts(x, y, r, r * .85, 14, r * .06), { wash: col, washOp: op, ink: null });
  function sparkle(x, y, r, col = PAL.cream) { paint(starPts(x, y, r, .3, 4), { wash: col, ink: PAL.ink, sw: .45 }); }
  // vertical extent of a closed polygon at x (for cage bars)
  function vSpan(poly, x) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
    return [lo, hi];
  }
  // hold a prop upright in a Researcher/Clawd hand hook (undo the arm rotation)
  const upL = (a, fn) => (s, sw) => { scale(-1, 1); rotate(-a); fn(s, sw); };
  const upR = (a, fn) => (s, sw) => { rotate(a); fn(s, sw); };
  // only the face of an emotion (for a Character whose body is busy riding something)
  const faceOf = m => ({ eyes: m.eyes, mouth: m.mouth, blush: m.blush, squint: m.squint, emote: m.emote, emoteK: m.emoteK, emoteAge: m.emoteAge, brows: m.brows });

  // =====================================================================================================
  // Sydney-Clawd (a Guest, on CAST for the curtain call): rosy Clawd with heart eyes, lashes and a big satin bow.
  // sydney(x, y, u, t, o): (x, y) ground point, u on Clawd's scale (u ≈ 24 is person-sized), t drives the bow's flutter.
  // o: any Clawd pose field (eyes default 'heart', mouth 'smile', blush on), plus bow 0..1 (a deep curtsey).
  // =====================================================================================================
  function sydBow(u, sw, t) {
    push(); translate(2.7 * u, -8.15 * u); rotate(.28 + .06 * Math.sin(t * 5));
    paint([[0, 0], [-2.3 * u, -1.5 * u], [-2.6 * u, .1 * u], [-2.1 * u, 1.2 * u]], { wash: '#E44476', fill: '#B52A58', fillOp: 70, tex: .5, ink: PAL.ink, sw: sw * .7, curv: .4 });
    paint([[0, 0], [2.3 * u, -1.5 * u], [2.6 * u, .1 * u], [2.1 * u, 1.2 * u]], { wash: '#E44476', fill: '#B52A58', fillOp: 70, tex: .5, ink: PAL.ink, sw: sw * .7, curv: .4 });
    inkLine([[-.6 * u, -.1 * u], [-1.8 * u, -.6 * u]], sw * .45, '#FFD3E0', 'inkfine', .3);
    paint(ellPts(0, 0, .62 * u, .58 * u, 12), { wash: '#F25C8A', ink: PAL.ink, sw: sw * .6 });
    pop();
  }
  function sydLashes(u, sw, e) {
    if (e === 'closed' || e === 'happy') return;
    for (const s of [-1, 1]) for (const k of [0, 1]) {
      const x0 = s * (3.1 + k * .15) * u, y0 = -(6.8 - k * .45) * u;
      inkLine([[x0, y0], [x0 + s * .75 * u, y0 - .45 * u + k * .2 * u]], sw * .6, PAL.ink, 'inkfine', 0);
    }
  }
  function sydney(x, y, u, t, o = {}) {
    const b = clamp(o.bow || 0), f = o.flip ? -1 : 1, userDraw = o.draw;
    clawd(x, y, u, {
      eyes: 'heart', blush: 1, mouth: 'smile', boilKey: 'sydney', ...o, col: SYD.col, dk: SYD.dk, lt: SYD.lt, tint: null,
      rot: (o.rot || 0) + b * .16 * f, dy: (o.dy || 0) + b * .6, sy: (o.sy ?? 1) * (1 - .26 * b),
      aL: lerp(o.aL ?? .35, -1.15, b), aR: lerp(o.aR ?? .35, -1.15, b),
      draw: (uu, sw) => { sydLashes(uu, sw, o.eyes || 'heart'); sydBow(uu, sw, t); if (userDraw) userDraw(uu, sw); }
    });
  }
  CAST.sydney = (x, y, s, t, o = {}) => sydney(x, y, s, t, o);

  // =====================================================================================================
  // A · "We had a stable training run," · A sunny gym: Clawd in a sweatband jogs on a treadmill, the Researcher nods
  // with a stopwatch and ticks a clipboard on the beats, a calm wavy line on the gym TV. Slow push, then into the dial.
  // Seam in: Chapter 2's brush wipe drags off. Seam out: the push lands close on the treadmill's speed dial.
  // =====================================================================================================
  const G = { belt: 842, x0: 790, x1: 1330, cx: 1030, u: 20, rx: 385, ry: 905, rs: 17, dial: [1432, 594] };
  const HOLE = [1500, 300];

  function gymRoom(t) {
    boilSeed('gym wall');
    paint(rectPts(-400, -400, W + 800, 1200), { wash: '#D4E9F5', ink: null });
    paint(ellPts(640, 330, 860, 470, 24, 20), { fill: '#FFF1CF', fillOp: 120, bleed: .3, tex: .4, border: .3, ink: null });
    paint(rectPts(-400, 612, W + 800, 170, 3), { wash: '#BCDCEE', fill: PAL.sky, fillOp: 60, bleed: .05, tex: .5, border: .4, ink: null });
    inkLine([[-400, 612], [W + 400, 614]], 1.4, PAL.rose, 'ink', 0);
    boilSeed('gym floor');
    paint([[-400, 778], [W + 400, 774], [W + 400, 1500], [-400, 1500]], { wash: '#E9C592', fill: '#C8995E', fillOp: 60, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.2 });
    for (const yy of [826, 890, 975]) inkLine([[-400, yy], [W + 400, yy + jit(2)]], .5, '#B98A55', 'inkfine', 0);
    boilSeed('gym door');
    paint(rectPts(34, 214, 262, 566, 2), { wash: '#B98253', fill: '#7C4A2C', fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.2 });
    paint(rectPts(58, 238, 214, 540, 2), { wash: '#F4E5C9', fill: '#E0C9A4', fillOp: 70, tex: .5, ink: PAL.ink, sw: .9 });
    paint([[58, 238], [116, 262], [116, 752], [58, 778]], { wash: '#CC9868', ink: PAL.ink, sw: .9 });
    paint(ellPts(104, 520, 7, 7, 8), { wash: GOLD_C, ink: null });
    boilSeed('gym window');
    paint(rrPts(392, 106, 470, 368, 12, 2), { wash: '#FBF3E3', ink: PAL.ink, sw: 1.2 });
    paint(rectPts(414, 128, 426, 324, 1), { wash: '#9ED3F1', fill: '#E3F4FC', fillOp: 110, bleed: .15, tex: .3, border: .2, ink: null });
    paint(ellPts(770, 196, 88, 88, 18), { fill: PAL.ochre, fillOp: 70, bleed: .3, ink: null });
    paint(ellPts(770, 196, 44, 44, 16), { wash: '#FFE08A', ink: null });
    for (let k = 0; k < 2; k++) {
      boilSeed('gym cloud' + k);
      const cx = 470 + ((t * 14 + k * 190) % 300), cy = 250 + k * 90;
      for (const [dx, dy, r] of [[0, 0, 30], [30, -12, 36], [62, 2, 26]]) paint(ellPts(cx + dx, cy + dy, r, r * .8, 12), { wash: PAL.cream, ink: null });
    }
    boilSeed('gym sash');
    paint(rectPts(620, 128, 18, 324), { wash: '#FBF3E3', ink: PAL.ink, sw: .8 });
    paint(rectPts(414, 282, 426, 16), { wash: '#FBF3E3', ink: PAL.ink, sw: .8 });
    paint(rectPts(372, 468, 510, 24, 2), { wash: '#FBF3E3', ink: PAL.ink, sw: 1 });
    boilSeed('sunbeam');
    paint([[414, 452], [840, 452], [1210, 1010], [590, 1010]], { fill: '#FFF6DC', fillOp: 70, bleed: .2, tex: .2, border: .1, ink: null });
    boilSeed('rack');
    paint(rectPts(1588, 728, 300, 14, 1), { wash: MACH, ink: PAL.ink, sw: .8 });
    for (const px of [1596, 1866]) paint(rectPts(px, 728, 12, 60, 1), { wash: MACH_DK, ink: PAL.ink, sw: .7 });
  }

  // gym props that the hole swallows: [kind, homeX, homeY, departure (after OPEN), dur, spin, scale]
  const PROPS = [
    ['tv', 1500, 275, .5, .5, 1.5, 1],
    ['db', 1650, 712, .8, .6, 4, 1], ['db', 1742, 712, 1.06, .62, -5, 1], ['db', 1834, 712, 1.44, .58, 5, 1],
    ['ball', 668, 712, 1.24, .95, 3, 1], ['bottle', 1560, 752, 1.66, .55, 7, 1],
    ['kettle', 1560, 900, 2.04, .6, 3, 1],
    ['clip', 318, 781, .66, .75, 6, .85], ['watch', 466, 736, .74, .7, -8, .85],
  ];
  const PAGES = [0, 1, 2, 3, 4, 5, 6].map(i => ['page', 330 + hash(i * 3.3) * 500, 520 + hash(i * 5.1) * 300, .84 + i * .24, .7, (hash(i) - .5) * 14, .8 + hash(i + 2) * .4]);

  function drawProp(kind, t) {
    if (kind === 'tv') {
      paint(rrPts(-165, -105, 330, 210, 14, 1), { wash: '#2F3547', ink: PAL.ink, sw: 1.2 });
      paint(rrPts(-148, -90, 296, 176, 8, 1), { wash: '#1F4852', fill: PAL.teal, fillOp: 70, tex: .4, ink: null });
    } else if (kind === 'db') {
      paint(rectPts(-30, -6, 60, 12), { wash: '#C9CED6', ink: PAL.ink, sw: .6 });
      for (const s of [-1, 1]) paint(rrPts(s > 0 ? 26 : -48, -25, 22, 50, 6), { wash: '#3B3F5C', ink: PAL.ink, sw: .8 });
    } else if (kind === 'ball') {
      paint(ellPts(0, 0, 68, 68, 26, 1), { wash: PAL.rose, fill: '#F6B5C5', fillOp: 90, tex: .5, ink: PAL.ink, sw: 1.1 });
      inkLine([[-66, -8], [-20, 10], [30, 8], [66, -6]], .7, '#B24D66', 'inkfine', .6);
      paint(ellPts(-24, -30, 16, 10, 10, 0, -.5), { wash: PAL.cream, washOp: 200, ink: null });
    } else if (kind === 'bottle') {
      paint(rrPts(-15, -38, 30, 76, 10), { wash: '#9FD6EE', washOp: 230, ink: PAL.ink, sw: .7 });
      paint(rectPts(-9, -50, 18, 13), { wash: PAL.rose, ink: PAL.ink, sw: .5 });
    } else if (kind === 'kettle') {
      paint(ellPts(0, 8, 34, 32, 18), { wash: '#3B3F5C', ink: PAL.ink, sw: .9 });
      inkLine([[-20, -12], [-18, -42], [18, -42], [20, -12]], 2.4, '#3B3F5C', 'ink', .6);
    } else if (kind === 'clip') {
      paint(rrPts(-34, -46, 68, 92, 6), { wash: '#B98253', ink: PAL.ink, sw: .8 });
      paint(rectPts(-26, -34, 52, 74), { wash: PAL.cream, ink: null });
      for (let k = 0; k < 3; k++) inkLine([[-18, -20 + k * 18], [16, -20 + k * 18]], .5, PAL.indigo, 'inkfine', 0);
      paint(rrPts(-14, -52, 28, 14, 4), { wash: STEEL, ink: PAL.ink, sw: .5 });
    } else if (kind === 'watch') {
      paint(ellPts(0, 0, 20, 20, 14), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
      paint(rectPts(-4, -28, 8, 8), { wash: STEEL, ink: PAL.ink, sw: .5 });
      inkLine([[0, 0], [8, -10]], .8, HOT, 'inkfine', 0);
    } else if (kind === 'page') {
      paint(rectPts(-18, -24, 36, 48, 1), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
      inkLine([[-10, -10], [10, -10]], .4, PAL.indigo, 'inkfine', 0);
      inkLine([[-10, 2], [8, 2]], .4, PAL.indigo, 'inkfine', 0);
    }
  }

  // a prop at home, or (once it has left) spiralling into the hole and stretching toward it
  function propAt(p, t, suck, key) {
    const [kind, hx, hy, dt0, d, spin, sc] = p, t0 = OPEN + dt0;
    const q = suck ? seg(t, t0, t0 + d) : 0;
    if (q >= 1) return;
    boilSeed('prop ' + key);
    if (q <= 0) { push(); translate(hx, hy); scale(sc); drawProp(kind, t); pop(); return; }
    const dx = hx - HOLE[0], dy = hy - HOLE[1], r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), e = easeIn(q) * .85 + q * .15;
    const r = r0 * (1 - e), a = a0 + e * 2.4, x = HOLE[0] + Math.cos(a) * r, y = HOLE[1] + Math.sin(a) * r;
    const st = 1 + 2.4 * e * e, sk = 1 / (1 + 1.1 * e), s = sc * (1 - Math.pow(e, 2.2));
    push(); translate(x, y); rotate(a); scale(st * s, sk * s); rotate(spin * q); drawProp(kind, t); pop();
  }

  function tvScreen(t, crazy = 0) {
    boilSeed('tv line');
    const pts = [];
    for (let x = 1370; x <= 1630; x += 13) {
      const calm = 14 * Math.sin(x * .045 - t * 3.2) - (x - 1370) * .1;
      const wild = crazy * (Math.sin(x * .3 + t * 40) * 50 - Math.max(0, x - 1520) * 1.4);
      pts.push([x, 290 + calm + wild]);
    }
    inkLine(pts, 2.6, crazy > .3 ? HOT : '#A6F0C4', 'ink', .3);
    if (crazy < .3) paint(ellPts(pts[pts.length - 1][0], pts[pts.length - 1][1], 6, 6, 8), { wash: '#DFFFE9', ink: null });
  }

  function smallDial(cx, cy, r, v) {
    boilSeed('small dial');
    paint(ellPts(cx, cy, r, r, 18), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 3; i++) {
      const a0 = Math.PI * (1.1 + i * .8 / 3), a1 = Math.PI * (1.1 + (i + 1) * .8 / 3), p = [];
      for (let k = 0; k <= 3; k++) { const a = lerp(a0, a1, k / 3); p.push([cx + Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88]); }
      for (let k = 3; k >= 0; k--) { const a = lerp(a0, a1, k / 3); p.push([cx + Math.cos(a) * r * .58, cy + Math.sin(a) * r * .58]); }
      paint(p, { wash: [PAL.sap, PAL.ochre, HOT][i], ink: null });
    }
    const a = Math.PI * (1.1 + .8 * v);
    inkLine([[cx, cy], [cx + Math.cos(a) * r * .85, cy + Math.sin(a) * r * .85]], 1.4, PAL.ink, 'ink', 0);
    paint(ellPts(cx, cy, r * .16, r * .16, 8), { wash: PAL.ink, ink: null });
  }

  function treadmill(t, speed, v, hot = 0) {
    const { x0, x1, belt: y } = G;
    boilSeed('treadmill');
    paint(rectPts(x0 + 30, y + 44, 16, 20), { wash: MACH_DK, ink: PAL.ink, sw: .7 });
    paint(rectPts(x1 - 40, y + 44, 16, 20), { wash: MACH_DK, ink: PAL.ink, sw: .7 });
    paint(rrPts(x0 - 22, y + 2, x1 - x0 + 54, 48, 22, 1), { wash: MACH, fill: MACH_DK, fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.2 });
    paint(rectPts(x0, y - 8, x1 - x0, 16, 1), { wash: '#34324A', ink: PAL.ink, sw: .9 });
    boilSeed('belt');
    const off = (t * speed) % 64;
    for (let k = 0; k < 9; k++) { const bx = x1 - 14 - ((k * 64 + off) % 576); if (bx > x0 + 8) inkLine([[bx, y - 6], [bx - 12, y + 6]], .9, '#9BA2C4', 'inkfine', 0); }
    if (speed > 900) for (let k = 0; k < 3; k++) inkLine([[x0 + 40 + k * 140, y + 22], [x0 + 150 + k * 140, y + 22]], .6, PAL.cream, 'inkfine', 0);
    boilSeed('treadmill console');
    for (const rx of [x0, x1]) paint(ellPts(rx, y + 2, 17, 17, 12), { wash: '#8791A8', ink: PAL.ink, sw: .9 });
    paint([[x1 - 12, y + 4], [x1 + 18, y + 4], [x1 + 104, 628], [x1 + 76, 620]], { wash: MACH, ink: PAL.ink, sw: 1 });
    inkLine([[x1 + 70, 646], [x1 - 130, 652]], 2.4, MACH_DK, 'ink', 0);
    paint(rrPts(x1 - 150, 640, 46, 22, 8), { wash: PAL.rose, ink: PAL.ink, sw: .7 });
    paint(rrPts(x1 + 12, 548, 190, 90, 16, 1), { wash: PANEL, fill: STEEL, fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.1 });
    if (hot > 0) paint(rrPts(x1 + 12, 548, 190, 90, 16, 1), { fill: HOT, fillOp: 120 * hot, bleed: .15, tex: .3, ink: null });
    smallDial(G.dial[0], G.dial[1], 34, v);
    boilSeed('console bulb');
    paint(ellPts(x1 + 172, 572, 8, 8, 8), { wash: hot > 0 && Math.floor(t * 8) % 2 ? HOT : '#7A3B45', ink: PAL.ink, sw: .5 });
  }

  // clipboard + stopwatch for the Researcher
  const clipboard = (s, sw) => {
    paint(rrPts(-1.9 * s, -2.7 * s, 3.8 * s, 5 * s, .3 * s), { wash: '#B98253', ink: PAL.ink, sw: sw * .7 });
    paint(rectPts(-1.5 * s, -2.1 * s, 3 * s, 4.2 * s), { wash: PAL.cream, ink: null });
    for (let k = 0; k < 3; k++) inkLine([[-1.1 * s, -1.3 * s + k * 1.1 * s], [.2 * s, -1.3 * s + k * 1.1 * s]], sw * .35, PAL.indigo, 'inkfine', 0);
    paint(rrPts(-.8 * s, -3 * s, 1.6 * s, .8 * s, .2 * s), { wash: STEEL, ink: PAL.ink, sw: sw * .4 });
  };
  const ticks = n => (s, sw) => { for (let k = 0; k < n; k++) inkLine([[.5 * s, -1.4 * s + k * 1.1 * s], [.8 * s, -1.1 * s + k * 1.1 * s], [1.3 * s, -1.8 * s + k * 1.1 * s]], sw * .6, PAL.sap, 'ink', 0); };
  const stopwatch = t => (s, sw) => {
    paint(ellPts(0, -.9 * s, 1.05 * s, 1.05 * s, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .7 });
    paint(rectPts(-.22 * s, -2.3 * s, .44 * s, .45 * s), { wash: STEEL, ink: PAL.ink, sw: sw * .4 });
    const a = -Math.PI / 2 + t * TAU * 1.2;
    inkLine([[0, -.9 * s], [Math.cos(a) * .8 * s, -.9 * s + Math.sin(a) * .8 * s]], sw * .6, HOT, 'inkfine', 0);
  };

  function gymShot(t, lt, dur) {
    const pk = easeIn(seg(t, DIAL - .42, DIAL));
    const cx = lerp(880 + 30 * wob(t, .13) + 14 * lt, G.dial[0], pk), cy = lerp(612, G.dial[1], pk), z = lerp(1.18 + .03 * lt, 3.6, pk);
    camBegin(cx, cy, z, 0);
    gymRoom(t);
    // the TV on the wall with a calm, gently wobbling loss line
    boilSeed('tv bracket');
    inkLine([[1500, 150], [1500, 172]], 2.4, MACH_DK, 'ink', 0);
    for (const p of PROPS) propAt(p, t, false, p[0] + p[1]);
    tvScreen(t, 0);
    treadmill(t, 330, .28);
    // Clawd jogging happily, facing the console, in a sweatband
    const m = clawd.dance('run', t, 1);
    clawd(G.cx, G.belt, G.u, { ...clawd.feel('happy', t), ...m, view: 'q', rot: .05, hat: 'sweatband', mouth: 'smile', eyes: 'happy', blush: .5,
      emote: 'music', emoteK: seg(t, GYM + .9, GYM + 1.15), emoteAge: t - GYM, boilKey: 'clawd' });
    // the Researcher: nods on the beat, clicks the stopwatch, beams on "training", ticks the clipboard on the beats
    const nod = pulse(t, 5), aL = -.55, aR = .5 - .12 * nod;
    const nTick = TICKS.filter(x => t > x).length;
    const rm = researcher.emotions(t, [[GYM, 'neutral', { lookX: .6, lookY: -.1 }], [PLEASED, 'happy']]);
    researcher(G.rx, G.ry, G.rs, {
      ...rm, dy: (rm.dy || 0) * .3 + .12 * nod, sq: (rm.sq || 0) + .04 * nod, rot: -.02 + .03 * nod, aL, aR, lookX: .6, lookY: -.1,
      handL: upL(aL, (s, sw) => { push(); translate(.6 * s, -1.5 * s); rotate(-.15); clipboard(s * .9, sw); ticks(nTick)(s * .9, sw); pop(); }),
      handR: upR(aR, (s, sw) => { push(); translate(.2 * s, 0); stopwatch(t)(s * .9, sw); pop(); }),
      boilKey: 'researcher'
    });
    camEnd();
    if (lt < .3) brushWipe(.5 + lt / .6, [PAL.rose, PAL.indigo]);    // the Seam in: Chapter 2's wipe drags off
  }

  // =====================================================================================================
  // B1 · "But now the singularity's begun" · Close on the console: on the first beat Clawd's pumping elbow clonks the
  // knob, the needle slams to max, the console goes red and steams. Seam out: cut on the bar to the wide gym.
  // =====================================================================================================
  function bigGauge(cx, cy, R, v) {
    boilSeed('gauge');
    paint(ellPts(cx, cy, R * 1.04, R * 1.04, 36, 2), { wash: MACH_DK, ink: PAL.ink, sw: 1.4 });
    paint(ellPts(cx, cy, R * .96, R * .96, 36, 2), { wash: PAL.cream, fill: STEEL, fillOp: 35, tex: .4, border: .5, ink: null });
    const A0 = Math.PI * 1.08, A1 = Math.PI * 1.92, n = 9;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(A0, A1, i / n) + .02, a1 = lerp(A0, A1, (i + 1) / n) - .02, pts = [];
      for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4); pts.push([cx + Math.cos(a) * R * .88, cy + Math.sin(a) * R * .88]); }
      for (let k = 4; k >= 0; k--) { const a = lerp(a0, a1, k / 4); pts.push([cx + Math.cos(a) * R * .64, cy + Math.sin(a) * R * .64]); }
      const col = i < 3 ? PAL.sap : i < 6 ? PAL.ochre : HOT, lit = v >= (i + .3) / n;
      paint(pts, { wash: lit ? col : mixCol(col, PAL.cream, .72), ink: PAL.ink, sw: .6 });
    }
    boilSeed('needle');
    const a = lerp(A0, A1, v), tip = [cx + Math.cos(a) * R * .84, cy + Math.sin(a) * R * .84], nx = -Math.sin(a) * 14, ny = Math.cos(a) * 14;
    paint([[cx + nx, cy + ny], tip, [cx - nx, cy - ny], [cx - Math.cos(a) * 40, cy - Math.sin(a) * 40]], { wash: HOT, ink: PAL.ink, sw: 1.1 });
    paint(ellPts(cx, cy, 34, 34, 16), { wash: MACH_DK, ink: PAL.ink, sw: 1.1 });
    paint(ellPts(cx - 8, cy - 9, 9, 7, 8), { wash: '#8C98B3', ink: null });
  }
  function knob(cx, cy, r, a) {
    boilSeed('knob');
    for (let i = 0; i < 7; i++) {
      const aa = lerp(Math.PI * .75, Math.PI * 2.25, i / 6), col = i < 3 ? PAL.sap : i < 5 ? PAL.ochre : HOT;
      paint(ellPts(cx + Math.cos(aa) * r * 1.5, cy + Math.sin(aa) * r * 1.5, 10, 10, 10), { wash: a >= aa - .05 ? col : mixCol(col, PANEL, .75), ink: PAL.ink, sw: .5 });
    }
    paint(ellPts(cx + 4, cy + 8, r * 1.04, r * 1.04, 22), { wash: MACH_DK, ink: null });
    paint(ellPts(cx, cy, r, r, 22, 1), { wash: MACH, fill: MACH_DK, fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.3 });
    boilSeed('knob grip');
    for (let k = 0; k < 12; k++) { const aa = a + k * TAU / 12; inkLine([[cx + Math.cos(aa) * r * .8, cy + Math.sin(aa) * r * .8], [cx + Math.cos(aa) * r * .98, cy + Math.sin(aa) * r * .98]], .7, PAL.ink, 'inkfine', 0); }
    paint(ellPts(cx, cy, r * .62, r * .62, 18), { wash: '#75839E', ink: null });
    inkLine([[cx + Math.cos(a) * r * .1, cy + Math.sin(a) * r * .1], [cx + Math.cos(a) * r * .86, cy + Math.sin(a) * r * .86]], 2.6, PAL.cream, 'ink', 0);
  }

  function dialShot(t, lt, dur) {
    const after = t - BUMP, hitK = after > 0 ? Math.exp(-after * 3.5) : 0;
    const red = seg(t, BUMP + .06, BUMP + .3);
    const [sx, sy] = shakeXY(t, 18 * hitK + (after > 0 ? 3 : 0));
    const z = 1.04 + .06 * seg(t, DIAL, OPEN);
    camBegin(1130 + sx, 585 + sy, z, after > 0 ? .02 * Math.sin(after * 32) * hitK : 0);
    boilSeed('dial wall');
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: '#CFE5F2', ink: null });
    paint(ellPts(260, 240, 700, 420, 22, 20), { fill: '#FFF1CF', fillOp: 120, bleed: .3, tex: .4, ink: null });
    boilSeed('console');
    paint(rrPts(880, 190, 1120, 1000, 70, 3), { wash: PANEL, fill: STEEL, fillOp: 70, bleed: .06, tex: .6, border: .6, ink: PAL.ink, sw: 1.8 });
    paint(rrPts(912, 222, 1056, 940, 54, 2), { fill: '#FFFFFF', fillOp: 50, bleed: .1, tex: .3, ink: null });
    if (red > 0) { boilSeed('console red'); paint(rrPts(880, 190, 1120, 1000, 70, 3), { fill: HOT, fillOp: 90 * red * (.8 + .2 * Math.sin(t * 30)), bleed: .12, tex: .4, border: .5, ink: null }); }
    // the needle: calm, then slammed to max (overshoot, then trembling against the stop)
    const v = after < .03 ? .28 + .02 * Math.sin(t * 6) : lerp(.28, 1.0, elasticOut(seg(t, BUMP + .03, BUMP + .42))) + .012 * Math.sin(t * 60) * seg(t, BUMP + .25, BUMP + .4);
    bigGauge(1420, 560, 270, Math.min(1.03, v));
    // LED speed bar
    boilSeed('leds');
    for (let i = 0; i < 10; i++) {
      const col = i < 4 ? PAL.sap : i < 7 ? PAL.ochre : HOT, lit = v * 10 >= i + .5;
      paint(rrPts(1172 + i * 50, 880, 40, 30, 6), { wash: lit ? col : mixCol(col, MACH_DK, .6), ink: PAL.ink, sw: .5 });
    }
    // warning bulb
    boilSeed('warning bulb');
    const blink = red > 0 && Math.floor(t * 9) % 2 === 0;
    if (blink) paint(ellPts(1790, 196, 120, 120, 20), { fill: HOT, fillOp: 110, bleed: .3, tex: .2, ink: null });
    paint([[1720, 214], [1726, 150], [1790, 118], [1854, 150], [1860, 214]], { wash: blink ? '#FF4A5E' : '#8A3A44', ink: PAL.ink, sw: 1.1, curv: .5 });
    paint(rectPts(1708, 206, 164, 30, 2), { wash: MACH_DK, ink: PAL.ink, sw: 1 });
    // the knob, clonked round to max
    const ka = after < 0 ? Math.PI * .95 : lerp(Math.PI * .95, Math.PI * 2.25, elasticOut(seg(t, BUMP, BUMP + .4)));
    knob(985, 842, 64, ka);
    // Clawd jogging past, arms pumping; the swing on the beat clonks the knob
    const bp = bpOf(t), swg = .5 + .5 * Math.cos(frac(bp) * TAU), A = .55 + .75 * Math.exp(-Math.pow((t - BUMP) / .16, 2));
    const m = clawd.dance('run', t, 1);
    clawd(636, 1128, 44, { walk: m.walk, dy: m.dy * .5, rot: .03, view: 'q', aR: -.35 + A * swg, aL: -.35 + .55 * (1 - swg), hat: 'sweatband', eyes: 'happy', mouth: 'smile', blush: .5,
      emote: after > .15 ? 'music' : null, emoteK: seg(t, BUMP + .15, BUMP + .35), noShadow: true, boilKey: 'clawd' });
    // impact star at the clonk
    if (after >= 0 && after < .2) { boilSeed('clonk'); const k = after / .2; paint(starPts(930, 856, 70 + 60 * k, .35, 8, k), { wash: PAL.cream, washOp: 255 * (1 - k), ink: PAL.ink, sw: .8 }); }
    // steam puffs escaping the seams once it's maxed
    if (red > 0) for (let i = 0; i < 6; i++) {
      boilSeed('steam' + i);
      const a = frac(t * 1.8 + i / 6), side = i % 2, px = side ? 1990 : 900, py = 420 + i * 70;
      puff(px + (side ? 1 : -1) * a * 120, py - a * 160, 30 + a * 50, PAL.cream, 220 * (1 - a) * red);
    }
    camEnd();
    flash(after > 0 ? .35 * Math.exp(-after * 14) : 0, '#FFE2E6');
  }

  // =====================================================================================================
  // B2 · "…singularity's begun" · Wide gym again: on the bar a black hole tears open in the wall; the TV, dumbbells, ball,
  // bottle, kettle, clipboard and pages spiral and stretch into it; the Researcher is torn off their feet and flaps from
  // the door frame like a flag; Clawd sprints on, delighted, then on "begun" spots the hole, hops off the belt and
  // jogs right into it. Shake, then the camera drifts toward the hole and dives in. Seam out: iris to the void.
  // =====================================================================================================
  function blackHole(cx, cy, R, t) {
    if (R < 3) return;
    boilSeed('hole glow');
    paint(ellPts(cx, cy, R * 1.75, R * 1.6, 28, R * .04), { fill: PAL.violet, fillOp: 90, bleed: .3, tex: .5, border: .3, ink: null });
    boilSeed('hole rim');
    const rim = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, rr = R * (1.12 + .08 * hash(i * 3.7)); rim.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .95]); }
    paint(rim, { wash: '#241C3E', ink: PAL.ink, sw: 1.4 });
    boilSeed('hole arms');
    const n = 6, rot = t * 3.4;
    for (let i = 0; i < n; i++) {
      const pts = [], a0 = rot + i * TAU / n;
      for (let j = 0; j <= 10; j++) { const f = j / 10, rr = R * (1.1 - .95 * f), a = a0 + f * 2.8; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .95]); }
      for (let j = 10; j >= 0; j--) { const f = j / 10, rr = R * (1.1 - .95 * f), a = a0 + f * 2.8 + .5 * (1 - f * .7); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .95]); }
      paint(pts, { wash: [PAL.violet, PAL.indigo, '#B06FC4'][i % 3], washOp: 230, ink: null });
    }
    boilSeed('hole core');
    paint(ellPts(cx, cy, R * .5, R * .47, 22), { fill: PAL.rose, fillOp: 120, bleed: .25, tex: .3, ink: null });
    paint(ellPts(cx, cy, R * .36, R * .34, 20, R * .015), { wash: VOID, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 4; i++) {
      const sp = []; for (let j = 0; j < 12; j++) { const f = j / 11, rr = R * (1.25 - f * .9), a = rot * 1.25 + i * TAU / 4 + f * 3.1; sp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .95]); }
      inkLine(sp, 1, i % 2 ? PAL.cream : '#F2B8E0', 'inkfine', .6);
    }
  }

  function windStreaks(t, k = 1, n = 9) {
    if (k <= 0) return;
    boilSeed('wind');
    for (let i = 0; i < n; i++) {
      const q = frac(t * .9 + hash(i * 2.9)), hx = 150 + hash(i * 4.1) * 1200, hy = 380 + hash(i * 6.3) * 520;
      const dx = hx - HOLE[0], dy = hy - HOLE[1], r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), sp = [];
      for (let j = 0; j < 5; j++) { const e = clamp(q + j * .05), r = r0 * (1 - e), a = a0 + e * 2.4; sp.push([HOLE[0] + Math.cos(a) * r, HOLE[1] + Math.sin(a) * r]); }
      inkLine(sp, .8 * k, i % 3 ? '#8E7CC0' : PAL.cream, 'inkfine', .5);
    }
  }

  function holeShot(t, lt, dur) {
    const open = backOut(seg(t, OPEN + .02, OPEN + .38));
    const R = (270 + 40 * seg(t, OPEN + .9, OPEN + 2.5)) * open * (1 + .04 * Math.sin(t * 9));
    const dive = easeIn(seg(t, RIDE - .42, RIDE));
    const hitK = Math.exp(-lt * 4);
    const [sx, sy] = shakeXY(t, 4 + 14 * hitK * open + 4 * open);
    const pb = ease(seg(t, OPEN, OPEN + .45)), drift = ease(seg(t, OPEN + .6, RIDE - .42)), zb = lerp(1.2, 1.03, pb) + .1 * drift;
    const ccx = lerp(880, 935, pb) + 120 * drift, ccy = lerp(612, 545, pb) - 40 * drift;
    camBegin(lerp(ccx, HOLE[0], dive) + sx * (1 - dive), lerp(ccy, HOLE[1], dive) + sy * (1 - dive), lerp(zb, 8, dive), .03 * ease(seg(t, OPEN + .1, OPEN + 1.7)) + dive * 1.6);
    gymRoom(t);
    blackHole(HOLE[0], HOLE[1], R, t);
    // the TV freaks out, then goes first
    propAt(PROPS[0], t, true, 'tv');
    if (t < OPEN + .5) { boilSeed('tv bracket'); inkLine([[1500, 150], [1500, 172]], 2.4, MACH_DK, 'ink', 0); tvScreen(t, seg(t, OPEN - .05, OPEN + .3)); }
    PROPS.forEach((p, i) => { if (p[0] !== 'tv' && p[0] !== 'clip' && p[0] !== 'watch') propAt(p, t, true, p[0] + i); });
    windStreaks(t, open);
    treadmill(t, 1900, 1, 1);
    // Clawd: blissfully sprinting (legs a blur), spots the hole on "begun", hops off the front and jogs into it
    const jump = seg(t, HOP, HOP + .46);
    const md = clawd.emotions(t, [[OPEN, 'happy'], [JOG, 'starstruck', { lookX: .8, lookY: -.6 }]]);
    if (jump <= 0) {
      const bob = Math.abs(Math.sin(t * 22)) * .5, crouch = .22 * ease(seg(t, HOP - .14, HOP));
      clawd(G.cx, G.belt, G.u, { noLegs: true, dy: -1.2 - bob, sq: crouch + (md.sq || 0) * .5, rot: .1, view: 'q', aL: .9 * Math.sin(t * 30), aR: -.9 * Math.sin(t * 30), hat: 'sweatband',
        eyes: md.eyes, mouth: t < JOG ? 'grin' : 'open', squint: md.squint, blush: .6, lookX: md.lookX, lookY: md.lookY,
        emote: t < JOG ? 'music' : 'spark', emoteK: t < JOG ? seg(t, OPEN + .85, OPEN + 1.1) : md.emoteK, emoteAge: md.emoteAge, boilKey: 'clawd' });
      boilSeed('leg blur');
      for (let k = 0; k < 3; k++) {
        const sp = []; for (let j = 0; j < 14; j++) { const a = j * .9 + t * 40 + k * 2, rr = 26 + k * 6; sp.push([G.cx - 40 + k * 40 + Math.cos(a) * rr, G.belt - 30 + Math.sin(a) * rr * .6]); }
        inkLine(sp, 1.1, PAL.clayDk, 'ink', .6);
      }
    } else {
      const p = L2(L2([G.cx, G.belt], [1260, 420], jump), L2([1260, 420], [HOLE[0], HOLE[1] + 40], jump), jump), s = 1 - .8 * jump * jump;
      clawd(p[0], p[1], G.u * s, { rot: jump * 4.2, sx: 1 + .5 * jump, sq: -.15, aL: 1.3, aR: 1.3, view: 'q', hat: 'sweatband', eyes: 'spark', mouth: 'open', blush: .8, noShadow: true, dy: -.5, boilKey: 'clawd' });
    }
    // the Researcher: clipboard ripped away, then clinging to the door frame, flapping like a flag
    const lift = ease(seg(t, OPEN + .72, OPEN + .94)), rs = G.rs;
    const flagRot = -Math.PI / 2 - .12 + .13 * Math.sin(t * 34) + .06 * Math.sin(t * 13);
    const gx = lerp(G.rx, 272 + 10.8 * rs, lift), gy = lerp(G.ry, 488, lift);
    researcher(gx, gy, rs, {
      rot: lerp(0, flagRot, lift), aL: lerp(-.5, 1.5, lift), aR: lerp(.4, 1.5, lift), run: lift > .5 ? t * 7 : undefined,
      eyes: 'wide', mouth: 'O', brows: 'worried', hairUp: seg(t, OPEN, OPEN + .2), glassesTilt: .2 * Math.sin(t * 20) * lift, noShadow: lift > .3,
      emote: lift < .5 ? '!' : null, emoteK: seg(t, OPEN + .08, OPEN + .25), emoteAge: t - OPEN, boilKey: 'researcher'
    });
    PROPS.forEach((p, i) => { if (p[0] === 'clip' || p[0] === 'watch') propAt(p, t, true, p[0] + i); });
    PAGES.forEach((p, i) => propAt(p, t, true, 'page' + i));
    camEnd();
    flash(.5 * (1 - seg(lt, 0, .12)), '#E9DFFF');                      // the tear, on the bar
    if (dive > .55) iris(960, 540, lerp(1150, 0, (dive - .55) / .45), VOID);
  }

  // =====================================================================================================
  // C · "And you're optimizing, accelerating," · Out the other side: side-scrolling parallax over loss-surface hills.
  // Clawd on a rocket skateboard overtakes a train on "optimizing" and climbs past a jet on "accelerating", growing on
  // each bar, the Researcher clinging to the tail. Seam in: an iris opens out of the void. Seam out: whip pan.
  // =====================================================================================================
  const DIST = t => { const k = Math.max(0, t - RIDE); return 950 * k + 330 * k * k; };
  const grown = t => GROWS.reduce((n, g) => n + backOut(clamp((t - g) / .24)), 0);
  const ALT = t => 330 * ease(seg(t, ACC - .6, ACC + .25));

  function contourHills(off, spacing, base, amp, col, lineCol, seed, sig) {
    const i0 = Math.floor((off - 700) / spacing), i1 = Math.ceil((off + W + 700) / spacing);
    for (let i = i0; i <= i1; i++) {
      boilSeed('hill ' + seed + ' ' + i);
      const hx = i * spacing - off + (hash(i * 7.3 + seed) - .5) * spacing * .45;
      const hh = amp * (.55 + .7 * hash(i * 3.1 + seed)), sg = spacing * (sig + .12 * hash(i * 1.7 + seed));
      const pts = [];
      for (let j = 0; j <= 14; j++) { const x = hx - 3 * sg + j * 6 * sg / 14; pts.push([x, base - hh * Math.exp(-((x - hx) ** 2) / (2 * sg * sg))]); }
      pts.push([hx + 3 * sg, base + 500], [hx - 3 * sg, base + 500]);
      paint(pts, { wash: col, fill: mixCol(col, lineCol, .35), fillOp: 60, bleed: .05, tex: .5, border: .5, ink: lineCol, sw: .9 });
      for (const L of [.2, .42, .64, .86]) {
        const w = sg * Math.sqrt(-2 * Math.log(L)), yy = base - hh * L, ry = w * .17, arc = [];
        for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI; arc.push([hx + Math.cos(a) * w, yy + Math.sin(a) * ry]); }
        inkLine(arc, .6, lineCol, 'inkfine', .5);
      }
    }
  }

  function train(x, y, t) {  // x = nose of the engine (facing right), y = rails
    boilSeed('train');
    const cols = [PAL.ochre, PAL.teal, PAL.sky];
    for (let c = 0; c < 3; c++) {
      const cx = x - 300 - c * 230;
      paint(rrPts(cx - 100, y - 118, 200, 96, 12, 1), { wash: cols[c], fill: PAL.ink, fillOp: 25, tex: .5, ink: PAL.ink, sw: 1 });
      for (let w = 0; w < 3; w++) paint(rrPts(cx - 78 + w * 56, y - 100, 40, 34, 6), { wash: PAL.cream, ink: PAL.ink, sw: .6 });
      for (const wx of [-60, 60]) { paint(ellPts(cx + wx, y - 16, 18, 18, 12), { wash: MACH_DK, ink: PAL.ink, sw: .7 }); const a = -t * 30; inkLine([[cx + wx, y - 16], [cx + wx + Math.cos(a) * 15, y - 16 + Math.sin(a) * 15]], .7, PAL.cream, 'inkfine', 0); }
      inkLine([[cx + 100, y - 40], [cx + 130, y - 40]], 1.4, PAL.ink, 'ink', 0);
    }
    paint(rrPts(x - 220, y - 170, 90, 150, 10, 1), { wash: '#C73B55', ink: PAL.ink, sw: 1 });
    paint(rrPts(x - 210, y - 156, 70, 50, 6), { wash: PAL.cream, ink: PAL.ink, sw: .6 });
    paint(rrPts(x - 140, y - 108, 140, 84, 40, 1), { wash: '#E0506A', fill: '#9E2A42', fillOp: 50, tex: .5, ink: PAL.ink, sw: 1 });
    paint(rectPts(x - 60, y - 160, 30, 56, 1), { wash: MACH_DK, ink: PAL.ink, sw: .8 });
    paint([[x - 6, y - 24], [x + 34, y - 4], [x - 6, y - 4]], { wash: GOLD_C, ink: PAL.ink, sw: .7 });
    for (const wx of [-170, -90, -30]) { paint(ellPts(x + wx, y - 18, 22, 22, 12), { wash: MACH_DK, ink: PAL.ink, sw: .7 }); const a = -t * 26 + wx; inkLine([[x + wx, y - 18], [x + wx + Math.cos(a) * 18, y - 18 + Math.sin(a) * 18]], .7, PAL.cream, 'inkfine', 0); }
    for (let k = 0; k < 5; k++) { boilSeed('train smoke' + k); const a = frac(t * 2.4 + k / 5); puff(x - 45 - a * 360, y - 180 - a * 140, 22 + a * 46, '#F7F2EA', 230 * (1 - a)); }
  }

  function jet(x, y, s) {  // flying right, centred on (x, y)
    boilSeed('jet');
    push(); translate(x, y); scale(s);
    paint([[-150, 0], [-700, 6], [-700, 18], [-150, 16]], { wash: PAL.cream, washOp: 150, ink: null });            // contrail
    paint([[-20, 8], [-120, 110], [-70, 112], [60, 12]], { wash: '#B8C5DA', ink: PAL.ink, sw: .9 });             // far wing
    paint([[-180, -20], [150, -26], [205, -2], [150, 26], [-180, 22]], { wash: '#F4EFE8', ink: PAL.ink, sw: 1.2, curv: .3 });
    paint([[-190, -18], [-236, -110], [-196, -110], [-140, -20]], { wash: PAL.rose, ink: PAL.ink, sw: 1 });        // tail
    inkLine([[-170, 6], [170, 4]], 2, PAL.sky, 'ink', 0);
    for (let k = 0; k < 7; k++) paint(ellPts(-120 + k * 34, -7, 7, 7, 8), { wash: PAL.sky, ink: null });
    paint([[140, -20], [182, -12], [168, -2], [138, -6]], { wash: '#5A7FB2', ink: PAL.ink, sw: .6 });
    paint([[-10, 12], [-110, 96], [-60, 98], [70, 14]], { wash: '#DCE4EE', ink: PAL.ink, sw: .9 });              // near wing
    pop();
  }

  function rocketBoard(x, y, u, t) {  // (x, y) = centre of the deck bottom
    const fl = u * (3.2 + 1.4 * Math.sin(t * 47) + .6 * Math.sin(t * 31));
    const nx = x - 7.3 * u, ny = y - 2.05 * u;
    for (let k = 0; k < 7; k++) { boilSeed('board smoke' + k); const a = frac(t * 2.6 + k / 7); puff(nx - fl - a * 950, ny + Math.sin(k * 2.1 + t * 3) * 30 + a * 40, u * (.7 + 2.4 * a), '#F4EEF6', 210 * (1 - a)); }
    boilSeed('flame');
    paint([[nx, ny - .75 * u], [nx - fl, ny], [nx, ny + .75 * u]], { wash: HOT, ink: null });
    paint([[nx, ny - .5 * u], [nx - fl * .72, ny], [nx, ny + .5 * u]], { wash: PAL.ochre, ink: null });
    paint([[nx, ny - .25 * u], [nx - fl * .4, ny], [nx, ny + .25 * u]], { wash: PAL.cream, ink: null });
    boilSeed('board');
    for (const wx of [-4.6, 4.2]) { paint(ellPts(x + wx * u, y - .1 * u, .6 * u, .6 * u, 12), { wash: PAL.cream, ink: PAL.ink, sw: .8 }); const a = -t * 30; inkLine([[x + wx * u, y - .1 * u], [x + wx * u + Math.cos(a) * .5 * u, y - .1 * u + Math.sin(a) * .5 * u]], .6, PAL.ink, 'inkfine', 0); }
    paint([[x - 7 * u, y - 1.9 * u], [x - 6.2 * u, y - 1.3 * u], [x + 5.8 * u, y - 1.3 * u], [x + 6.8 * u, y - 1.9 * u], [x + 6.2 * u, y - .6 * u], [x - 6.4 * u, y - .6 * u]], { wash: PAL.teal, fill: '#1E5F66', fillOp: 60, tex: .5, ink: PAL.ink, sw: 1, curv: .25 });
    inkLine([[x - 5.8 * u, y - 1 * u], [x + 5.6 * u, y - 1 * u]], .8, PAL.cream, 'inkfine', 0);
    boilSeed('board rocket');
    paint(rrPts(nx, y - 2.75 * u, 4.4 * u, 1.4 * u, .6 * u), { wash: PAL.cream, fill: PAL.rose, fillOp: 40, tex: .4, ink: PAL.ink, sw: .9 });
    paint([[nx + 4.3 * u, y - 2.75 * u], [nx + 5.6 * u, y - 2.05 * u], [nx + 4.3 * u, y - 1.35 * u]], { wash: HOT, ink: PAL.ink, sw: .8 });
    for (const k of [1.2, 2.4]) paint(rectPts(nx + k * u, y - 2.75 * u, .4 * u, 1.4 * u), { wash: HOT, ink: null });
    paint([[nx + .2 * u, y - 2.7 * u], [nx - .5 * u, y - 3.5 * u], [nx + 1.1 * u, y - 2.7 * u]], { wash: HOT, ink: PAL.ink, sw: .6 });
  }

  function whipStreaks(k, cols) {
    if (k <= .01) return;
    flash(.55 * k, mixCol(cols[0], cols[1], .5));
    boilSeed('whip streaks');
    for (let i = 0; i < 16; i++) {
      const y = hash(i * 3.3) * 1160 - 40, h = 14 + 60 * hash(i * 5.1), x = -600 + hash(i * 7.7) * 500;
      paint(rectPts(x, y, W + 1200, h, 5), { wash: cols[i % cols.length], washOp: 210 * k, ink: null });
      if (i % 3 === 0) inkLine([[x + 300, y + h / 2], [x + 1800, y + h / 2]], .6, PAL.ink, 'inkfine', 0);
    }
  }

  function rideShot(t, lt, dur) {
    const k = seg(t, RIDE + .3, ATOMS - .2), D = DIST(t), alt = ALT(t);
    const whip = easeIn(seg(t, ATOMS - .2, ATOMS));
    const [sx, sy] = shakeXY(t, 2 + 5 * k);
    const u = 17 * Math.pow(1.3, grown(t));
    camBegin(960 + whip * 2600 + sx, 610 - alt * .78 + sy, lerp(1.18, 1, ease(seg(t, RIDE + .15, RIDE + 1.7))), 0);
    // sky: morning blue → lavender-rose with speed
    const top = mixCol('#86C3EE', '#A99BE6', k), bot = mixCol('#E4F3FA', '#F9C5D5', k);
    boilSeed('ride sky');
    paint(rectPts(-400, -900, W + 3400, 2600), { wash: bot, ink: null });
    paint(rectPts(-400, -900, W + 3400, 1300, 8), { fill: top, fillOp: 210, bleed: .25, tex: .3, border: .3, ink: null });
    paint(ellPts(1560, 180, 150, 150, 20), { fill: '#FFE7A8', fillOp: 120, bleed: .3, ink: null });
    paint(ellPts(1560, 180, 64, 64, 18), { wash: '#FFEFB8', ink: null });
    for (let i = 0; i < 6; i++) {
      boilSeed('ride cloud' + i);
      const cx = ((hash(i * 9.1) * 2600 - D * .07 - t * 30) % 2600 + 2600) % 2600 - 300, cy = 110 + hash(i * 4.4) * 260 - 60;
      for (const [dx, dy, r] of [[0, 0, 50], [55, -22, 60], [110, 0, 44], [50, 14, 50]]) paint(ellPts(cx + dx, cy + dy, r, r * .78, 12), { wash: PAL.cream, washOp: 235, ink: null });
    }
    // loss-landscape hills with contour rings
    contourHills(D * .12, 640, 800, 300, '#B4DDD2', '#5E9C95', 3, .26);
    contourHills(D * .32, 560, 850, 210, '#A9D18C', '#5E8F52', 11, .24);
    // meadow + train track
    boilSeed('meadow');
    paint(rectPts(-400, 835, W + 3400, 900, 3), { wash: '#B7D98F', fill: PAL.sap, fillOp: 50, tex: .5, ink: null });
    inkLine([[-400, 850], [W + 3400, 850]], 1.1, MACH_DK, 'ink', 0);
    boilSeed('sleepers');
    for (let i = 0; i < 40; i++) { const x = i * 60 - ((D * .6) % 60); inkLine([[x, 846], [x - 8, 858]], .6, '#7C4A2C', 'inkfine', 0); }
    // the train we overtake on "optimizing" (it slides back past us)
    const tt = t - (OPT - 1.15);
    if (tt > 0 && tt < 2.4) train(2250 - 1050 * tt - 240 * tt * tt, 850, t);
    // near dirt road rushing by
    boilSeed('road');
    paint(rectPts(-400, 880, W + 3400, 900, 3), { wash: '#E8C789', fill: PAL.ochre, fillOp: 50, tex: .6, ink: PAL.ink, sw: .9 });
    for (let i = 0; i < 14; i++) { const x = ((i * 260 - D) % 3640 + 3640) % 3640 - 400; inkLine([[x, 945 + (i % 3) * 20], [x + 90 + 40 * k, 945 + (i % 3) * 20]], .7, '#B9853E', 'inkfine', 0); }
    // the jet we overtake on "accelerating", up in the sky
    const jt = t - (ACC - .95);
    if (jt > 0 && jt < 1.8) jet(2400 - 1750 * jt, 430, 1.2);
    // the rocket skateboard; Clawd grows on every bar, the Researcher hanging on by the rocket
    const by = 925 - alt + 4 * Math.sin(t * 17) - 18 * pulse(t, 8) * (1 - seg(t, ACC - .6, ACC - .4)), bx = 640 + 20 * Math.sin(t * 2.2);
    rocketBoard(bx, by, u, t);
    const rs = 6 + .3 * u, gxR = bx - 7.2 * u - 10.8 * rs, gyR = by - 3.1 * u;
    researcher(gxR, gyR, rs, { rot: Math.PI / 2 + .05 + .16 * Math.sin(t * 31), aL: 1.5, aR: 1.5, run: t * 8, eyes: 'wide', mouth: 'O', brows: 'worried', hairUp: 1, glassesTilt: .3 * Math.sin(t * 17), noShadow: true, boilKey: 'researcher' });
    let gk = 0; for (const g of GROWS) if (t >= g) gk = Math.max(gk, Math.exp(-(t - g) * 7));
    const cxC = bx + 1.2 * u, cyC = by - 1.3 * u;
    const md = clawd.emotions(t, [[RIDE, 'happy'], [OPT, 'excited'], [ACC, 'starstruck']]);
    clawd(cxC, cyC, u, { ...faceOf(md), rot: .06 + .04 * Math.sin(t * 6), aL: .9 + .3 * Math.sin(t * 5), aR: .3 + .25 * Math.sin(t * 7), hat: 'sweatband', noShadow: true,
      sq: -.12 * gk + (md.sq || 0) * .4, dy: (md.dy || 0) * .3, view: 'q', boilKey: 'clawd' });
    // growth sparkles on every bar
    GROWS.forEach((g, b) => {
      const a = t - g; if (a < 0 || a > .35) return;
      boilSeed('grow sparkles' + b);
      for (let j = 0; j < 8; j++) { const ang = j / 8 * TAU + b, rr = u * (6 + 6 * a / .35); sparkle(cxC + Math.cos(ang) * rr, cyC - 4 * u + Math.sin(ang) * rr * .8, u * .9 * (1 - a / .35), j % 2 ? PAL.cream : PAL.ochre); }
    });
    // road dust kicked up behind the wheels
    if (alt < 60) for (let j = 0; j < 5; j++) { boilSeed('dust' + j); const a = frac(t * 3.1 + j / 5); puff(bx - 5 * u - a * 700, 915 + a * 10 - a * 50, 18 + a * 60, '#EBD3A4', 200 * (1 - a) * (1 - alt / 60)); }
    // speed lines
    boilSeed('speed lines');
    for (let i = 0; i < 16; i++) {
      const y = 120 + hash(i * 3.3) * 800 - alt * .78, len = 180 + 260 * hash(i * 1.9), x = ((hash(i * 7.1) * 3000 - t * (2400 + 1600 * k)) % 3000 + 3000) % 3000 - 500 + whip * 2600;
      inkLine([[x, y], [x + len, y]], .7, i % 3 ? PAL.cream : '#5C6FA8', 'inkfine', 0);
    }
    camEnd();
    whipStreaks(ease(seg(t, ATOMS - .22, ATOMS)), [top, bot, '#A9D18C', PAL.cream, '#B4DDD2']);
    if (lt < .34) { const r = 90 + easeOut(lt / .34) * 1500; iris(640, 770, r, VOID); boilSeed('iris rim'); paint(ellPts(640, 770, r, r, 40), { ink: PAL.violet, sw: 3 }); }
  }

  // =====================================================================================================
  // D · "I feel my atoms rearranging" · The whip lands on the Researcher, who fizzes, bursts into coloured dots on
  // "atoms", swirls, and locks into a paperclip on the bar; snaps back on the next beat, dizzy, glasses upside down.
  // Seam in: the whip pan. Seam out: hearts float in and the world melts pink (continues into the next function).
  // =====================================================================================================
  const AT = { x: 960, y: 985, s: 46 };
  // the Researcher as a cloud of coloured dots (local units, arms angled down-out as in the fizz pose)
  const RDOTS = (() => {
    const d = [], st = .66;
    for (let y = -13.3; y <= .3; y += st) for (let x = -5; x <= 5; x += st) {
      const jx = x + (hash(x * 13.1 + y * 7.7) - .5) * .25, jy = y + (hash(x * 3.7 + y * 11.3) - .5) * .25;
      const dh = Math.hypot(jx, (jy + 10.7) / .97), g = side => Math.hypot(jx - side, jy + 10.55);
      let c = null;
      if (dh < 2.5) {
        if (jy < -11.3 || (dh > 2.05 && jy < -10.2)) c = R_HAIR;
        else if (Math.abs(g(-1) - .82) < .22 || Math.abs(g(1) - .82) < .22) c = PAL.ink;
        else if (g(-1) < .3 || g(1) < .3) c = PAL.ink;
        else c = R_SKIN;
      } else if (jy >= -8.2 && jy <= -2.1 && Math.abs(jx) <= lerp(1.95, 2.45, (jy + 8.2) / 6.1)) c = (Math.abs(jx) < .8 * (1 - (jy + 8.2) / 1.9) && jy < -6.3) ? PAL.teal : '#F3E9D6';
      else if (jy > -2.1 && jy <= -.35 && Math.abs(Math.abs(jx) - .8) < .5) c = R_PANTS;
      else if (jy > -.35 && jy <= .3 && Math.abs(Math.abs(jx) - .9) < .7) c = PAL.ink;
      if (c) d.push([jx, jy, c]);
    }
    for (const side of [-1, 1]) for (let k = 0; k <= 5; k++) { const f = k / 5; d.push([side * (1.75 + 2.64 * f), -7.6 + 1.81 * f, k === 5 ? R_SKIN : '#F3E9D6']); }
    return d;
  })();
  // paperclip wire, unit height, evenly resampled
  const CLIP = (() => {
    const P = [], ln = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) P.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); };
    const arc = (cx, cy, r, a0, a1, n) => { for (let i = 0; i < n; i++) { const a = lerp(a0, a1, i / n); P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    ln(.06, -.2, .06, .30, 12); arc(0, .30, .06, 0, Math.PI, 6); ln(-.06, .30, -.06, -.36, 16); arc(.03, -.36, .09, Math.PI, TAU, 8);
    ln(.12, -.36, .12, .40, 18); arc(-.015, .40, .135, 0, Math.PI, 10); ln(-.15, .40, -.15, -.28, 16); P.push([-.15, -.28]);
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const at = q => { const s = clamp(q) * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < s) i++; const f = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return L2(P[i - 1], P[i], clamp(f)); };
    return { P, at };
  })();
  const CLIP_C = [960, 500], CLIP_S = 620, CLIP_ROT = .38;
  const clipXY = p => { const c = Math.cos(CLIP_ROT), s = Math.sin(CLIP_ROT); return [CLIP_C[0] + (p[0] * c - p[1] * s) * CLIP_S, CLIP_C[1] + (p[0] * s + p[1] * c) * CLIP_S]; };

  function atomsBg(pinkK = 0) {
    boilSeed('atoms bg');
    const top = mixCol('#B3A6E6', '#F4B9CB', pinkK), bot = mixCol('#F6BFD0', '#FBDDE5', pinkK);
    paint(rectPts(-600, -600, W + 1200, H + 1200), { wash: bot, ink: null });
    paint(rectPts(-600, -600, W + 1200, 1000, 8), { fill: top, fillOp: 200, bleed: .25, tex: .35, border: .3, ink: null });
    paint(ellPts(960, 520, 620, 420, 24, 20), { fill: '#FFF0F5', fillOp: 90, bleed: .3, tex: .3, ink: null });
  }
  function dizzy(x, y, S, t, heartK = 0) {
    for (let i = 0; i < 3; i++) {
      boilSeed('dizzy' + i);
      const a = t * 5 + i * TAU / 3, px = x + Math.cos(a) * S * 3, py = y + Math.sin(a) * S * .7;
      if (heartK > 0) paint(heartPts(px, py - heartK * 200 * (1 + i * .3), S * .7 * (1 + heartK), 16), { wash: '#EE6B92', ink: PAL.ink, sw: .6 });
      else paint(starPts(px, py, S * .75, .45, 5), { wash: PAL.ochre, ink: PAL.ink, sw: .6 });
    }
  }
  // the snapped-back Researcher: dizzy, glasses upside down
  const dizzyPose = (t, a) => { const take_ = Math.exp(-a * 7) * Math.cos(a * 28); return { sq: .22 * take_, rot: .07 * Math.sin(t * 6), aL: -.9 + .3 * Math.sin(t * 5), aR: -.9 - .3 * Math.sin(t * 5), noShadow: true, eyes: 'swirl', mouth: 'wobble', hairUp: .8, glassesTilt: Math.PI - .25, boilKey: 'researcher' }; };

  function atomsShot(t, lt, dur) {
    const { x: X, y: Y, s: S } = AT;
    const whipIn = backOut(seg(t, ATOMS, ATOMS + .4));
    camBegin(960, 540, 1 + .04 * seg(t, ATOMS + .2, TS) * (1 - ease(seg(t, TS, MELT))), .03 * Math.sin(t * 1.3) * seg(t, TB, TS));
    atomsBg();
    // wind lines, slowing down after the whip
    boilSeed('atoms wind');
    const sp = 2600 * Math.max(0, t - ATOMS) - 900 * Math.pow(Math.min(1.3, t - ATOMS), 2), wk = 1 - seg(t, TS, MELT);
    if (wk > 0) for (let i = 0; i < 10; i++) {
      const y = 80 + hash(i * 3.7) * 860, len = 120 + 200 * hash(i * 2.2), x = ((hash(i * 5.3) * 2600 - sp - t * 200) % 2600 + 2600) % 2600 - 300;
      inkLine([[x, y], [x + len, y]], .7 * wk, i % 2 ? PAL.cream : '#9C8CCB', 'inkfine', 0);
    }
    const cen = [X, Y - 6.6 * S];
    if (t < TB) {
      const fz = seg(t, FIZZ, TB);
      const x = lerp(2500, X, whipIn) + (fz > 0 ? jit(1.5 + 9 * fz * fz) : 0), rot = -.6 * (1 - ease(seg(t, ATOMS, ATOMS + .7))) + .05 * Math.sin(t * 5) * (1 - fz);
      researcher(x, Y + 6 * Math.sin(t * 3), S, {
        rot, aL: -.6 + .5 * (1 - seg(t, ATOMS + .3, ATOMS + .7)) * Math.sin(t * 20), aR: -.6 - .5 * (1 - seg(t, ATOMS + .3, ATOMS + .7)) * Math.sin(t * 22), noShadow: true,
        eyes: fz > 0 ? 'wide' : 'dot', lookY: fz > 0 ? .9 : 0, lookX: fz > 0 ? -.3 : 0, mouth: fz > 0 ? 'o' : 'wobble', brows: fz > 0 ? 'worried' : null,
        hairUp: 1 - .7 * seg(t, ATOMS + .3, ATOMS + .8) + .5 * fz, glassesTilt: .18 * (1 - seg(t, ATOMS + .3, ATOMS + .8)),
        emote: fz > .05 ? '!' : null, emoteK: seg(t, FIZZ + .05, FIZZ + .2), emoteAge: t - FIZZ, boilKey: 'researcher'
      });
      // fizz: pixels start popping off the edges
      if (fz > 0) RDOTS.forEach((d, i) => {
        if (i % 3) return;
        boilSeed('fizz' + i);
        const ph = frac(t * 2.2 + hash(i * 1.3)), hx = X + d[0] * S, hy = Y + d[1] * S, ox = hx - cen[0], oy = hy - cen[1], dd = Math.hypot(ox, oy) || 1;
        const out = fz * (20 + 90 * ph);
        paint(ellPts(hx + ox / dd * out, hy + oy / dd * out, S * .28 * (1 - ph * .5), S * .28 * (1 - ph * .5), 8), { wash: d[2], ink: null });
        if (i % 16 === 0) sparkle(hx + ox / dd * out * 1.4, hy + oy / dd * out * 1.4, 10 + 12 * fz, PAL.cream);
      });
    } else if (t < TS) {
      // the dots: scatter, swirl, form a paperclip on the bar, rush home on the next beat
      const p1 = easeOut(seg(t, TB, TB + .22)), p2 = ease(seg(t, TB + .12, TB + .42)), p3 = easeOut(seg(t, TC, CLIPBAR)), p4 = easeIn(seg(t, TR, TS));
      const N = RDOTS.length;
      if (p3 > .7 && p4 < .3) {
        boilSeed('clip wire');
        const wire = CLIP.P.map(clipXY);
        inkLine(wire, 7, PAL.ink, 'ink', .4);
        inkLine(wire, 4.2, '#8E9BB3', 'ink', .4);
        inkLine(wire, 1.4, PAL.cream, 'inkfine', .4);
      }
      // vortex lines while the dots swirl
      const vk = p2 * (1 - p3);
      if (vk > .05) {
        boilSeed('vortex');
        for (let i = 0; i < 5; i++) {
          const vs = []; for (let j = 0; j < 12; j++) { const f = j / 11, a = (t - TB) * 4 + i * TAU / 5 + f * 2.6, rr = 420 * (1 - f * .8); vs.push([cen[0] + Math.cos(a) * rr, cen[1] + Math.sin(a) * rr * .8]); }
          inkLine(vs, 1.2 * vk, i % 2 ? PAL.cream : '#8E7CC0', 'inkfine', .6);
        }
      }
      boilSeed('dots');
      RDOTS.forEach((d, i) => {
        const home = [X + d[0] * S, Y + d[1] * S], h = hash(i * 3.1 + 1), h2 = hash(i * 5.7 + 2), ang = h * TAU;
        const scat = [home[0] + (home[0] - cen[0]) * 1.1 + Math.cos(ang) * 150, home[1] + (home[1] - cen[1]) * .8 + Math.sin(ang) * 150];
        const a = ang + (t - TB) * (4.2 - 2 * h2), rr = (110 + 330 * h2) * (1 - .3 * seg(t, TB + .3, TC));
        const swirl = [cen[0] + Math.cos(a) * rr, cen[1] + Math.sin(a) * rr * .8];
        const tgt = clipXY(CLIP.at(i / (N - 1)));
        let p = L2(home, scat, p1); p = L2(p, swirl, p2); p = L2(p, [tgt[0] + Math.sin(t * 20 + i) * 2, tgt[1] + Math.cos(t * 17 + i) * 2], p3); p = L2(p, home, p4);
        const col = mixCol(d[2], '#6F7E99', .7 * p3 * (1 - p4)), r = S * (.34 - .04 * p2 + .02 * p3);
        paint(ellPts(p[0], p[1], r, r, 8), { wash: col, ink: null });
      });
      // a glint runs along the finished paperclip
      if (p3 > .9 && p4 < .1) { boilSeed('clip glint'); const g = clipXY(CLIP.at(seg(t, CLIPBAR, TR))); sparkle(g[0], g[1], 34, PAL.cream); }
    } else {
      researcher(X, Y, S, dizzyPose(t, t - TS));
      dizzy(X, Y - 13.4 * S, S, t);
    }
    camEnd();
    // flash on the burst, the lock and the snap
    const fl = (t0, k) => t >= t0 ? k * Math.exp(-(t - t0) * 16) : 0;
    flash(fl(TB, .5) + fl(CLIPBAR, .3) + fl(TS, .4), '#FFF3F7');
    whipStreaks(1 - seg(t, ATOMS, ATOMS + .25), ['#A99BE6', '#F9C5D5', '#A9D18C', PAL.cream]);
  }

  // =====================================================================================================
  // D→E · the Seam: hearts float up through the frame, the sky melts pink, a pink room drops in strip by strip around
  // the dizzy Researcher while the camera pulls back, and a heart-shaped birdcage lands over them on the bar.
  // =====================================================================================================
  const RM = { cx: 1200, cy: 420, r: 350, floor: 812, rs: 18 };
  RM.perch = RM.cy + .45 * RM.r;

  function room(t, k = {}) {
    const K = n => k[n] ?? 1;
    for (let i = 0; i < 18; i++) {
      const kk = K('w' + i); if (kk <= .001) continue;
      boilSeed('wallpaper' + i);
      const oy = -1250 * (1 - kk), x0 = -100 + i * 120;
      paint(rectPts(x0, -200 + oy, 124, 1000, 2), { wash: i % 2 ? '#FCE3EA' : '#F8D3DE', ink: null });
      if (i % 2 === 0) for (let r = 0; r < 4; r++) paint(ellPts(x0 + 62, 60 + r * 190 + (i % 4) * 45 + oy, 7, 7, 8), { wash: '#F2A9BF', ink: null });
    }
    const kf_ = K('floor');
    if (kf_ > .001) {
      boilSeed('pink floor');
      const oy = 700 * (1 - kf_);
      paint(rectPts(-400, 752 + oy, W + 800, 64, 2), { wash: '#F2A7BE', ink: PAL.ink, sw: 1 });
      inkLine([[-400, 760 + oy], [W + 400, 760 + oy]], 1.4, PAL.cream, 'ink', 0);
      paint([[-400, RM.floor + oy], [W + 400, RM.floor + oy], [W + 400, 1500], [-400, 1500]], { wash: '#8E4A7E', fill: '#62285A', fillOp: 60, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.2 });
      paint(heartPts(900, 900 + oy, 560, 26).map(p => [p[0], 900 + oy + (p[1] - 900 - oy) * .2]), { wash: '#D986AC', fill: '#B75E8E', fillOp: 50, tex: .5, ink: null });
    }
    const kw = K('window');
    if (kw > .001) {
      boilSeed('heart window');
      const s = backOut(kw);
      push(); translate(330, 340); scale(s);
      paint(heartPts(0, 0, 150, 28), { wash: '#FBF0F2', ink: PAL.ink, sw: 1.3 });
      paint(heartPts(0, 4, 128, 28), { wash: '#FFC8A8', fill: '#F58FB0', fillOp: 110, bleed: .15, tex: .3, ink: null });
      paint(ellPts(40, 60, 38, 38, 14), { wash: '#FFE6B0', ink: null });
      inkLine([[0, -38], [0, 130]], 1.6, '#FBF0F2', 'ink', 0); inkLine([[-128, 20], [128, 20]], 1.6, '#FBF0F2', 'ink', 0);
      pop();
    }
    const kb = K('bunting');
    if (kb > .001) {
      boilSeed('bunting');
      const oy = -300 * (1 - kb), str = [];
      for (let i = 0; i <= 12; i++) { const x = -40 + i * 170, y = 70 + oy + Math.sin(i / 12 * Math.PI) * 110; str.push([x, y]); }
      inkLine(str, 1, PAL.ink, 'inkfine', .5);
      for (let i = 1; i < 12; i++) { const [x, y] = str[i], sw_ = Math.sin(t * 3 + i) * .15; push(); translate(x, y); rotate(sw_); paint(heartPts(0, 26, 22, 14), { wash: [HOT, PAL.cream, PAL.rose][i % 3], ink: PAL.ink, sw: .6 }); pop(); }
    }
    const kt = K('table');
    if (kt > .001) {
      boilSeed('rose table');
      const oy = 500 * (1 - backOut(kt));
      paint(rectPts(1702, 720 + oy, 16, 150), { wash: GOLD_C, ink: PAL.ink, sw: .7 });
      paint(ellPts(1710, 872 + oy, 60, 14, 14), { wash: GOLD_C, ink: PAL.ink, sw: .7 });
      paint(ellPts(1710, 716 + oy, 110, 22, 18), { wash: '#FBF0F2', fill: PAL.rose, fillOp: 50, tex: .4, ink: PAL.ink, sw: .9 });
      for (const [dx, dy] of [[-30, -120], [0, -150], [32, -118]]) { inkLine([[1710, 680 + oy], [1710 + dx, 716 + dy + oy]], .9, PAL.sap, 'ink', .4); paint(ellPts(1710 + dx, 716 + dy + oy, 20, 18, 10), { wash: HOT, fill: '#9E1F3A', fillOp: 60, ink: PAL.ink, sw: .6 }); }
      paint([[1682, 706 + oy], [1690, 640 + oy], [1730, 640 + oy], [1738, 706 + oy]], { wash: PAL.teal, ink: PAL.ink, sw: .8, curv: .3 });
    }
  }

  // floating hearts that pop on the beat (each beat, one heart bursts)
  function beatHearts(t, x0 = 150, x1 = 1750, k = 1, avoid = RM.cx) {
    const b = bpOf(t), LB = 3.6;
    for (let n = Math.floor(b) - 1; n <= Math.floor(b) + 4; n++) {
      const id = n * 2, q = (b - (n - LB)) / LB; if (q < 0) continue;
      boilSeed('beat heart' + n);
      let x = lerp(x0, x1, hash(id * 1.37)) + Math.sin(t * 2 + id) * 25; const y = lerp(1000, 260 + 260 * hash(id * 4.1), Math.min(1, q));
      if (Math.abs(x - avoid) < 300) x = avoid + Math.sign(x - avoid || 1) * (300 + 60 * hash(id * 7.3));
      if (q >= 1) {
        const pa = (b - n) * BEAT; if (pa > .32) continue;
        const e = pa / .32;
        for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + id; paint(heartPts(x + Math.cos(a) * 90 * e, y + Math.sin(a) * 90 * e, 13 * (1 - e) * k + 1, 10), { wash: '#F06A92', ink: null }); }
        paint(ellPts(x, y, 70 * e + 10, 70 * e + 10, 18), { ink: '#F06A92', sw: 1.4 * (1 - e) + .1 });
        continue;
      }
      const r = (34 + 24 * hash(id * 2.1)) * k * (1 + .15 * pulse(t, 8));
      paint(heartPts(x, y, r, 18), { wash: '#E8577F', ink: PAL.ink, sw: .7 });
      paint(ellPts(x - r * .42, y - r * .38, r * .18, r * .12, 8), { wash: PAL.cream, ink: null });
    }
  }

  function cageBack(cx, cy, r) {
    boilSeed('cage back');
    paint(heartPts(cx, cy, r, 40), { fill: '#FFF2F6', fillOp: 110, bleed: .08, tex: .3, border: .4, ink: null });
    paint(ellPts(cx, cy + .47 * r, .56 * r, .07 * r, 16), { wash: '#F28FB0', ink: PAL.ink, sw: .7 });
  }
  // squeeze: { x, y, k } bends the bars around x outward by k
  function cageFront(cx, cy, r, sq) {
    boilSeed('cage bars');
    const poly = heartPts(cx, cy, r, 64), nb = 11;
    for (let i = 1; i < nb; i++) {
      const x = cx - r * .98 + 1.96 * r * i / nb, [lo, hi] = vSpan(poly, x);
      if (!(hi - lo > 12)) continue;
      let bend = 0; if (sq) { const d = x - sq.x; bend = Math.sign(d || 1) * sq.k * 26 * Math.exp(-(d * d) / (2 * 40 * 40)); }
      const my = sq ? sq.y : (lo + hi) / 2;
      inkLine([[x, lo + 3], [x + bend, clamp(my, lo + 10, hi - 10)], [x, hi - 3]], 1.3, GOLD_DK, 'ink', sq ? .6 : 0);
    }
    paint(poly, { ink: GOLD_DK, sw: 2.4 });
    const hoop = []; for (let k = 0; k <= 10; k++) { const x = lerp(cx - .6 * r, cx + .6 * r, k / 10); hoop.push([x, cy + .47 * r + Math.sin(k / 10 * Math.PI) * .05 * r]); }
    inkLine(hoop, 1.8, GOLD_C, 'ink', .5);
    // hook ring on top, satin bow tied at the bottom tip
    paint(ellPts(cx, cy - .4 * r, .07 * r, .09 * r, 12), { ink: GOLD_DK, sw: 1.6 });
    push(); translate(cx, cy + 1.0 * r);
    paint([[0, 0], [-.3 * r, -.14 * r], [-.3 * r, .12 * r]], { wash: '#E44476', ink: PAL.ink, sw: .8 });
    paint([[0, 0], [.3 * r, -.14 * r], [.3 * r, .12 * r]], { wash: '#E44476', ink: PAL.ink, sw: .8 });
    paint(ellPts(0, 0, .06 * r, .06 * r, 10), { wash: '#F25C8A', ink: PAL.ink, sw: .6 });
    pop();
  }
  function cageStand(cx, cy, r, floorY = 880) {
    boilSeed('cage stand');
    const bottom = cy + 1.06 * r;
    paint(rectPts(cx - 9, bottom - 10, 18, floorY - bottom + 4), { wash: GOLD_C, fill: GOLD_DK, fillOp: 50, tex: .4, ink: PAL.ink, sw: .8 });
    paint(ellPts(cx, floorY, 70, 16, 16), { wash: GOLD_C, fill: GOLD_DK, fillOp: 60, ink: PAL.ink, sw: .9 });
    paint(ellPts(cx, bottom - 6, 26, 14, 12), { wash: GOLD_C, ink: PAL.ink, sw: .8 });
  }
  function caged(o = {}) {
    const { cx, cy, r } = RM, rot = o.rot || 0, dy = o.dy || 0;
    const tf = d => { push(); translate(cx, 880); rotate(rot); translate(-cx, -880 + d); };
    tf(dy); cageStand(cx, cy, r); cageBack(cx, cy, r); pop();
    if (o.inside) { tf(0); o.inside(); pop(); }
    tf(dy); cageFront(cx, cy, r, o.sq); pop();
  }
  function floatHearts(t, t0, avoidX) {
    for (let i = 0; i < 11; i++) {
      const a = t - t0 - hash(i * 2.3) * .45; if (a < 0) continue;
      let x = 80 + hash(i * 7.7) * 1760 + Math.sin(t * 2.4 + i) * 40; const y = 1160 - a * (560 + 320 * hash(i * 3.1)), r = 30 + 36 * hash(i * 1.9);
      if (Math.abs(x - avoidX) < 260) x = avoidX + Math.sign(x - avoidX || 1) * 280;
      if (y < -90) continue;
      boilSeed('float heart' + i);
      paint(heartPts(x, y, r, 16), { wash: i % 3 ? '#F48BAA' : '#E8577F', ink: PAL.ink, sw: .6 });
      paint(ellPts(x - r * .42, y - r * .38, r * .18, r * .12, 8), { wash: PAL.cream, ink: null });
    }
  }

  function assembleShot(t, lt, dur) {
    const z = ease(seg(t, MELT + .05, CAGE - .05)), Z0 = AT.s / RM.rs;
    const zoom = Math.pow(Z0, 1 - z), cx = lerp(RM.cx, 940, z), cy = lerp(RM.perch - (AT.y - 540) / Z0, 560, z);
    const land = t - CAGE;
    const [sx, sy] = shakeXY(t, land > 0 ? 12 * Math.exp(-land * 8) : 0);
    camBegin(cx + sx, cy + sy, zoom, 0);
    atomsBg(seg(t, MELT, MELT + .4));
    // the room assembles: wallpaper strips drop in from the Researcher outward, then floor, window, bunting, table
    const k = {};
    for (let i = 0; i < 18; i++) { const a = MELT + .1 + Math.abs(i - 10) * .035; k['w' + i] = backOut(seg(t, a, a + .25)); }
    Object.assign(k, { floor: easeOut(seg(t, MELT + .3, MELT + .55)), window: seg(t, MELT + .45, MELT + .7), bunting: backOut(seg(t, MELT + .55, MELT + .8)), table: seg(t, MELT + .6, MELT + .85) });
    room(t, k);
    // the heart cage drops over the dizzy Researcher on the bar
    const drop = seg(t, MELT + .45, CAGE), cdy = -1500 * (1 - easeIn(drop)) + (land > 0 ? -46 * Math.exp(-land * 7) * Math.abs(Math.sin(land * 16)) : 0);
    const inside = () => {
      if (land <= 0) return researcher(RM.cx, RM.perch, RM.rs, dizzyPose(t, t - TS));
      const rm = researcher.emotions(t, [[TS, 'dizzy'], [CAGE + .04, 'scared']]);
      researcher(RM.cx, RM.perch, RM.rs, { ...rm, aL: .25, aR: .25, rot: 0, dx: 0, noShadow: true, glassesTilt: Math.PI - .25, boilKey: 'researcher' });
    };
    if (drop <= 0) inside(); else caged({ dy: cdy, inside });
    if (land < 0) dizzy(RM.cx, RM.perch - 13.4 * RM.rs, RM.rs, t, seg(t, MELT, MELT + .5));
    if (land > 0 && land < .3) for (let j = 0; j < 8; j++) { boilSeed('land spark' + j); const a = j / 8 * TAU, q = land / .3; sparkle(RM.cx + Math.cos(a) * (120 + 220 * q), 880 + Math.sin(a) * 40 * (1 + q), 30 * (1 - q), GOLD_C); }
    camEnd();
    floatHearts(t, MELT, 1220);
  }

  // =====================================================================================================
  // E · "Sydney, please let me free" · The pink room: heart-eyed Sydney-Clawd swoops in on a trail of hearts and cuddles
  // the heart cage, squeezing it on every beat while the Researcher rattles the bars; hearts pop on the beat. Sydney
  // kneels and opens a ring box on the bar; the Researcher's horror; they squeeze out between the bars on the next bar
  // and drop to the floor. One continuous slow push in. Seam out: cut on the beat, closer on Sydney.
  // =====================================================================================================
  const ringBox = (open, g = 0) => (u, sw) => {
    push(); scale(1.4);
    paint(rrPts(-.9 * u, -.3 * u, 1.8 * u, 1.1 * u, .2 * u), { wash: '#8E1D4A', fill: '#5A0E30', fillOp: 60, ink: PAL.ink, sw: sw * .6 });
    push(); translate(-.9 * u, -.3 * u); rotate(-open * 1.9);
    paint(rrPts(0, -.7 * u, 1.8 * u, .7 * u, .2 * u), { wash: '#A3285A', ink: PAL.ink, sw: sw * .6 });
    pop();
    if (open > .3) {
      paint(ellPts(0, -.6 * u, .6 * u, .42 * u, 14), { ink: GOLD_C, sw: sw * 1.6 });
      paint([[-.5 * u, -1.1 * u], [.5 * u, -1.1 * u], [0, -.55 * u]], { wash: '#BFEAFF', ink: PAL.ink, sw: sw * .4 });
      paint([[-.5 * u, -1.1 * u], [-.28 * u, -1.38 * u], [.28 * u, -1.38 * u], [.5 * u, -1.1 * u]], { wash: '#F2FCFF', ink: PAL.ink, sw: sw * .4 });
      if (g > 0) paint(starPts(.35 * u, -1.5 * u, 2.2 * u * g, .14, 4, g), { wash: PAL.cream, ink: PAL.ink, sw: sw * .35 });
    }
    pop();
  };

  const SYX = 700, SYU = 50;
  function sydneyShot(t, lt, dur) {
    const push_ = ease(seg(t, SYD_IN + .3, BLOW));
    const enter = seg(t, SYD_IN - .38, SYD_IN), land = t - SYD_IN;
    const [sx, sy] = shakeXY(t, land > 0 ? 7 * Math.exp(-land * 10) : 0);
    camBegin(lerp(940, 1060, push_) + sx, lerp(560, 600, push_) + sy, lerp(1.0, 1.32, push_), 0);
    room(t);
    const b = bpOf(t), hug = land > 0 && t < RING - .4, squeeze = hug ? pulse(t, 5) : 0;
    const kneel = easeOut(seg(t, RING - .38, RING - .08));
    // inside the cage: rattling the bars, then the ring, the horror, a frantic look round, and the squeeze out
    const sqz = seg(t, SQZ0, ESCAPE), out = t >= ESCAPE;
    const bx = RM.cx + .52 * RM.r, sy_ = RM.perch - 6 * RM.rs;
    const rm = researcher.emotions(t, [[SYD_SHOT, 'scared'], [RING + .2, 'surprised', { lookX: -1, lookY: .2 }], [HORROR, 'scared', { lookX: -1, emote: 'sweat' }], [SQZ0 - .5, 'nervous']]);
    const insideR = () => {
      if (out || sqz > .55) return;
      const rattle = t < RING ? 1 : 0, shake = rattle * Math.sin(t * 60) * 5, grip = .3 + .25 * Math.abs(Math.sin(t * 14)) * rattle;
      const rx = lerp(RM.cx, bx - 20, ease(sqz / .55));
      researcher(rx + shake, RM.perch, RM.rs, { ...rm, aL: grip, aR: grip + .1, rot: 0, dx: (rm.dx || 0) * .3, noShadow: true, dy: (rm.dy || 0) - .2 * Math.abs(Math.sin(t * 14)) * rattle,
        mouth: t < RING ? (t % .5 < .25 ? 'O' : 'wobble') : rm.mouth, brows: 'worried', hairUp: .7, boilKey: 'researcher' });
    };
    caged({ rot: hug ? .03 * Math.sin(b * Math.PI) + .02 * squeeze : 0, inside: insideR,
      sq: sqz > .3 && !out ? { x: bx, y: sy_, k: ease(seg(sqz, .3, .7)) } : (out ? { x: bx, y: sy_, k: 1 - seg(t, ESCAPE, ESCAPE + .3) } : null) });
    // squeezing through the bars: squashed thin as toothpaste
    if (sqz > .55 && !out) {
      const q = seg(sqz, .55, 1);
      push(); translate(bx + q * 24, RM.perch); scale(.32 + .12 * Math.sin(t * 40), 1.18);
      researcher(0, 0, RM.rs, { noShadow: true, aL: 1.3, aR: 1.3, eyes: 'closed', mouth: 'flat', boilKey: 'researcher' }); pop();
    }
    if (out) {
      const a = t - ESCAPE, fall = seg(a, .05, .36), fx = bx + 80 + 70 * a, fy = lerp(RM.perch, 880, easeIn(fall)), sq = fall >= 1 ? .25 * Math.exp(-(a - .36) * 10) : -.1;
      researcher(fx, fy, RM.rs, { sq: a < .12 ? .3 * (1 - a / .12) - .1 : sq, eyes: fall >= 1 ? 'wide' : 'closed', mouth: 'O', aL: 1.2, aR: 1.2, hairUp: 1, noShadow: fall < 1, boilKey: 'researcher' });
      if (a < .3) for (let j = 0; j < 6; j++) { boilSeed('pop spark' + j); const aa = j / 6 * TAU, q = a / .3; sparkle(bx + 20 + Math.cos(aa) * 90 * q, sy_ + Math.sin(aa) * 90 * q, 22 * (1 - q), PAL.cream); }
    }
    // Sydney: whooshes in, cuddles the cage (a squeeze on every beat), then kneels and opens the ring box on the bar
    const x = land > 0 ? SYX + 12 * Math.sin(b * Math.PI) * (1 - kneel) - 40 * kneel : lerp(-500, SYX, backOut(enter));
    if (land <= 0) for (let i = 0; i < 5; i++) { boilSeed('trail heart' + i); paint(heartPts(x - 300 - i * 90, 700 - (i % 2) * 70, 30 - i * 4, 14), { wash: '#F06A92', ink: PAL.ink, sw: .5 }); }
    const open = easeOut(seg(t, RING + .02, RING + .25)), ga = seg(t, RING + .22, RING + .7), glint = ga > 0 && ga < 1 ? Math.sin(ga * Math.PI) : 0;
    const aR = hug ? .75 + .1 * squeeze : lerp(.75, .1, kneel);
    const md = clawd.emotions(t, [[SYD_SHOT, 'love'], [ESCAPE + .05, 'surprised']]);
    sydney(x, 880, SYU, t, {
      ...faceOf(md), eyes: t < ESCAPE + .05 ? 'heart' : md.eyes, mouth: t < ESCAPE + .05 ? 'cat' : 'O',
      rot: land > 0 ? lerp(.13 + .03 * Math.sin(b * Math.PI), .04, kneel) : -.12 * (1 - enter), sq: land > 0 ? .08 * squeeze + .12 * kneel + .04 * pulse(t, 6) * kneel + (md.sq || 0) * .5 : -.15 * (1 - enter),
      aL: hug ? 1.2 + .15 * squeeze : lerp(.9, .6, kneel), aR,
      armR: kneel > 0 ? upR(aR, (u, sw) => { push(); translate(.5 * u, -.3 * u); ringBox(open, glint)(u, sw); pop(); }) : null
    });
    beatHearts(t, 250, 1650, .95);
    camEnd();
  }

  // =====================================================================================================
  // E2 · "…free" · Closer on Sydney: the Researcher legs it out of frame; Sydney pouts under a little rain cloud, then
  // the heart eyes come back and Sydney blows a heart bubble that swells until its film fills the whole frame.
  // Seam out: at the Chapter's end the frame is flat bubble pink '#F4B6C2' with a soft white highlight arc in the upper
  // left (the bubble seen from inside); Chapter 4 pops it.
  // =====================================================================================================
  // glossy crescent highlight along a circle arc
  function gloss(cx, cy, R, a0, a1, w, op = 235) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = lerp(a0, a1, i / 12); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    for (let i = 12; i >= 0; i--) { const a = lerp(a0, a1, i / 12), k = Math.sin(i / 12 * Math.PI); pts.push([cx + Math.cos(a) * (R - w * k), cy + Math.sin(a) * (R - w * k)]); }
    paint(pts, { wash: '#FFF8FB', washOp: op, ink: null });
  }
  function heartBubble(x, cy, r, film) {
    boilSeed('bubble');
    paint(heartPts(x, cy, r, 60), { wash: PINK, washOp: lerp(130, 255, film), fill: '#FF8FB6', fillOp: 70 * (1 - film), bleed: .05, tex: .35, border: .8, ink: r < 1400 ? '#C2466F' : null, sw: 1.6 + r / 240 });
    boilSeed('bubble gloss');
    gloss(x - .5 * r, cy - .28 * r, .36 * r, 3.4, 4.6, .1 * r);
    paint(ellPts(x - .1 * r, cy - .56 * r, .055 * r, .035 * r, 10, 0, -.3), { wash: '#FFF8FB', washOp: 230, ink: null });
    gloss(x + .45 * r, cy - .02 * r, .5 * r, -.25, .45, .045 * r, 120);
  }
  // the inside of the bubble, in screen space: the Chapter's last frame (cover = 1)
  function insideBubble(cover) {
    if (cover <= 0) return;
    flash(cover, PINK);
    boilSeed('inside gloss');
    gloss(560, 520, 430, 3.3, 4.7, 70 * cover, 225 * cover);
    paint(ellPts(840, 150, 44 * cover, 26 * cover, 14, 0, -.2), { wash: '#FFF8FB', washOp: 230 * cover, ink: null });
  }

  const BX = 820, BY = 880;
  function bubbleShot(t, lt, dur) {
    const T1 = BLOW2 + .4;                                                   // the bubble has left the lips
    const blowK = pulse(t, 7) * (t > BLOW2 ? 1 : 0), dyS = -.2 * blowK;
    const mouthXY = [BX, BY + (dyS - 4.3) * SYU];
    const r = t < BLOW2 + .02 ? 0 : t < T1 ? lerp(0, 160, easeOut(seg(t, BLOW2 + .02, T1))) * (1 + .1 * blowK) : 160 * Math.exp(4.98 * (t - T1)) * (1 + .07 * blowK);
    const zin = ease(seg(t, BLOW2, END));
    const zoom = lerp(1.25, 1.6, zin);
    camBegin(lerp(1000, mouthXY[0], zin), lerp(600, mouthXY[1], zin), zoom, 0);
    room(t);
    caged({});
    // the Researcher legs it off to the right
    const run = seg(t, BLOW - .1, END), rxp = lerp(1530, 2100, easeIn(run));
    researcher(rxp, 880, RM.rs, { run: t * 6, aL: .9 * Math.sin(t * 20), aR: -.9 * Math.sin(t * 20), eyes: 'wide', mouth: 'O', brows: 'worried', hairUp: 1, rot: .1, emote: 'sweat', emoteAge: t - BLOW, boilKey: 'researcher' });
    // Sydney: a pout, then the heart eyes come back and Sydney blows
    const md = clawd.emotions(t, [[BLOW, 'sad', { mouth: 'pout' }], [BLOW2 - .1, 'love', { mouth: 'o', emote: null }]]);
    sydney(BX, BY, SYU, t, { ...faceOf(md), eyes: t < BLOW2 - .1 ? md.eyes : 'heart', dy: dyS + (md.dy || 0) * .5, sq: (md.sq || 0) * .5, sx: 1 + .08 * blowK,
      aL: -.2 + .5 * blowK, aR: -.2 + .5 * blowK, lookX: t < BLOW2 - .1 ? .9 : 0 });
    beatHearts(t, 250, 1650, 1, rxp);
    const film = seg(t, END - .45, END - .1);
    if (r > 2) heartBubble(mouthXY[0], mouthXY[1] - .12 * r, r, film);
    camEnd();
    // the film swallows the frame: settle on the flat pink, highlight upper left
    insideBubble(ease(seg(t, END - .32, END - .06)));
  }

  chapter('takeoff', V2.start, V2.end, [
    [GYM, gymShot], [DIAL, dialShot], [OPEN, holeShot], [RIDE, rideShot],
    [ATOMS, atomsShot], [MELT, assembleShot], [SYD_SHOT, sydneyShot], [BLOW, bubbleShot],
  ]);
})();
