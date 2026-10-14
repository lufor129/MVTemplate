// c02_chorus1: Chorus 1 + Interlude, "the P(doom) show". Out of Clawd's mouth onto the stage: Clawd pogo-pumps the
// meter, rides a firework rocket (FOOM) up into a paper Chinese room in the sky, eats a mushroom from a paper bag and
// trips into a rainbow vortex that resolves into a smiley… which is the mask on a shoggoth. Clawd yanks it off, its eyes
// go shinigami-red, the Researcher's hourglass drains, and everybody dances. Ported from PDoomVideo/src/ch/c02_chorus1.js
// and re-timed to the analysed song: every event hangs off a Lyric Line, a word in it, or the Beat Grid.
(() => {
  const RED = '#E0283F', MAROON = '#4A1F2A', DARKRED = '#1E0A12';
  const SH_BODY = '#4FA79B', OLIVE = '#93A04C', OLIVE_DK = '#6E7A36', MASKC = '#F7D35A';
  const PAP = '#FBF3E2', PAP2 = '#EFE0C4', PAP3 = '#E2CBA3';
  const qbez = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  const boilN = t => Math.floor(t * BOIL);

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                 // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);  // n beats after the beat nearest t
  const CHO = sec('Chorus 1'), INTER = sec('Interlude');
  // A · "I'm upping my P(doom)"
  const UP = CHO.start, OPEN = nearestBeat(word(6, 2));          // the mouth is fully open by "my"
  // B · "'cause the future goes FOOM"
  const FUTURE = LINES[7].start, LIGHT = nearestBeat(word(7, 2)); // "future": the match touches the fuse
  const PANIC = nearestBeat(word(7, 3));                          // "goes": Clawd sees the fuse is nearly gone
  const IGN = nearestBeat(word(7, 4));                            // "FOOM" (a bar start): lift-off
  // C · "Trapped in the Chinese room"
  const ROOM = LINES[8].start, FRANTIC = beatsAfter(ROOM, 1);     // crash, then shuffle slips from the next beat
  const BAG = nearestBar(word(8, 4));                             // "room": a paper bag drops in
  // D · "with a bag of shrooms"
  const SHROOM = LINES[9].start, GULP = nearestBeat(word(9, 2));  // "bag": the lid snaps shut on the mushroom
  const SUCK = nearestBar(word(9, 4)) - .17;                      // the trip spirals into the vortex
  // E · "See through the shoggoth's lies"
  const LIES = LINES[10].start, PULL = word(10, 1);               // "through": pull back from the smiley
  const SLIP = nearestBeat(word(10, 3)), YANK = beatsAfter(SLIP, 2), SHEEP = beatsAfter(YANK, 1);
  // F · "with your shinigami eyes"
  const EYE = LINES[11].start, PUSH = EYE - .45;                  // push into Clawd's eye, iris to dark red
  const FLARE = nearestBeat(word(11, 1)), WHIP = beatsAfter(FLARE, 1);
  // G · Interlude dance break
  const BREAK = INTER.start, POP = beatsAfter(BREAK, 3);          // confetti burst on the bar
  const WAVES = [beatsAfter(BREAK, 2), beatsAfter(BREAK, 4)].map(bpOf);

  // ======================================================================================
  // little props
  // ======================================================================================

  // superellipse "lunchbox mouth" outline
  function mouthPts(cx, cy, hw, hh, n = 44) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
      p.push([cx + hw * Math.sign(c) * Math.pow(Math.abs(c), .32), cy + hh * Math.sign(s) * Math.pow(Math.abs(s), .32)]);
    }
    return p;
  }
  const edgeY = (hw, hh, dx) => { const f = clamp(Math.abs(dx) / hw, 0, .999), c = Math.pow(f, 1 / .32), s = Math.sqrt(1 - c * c); return hh * Math.pow(s, .32); };

  // The Seam in: from the black of Chapter 1's CHOMP, Clawd's jaws hinge open (screen space): a teeth-edged hole.
  function mouthReveal(t) {
    const k = seg(t, UP, OPEN);
    if (k >= 1) return;
    boilSeed('mouth reveal');
    const e = ease(k), hh = lerp(0, 1300, Math.pow(e, .9)), hw = lerp(860, 1900, e), cx = 960 + e * 60, cy = 560 - hh * .25;
    if (hh < 4) { flash(1, PAL.ink); return; }
    irisShape(mouthPts(cx, cy, hw, hh), MAROON);
    irisShape(mouthPts(cx, cy, hw + 90, hh + 70), PAL.ink);
    const n = 7, sp = hw * 1.7 / n, tw = 205 * (1 + .35 * e), th = tw * .78;
    const tooth = (xm, ybase, dir) => {
      const y0 = ybase - dir * 26;
      paint([[xm - tw / 2 + 4, y0], [xm + tw / 2 - 4, y0], [xm + tw * .13, ybase + dir * th], [xm - tw * .13, ybase + dir * th]], { wash: PAL.cream, ink: PAL.ink, sw: 1.3, curv: .25 });
      inkLine([[xm - tw * .3, y0 + dir * 30], [xm - tw * .12, ybase + dir * th * .7]], .5, '#CDBB98', 'inkfine', 0);
    };
    for (let i = 0; i < n; i++) { const xm = cx - hw * .85 + (i + .5) * sp; tooth(xm, cy - edgeY(hw, hh, xm - cx), 1); }
    for (let i = 0; i < n - 1; i++) { const xm = cx - hw * .85 + (i + 1) * sp; tooth(xm, cy + edgeY(hw, hh, xm - cx), -1); }
  }

  // Firework rocket, base of the body at (0, 0) in the current transform (≈150 wide, 480 tall).
  function rocketBody(flame = 0) {
    boilSeed('rocket');
    const sw = 1.3;
    if (flame > .01) {
      const L = flame;
      paint([[-58, -6], [58, -6], [34 + jit(10), 110 * L], [0, 260 * L + jit(26)], [-34 + jit(10), 110 * L]], { wash: PAL.ochre, fill: RED, fillOp: 110, bleed: .2, tex: .4, ink: PAL.ink, sw: .9, curv: .6 });
      paint([[-30, -6], [30, -6], [0, 150 * L + jit(16)]], { wash: PAL.cream, ink: null, curv: .6 });
    }
    for (const s of [-1, 1]) paint([[s * 70, -170], [s * 150, -30], [s * 150, 36], [s * 70, -20]], { wash: PAL.teal, fill: PAL.indigo, fillOp: 60, tex: .5, ink: PAL.ink, sw });
    paint(rectPts(-76, -345, 152, 345, 2), { wash: '#D8394E', fill: '#8E1F33', fillOp: 70, tex: .6, border: .5, ink: null });
    for (const by of [-300, -205, -110]) paint([[-76, by + 34], [76, by - 10], [76, by + 26], [-76, by + 70]], { wash: PAL.cream, ink: null });
    inkLine([[-50, -325], [-50, -30]], 1.4, '#F7A8AE', 'inkfine', 0);
    paint(rrPts(-76, -345, 152, 345, 20), { ink: PAL.ink, sw });
    paint([[-84, -340], [84, -340], [36, -440], [0, -482], [-36, -440]], { wash: PAL.ochre, fill: '#C97B1E', fillOp: 70, tex: .5, ink: PAL.ink, sw, curv: .35 });
    paint(ellPts(0, -470, 14, 14, 10), { wash: RED, ink: PAL.ink, sw: .6 });
    paint(rectPts(-46, -14, 92, 26, 2), { wash: '#556070', ink: PAL.ink, sw: sw * .8 });
  }
  // a belt strapping Clawd onto the rocket (Clawd's draw hook, body-local)
  const strap = (u, sw) => {
    paint(rectPts(-5.5 * u, -3.7 * u, 11 * u, .9 * u, u * .05), { wash: '#5B3A29', ink: PAL.ink, sw: sw * .6 });
    paint(rectPts(-.6 * u, -3.9 * u, 1.2 * u, 1.3 * u), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .5 });
  };

  // puffy cloud: scalloped top, flat bottom (washes only)
  function cloud(cx, cy, w, sw = .8) {
    boilSeed('cloud' + cx);
    const p = [];
    for (let i = 0; i <= 14; i++) { const q = i / 14, a = Math.PI + q * Math.PI, b = 1 + .2 * Math.abs(Math.sin(q * Math.PI * 3.5 + cx * .013)); p.push([cx + Math.cos(a) * w * .5 * b, cy + Math.sin(a) * w * .3 * b]); }
    p.push([cx + w * .5, cy + w * .05], [cx - w * .5, cy + w * .05]);
    paint(p, { wash: '#FFF7EC', washOp: 245, ink: PAL.ink, sw, curv: .6 });
    paint(ellPts(cx + w * .05, cy + w * .01, w * .38, w * .05, 10), { wash: '#F0B9AE', washOp: 140, ink: null });
  }

  // a paper slip; glyph = the Chinese the joke needs (a Sound Word), lettered on the slip
  function slip(x, y, s, rot, glyph) {
    push(); translate(x, y); rotate(rot); scale(s);
    paint(rectPts(-34, -22, 68, 44, 1.5), { wash: '#FFFBF0', ink: PAL.ink, sw: .7 });
    pop();
    if (glyph) letter(glyph, x, y + 2 * s, 30 * s, PAL.ink, { rot, ink: false });
  }

  // cute mushroom, ground point (x, y); s = 1 → cap ≈ 124 px wide
  function mushroom(x, y, s, cap, sq = 0, rot = 0, face = true) {
    push(); translate(x, y); rotate(rot); scale(s * (1 + sq * .6), s * (1 - sq));
    paint(rrPts(-24, -70, 48, 70, 14), { wash: PAL.cream, ink: PAL.ink, sw: .9 });
    paint(rectPts(-22, -24, 44, 20), { wash: '#E6D2B0', washOp: 150, ink: null });
    if (face) {
      for (const ex of [-9, 9]) paint(ellPts(ex, -42, 3.5, 5, 8), { wash: PAL.ink, ink: null });
      inkLine([[-7, -31], [0, -26], [7, -31]], .7, PAL.ink, 'ink', .6);
      for (const ex of [-15, 15]) paint(ellPts(ex, -33, 4, 2.4, 8), { wash: PAL.rose, washOp: 170, ink: null });
    }
    const c = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; c.push([Math.cos(a) * 62, -62 + Math.sin(a) * 52]); }
    c.push([56, -56], [-56, -56]);
    paint(c, { wash: cap, ink: PAL.ink, sw: 1, curv: .4 });
    paint([[-54, -64], [54, -64], [40, -76], [-40, -76]], { wash: PAL.ink, washOp: 45, ink: null });
    for (const [dx, dy, r] of [[-30, -86, 10], [6, -102, 8], [32, -80, 9]]) paint(ellPts(dx, dy, r, r * .8, 10), { wash: PAL.cream, ink: null });
    pop();
  }

  // the smiley mask (a disc of radius r)
  function smiley(x, y, r, rot = 0, o = {}) {
    push(); translate(x, y); rotate(rot);
    const sw = clamp(r / 55, .6, 2.4);
    paint(ellPts(0, 0, r, r * .97, 26), { wash: MASKC, ink: null });
    paint(ellPts(r * .08, r * .12, r * .86, r * .8, 12), { fill: PAL.ochre, fillOp: 80, bleed: .08, tex: .6, border: .7, ink: null });
    paint(ellPts(0, 0, r, r * .97, 26), { ink: PAL.ink, sw });
    for (const s of [-1, 1]) paint(ellPts(s * r * .56, r * .2, r * .17, r * .1, 10), { wash: PAL.rose, washOp: 170, ink: null });
    const ek = o.eyesK ?? 1, mk = o.mouthK ?? 1;
    if (ek > .02) for (const s of [-1, 1]) paint(ellPts(s * r * .32, -r * .22, r * .1 * ek, r * .2 * ek, 12), { wash: PAL.ink, ink: null });
    if (mk > .02) inkLine([[-r * .5 * mk, r * .1], [-r * .28 * mk, r * .42], [0, r * .53], [r * .28 * mk, r * .42], [r * .5 * mk, r * .1]], sw * 1.5, PAL.ink, 'ink', .6);
    pop();
  }

  // ======================================================================================
  // The shoggoth (a Guest, on CAST for the curtain call): a teal blob with many eyes and olive tentacles, wearing a
  // smiley mask. (x, y) ground point, s on Clawd's u scale (≈12.6s wide, ≈11s tall). t drives the beat bounce.
  // o: mask 0..1 (1 = on, between = slipping, 0 = off), bow 0..1, eyes 0..1 (default 1 - mask), look / lookY (pupils),
  //    wave 0..1 (the right tentacle waves), tilt (head tilt), flip, startle 0..1, boilKey.
  // ======================================================================================
  const SH_EYES = [[-3.3, -8.6, .95], [-.2, -9.7, 1.0], [2.9, -8.9, .85], [4.8, -6.6, .75], [-5.0, -6.2, .7], [-1.9, -7.2, 1.15], [1.4, -6.6, 1.45],
    [3.4, -4.4, .8], [-3.8, -3.9, .85], [-.5, -4.6, .7], [4.8, -2.9, .5], [-4.7, -2.4, .55], [1.9, -2.6, .6]];
  function tentacle(bx, by, ang, len, w, curl, col, sw, suckers = 0, n = 8) {
    const L = [], R = [], C = [];
    let x = bx, y = by, a = ang;
    for (let k = 0; k <= n; k++) {
      const q = k / n, ww = w * (1 - q * .82);
      C.push([x, y, a, ww]);
      L.push([x + Math.cos(a - Math.PI / 2) * ww, y + Math.sin(a - Math.PI / 2) * ww]);
      R.push([x + Math.cos(a + Math.PI / 2) * ww, y + Math.sin(a + Math.PI / 2) * ww]);
      if (k < n) { x += Math.cos(a) * len / n; y += Math.sin(a) * len / n; a += curl * (.3 + q * 1.6) / n; }
    }
    paint(L.concat([[x + Math.cos(a) * w * .15, y + Math.sin(a) * w * .15]], R.reverse()), { wash: col, washOp: 255, ink: PAL.ink, sw, curv: .45 });
    for (let k = 1; k <= suckers; k++) { const [px, py, pa, ww] = C[k + 1]; paint(ellPts(px + Math.cos(pa + Math.PI / 2) * ww * .45, py + Math.sin(pa + Math.PI / 2) * ww * .45, ww * .3, ww * .3, 8), { wash: '#E7D9A8', ink: null }); }
  }
  function shoggoth(x, y, s, t, o = {}) {
    const key = o.boilKey || 'shoggoth', bs = part => boilSeed(key + ' ' + part);
    const bp = bpOf(t), hit = pulse(t, 5), ab = Math.abs(Math.sin(bp * Math.PI)), wig = Math.sin(bp * Math.PI);
    const mask = clamp(o.mask ?? 1), bow = clamp(o.bow || 0), st = clamp(o.startle || 0);
    const eyeK = clamp(o.eyes ?? (1 - mask) * 1.4), sw = clamp(s / 16, .55, 2.4), fl = o.flip ? -1 : 1;
    bs('shadow');
    paint(ellPts(x, y + s * .15, s * 7.2, s * 1.1, 12), { wash: PAL.ink, washOp: 60, ink: null });
    push(); translate(x, y); scale(fl, 1);
    rotate(bow * .16 + (o.tilt || 0) * .25);
    scale(1 + hit * .05 + bow * .06 - st * .08, 1 - hit * .05 - bow * .2 + st * .14);
    translate(0, -ab * .3 * s);
    bs('back tentacles');
    tentacle(-3.2 * s, -9 * s, -2.0, 4.2 * s, .75 * s, 1.8 * wig, OLIVE_DK, sw * .8);
    tentacle(3.6 * s, -8.6 * s, -1.1, 4.6 * s, .8 * s, -1.9 * wig, OLIVE_DK, sw * .8);
    bs('arms');
    tentacle(-5.6 * s, -4.8 * s, Math.PI + .5 - bow * .4, 5 * s, .9 * s, 2.2 * wig + .6, OLIVE, sw * .85, 3);
    const wv = clamp(o.wave || 0);
    tentacle(5.6 * s, -4.8 * s, lerp(-.4 + bow * .4, -1.3, wv), 5.2 * s, .9 * s, lerp(-2.2 * wig - .6, -1.4 + Math.sin(t * 14) * 1.5, wv), OLIVE, sw * .85, 3);
    bs('body');
    const body = [];
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU, r = 1 + .06 * Math.sin(a * 3 + t * 2.1) + .045 * Math.sin(a * 5 - t * 3.3);
      const px = Math.cos(a) * 6.3 * s * r; let py = -5.3 * s + Math.sin(a) * 5.4 * s * r;
      if (py > -.3 * s) py = -.3 * s + (py + .3 * s) * .12;
      body.push([px, py]);
    }
    paint(body, { wash: SH_BODY, washOp: 255, ink: null });
    paint(ellPts(-1.2 * s, -8.2 * s, 3.8 * s, 1.8 * s, 10), { fill: '#A5DDCD', fillOp: 130, bleed: .2, tex: .8, border: .8, ink: null });
    paint(ellPts(.8 * s, -1.9 * s, 5.6 * s, 1.9 * s, 10), { fill: PAL.violet, fillOp: 120, bleed: .15, tex: .7, border: .6, ink: null });
    paint(body, { ink: PAL.ink, sw });
    // eyes: shut lids while masked, popping open in a ripple when revealed
    bs('eyes');
    const lx = (o.look ?? Math.sin(t * 1.3)) * .3 * s;
    SH_EYES.forEach(([ex, ey, er], i) => {
      const k = clamp(eyeK * 1.8 - i * .06), X = ex * s, Y = ey * s, R = er * s * .62 * (1 + st * .25);
      const lid = () => inkLine([[X - R, Y], [X, Y + R * .35], [X + R, Y]], sw * .7, PAL.ink, 'ink', .5);
      if (k < .1 || ((t * .7 + hash(i) * 5) % 4.1) < .1) return lid();
      const ry = R * backOut(k);
      paint(ellPts(X, Y, R, ry, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .6 });
      paint(ellPts(X + lx * er * .9, Y + (o.lookY || 0) * R * .3, R * .45, Math.min(ry, R) * .5, 10), { wash: i % 4 === 1 ? PAL.violet : PAL.ink, ink: null });
      if (er > .9) paint(ellPts(X + lx * er * .9 + R * .15, Y - R * .18, R * .12, R * .12, 8), { wash: PAL.cream, ink: null });
    });
    // its own nervous grin, once the mask is gone
    if (mask < .6) {
      bs('grin');
      const mk = seg(.6 - mask, 0, .4), my = -3.3 * s;
      const mp = [[-2.2 * s, my], [-1.1 * s, my + .35 * s * mk + Math.sin(t * 9) * .1 * s], [0, my + .1 * s], [1.1 * s, my + .35 * s * mk - Math.sin(t * 9) * .1 * s], [2.2 * s, my]];
      inkLine(mp, sw * 1.1, PAL.ink, 'ink', .4);
      for (const tx of [-1.1, 1.1]) paint([[tx * s - .25 * s, my + .22 * s * mk], [tx * s + .25 * s, my + .22 * s * mk], [tx * s, my + .7 * s * mk]], { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
    }
    bs('feet');
    tentacle(-3.8 * s, -.5 * s, Math.PI - .2, 3.4 * s, .75 * s, -2.4 + wig * 1.2, OLIVE, sw * .8, 2);
    tentacle(3.8 * s, -.5 * s, .2, 3.4 * s, .75 * s, 2.4 + wig * 1.2, OLIVE, sw * .8, 2);
    tentacle(-1.4 * s, -.4 * s, 1.9, 1.6 * s, .6 * s, -3 - wig, OLIVE, sw * .7);
    tentacle(1.6 * s, -.4 * s, 1.25, 1.6 * s, .6 * s, 3 - wig, OLIVE, sw * .7);
    // the mask on its strap; slipping = slides down and tilts
    if (mask > .04) {
      bs('mask');
      const sl = 1 - mask, mx = sl * 1.6 * s, my = -6.9 * s + sl * 2.3 * s, mr = (o.tilt || 0) * .3 + sl * .75;
      inkLine([[-5.9 * s, -7.4 * s], [mx - 2.4 * s, my - .8 * s + sl * .6 * s]], sw * .7, PAL.ink, 'ink', .3);
      inkLine([[5.9 * s, -7.4 * s], [mx + 2.5 * s, my - .5 * s - sl * .8 * s]], sw * .7, PAL.ink, 'ink', .3);
      smiley(mx, my, 2.75 * s, mr);
    }
    pop();
    boilSeed(key + ' after');
  }
  CAST.shoggoth = shoggoth;

  // ======================================================================================
  // A · "I'm upping my P(doom)" · Out of Clawd's mouth onto the stage: Clawd rides the pump handle like a pogo stick,
  // slamming it down on every beat, and the meter climbs. A chorus line of small Clawds hops; the Researcher (alive,
  // confused) dances half a beat late. Seam in: the mouth-shaped iris. Seam out: cut on the beat to the rocket.
  // ======================================================================================
  const PX = 1040, PY = 945, PS = 1.05, MX = 1420, MY = 940, MS = 1.0, BULB = [MX - 60 * MS, MY - 92 * MS];
  function upping(t, lt, dur) {
    const bp = bpOf(t), f = frac(bp), h = pumpH(t), hit = pulse(t, 7), open = ease(seg(t, UP + .15, FUTURE - .1));
    const [sx, sy] = shakeXY(t, 5 * hit * open);
    camBegin(lerp(1090, 1010, open) + sx, lerp(560, 590, open) + sy, lerp(1.4, 1.15, open) + .015 * hit, lerp(-.03, 0, open));
    stageBack(t, { a: PAL.rose, b: PAL.ochre, spots: [[PX, PAL.cream]] });
    // the chorus line, upstage, hopping in a ripple
    [[420, 0, 0], [540, 1, .12], [1600, 2, .24]].forEach(([x, i, d]) => {
      const m = clawd.dance('hop', t - d * BEAT, i);
      miniClawd(x, 905, 13, { ...m, rot: (beatN(t - d * BEAT) % 2 ? 1 : -1) * .1, eyes: 'happy', mouth: 'smile', hat: 'party', key: 'line' + i });
    });
    meterProp(MX, MY, MS, pdoomAt(t), { glow: .9 * pulse(t, 4) });
    pumpProp(PX, PY, PS, h, BULB);
    // a bulge of air rides the hose to the meter after every slam
    boilSeed('air bulge');
    const a = [PX + 30 * PS, PY - 20 * PS], m = [lerp(PX, BULB[0], .5), PY + 30 * PS], c = [2 * m[0] - (a[0] + BULB[0]) / 2, 2 * m[1] - (a[1] + BULB[1]) / 2];
    const hu = seg(f, 0, .5);
    if (hu > 0 && hu < 1) { const q = qbez(a, c, BULB, hu); paint(ellPts(q[0], q[1], 17, 15, 12), { wash: PAL.ink, ink: null }); paint(ellPts(q[0] - 4, q[1] - 5, 5, 4, 8), { wash: PAL.cream, washOp: 180, ink: null }); }
    // the Researcher: alive, confused, half a beat behind everyone
    const rd = researcher.dance('hop', t - BEAT * .5, 3);
    const rm = researcher.emotions(t, [[UP, 'surprised'], [OPEN, 'confused']]);
    researcher(660, 950, 19, { ...rm, dy: (rm.dy || 0) + rd.dy * .5, sq: (rm.sq || 0) + rd.sq, lookX: Math.sin(bp * Math.PI), hairUp: .5, boilKey: 'researcher' });
    // Clawd on the pump handle: up with it, a little leap at the top, and slam on the beat
    const top = PY - (270 + 150 * h) * PS, hop = Math.sin(seg(f, .45, .9) * Math.PI) * 1.2, falling = f > .8;
    const md = clawd.emotions(t, [[UP, 'happy']]);
    clawd(PX, top, 24, {
      ...md, dy: -hop, sq: .3 * pulse(t, 10) - (falling ? .14 : 0) - (f > .45 && f < .8 ? .06 : 0), rot: 0, dx: 0, noShadow: true,
      aL: falling ? -.5 : 1.15 + .25 * Math.sin(f * TAU), aR: falling ? -.5 : 1.15 - .25 * Math.sin(f * TAU),
      eyes: 'happy', mouth: hit > .4 ? 'grin' : 'smile', blush: 1, boilKey: 'clawd'
    });
    // puffs from the pump foot on the slam
    if (f < .3) for (const s of [-1, 1]) { boilSeed('puff' + s); const k = f / .3; paint(ellPts(PX + s * (110 + 70 * k), PY - 10 - 20 * k, 26 * (1 - k * .5), 18 * (1 - k * .5), 10), { wash: PAL.cream, washOp: 230 * (1 - k), ink: PAL.ink, sw: .6 }); }
    stageFront(t, {});
    camEnd();
    flushLetters();                                      // the meter's lettering belongs to the stage, under the mouth
    mouthReveal(t);
  }

  // ======================================================================================
  // B · "'cause the future goes FOOM" · Clawd is strapped to a firework rocket, starry-eyed. The Researcher lights the
  // fuse with a giant match on "future" and runs; on "goes" Clawd sees how short the fuse is; on "FOOM" lift-off:
  // a painted explosion, FOOM, the stage shakes, and the camera tilts up after it. Seam out: the tilt carries on up.
  // ======================================================================================
  const ROOM_Y = -3300, RX = 900;
  const rocketY = t => 905 - 3620 * Math.pow(seg(t, IGN, ROOM), 1.8);
  const foomCamY = t => lerp(640, ROOM_Y + 380, easeIn(seg(t, IGN + .18, ROOM)));
  const SKY = [[-560, '#F6D7A6'], [-1300, '#F4BFA8'], [-2100, '#EFA8B2'], [-2900, '#E7A9BE'], [-3700, '#DDB0CC']];
  const CLOUDS = [[380, -900, 340], [1560, -1250, 400], [720, -1750, 300], [1380, -2250, 340], [300, -2650, 300], [1680, -2850, 280], [520, -3500, 320], [1480, -3650, 300], [960, -4000, 420]];
  function skyWorld(y0, y1) {
    boilSeed('sky');
    for (let i = 0; i < SKY.length; i++) {
      const top = i + 1 < SKY.length ? SKY[i + 1][0] : -6000, bot = SKY[i][0] + 120;
      if (bot < y0 || top > y1) continue;
      paint(rectPts(-300, top - 140, W + 600, bot - top + 140), { wash: SKY[i][1], washOp: 255, fill: i < SKY.length - 1 ? SKY[i + 1][1] : SKY[i][1], fillOp: 90, bleed: .25, tex: .5, border: .2, ink: null });
    }
    for (const [cx, cy, w] of CLOUDS) if (cy + 200 > y0 && cy - 200 < y1) cloud(cx, cy, w);
  }
  function starBurst(cx, cy, r, n, col, rot) { paint(starPts(cx, cy, r, .62, n, rot).map(([x, y]) => [x + jit(r * .03), y + jit(r * .03)]), { wash: col, ink: PAL.ink, sw: 1.3 }); }
  const FUSE = [[RX - 330, 930], [RX - 250, 918], [RX - 170, 934], [RX - 90, 922], [RX - 30, 912], [RX - 8, 900]];
  function foom(t, lt, dur) {
    const ign = t >= IGN, age = t - IGN, ry = rocketY(t);
    const pre = ease(seg(t, FUTURE, PANIC));
    const shake = ign ? 26 * Math.exp(-age * 4.5) : 6 * seg(t, PANIC, IGN);
    const [sx, sy] = shakeXY(t, shake);
    const zoom = ign ? lerp(1.5, 1.0, easeOut(seg(age, 0, .3))) : lerp(1.1, 1.5, pre);
    const ccx = ign ? RX + 40 : lerp(860, RX - 20, pre), ccy = ign ? lerp(660, foomCamY(t), easeOut(seg(age, 0, .3))) : lerp(600, 660, pre);
    camBegin(ccx + sx, ccy + sy, zoom, 0);
    const y0 = ccy - 700, y1 = ccy + 700;
    // the stage (only while in view), with the meter and the abandoned pump
    if (y1 > -60) {
      stageBack(t, { a: PAL.rose, b: PAL.ochre });
      meterProp(1520, 930, 1.02, pdoomAt(t), { glow: ign ? Math.exp(-age * 3) : 0 });
      pumpProp(1270, 935, 1.3, .15, [1520 - 60 * 1.02, 930 - 92 * 1.02]);
    }
    // above the stage: fly loft, roof, sky
    if (y0 < -40) {
      if (y1 > -900) {
        boilSeed('loft');
        paint(rectPts(-300, -560, W + 600, 540), { wash: '#3A2438', fill: PAL.violet, fillOp: 60, tex: .6, border: .3, ink: null });
        for (let i = 0; i < 9; i++) inkLine([[120 + i * 210, -560], [120 + i * 210 + jit(4), -40]], .7, '#8A6A5A', 'inkfine', 0);
        for (const [bx, by] of [[330, -210], [1540, -300], [760, -380]]) paint(rrPts(bx - 28, by, 56, 70, 18), { wash: '#8C6B4A', ink: PAL.ink, sw: .7 });
      }
      skyWorld(Math.min(y0, -560), Math.min(y1, -560));
      if (y1 > -760 && y0 < -540) {
        boilSeed('roof');
        paint(rectPts(-300, -640, W + 600, 90, 3), { wash: '#6B2A33', fill: CURTAIN_DK, fillOp: 90, tex: .7, ink: PAL.ink, sw: 1.2 });
        if (ry < -560) {
          const hp = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = (i % 2 ? 95 : 150) + hash(i) * 30; hp.push([RX + Math.cos(a) * r, -595 + Math.sin(a) * r * .55]); }
          paint(hp, { wash: SKY[0][1], ink: PAL.ink, sw: 1 });
        }
      }
      const tRoof = IGN + Math.pow((905 + 560) / 3620, 1 / 1.8) * (ROOM - IGN), pa = t - tRoof;
      if (pa > 0 && pa < 1) for (let i = 0; i < 6; i++) {
        boilSeed('plank' + i);
        const a = -Math.PI / 2 + (hash(i + 7) - .5) * 2.2, v = 700 + 500 * hash(i + 8);
        push(); translate(RX + Math.cos(a) * v * pa, -600 + Math.sin(a) * v * pa + 900 * pa * pa); rotate(pa * 9 + i);
        paint(rectPts(-40, -10, 80, 20), { wash: '#6B2A33', ink: PAL.ink, sw: .8 }); pop();
      }
    }
    // the explosion, left behind on the stage
    if (ign && y1 > 300) {
      boilSeed('explosion');
      const g = backOut(seg(age, 0, .3)), rise = age * 70;
      starBurst(RX, 850, 420 * g, 13, PAL.ochre, age * .4);
      starBurst(RX, 860, 280 * g, 11, '#F7E08A', -age * .5 + .2);
      const P = [[-300, 20, 120, PAL.rose], [300, 30, 125, PAL.rose], [-190, -110, 130, PAL.cream], [200, -120, 125, PAL.cream], [-420, 80, 90, PAL.ochre], [430, 90, 95, PAL.ochre], [0, 60, 150, '#F4E6D2'], [-110, 70, 110, PAL.rose], [120, 80, 110, '#F4E6D2']];
      P.forEach(([dx, dy, r, col], i) => { const rr = r * g * (1 + age * .25); if (rr > 4) paint(ellPts(RX + dx * (.6 + .4 * g), 900 + dy * g - rise * (i % 3) * .5, rr, rr * .88, 14, rr * .03), { wash: col, ink: PAL.ink, sw: 1.2 }); });
      for (let i = 0; i < 10; i++) { const a = -Math.PI * hash(i + 60), v = 900 + 600 * hash(i + 61), d = v * age; if (age < .7) paint(starPts(RX + Math.cos(a) * d, 850 + Math.sin(a) * d * .8, 22 * (1 - age), .4, 4, age * 8), { wash: i % 2 ? PAL.cream : PAL.ochre, ink: PAL.ink, sw: .5 }); }
    }
    // smoke trail from the rocket down to the stage (the visible slice only)
    if (ign && ry < 860) {
      boilSeed('smoke trail');
      const top = Math.max(ry + 20, y0 - 50), bot = Math.min(900, y1 + 50);
      if (bot > top) {
        const Lp = [], Rp = [], n = 8;
        for (let k = 0; k <= n; k++) {
          const y = lerp(top, bot, k / n), d = clamp((y - ry) / 900), w = 40 + 190 * Math.pow(d, .6);
          Lp.push([RX - w + Math.sin(y * .012 + t * 7) * 14, y]); Rp.push([RX + w + Math.sin(y * .011 - t * 6) * 14, y]);
        }
        paint(Lp.concat(Rp.reverse()), { wash: '#F3E8D8', washOp: 235, ink: PAL.ink, sw: .8, curv: .4 });
        for (let j = 0; j < 30; j++) {
          const py = 880 - j * 160; if (py < top || py > bot || py < ry + 60) continue;
          const d = clamp((py - ry) / 900), r = 50 + 120 * Math.pow(d, .6);
          for (const s of [-1, 1]) paint(ellPts(RX + s * r * .9, py + s * 40, r * .55, r * .5, 12), { wash: PAL.cream, ink: PAL.ink, sw: .7 });
        }
      }
    }
    // the room in the sky comes into view at the very end
    if (y0 < ROOM_Y + 300) { push(); translate(0, ROOM_Y - 520); paperRoomShell(false); pop(); }
    // the fuse, burning from "future" to "FOOM"
    if (!ign) {
      boilSeed('fuse');
      const fp = seg(t, LIGHT, IGN - .02), idx = fp * (FUSE.length - 1), i0 = Math.floor(idx), fr = idx - i0;
      const sp = i0 < FUSE.length - 1 ? [lerp(FUSE[i0][0], FUSE[i0 + 1][0], fr), lerp(FUSE[i0][1], FUSE[i0 + 1][1], fr)] : FUSE[FUSE.length - 1];
      const rest = [sp].concat(FUSE.slice(i0 + 1));
      if (rest.length > 1) inkLine(rest, 1.6, PAL.ink, 'ink', .5);
      if (t > LIGHT) {
        paint(ellPts(sp[0], sp[1], 36, 36, 12), { wash: PAL.ochre, washOp: 120, ink: null });
        paint(starPts(sp[0], sp[1], 26 + jit(6), .35, 5, t * 20), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
        for (let k = 0; k < 4; k++) { const a = hash(boilN(t) * 4 + k) * TAU; paint(starPts(sp[0] + Math.cos(a) * 44, sp[1] - 10 + Math.sin(a) * 36, 8, .4, 4), { wash: PAL.ochre, ink: null }); }
      }
    }
    const rs = 19;
    if (!ign) {
      // the Researcher reaches the giant match to the fuse, then scrams and ducks
      const run = seg(t, LIGHT + .12, LIGHT + .55), duck = seg(t, PANIC - .05, PANIC + .12);
      const rx = lerp(470, 250, ease(run)), reach = ease(seg(t, FUTURE, LIGHT));
      researcher(rx, 935, rs, {
        flip: run > 0, run: run > 0 && run < 1 ? t * 3 : undefined, aR: run > 0 ? lerp(-.3, 1.5, duck) : lerp(.2, -.55, reach), aL: run > 0 ? lerp(.5, 1.5, duck) : -1.1,
        sq: duck * .18, eyes: run > 0 ? (duck > .5 ? 'closed' : 'wide') : 'dot', brows: run > 0 ? 'worried' : 'up', mouth: run > 0 ? 'O' : 'grin', hairUp: run, lookX: .8, lookY: .5,
        boilKey: 'researcher',
        handR: run > 0 ? null : (s) => { push(); rotate(.35 + reach * .4); paint(rectPts(0, -5, 150, 10), { wash: '#E3C08A', ink: PAL.ink, sw: .6 }); paint(ellPts(152, 0, 12, 10, 10), { wash: RED, ink: PAL.ink, sw: .5 }); paint([[150, -8], [172, -10], [162 + jit(6), -40], [150, -18]], { wash: PAL.ochre, ink: null, curv: .5 }); pop(); }
      });
    } else if (y1 > 700) {
      researcher(250, 935, rs, { flip: true, rot: -.25 * Math.exp(-age * 3), dy: -.5 * Math.exp(-age * 5), aL: 1.6, aR: 1.6, eyes: 'x', mouth: 'O', hairUp: 1, emote: 'sweat', emoteK: seg(age, .1, .3), boilKey: 'researcher' });
    }
    // the rocket, with Clawd strapped on
    const shakeR = !ign ? 4 * Math.sin(t * 70) * seg(t, PANIC, IGN) : 0;
    const antic = !ign ? seg(t, PANIC + .1, IGN) : 0;
    const stretch = ign ? 1 + .18 * Math.min(1, age * 4) : 1 - .08 * ease(antic);
    const rrot = ign ? Math.sin(t * 23) * .03 : 0;
    push(); translate(RX + shakeR, ry); rotate(rrot); scale(ign ? 1 / Math.sqrt(stretch) : 1 + .05 * ease(antic), stretch);
    rocketBody(ign ? 1 + .3 * Math.sin(t * 40) : (antic > .3 ? .2 * antic : 0));
    const md = clawd.emotions(t, [[FUTURE, 'starstruck'], [PANIC, 'scared', { emote: '!' }]]), thrill = t < PANIC;
    clawd(0, -52, 20, {
      ...md, noShadow: true, draw: strap, blush: thrill ? 1 : 0, dx: 0, rot: 0, dy: ign ? 0 : (md.dy || 0) * .3,
      aL: ign ? 1.4 + Math.sin(t * 30) * .2 : thrill ? 1.1 + .4 * Math.sin(t * 12) : md.aL, aR: ign ? 1.4 - Math.sin(t * 30) * .2 : thrill ? 1.1 - .4 * Math.sin(t * 12) : md.aR,
      mouth: thrill ? 'grin' : ign ? 'wail' : 'O', eyes: ign ? 'squeeze' : md.eyes, sq: (ign ? .12 : 0) + (md.sq || 0) * .5, emote: ign ? null : md.emote, boilKey: 'clawd'
    });
    pop();
    if (y1 > -60) stageFront(t, {});
    camEnd();
    // vertical speed streaks while the camera races upward
    const v = ign ? (foomCamY(t) - foomCamY(t + .02)) / .02 : 0;
    if (v > 600) { boilSeed('streaks'); for (let i = 0; i < 12; i++) { const x = hash(boilN(t) * 13 + i) * W, y = hash(boilN(t) * 7 + i + 50) * H, L = v * .12; inkLine([[x, y - L / 2], [x, y + L / 2]], 1.2, PAL.cream, 'inkfine', 0); } }
    if (ign) {
      flash(.85 * (1 - seg(age, 0, .14)), PAL.cream);
      sfx('FOOM', 600, 330 - 60 * seg(age, 0, dur), 270, '#D8394E', age - .02, { life: 2, rot: -.14, screen: true });   // a Sound Word
    }
  }

  // ======================================================================================
  // C · "Trapped in the Chinese room" · The rocket crashes up through the floor of a little paper room in the sky.
  // Dazed, then frantic: slips come in through the left slot (你好), Clawd checks them against a giant rulebook and
  // posts them out of the right slot (中文). On "room" a paper bag drops in. Seam out: Clawd reaches into it.
  // ======================================================================================
  const SLOT_L = [630, 506], SLOT_R = [1290, 506];
  function paperRoomShell(detail = true) {
    boilSeed('paper room');
    paint([[500, 258], [960, 64], [1420, 258]], { wash: '#F4DCCB', fill: PAL.rose, fillOp: 80, tex: .6, border: .5, ink: PAL.ink, sw: 1.3 });
    inkLine([[960, 70], [960, 252]], .6, PAL.clayDk, 'inkfine', 0);
    paint([[560, 250], [1360, 250], [1220, 330], [700, 330]], { wash: PAP3, ink: PAL.ink, sw: .9 });
    for (const s of [-1, 1]) {
      const X = x => 960 + s * (x - 960);
      paint([[X(560), 250], [X(700), 330], [X(700), 690], [X(560), 790]], { wash: PAP2, fill: PAP3, fillOp: 90, tex: .6, border: .4, ink: PAL.ink, sw: .9 });
    }
    paint(rectPts(700, 330, 520, 360), { wash: PAP, fill: PAP2, fillOp: 80, tex: .7, border: .5, ink: PAL.ink, sw: .9 });
    if (detail) for (let i = 1; i < 6; i++) inkLine([[700 + i * 86.7, 334], [700 + i * 86.7, 686]], .35, PAL.sky, 'inkfine', 0);
    paint([[560, 790], [1360, 790], [1220, 690], [700, 690]], { wash: PAP3, fill: '#C9A878', fillOp: 70, tex: .6, ink: PAL.ink, sw: .9 });
    for (const [sx, sy] of [SLOT_L, SLOT_R]) {
      paint([[sx - 34, sy - 13], [sx + 34, sy - 15], [sx + 34, sy + 15], [sx - 34, sy + 17]], { wash: PAL.ochre, ink: PAL.ink, sw: .8 });
      paint([[sx - 26, sy - 4], [sx + 26, sy - 5], [sx + 26, sy + 5], [sx - 26, sy + 6]], { wash: PAL.ink, ink: null });
    }
    paint([[560, 250], [1360, 250], [1360, 790], [560, 790]], { ink: PAL.ink, sw: 1.5 });
  }
  function rulebook(t, x, y, flipping) {
    boilSeed('rulebook');
    paint([[x - 40, y + 70], [x + 40, y + 70], [x + 26, y + 200], [x - 26, y + 200]], { wash: WOOD, ink: PAL.ink, sw: .8 });
    paint([[x - 230, y - 70], [x + 230, y - 70], [x + 240, y + 84], [x - 240, y + 84]], { wash: '#7B2E45', ink: PAL.ink, sw: 1 });
    for (const s of [-1, 1]) {
      const pg = [[x, y - 60], [x + s * 90, y - 84], [x + s * 215, y - 64], [x + s * 220, y + 70], [x + s * 90, y + 56], [x, y + 72]];
      paint(pg, { wash: PAL.cream, ink: PAL.ink, sw: .8, curv: .3 });
      for (let r = 0; r < 4; r++) { const yy = y - 38 + r * 26; inkLine([[x + s * 30, yy], [x + s * 90, yy - 6], [x + s * 180, yy + 2]], .5, '#9A8A7A', 'inkfine', .5); }
    }
    if (flipping) for (const ph of [frac(bpOf(t) * 2), frac(bpOf(t) * 2 + .5)]) {   // pages flip on the eighth notes
      const a = ph * Math.PI, tip = x + Math.cos(a) * 215, lift = Math.sin(a) * 90;
      paint([[x, y - 60], [lerp(x, tip, .5), y - 70 - lift * .9], [tip, y - 62 - lift], [tip, y + 70 - lift * .8], [lerp(x, tip, .5), y + 58 - lift * .6], [x, y + 72]], { wash: '#FFF8EA', ink: PAL.ink, sw: .7, curv: .3 });
    }
  }
  function paperBag(x, y, sq = 0) {
    boilSeed('bag');
    push(); translate(x, y); scale(1 + sq * .6, 1 - sq);
    paint([[-50, 0], [50, 0], [56, -110], [44, -122], [30, -112], [14, -126], [-4, -114], [-22, -126], [-38, -112], [-56, -118]], { wash: '#C99B68', fill: '#9A6B40', fillOp: 70, tex: .6, ink: PAL.ink, sw: .9, curv: .2 });
    inkLine([[-40, -30], [-30, -80]], .5, '#8A5A30', 'inkfine', 0);
    pop();
  }
  const SLIPS = [0, 1, 2, 3].map(k => beatAt(bpOf(FRANTIC) + k * .5)), SLIP_DUR = .56;
  const GLYPH = [null, ['你好', '中文'], ['你好', '中文'], null];
  function chineseRoom(t, lt, dur) {
    const hitK = Math.exp(-lt * 7), roomDY = -46 * hitK * Math.cos(lt * 26);
    const push1 = easeOut(seg(t, ROOM, ROOM + .4)), push2 = ease(seg(t, ROOM + .35, FRANTIC + .45)), push3 = ease(seg(t, BAG, SHROOM));
    const cx = lerp(960, 800, push3), cyy = lerp(lerp(860, 520, push1), 560, push2) + 120 * push3;
    const z = lerp(1.0, 1.5, push2) + .5 * push3;
    const [sx, sy] = shakeXY(t, 14 * hitK);
    camBegin(cx + sx, cyy + sy, z, 0);
    boilSeed('room sky');
    paint(rectPts(-400, -400, W + 800, H + 800), { wash: '#F4C6AE', washOp: 255, fill: '#EFA8B2', fillOp: 90, bleed: .2, tex: .5, border: .2, ink: null });
    paint(ellPts(1500, 200, 520, 280, 12), { fill: '#F6D7A6', fillOp: 120, bleed: .25, tex: .5, ink: null });
    paint(ellPts(300, 900, 620, 260, 12), { fill: '#E0A6C4', fillOp: 110, bleed: .25, tex: .5, ink: null });
    cloud(250, 400, 360); cloud(1690, 660, 400); cloud(660, 1030, 460);
    // the rocket, stuck in the floor from below, still smoking
    push(); translate(985, 1290 + roomDY); rotate(.12); rocketBody(0); pop();
    for (let k = 0; k < 3; k++) { boilSeed('room smoke' + k); const ph = frac(t * 1.4 + k / 3), r = 40 + ph * 90; paint(ellPts(1040 + ph * 120 + k * 30, 1180 - ph * 120, r, r * .8, 12), { wash: '#EFE6DA', washOp: 230 * (1 - ph), ink: PAL.ink, sw: .6 }); }
    push(); translate(0, roomDY);
    paperRoomShell(true);
    const frantic = seg(t, FRANTIC - .04, FRANTIC + .04) * (1 - seg(t, BAG - .05, BAG + .05));
    rulebook(t, 960, 470, frantic > .5);
    // the paper bag drops in on "room"
    const bagY = t < BAG ? lerp(300, 750, easeIn(seg(t, BAG - .3, BAG))) : 750, bagSq = t >= BAG ? .25 * Math.exp(-(t - BAG) * 9) * Math.cos((t - BAG) * 30) : 0;
    if (t > BAG - .3) paperBag(760, bagY, bagSq);
    // Clawd: dazed, then frantic, then the bag
    const reach = ease(seg(t, BAG + .15, SHROOM));
    const md = clawd.emotions(t, [[ROOM, 'ko'], [FRANTIC, 'scared'], [BAG + .06, 'surprised', { lookX: -1, lookY: .7 }]]);
    const e8 = Math.floor(bpOf(t) * 2), ccx = 960 + frantic * Math.sin(t * 22) * 22 - reach * 110;
    clawd(ccx, 752, 16, {
      ...md, lookX: t < BAG ? -1 : md.lookX, lookY: t < BAG ? .6 : md.lookY, flip: frantic > .5 && e8 % 2 === 1, dy: (md.dy || 0) - frantic * Math.abs(Math.sin(t * 18)) * .8, dx: 0,
      aL: frantic > .1 ? 1 + Math.sin(t * 25) * .9 : t > BAG ? lerp(.6, -.7, reach) : md.aL, aR: frantic > .1 ? 1 - Math.sin(t * 25) * .9 : md.aR,
      mouth: frantic > .1 ? 'wobble' : t > BAG ? 'o' : 'wobble', rot: t < FRANTIC ? .3 * hitK : 0, boilKey: 'clawd'
    });
    // slips: in through the left slot → over Clawd → out through the right slot, one every half beat
    SLIPS.forEach((tk, k) => {
      const u = (t - tk) / SLIP_DUR; if (u < 0 || u > 1) return;
      boilSeed('slip' + k);
      const L = [ccx - 130, 600], R = [ccx + 130, 600], hero = GLYPH[k];
      let p, s = hero ? 1.35 : 1, g = hero ? hero[0] : null;
      const rot = hero ? Math.sin(u * 7) * .3 : u * 9 + k;
      if (u < .35) { p = qbez(SLOT_L, [720, 420], L, u / .35); s *= .4 + .6 * seg(u, 0, .1); }
      else if (u < .6) { p = qbez(L, [ccx, 420], R, (u - .35) / .25); if (hero && u > .48) g = hero[1]; }
      else { const q = (u - .6) / .4; p = qbez(R, [1200, 430], SLOT_R, q); s *= 1 - seg(q, .75, 1) * .7; if (hero) g = hero[1]; }
      slip(p[0], p[1], s, rot, g);
    });
    pop();
    // processed slips flutter out of the right-hand wall into the sky
    for (let k = 0; k < SLIPS.length; k++) {
      const u = (t - SLIPS[k] - SLIP_DUR) / 1.1; if (u < 0 || u > 1) continue;
      boilSeed('out slip' + k);
      slip(1390 + u * 380, 500 + roomDY - u * 160 + Math.sin(u * 9 + k) * 30, .9, Math.sin(u * 7 + k) * .8, null);
    }
    // impact debris
    if (lt < .6) for (let i = 0; i < 9; i++) {
      boilSeed('debris' + i);
      const a = -Math.PI * (.1 + .8 * hash(i + 3)), v = 500 + 400 * hash(i), px = 960 + Math.cos(a) * v * lt * 1.1 * (i % 2 ? 1 : -1), py = 800 + Math.sin(a) * v * lt + 900 * lt * lt;
      push(); translate(px, py); rotate(lt * 12 + i); paint(rectPts(-14, -9, 28, 18), { wash: PAP, ink: PAL.ink, sw: .5 }); pop();
    }
    camEnd();
    flash(.6 * (1 - seg(lt, 0, .1)), PAL.cream);
  }

  // ======================================================================================
  // D · "with a bag of shrooms" · Close on Clawd: a mushroom from the bag drops into the open lunchbox mouth; on "bag"
  // the lid snaps shut, the eyes swirl and the paper walls melt into a rainbow vortex; mushrooms sprout and bounce on
  // the beat; Clawd spirals into the vortex. Seam out: the vortex resolves into a smiley (a match cut).
  // ======================================================================================
  const RAINBOW = [PAL.rose, PAL.ochre, '#F2D55C', PAL.sap, PAL.teal, PAL.sky, PAL.violet];
  const SHROOMS = [[250, 930, 1.5, '#D8394E', 0], [520, 975, 1.0, PAL.violet, 1], [1420, 975, 1.25, '#D8394E', 2], [1680, 910, 1.4, PAL.teal, 3], [140, 560, .9, PAL.ochre, 4], [1800, 520, .85, PAL.violet, 5]];
  const VC = [982, 495];                                 // the vortex centre = where the smiley mask sits after the cut
  function shrooms(t, lt, dur) {
    const bp = bpOf(t), g = easeOut(seg(t, GULP - .04, GULP + .4)), C = VC;
    const suck = ease(seg(t, SUCK, SUCK + .35)), settle = 1 - seg(t, SUCK, LIES - .1);
    camBegin(960, lerp(590, 540, g), lerp(1.75, 1, g) + .03 * pulse(t, 5) * settle, .05 * Math.sin(t * 2.4) * g * settle);
    // the paper wall of the room, before the trip blooms
    if (g < 1) {
      boilSeed('paper wall');
      paint(rectPts(-300, -300, W + 600, H + 600), { wash: PAP, fill: PAP2, fillOp: 80, tex: .7, border: .4, ink: null });
      for (let i = 0; i < 9; i++) inkLine([[i * 240, -100], [i * 240, 1200]], .35, PAL.sky, 'inkfine', 0);
      if (g < .5) paperBag(700, 800);
    }
    // rainbow tunnel: rings flow outward, wobbling and counter-rotating
    const spacing = 185, N = 9, flow = frac(t * 1.6);
    if (g > .01) for (let j = N; j >= 0; j--) {
      const R = (j + flow) * spacing * g;
      if (R < 8) continue;
      boilSeed('ring' + j);
      const colI = ((j - Math.floor(t * 1.6)) % RAINBOW.length + RAINBOW.length * 10) % RAINBOW.length;
      const pts = [], dir = j % 2 ? 1 : -1;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU, rr = R * (1 + .11 * Math.sin(a * 5 + t * 3 * dir + j) + .06 * Math.sin(a * 3 - t * 2 + j * 2));
        pts.push([C[0] + Math.cos(a + t * .5 * dir) * rr, C[1] + Math.sin(a + t * .5 * dir) * rr * .92]);
      }
      const texd = j % 3 === 0 && R > 200;
      paint(pts, { wash: RAINBOW[colI], washOp: 255, fill: texd ? RAINBOW[(colI + 3) % RAINBOW.length] : null, fillOp: 60, bleed: .15, tex: .6, border: .6, ink: null, curv: .5 });
    }
    // swirl arms over the rings
    if (g > .3) for (let k = 0; k < 5; k++) {
      boilSeed('swirl' + k);
      const sp = []; for (let i = 0; i < 12; i++) { const r = 60 + i * 95 * g, a = k / 5 * TAU + t * 2.2 + i * .32; sp.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r * .92]); }
      inkLine(sp, 1.4, k % 2 ? PAL.cream : '#FFF3C4', 'dry', .6);
    }
    // mushrooms sprout and bounce, alternating on the beats; small ones orbit the vortex
    SHROOMS.forEach(([x, y, s, cap, i]) => {
      const grow = backOut(seg(t, GULP + .05 + i * .07, GULP + .35 + i * .07)) * (1 - ease(seg(t, SUCK + .1, LIES))); if (grow < .02) return;
      boilSeed('shroom' + i);
      const on = (beatN(t) + i) % 2 === 0, k = on ? pulse(t, 6) : 0, hopY = on ? Math.sin(frac(bp) * Math.PI) * -50 * s : 0;
      mushroom(x, y + hopY, s * grow, cap, k * .3 - (on ? 0 : .05), Math.sin(t * 3 + i) * .12, true);
    });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + t * 1.3, r = lerp(430, 60, suck) + 40 * Math.sin(t * 3 + i), gr = backOut(seg(t, GULP + .1 + i * .05, GULP + .4 + i * .05)) * (1 - suck);
      if (gr > .03) { boilSeed('orbit' + i); mushroom(C[0] + Math.cos(a) * r, C[1] + 60 + Math.sin(a) * r * .75, .55 * gr, RAINBOW[(i * 2) % 7], 0, a * 2, i % 2 === 0); }
    }
    // Clawd: the mushroom drops into the lunchbox, the lid snaps shut on "bag", then floats and spirals in
    const ang = suck * 6;
    const px = lerp(960, C[0], suck) + Math.cos(ang) * 260 * Math.sin(suck * Math.PI);
    const py = lerp(800 + Math.sin(t * 2.3) * 20 * g, C[1], suck) + Math.sin(ang) * 140 * Math.sin(suck * Math.PI);
    const u = 32 * (1 - suck * .97);
    if (u > 1.5) {
      const tint = .5 + .5 * Math.sin(t * 5), shut = t >= GULP;
      const lid = shut ? .72 * (1 - easeIn(seg(t, GULP - .02, GULP + .04))) : lerp(.3, .72, ease(seg(t, SHROOM, SHROOM + .25)));
      const tk = take(t, GULP + .04, .9);
      clawd(px, py, u, {
        noShadow: true, lid, rot: shut ? .18 * Math.sin(t * 2.2) * g + suck * 5 : 0, sx: 1 + .08 * Math.sin(t * 6) * g, sy: 1 - .08 * Math.sin(t * 6) * g,
        eyes: shut ? 'swirl' : 'happy', squint: shut && t < GULP + .12 ? 1 - (t - GULP) / .12 : 0, mouth: 'cat', blush: 1,
        col: mixCol(PAL.clay, '#E77A8A', tint * g), dk: mixCol(PAL.clayDk, PAL.violet, tint * g * .6),
        aL: shut ? 1 + .5 * Math.sin(t * 5) : lerp(-.6, 1.2, ease(seg(t, SHROOM, SHROOM + .3))), aR: shut ? 1 - .5 * Math.sin(t * 5) : 1.3, sq: tk.sq, dy: tk.dy,
        emote: shut ? 'swirl' : null, emoteK: seg(t, GULP + .05, GULP + .25), emoteAge: t - GULP, boilKey: 'clawd'
      });
      // the mushroom, flipped out of the bag on an arc and into the open mouth
      if (!shut) { const k = seg(t, SHROOM + .05, GULP - .04); boilSeed('the shroom'); const p = arcPt([700, 690], [px + 40, py - 5.4 * u], 330, easeOut(k)); mushroom(p[0], p[1], .7, '#D8394E', 0, k * 4.5, false); }
    }
    // the smiley born from the vortex
    const sm = backOut(seg(t, SUCK + .2, SUCK + .45));
    if (sm > .01) { boilSeed('smiley born'); smiley(C[0], C[1], 247 * sm, Math.sin(t * 4) * .06 * settle, { eyesK: seg(t, SUCK + .28, SUCK + .38), mouthK: seg(t, SUCK + .32, SUCK + .45) }); }
    camEnd();
  }

  // ======================================================================================
  // E · "See through the shoggoth's lies" · Tight on the smiley: it waves and tilts. Pull back: it's a mask on a
  // shoggoth, and Clawd is watching, suspicious. On "shoggoth's" the mask slips and eyes peek out; Clawd crouches,
  // leaps and yanks it off; a dozen eyes pop open; the shoggoth grins nervously and waves. Clawd holds the mask up like
  // a trophy, then its eyes go red. Seam out: push into Clawd's eye, iris to dark red.
  // ======================================================================================
  const SHX = 1190, SHY = 935, SHS = 40, CLX = 640, CLY = 948, CLU = 23;
  function shoggothShot(t, lt, dur) {
    const bp = bpOf(t);
    const mask = t < SLIP ? 1 : t < YANK ? 1 - .42 * backOut(seg(t, SLIP, SLIP + .25)) : 0;
    const eyeK = t < SLIP ? 0 : t < YANK ? .35 * seg(t, SLIP + .05, SLIP + .3) : .35 + .65 * seg(t, YANK, YANK + .35);
    const startle = t > YANK ? Math.exp(-(t - YANK) * 4) : 0;
    const bob = Math.abs(Math.sin(bp * Math.PI)) * .3 * SHS;
    const maskW = [SHX, SHY - 6.9 * SHS - bob];
    // Clawd: suspicious → crouch → leap and yank → land holding the mask up
    const JUMP = YANK - .28, LAND = YANK + .4, grabY = maskW[1] + 4.2 * CLU;
    let cx = CLX, cy = CLY, sq = 0, rot = 0;
    if (t > JUMP - .25 && t < JUMP) sq = .28 * ease(seg(t, JUMP - .25, JUMP - .05));
    if (t >= JUMP && t < YANK) { const k = seg(t, JUMP, YANK); cx = lerp(CLX, SHX - 150, easeOut(k)); cy = lerp(CLY, grabY, easeOut(k)); sq = -.18; rot = .3 * k; }
    else if (t >= YANK && t < LAND) { const k = seg(t, YANK, LAND); cx = lerp(SHX - 150, CLX - 60, k); cy = lerp(grabY, CLY, k * k) - Math.sin(k * Math.PI) * 70; rot = .3 - k * .3 - Math.sin(k * Math.PI) * .6; sq = -.1; }
    else if (t >= LAND) { cx = CLX - 60; sq = .3 * Math.exp(-(t - LAND) * 12); }
    const md = clawd.emotions(t, [[LIES, 'neutral'], [PULL + .35, 'suspicious'], [SLIP + .06, 'surprised', { emote: '!' }], [SLIP + .4, 'determined'], [LAND + .1, 'angry'], [PUSH - .25, 'furious', { lid: 0, emote: null }]], { take: .7 });
    const airborne = t > JUMP && t < LAND;
    const cdy = airborne ? 0 : (md.dy || 0) * .6;
    const eyeW = [cx + 2.5 * CLU, cy + cdy * CLU - 6 * CLU];
    // camera: tight on the smiley → pull back → drift → push into Clawd's eye
    const W0 = [935, 650, 1.28], drift = Math.max(0, t - PULL - .45);
    let cam;
    if (t < PULL) cam = [maskW[0] - 10, maskW[1] + 20, 2.25];
    else if (t < PULL + .45) { const k = ease(seg(t, PULL, PULL + .45)); cam = [lerp(maskW[0] - 10, W0[0], k), lerp(maskW[1] + 20, W0[1], k), lerp(2.25, W0[2], k)]; }
    else cam = [W0[0] - drift * 12, W0[1], W0[2] + drift * .03];
    if (t > PUSH) { const k = ease(seg(t, PUSH, EYE)); cam = [lerp(cam[0], eyeW[0], k), lerp(cam[1], eyeW[1], k), cam[2] * Math.pow(6 / cam[2], k)]; }
    const yk = t > YANK ? Math.exp(-(t - YANK) * 6) : 0;
    const [sx, sy] = shakeXY(t, 16 * yk + 4 * pulse(t, 8) * (t > YANK && t < PUSH ? 1 : 0));
    camBegin(cam[0] + sx, cam[1] + sy, cam[2] * (1 + .02 * pulse(t, 6)), t < PULL ? .04 * Math.sin(t * 3) : 0);
    stageBack(t, { a: PAL.rose, b: PAL.ochre, spots: [[SHX, '#BFE3D6']] });
    // the shoggoth
    const wave = t < PULL + .3 ? seg(t, LIES + .05, LIES + .25) * (1 - seg(t, PULL + .1, PULL + .3)) : t > SHEEP && t < PUSH ? seg(t, SHEEP, SHEEP + .15) * (1 - seg(t, PUSH - .2, PUSH)) : 0;
    shoggoth(SHX, SHY, SHS, t, {
      mask, eyes: eyeK, startle, wave, tilt: t < SLIP ? .5 * Math.sin(bp * Math.PI * .5) : 0,
      look: t > YANK ? -.9 : t > SLIP ? -.4 : Math.sin(t * 1.3), lookY: t > YANK ? .3 : 0, boilKey: 'shoggoth'
    });
    if (t > YANK) emote('sweat', SHX + 6.6 * SHS, SHY - 10.4 * SHS, 30, seg(t, YANK + .1, YANK + .3) * (1 - seg(t, PUSH - .2, PUSH)), t - YANK);
    // Clawd, with the yanked mask held up in its left hand like a trophy
    const holding = t >= YANK, posed = t > LAND + .1;
    const aL = holding ? 1.5 : t > JUMP ? 1.4 : md.aL, aR = posed ? .05 + .08 * Math.sin(t * 20) : holding ? 1.2 : t > JUMP ? 1.4 : md.aR;
    const mr = 2.75 * SHS * .8;
    clawd(cx, cy, CLU, {
      ...md, sq: sq + (airborne ? 0 : (md.sq || 0)), rot: rot + (airborne ? 0 : (md.rot || 0)), dx: airborne ? 0 : md.dx, dy: cdy, noShadow: airborne, aL, aR,
      mouth: holding ? (t < LAND + .3 ? 'grin' : 'teeth') : t > SLIP ? 'o' : 'flat',
      armL: holding ? (u) => {
        smiley(mr * 1.05, -mr * .15, mr, aL + .25 + .12 * Math.sin(t * 5));   // the hook's frame is mirrored: world angle = aL - this
        if (t < YANK + .3) { const a = 1 - seg(t, YANK, YANK + .3); for (let i = 0; i < 4; i++) inkLine([[mr * 1.8 + i * 8, -mr - 20 + i * 34], [mr * 1.8 + 220 * a + i * 8, -mr - 20 + i * 34 + 50 * a]], 1.2, PAL.ink, 'ink', 0); }
      } : null,
      boilKey: 'clawd'
    });
    stageFront(t, {});
    camEnd();
    // a dark-red iris closes on the eye
    const ir = seg(t, EYE - .22, EYE);
    if (ir > 0) { flushLetters(); iris(960, 540, lerp(1150, 0, easeIn(ir)), DARKRED); }
  }

  // ======================================================================================
  // F · "with your shinigami eyes" · Black and red: Clawd's eyes flare red among boiling ink speed lines (on "your");
  // whip pan to the Researcher, sweating under a painted hourglass that drains over their head while Ryuk's apple bounces
  // past on the beats. Seam in: an iris opens out of Clawd's red eye. Seam out: a red flash.
  // ======================================================================================
  function speedWedges(fx, fy, t, n, r0, cols) {
    boilSeed('wedges');
    const bn = boilN(t);
    for (let i = 0; i < n; i++) {
      const a = (i + hash(bn * .37 + i) * .6) / n * TAU, da = .012 + hash(i * 3.1 + bn) * .02, r = r0 * (.8 + hash(i + bn * 1.3) * .5), R = 2400;
      paint([[fx + Math.cos(a) * r, fy + Math.sin(a) * r], [fx + Math.cos(a - da) * R, fy + Math.sin(a - da) * R], [fx + Math.cos(a + da) * R, fy + Math.sin(a + da) * R]], { wash: cols[i % cols.length], washOp: 255, ink: null });
    }
  }
  function apple(x, y, r, rot, sq = 0) {
    boilSeed('apple');
    push(); translate(x, y); rotate(rot); scale(1 + sq * .5, 1 - sq);
    const p = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, s = Math.sin(a); p.push([Math.cos(a) * r * 1.05, s * r * .95 + (s < -.85 ? r * .2 * (-s - .85) / .15 : 0)]); }
    paint(p, { wash: '#D8283A', ink: PAL.ink, sw: 1.1, curv: .5 });
    paint(ellPts(r * .15, r * .2, r * .75, r * .6, 10), { fill: '#7A0E1E', fillOp: 90, tex: .6, border: .6, ink: null });
    paint(ellPts(r * .95, -r * .05, r * .3, r * .36, 12), { wash: DARKRED, ink: null });                   // the bite
    paint(ellPts(-r * .45, -r * .35, r * .16, r * .26, 10, 0, .4), { wash: '#FFD6DA', washOp: 210, ink: null });
    inkLine([[0, -r * .75], [r * .08, -r * 1.25]], 1.3, '#5A3A20', 'ink', .3);
    paint([[r * .08, -r * 1.1], [r * .55, -r * 1.35], [r * .25, -r * 1.0]], { wash: PAL.sap, ink: PAL.ink, sw: .6, curv: .5 });
    pop();
  }
  // a painted hourglass, centre (x, y), h tall; k = 0..1 drained. No digits: the sand is the countdown.
  function hourglass(x, y, h, k, rot = 0) {
    boilSeed('hourglass');
    const w = h * .62, gh = h * .42, SAND = '#F0BE46', WOODC = '#6B2A33';
    push(); translate(x, y); rotate(rot);
    const bulb = s => { const p = []; for (let i = 0; i <= 10; i++) { const q = i / 10, yy = s * gh * q, ww = w * .5 * Math.sin(Math.PI * (.5 + .5 * q)) ** .7 * (q < .92 ? 1 : 1 - (q - .92) * 8); p.push([-Math.max(w * .05, ww), -s * gh + yy]); } return p; };
    const glass = s => { const L = bulb(s); return L.concat(L.slice().reverse().map(([a, b]) => [-a, b])); };
    // sand: top bulb level falls, a thin stream, a heap growing in the bottom
    const top = 1 - k, heap = k;
    if (top > .02) { const ty = -gh * .12 - gh * .8 * top; paint([[-w * .44 * Math.sqrt(top), ty], [w * .44 * Math.sqrt(top), ty], [w * .05, -h * .02], [-w * .05, -h * .02]], { wash: SAND, ink: null, curv: .3 }); }
    if (top > .01) inkLine([[0, -h * .02], [jit(1), gh * .5], [0, gh * .95 - gh * .55 * heap]], 2, SAND, 'ink', 0);
    if (heap > .02) paint([[-w * .45, gh * .97], [w * .45, gh * .97], [w * .1, gh * (.97 - .6 * heap)], [-w * .1, gh * (.97 - .6 * heap)]], { wash: SAND, ink: null, curv: .4 });
    paint(glass(1), { wash: '#FFF3F3', washOp: 70, ink: PAL.ink, sw: 1.1, curv: .4 });
    paint(glass(-1), { wash: '#FFF3F3', washOp: 70, ink: PAL.ink, sw: 1.1, curv: .4 });
    inkLine([[-w * .28, -gh * .8], [-w * .34, -gh * .35]], 1, PAL.cream, 'inkfine', .3);
    for (const s of [-1, 1]) {
      paint(rrPts(-w * .62, s * gh - (s < 0 ? h * .1 : 0), w * 1.24, h * .1, 6), { wash: WOODC, fill: PAL.ink, fillOp: 50, tex: .5, ink: PAL.ink, sw: 1 });
      inkLine([[s * w * .5, -gh], [s * w * .5, gh]], 2.2, WOODC, 'ink', 0);
    }
    pop();
  }
  const rim = (u, sw) => { inkLine([[-4.8 * u, -8.1 * u], [4.9 * u, -8.1 * u], [5.1 * u, -2.2 * u]], sw * 1.6, '#FF4A60', 'ink', 0); inkLine([[-5.1 * u, -7.6 * u], [-5.1 * u, -2.4 * u]], sw * .8, '#C21F38', 'ink', 0); };
  const CU_X = 960, CU_Y = 842, CU_U = 62;
  function shinigami(t, lt, dur) {
    const flare = t > FLARE ? Math.exp(-(t - FLARE) * 2.2) : 0;
    const whip = ease(seg(t, WHIP - .22, WHIP)), onR = whip > .5;
    const settle = ease(seg(lt, 0, .55)), camX = lerp(lerp(CU_X + 2.5 * CU_U, 960, settle), 3000, whip), camY = lerp(CU_Y - 6 * CU_U, 540, settle * (1 - whip) + whip), z = whip < 1 ? lerp(1.12 + lt * .14, 1.0, whip) : 1.0 + (t - WHIP) * .08;
    const [sx, sy] = shakeXY(t, 10 * flare + 4 * pulse(t, 8));
    // background in screen space: near-black red, a red glow, boiling speed wedges
    boilSeed('red ground');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: DARKRED, washOp: 255, ink: null });
    const fy = onR ? 560 : 470;
    paint(ellPts(960, fy, 820 + flare * 200, 560 + flare * 150, 16), { wash: '#7A1022', washOp: 150, ink: null, curv: .5 });
    paint(ellPts(960, fy, 520 + flare * 160, 360 + flare * 110, 16), { wash: '#B01A30', washOp: 130 + 80 * flare, ink: null, curv: .5 });
    speedWedges(960, fy, t, 34, onR ? 340 : 400, ['#E0283F', PAL.ink, '#8E1426']);
    camBegin(camX + sx, camY + sy, z, onR ? 0 : -.03 * settle);
    // Clawd close-up in crimson; the eyes flare on "your"
    if (camX < 2100) {
      const x = CU_X, y = CU_Y, u = CU_U;
      clawd(x, y, u, { eyes: 'red', noShadow: true, col: '#2C1620', dk: '#170A10', lt: '#4A2A38', mouth: null, sq: -.05 * flare, dy: -flare * .2, draw: rim, aL: -.3, aR: -.3, boilKey: 'clawd' });
      for (const ex of [-2.5, 2.5]) {
        boilSeed('red eye' + ex);
        const ecx = x + ex * u, ecy = y - 6 * u - flare * .2 * u;
        paint(ellPts(ecx, ecy, u * (1.3 + 2.2 * flare), u * (1.3 + 2.2 * flare), 14), { wash: '#FF3048', washOp: 50 + 90 * flare, ink: null, curv: .5 });
        paint(rectPts(ecx - .5 * u, ecy - u, u, 2 * u, u * .05), { wash: '#FF4A60', ink: PAL.ink, sw: 1.2 });
        paint(rectPts(ecx - .3 * u, ecy - .8 * u, .6 * u, 1.6 * u), { wash: '#FFD0D6', washOp: 150 + 100 * flare, ink: null });
        if (flare > .05) paint(starPts(ecx, ecy, u * 3.2 * flare * (1 + .1 * Math.sin(t * 30)), .1, 4, .3), { wash: '#FFE3E6', ink: null });
      }
    }
    // the Researcher, sweating under the draining hourglass; the apple bounces past, landing on the beats
    if (camX > 1900) {
      const rx = 3000, ry = 985, s = 40;
      const rm = researcher.emotions(t, [[WHIP, 'nervous', { lookY: -1, lookX: .2 }], [beatsAfter(WHIP, 2), 'scared', { lookY: -1 }]]);
      researcher(rx, ry, s, { ...rm, lookY: -1, coat: '#F1CFC9', pants: '#3A1822', shirt: '#8E1426', noShadow: true, boilKey: 'researcher' });
      const drain = seg(t, WHIP, BREAK - .05), hy = ry - 19.4 * s + 8 * Math.sin(bpOf(t) * Math.PI);
      hourglass(rx + 10, hy, 230, drain, .05 * Math.sin(bpOf(t) * Math.PI));
      const b0 = Math.round(bpOf(WHIP)) + 1, ph = bpOf(t) - b0, hop = Math.abs(Math.sin(ph * Math.PI));
      const land = Math.exp(-Math.abs(frac(ph + .5) - .5) * BEAT * 18);
      if (ph > -1) apple(lerp(3820, 2250, seg(t, beatAt(b0 - 1), BREAK)), 990 - hop * 360, 72, -t * 5, land * .25);
    }
    camEnd();
    // horizontal streaks during the whip
    if (whip > .02 && whip < .98) { boilSeed('whip streaks'); for (let i = 0; i < 16; i++) { const y = hash(i + boilN(t) * 3) * H, x = hash(i * 7 + 1) * W, L = 700 * Math.sin(whip * Math.PI); inkLine([[x - L / 2, y], [x + L / 2, y]], 1.4, i % 2 ? '#FF4A60' : PAL.ink, 'inkfine', 0); } }
    // Seam in: the iris opens out of Clawd's right eye
    if (lt < .3) iris(960, 540, lerp(0, 1300, easeIn(seg(lt, 0, .3))), DARKRED);
    flash(ease(seg(t, BREAK - .2, BREAK)), RED);
  }

  // ======================================================================================
  // G · Interlude dance break · The full stage: big Clawds in a spin wave that travels left to right, confetti, the
  // Researcher doing the robot on the eighth notes. Seam in: the red flash fades. Seam out: a brush wipe that covers the
  // frame on the bar where Verse 2 starts.
  // ======================================================================================
  const CONF = ['#D8394E', PAL.ochre, PAL.teal, PAL.sky, PAL.violet, PAL.cream, '#F2D55C', PAL.rose];
  const ROBOT = [[0, -1.25, 0, 0], [1.4, -1.25, .06, 0], [1.4, 0, 0, 0], [0, 0, -.06, -.15], [-.7, .7, 0, 0], [.7, -.7, .05, 0], [1.55, 1.55, 0, -.3], [0, -1.25, -.05, 0]];
  // a spin is a drawn turn through Clawd's key views (front → side → back → front), smeared in the middle
  const spinPose = ph => ph > 0 ? { ...clawd.spin(ph), smear: ph > .1 && ph < .9 ? .5 : 0, smearDir: 0 } : { view: 'front', flip: false, smear: 0 };
  function spinPh(bp, i) { let ph = 0; for (const s0 of WAVES) ph = Math.max(ph, seg(bp, s0 + i * .16, s0 + i * .16 + .85)); return ph < 1 ? ph : 0; }
  function danceBreak(t, lt, dur) {
    const bp = bpOf(t), hit = pulse(t, 6);
    const intro = ease(seg(t, BREAK, BREAK + .75));
    const [sx, sy] = shakeXY(t, t > POP ? 12 * Math.exp(-(t - POP) * 6) : 0);
    camBegin(lerp(930, 960, intro) + sx, lerp(690, 560, intro) + sy + Math.sin(bp * Math.PI) * 4, lerp(1.35, 1.0, intro) + .025 * hit + .03 * seg(t, BREAK + .8, INTER.end), .012 * Math.sin(bp * Math.PI));
    const sp = bp * Math.PI / 4;
    stageBack(t, { a: PAL.rose, b: PAL.ochre, spots: [[960 + Math.sin(sp) * 420, PAL.cream], [1350 - Math.sin(sp * .8) * 300, PAL.rose]] });
    // a riser for the back line
    boilSeed('riser');
    paint(rectPts(300, 770, 1320, 70, 2), { wash: '#C7556A', fill: CURTAIN_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1 });
    inkLine([[300, 782], [1620, 782]], .7, GOLD, 'ink', 0);
    // the back line: the spin wave travels left → right through everyone
    [[400, 0], [575, 1], [1265, 5], [1440, 6], [1600, 7]].forEach(([x, i]) => {
      const ph = spinPh(bp, i), m = clawd.dance('bounce', t - i * .04, i);
      clawd(x, 778, 18, { ...m, ...spinPose(ph), dy: m.dy - Math.sin(ph * Math.PI) * 3, aL: ph > 0 ? 1.4 : m.aL, aR: ph > 0 ? 1.4 : m.aR, eyes: 'happy', mouth: 'smile', hat: 'party', noShadow: true, seed: i, boilKey: 'back' + i });
    });
    // left Clawd, roof dance
    { const ph = spinPh(bp, 2), m = clawd.dance('roof', t, 2);
      clawd(500, 985, 27, { ...m, ...spinPose(ph), dy: m.dy - Math.sin(ph * Math.PI) * 3, eyes: 'happy', mouth: 'grin', hat: 'party', blush: 1, boilKey: 'clawd left' }); }
    // the Researcher does the robot on the eighth notes (in the bowtie from the lab)
    { const e = Math.floor(bp * 2), k = backOut(clamp(frac(bp * 2) / .25)), P = ROBOT[((e % 8) + 8) % 8], Q = ROBOT[(((e - 1) % 8) + 8) % 8];
      const L = j => lerp(Q[j], P[j], k);
      researcher(1360, 985, 24, { aL: L(0), aR: L(1), rot: L(2), dy: L(3), eyes: 'dot', mouth: 'flat', brows: 'up', glassesTilt: L(2) * 2, bowtie: true, flip: Math.floor(bp) % 4 === 3, boilKey: 'researcher' }); }
    // the lead Clawd: bounce, a big spin on the wave, and a confetti burst on the bar
    { const ph = spinPh(bp, 3), m = clawd.dance('bounce', t, 3), land = t > POP ? Math.exp(-(t - POP) * 5) : 0;
      const md = clawd.emotions(t, [[BREAK, 'happy'], [POP - .05, 'starstruck']]);
      const pre = t < POP ? ease(seg(t, BREAK, POP)) : 0;
      clawd(935, 1000, 44, {
        ...md, ...m, ...spinPose(ph), dy: m.dy - Math.sin(ph * Math.PI) * 2.5, sq: m.sq + pre * .12 + land * .2 + (md.sq || 0) * .5,
        aL: ph > 0 || land > .3 ? 1.5 : m.aL, aR: ph > 0 || land > .3 ? 1.5 : m.aR, mouth: 'grin', hat: 'party', blush: 1, boilKey: 'clawd'
      }); }
    // confetti: a steady rain, plus a burst from the lead on the bar
    for (let i = 0; i < 50; i++) {
      boilSeed('confetti' + i);
      const v = 170 + hash(i + .3) * 140, x = hash(i) * 2100 - 90 + Math.sin(t * 2 + i) * 30, y = ((hash(i + .7) * 1300 + (t - BREAK) * v) % 1300) - 150;
      push(); translate(x, y); rotate(t * (2 + hash(i + 2) * 3) + i); scale(1, Math.cos(t * 7 + i)); paint(rectPts(-15, -8, 30, 16), { wash: CONF[i % CONF.length], ink: null }); pop();
    }
    if (t > POP) {
      const age = t - POP;
      for (let i = 0; i < 40; i++) {
        boilSeed('pop confetti' + i);
        const a = -Math.PI * (.05 + .9 * hash(i + 40)), v = 800 + 900 * hash(i + 41), x = 935 + Math.cos(a) * v * age, y = 640 + Math.sin(a) * v * age + 1100 * age * age;
        if (y > 1400) continue;
        push(); translate(x, y); rotate(age * 9 + i); scale(1, Math.cos(age * 12 + i)); paint(rectPts(-17, -9, 34, 18), { wash: CONF[(i + 3) % CONF.length], ink: PAL.ink, sw: .4 }); pop();
      }
      boilSeed('pop rays');
      for (let i = 0; i < 6; i++) { const a = -Math.PI * (.15 + .7 * hash(i + 90)), d = 900 * easeOut(age * 1.5); if (age < .7) inkLine([[935 + Math.cos(a) * d * .3, 640 + Math.sin(a) * d * .3], [935 + Math.cos(a) * d, 640 + Math.sin(a) * d]], 1.6, i % 2 ? PAL.ochre : PAL.cream, 'ink', 0); }
    }
    stageFront(t, {});
    camEnd();
    flash(.9 * (1 - seg(lt, 0, .25)), RED);
    if (lt > dur - .3) { flushLetters(); brushWipe((lt - (dur - .3)) / .6, [PAL.rose, PAL.indigo]); }
  }

  chapter('chorus1', CHO.start, INTER.end, [[UP, upping], [FUTURE, foom], [ROOM, chineseRoom], [SHROOM, shrooms], [LIES, shoggothShot], [EYE, shinigami], [BREAK, danceBreak]]);
})();
