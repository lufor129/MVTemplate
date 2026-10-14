// c08_chorus4: Chorus 4 + Interlude, "red alert". The chorus stage one last time, now under sirens: Clawd has grown too
// big for it (its face fills the whole proscenium and only its arms reach in from the wings) and pumps both pumps on
// the eighth notes until the meter's glass cracks. Then the seer at the loom whose threads burst into a tree of futures;
// a sepia flashback to baby Clawd filling in "the cat sat on the [MASK]"; Clawd hammering a bigger Clawd around itself,
// again and again; and a door in the void, leaking light: they peek, it SLAMs, padlocks snap on one per beat, and the
// lights die except one spotlight on the locked door. Ported from PDoomVideo/src/ch/c08_chorus4.js and re-timed to the
// analysed song: every event hangs off a Lyric Line, a word in it, or the Beat Grid.
//
// ======================================================================================================================
// SEAM OUT TO CHAPTER 9 (held, nearly still, from 136.0 to INT.end = 137.437; Chapter 9 starts on exactly this frame)
//   camera   z = 1 - .06 * k * k, k = seg(t, INT.end - .6, INT.end)   (1 → .94; at the cut z = .94 and dz/dt = -.2 /s)
//            camBegin(960, 600 - 60 / z, z, 0): a zoom about the WORLD point (960, 600), which stays put at SCREEN
//            (960, 600). At z = 1 this is the identity camera.
//   ground   y = 860 for everything (door, Researcher, Clawd).
//   void     cover(DARK) everywhere, DARK = '#140D17'; the floor (y > 860) is '#2A1D28' but only shows inside the pool.
//   door     CAST.door(960, 860, 1, t, { lit: 0, locked: 1, flat: 0 })   (frame 340 wide × 520 tall at s = 1)
//   spot     SPOT = '#FFE2A8' (warm). The cone is the convex polygon coneHole(): top edge (860, -80)–(1060, -80), then the
//            lower half of the ellipse centre (960, 880), rx 500, ry 90, from angle 0 to π. Painted, in this order:
//              cover(DARK); floor; paint(coneHole(), { wash: '#3A2C30', washOp: 255, ink: null }) (the dusty beam);
//              paint(ellPts(960, 880, 500, 90, 30), { wash: '#B98F6A', washOp: 255, fill: '#E8C38E', fillOp: 120,
//                bleed: .1, tex: .4, border: .3, ink: null }) (the pool); door; characters;
//              darkAround(coneHole(), DARK, 250) (everything outside the cone goes black); glow(960, 300, 520, SPOT, .35)
//              and glow(960, 870, 420, SPOT, .45) (the light itself).
//   Researcher  researcher(700, 860, 24, { ...researcher.feel('neutral', t), eyes: 'dot', mouth: 'flat', lookX: 1,
//                 aL: -1.25, aR: -1.25, boilKey: 'researcher' })   (left of the door, looking right at Clawd)
//   Clawd       clawd(1255, 860, 26, { ...clawd.feel('neutral', t), view: 'q', flip: true, mouth: 'flat', lookX: .5,
//                 boilKey: 'clawd' })   (right of the door, three-quarter view facing left, looking at the Researcher)
// ======================================================================================================================
(() => {
  const ALARM = '#C8102E', RED = '#E0283F', DARK = '#140D17', GOLDL = '#F8D66A', SEPC = '#F1E1BD', SPOT = '#FFE2A8';
  const STEEL = '#A3AAB6', STEELD = '#5E6575', PLANKC = '#C8915A', VOID = '#1A121E', VFLOOR = '#2A1D28';
  const FULL = () => rectPts(-3000, -3000, 8000, 8000);
  const cover = (col, op = 255) => { if (op >= 2) paint(FULL(), { wash: col, washOp: op, ink: null }); };
  const bloom = (x, y, rx, ry, col, op = 90, bleed = .3) => paint(ellPts(x, y, rx, ry, 24), { fill: col, fillOp: op, bleed, tex: .3, border: .2, ink: null });
  const disc = (x, y, r, col, op = 255, n = 12) => paint(ellPts(x, y, r, r, n), { wash: col, washOp: op, ink: null });
  const boilN = t => Math.floor(t * BOIL);

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                 // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);  // n beats after the beat nearest t
  const CHO = sec('Chorus 4'), INT = SECTIONS.find(s => s.kind === 'interlude' && s.start >= CHO.end - .01);
  // A · "I'm upping my P(doom)"
  const UP = CHO.start, LEVEL = beatsAfter(UP, 1);               // the frame rolls back level onto this beat
  const SING = LINES[40].start, CRACK = nearestBar(word(40, 4));  // "doom" (a bar): the glass cracks
  const CRACKS = [[-6, -330, CRACK, 7], [12, -250, CRACK + BEAT * .5, 5]];   // tube-local x, y, time, rays
  // B · "Just as foretold by Loom"
  const LOOM = LINES[41].start, B0 = Math.round(bpOf(LOOM));
  const PASS = [beatAt(B0), beatAt(B0 + 1), beatAt(B0 + 2)];     // the shuttle lands on each beat
  const TB = PASS[2], RACE0 = nearestBar(word(41, 4));            // the warp bursts; on "Loom" (a bar) one branch races at us
  // C · "From masked pre-training days"
  const MASKED = LINES[42].start, HAND = nearestBeat(word(42, 1)) ;   // "masked": baby Clawd's hand shoots up
  const DRAW0 = nearestBeat(word(42, 3)), DRAW1 = nearestBar(word(42, 4)), STAR = DRAW1 + .12;   // "training" → "days"
  // D · "To recursive self-upgrade"
  const RECUR = LINES[43].start, RB = Math.round(bpOf(RECUR));
  const DONE = [beatAt(RB + 1), beatAt(RB + 2), beatAt(RB + 3)];  // each bigger Clawd is finished on a beat
  // E · "What did Ilya see? We'll never know."
  const WHAT = LINES[44].start, DID = word(44, 1), ILYA = word(44, 2);
  const SLAM = nearestBar(word(44, 3));                           // "see?" (a bar): SLAM
  const LOCKT = [1, 2, 3].map(n => beatsAfter(SLAM, n));          // padlocks, one per beat through "we'll never know"
  // F · Interlude
  const DIE = INT.start, RISE = beatsAfter(DIE, 1), LOOK = nearestBeat(136.0), MARKS = LOOK - .1;   // on their marks, then they look at each other on the beat
  const END = INT.end;

  // ======================================================================================================================
  // CAST.door(x, y, s, t, o): the door Ilya saw behind (a Guest; Chapter 9 opens on it and reveals it's a painted flat).
  // (x, y) = the bottom centre of the door on the floor; at s = 1 the frame is 340 wide and 520 tall. o:
  //   lit 0..1     the door stands ajar on the left and golden light leaks from the crack and under the door
  //   locked 0..1  two chains snap across it (0–.36), then three padlocks pop on (at .4, .65 and .9)
  //   flat 0..1    how much it reads as a painted theatre flat: the plywood edge, a wooden brace and a stage weight
  //                behind it on the right, and casters, all fading in from the dark
  // ======================================================================================================================
  const LOCKS = [[0, -270, .4], [-70, -400, .65], [72, -150, .9]];   // door-local x, y, when (in `locked`)
  function chainLink(a, b, k, sw) {
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 34), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let i = 0; i < Math.floor(n * k); i++) {
      const cx = lerp(a[0], b[0], (i + .5) / n), cy = lerp(a[1], b[1], (i + .5) / n);
      if (i % 2) paint(ellPts(cx, cy, 20, 5, 12, 0, ang), { wash: STEELD, ink: PAL.ink, sw: sw * .7 });
      else { paint(ellPts(cx, cy, 21, 12, 14, 0, ang), { wash: STEEL, ink: PAL.ink, sw: sw * .9 }); paint(ellPts(cx, cy, 11, 4, 10, 0, ang), { wash: '#2A2230', ink: null }); }
    }
  }
  function padlock(x, y, k, rot, sw) {
    if (k <= .01) return;
    push(); translate(x, y); rotate(rot); scale(k);
    inkLine([[-22, 6], [-22, -26], [-12, -42], [12, -42], [22, -26], [22, 6]], 3.2, STEELD, 'ink', .6);
    inkLine([[-22, 6], [-22, -26], [-12, -42], [12, -42], [22, -26], [22, 6]], 1.4, STEEL, 'inkfine', .6);
    paint(rrPts(-36, 0, 72, 60, 12, 1), { wash: '#E0A93A', fill: '#A8741E', fillOp: 70, tex: .5, ink: PAL.ink, sw: sw * 1.2 });
    disc(0, 24, 8, PAL.ink, 255, 10); paint([[-4, 26], [4, 26], [6, 44], [-6, 44]], { wash: PAL.ink, ink: null });
    pop();
  }
  CAST.door = (x, y, s, t, o = {}) => {
    const lit = clamp(o.lit || 0), locked = clamp(o.locked || 0), flat = clamp(o.flat || 0), sw = 1.3;
    const cw = 30 * lit;                                                         // the gap on the latch side
    boilSeed('door ' + (o.boilKey || ''));
    push(); translate(x, y); scale(s);
    if (flat > .01) {                                                            // it was scenery all along
      const wood = mixCol(DARK, '#9A6A3A', flat), ply = mixCol(DARK, '#D8B88A', flat);
      inkLine([[160, -440], [330, 0]], 9, wood, 'ink', 0);                       // the brace behind it
      inkLine([[160, -200], [260, 0]], 6, wood, 'ink', 0);
      paint(rrPts(270, -34, 110, 34, 10), { wash: mixCol(DARK, '#5A4A3A', flat), ink: PAL.ink, sw: .8 });   // stage weight
      paint([[170, -520], [170 + 20 * flat, -506], [170 + 20 * flat, 2], [170, 0]], { wash: ply, ink: PAL.ink, sw: .9 });   // plywood edge
      for (const cx of [-120, 120]) paint(ellPts(cx, 10, 13, 13, 10), { wash: mixCol(DARK, '#3A3040', flat), ink: PAL.ink, sw: .7 });
    }
    paint(rectPts(-170, -520, 340, 520, 2), { wash: '#5A3424', fill: '#2A1810', fillOp: 60, tex: .6, ink: PAL.ink, sw: sw * 1.1 });   // the frame
    paint(rectPts(-140, -490, 280, 490), { wash: '#24161C', ink: null });       // the dark doorway
    if (cw > .5) {                                                               // light through the crack
      paint(rectPts(-140, -490, cw, 490), { wash: GOLDL, ink: null });
      paint(rectPts(-140 + cw * .3, -490, cw * .4, 490), { wash: '#FFF8E4', ink: null });
    }
    paint(rectPts(-140 + cw, -490, 280 - cw, 490, 2), { wash: '#7A4A30', fill: '#4A2A1A', fillOp: 60, tex: .7, ink: PAL.ink, sw });   // the slab
    for (const [y0, y1] of [[-460, -290], [-250, -40]]) paint(rectPts(-140 + cw + 34, y0, 280 - cw - 68, y1 - y0, 2), { fill: '#4A2A1A', fillOp: 70, tex: .5, ink: '#3A2014', sw: .9 });
    paint(ellPts(-140 + cw + 30, -250, 12, 12, 12), { wash: '#E8B23A', ink: PAL.ink, sw: .8 });   // knob
    if (lit > .01) {
      paint(rectPts(-140, -6, 280, 6), { wash: GOLDL, washOp: 255 * lit, ink: null });              // light under the door
      bloom(-140 + cw / 2, -250, 40 + cw * 2, 280, GOLDL, 110 * lit);
    }
    if (locked > .01) {
      const ck = (a, b) => clamp((locked - a) / (b - a));
      chainLink([-175, -470], [175, -60], ck(0, .26), sw);
      chainLink([175, -470], [-175, -60], ck(.1, .36), sw);
      for (const [lx, ly, at] of LOCKS) {
        const k = ck(at, at + .1);
        padlock(lx, ly, backOut(k), .5 * (1 - k) + .05 * Math.sin(t * 3.1 + lx) * k, sw);
      }
    }
    pop();
    boilSeed('door after');
  };

  // Darken everything outside a convex hole (one keyhole polygon, so no seams).
  function darkAround(hole, col, op) {
    if (op < 2) return;
    const o = [[-3000, -3000], [5000, -3000], [5000, 5000], [-3000, 5000]];
    const h = hole.slice().reverse();
    paint([...o, o[0], h[h.length - 1], ...h], { wash: col, washOp: op, ink: null });
  }
  function coneHole() {
    const p = [[860, -80], [1060, -80]];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; p.push([960 + 500 * Math.cos(a), 880 + 90 * Math.sin(a)]); }
    return p;
  }
  // the seam camera: a zoom about the world point (960, 600), which stays put on screen
  const seamCam = (z, sx = 0, sy = 0) => camBegin(960 + sx, 600 - 60 / z + sy, z, 0);

  // ======================================================================================================================
  // A · "I'm upping my P(doom)" · The chorus stage under red alert. Clawd is too big for it now: its face fills the
  // whole proscenium behind the meter and only its arms fit, reaching in from the wings to slam both pumps on the
  // eighth notes. Siren beams sweep. On "doom" (the bar) the meter's glass cracks; Clawd's eyes go wide and its arms
  // recoil. Seam in: from Chapter 7's red, the frame rolls back level onto a beat. Seam out: cut on the beat.
  // ======================================================================================================================
  const GU = 120, GX = 960, GY = 60 + 8 * GU;                    // giant Clawd: its head jammed up under the valance
  const SHY = GY - 4.5 * GU, SHX = 5.45 * GU;                    // its shoulders (the arm pivots, slid out)
  const MX = 960, MY = 935, MS = 1.0, PS = 1.25, PL = 560, PR = 1360, PY = 935;
  const BULB = [MX, MY - 92 * MS];
  const BEAC = [[430, 150, 0], [1490, 150, Math.PI]];
  const sirenK = t => .5 + .5 * Math.cos(bpOf(t) * Math.PI);
  // frantic strokes on the eighth notes, the two arms alternating; the down-stroke lands on the note
  const strokeH = (t, ph) => { const f = frac(bpOf(t) * 2 + ph); return f < .7 ? ease(f / .7) : 1 - easeIn((f - .7) / .3); };
  const barTop = h => PY - (270 + 150 * h) * PS;
  function sirenBeams(t) {
    boilSeed('siren beams');
    for (const [bx, by, ph] of BEAC) {
      const a = Math.PI / 2 + Math.sin(t * 3.3 + ph) * .95, s = .15, L = 1700;
      const P = d => [bx + Math.cos(a + d) * L, by + Math.sin(a + d) * L];
      paint([[bx, by], P(-s), P(s)], { wash: '#FF6A50', washOp: 50, ink: null });
      paint([[bx, by], P(-s * .4), P(s * .4)], { wash: '#FFD2A8', washOp: 46, ink: null });
    }
  }
  function beacons(t) {
    const k = sirenK(t);
    for (const [bx, by, ph] of BEAC) {
      boilSeed('beacon' + bx);
      inkLine([[bx, 96], [bx, by - 30]], 1.4, PAL.ink, 'ink', 0);
      glow(bx, by - 14, 120 + 50 * k, '#FF4A3A', .5 + .5 * k);
      paint([[bx - 36, by + 6], [bx - 32, by - 22], [bx - 15, by - 38], [bx + 15, by - 38], [bx + 32, by - 22], [bx + 36, by + 6]], { wash: RED, fill: '#FF9A7A', fillOp: 90 * k, ink: PAL.ink, sw: 1.1, curv: .4 });
      disc(bx + Math.sin(t * 3.3 + ph) * 18, by - 18, 9, '#FFE8D0', 230);
      paint(rectPts(bx - 44, by + 4, 88, 16, 1), { wash: '#3A3040', ink: PAL.ink, sw: 1 });
    }
  }
  // the private crack, drawn over meterProp: ink rays from each impact, bubbles boiling in the liquid, chips flying
  function meterCrack(t, mx) {
    const v = pdoomAt(t), hh = 390 * clamp(v / 100);
    boilSeed('meter boil');
    push(); translate(mx, MY); scale(MS);
    if (t > SING) for (let i = 0; i < 6; i++) {                                  // the liquid boils
      const yy = -118 - ((t * 170 + hash(i + 3) * 400) % (hh - 10)), xx = -12 + hash(i) * 24 + Math.sin(t * 9 + i) * 3;
      disc(xx, yy, 4 + hash(i + 9) * 4, '#FFD8D0', 190, 8);
    }
    for (const [cx, cy, ct, n] of CRACKS) {
      if (t < ct) continue;
      boilSeed('crack' + ct);
      const k = easeOut((t - ct) / .08);
      for (let j = 0; j < n; j++) {
        const a = hash(ct * 13 + j) * TAU, L = (40 + hash(ct * 7 + j) * 45) * k, p = [[cx, cy]];
        for (let q = 1; q <= 3; q++) { const aa = a + (q % 2 ? .35 : -.3); p.push([clamp(cx + Math.cos(aa) * L * q / 3, -36, 36), cy + Math.sin(aa) * L * q / 3]); }
        inkLine(p, 1.2, PAL.ink, 'inkfine', 0);
      }
      paint(starPts(cx, cy, 9 * k, .4, 5, ct), { wash: '#FFFFFF', washOp: 200, ink: null });
    }
    pop();
    for (const [cx, cy, ct] of CRACKS) {                                          // glass chips fly off
      const age = t - ct; if (age < 0 || age > .5) continue;
      boilSeed('chips' + ct);
      for (let j = 0; j < 5; j++) {
        const vx = (hash(ct * 3 + j) - .5) * 620, vy = -220 - hash(ct * 5 + j) * 300;
        const x = mx + cx * MS + vx * age, y = MY + cy * MS + vy * age + 1100 * age * age, r = 8 + hash(j + ct) * 7, a0 = age * 14 + j;
        paint([[x + Math.cos(a0) * r, y + Math.sin(a0) * r], [x + Math.cos(a0 + 2.2) * r, y + Math.sin(a0 + 2.2) * r], [x + Math.cos(a0 + 4) * r * .7, y + Math.sin(a0 + 4) * r * .7]], { wash: '#DDF0F8', ink: PAL.ink, sw: .5 });
      }
    }
  }
  // a giant arm reaching in from the wing, its end pressing on a pump handle
  const armAim = (side, hx, hy) => { const vx = hx - (GX + side * SHX), vy = hy - SHY; return side < 0 ? Math.atan2(-vy, -vx) : Math.atan2(-vy, vx); };
  function bigArm(side, hx, hy, t) {
    boilSeed('big arm' + side);
    const sx = GX + side * SHX, sy = SHY, ang = Math.atan2(hy - sy, hx - sx), len = Math.hypot(hx - sx, hy - sy) + 20, AW = GU * .95;
    push(); translate(sx, sy); rotate(ang);
    paint(rrPts(-AW * .3, -AW / 2, len + AW * .3, AW, 12), { wash: PAL.clay, washOp: 255, fill: PAL.clayDk, fillOp: 70, tex: .5, ink: PAL.ink, sw: 2.2 });
    paint(rectPts(0, AW * .12, len - 10, AW * .3), { fill: PAL.clayDk, fillOp: 90, bleed: .05, tex: .6, border: .5, ink: null });
    pop();
  }
  function redAlert(t, lt, dur) {
    const roll = .35 * (1 - backOut(seg(t, UP, LEVEL)));
    const land = t > LEVEL ? Math.exp(-(t - LEVEL) * 8) : 0, crackHit = t > CRACK ? Math.exp(-(t - CRACK) * 6) : 0;
    const [sx, sy] = shakeXY(t, 3 + 7 * pulse2(t, 9) + 14 * land + 22 * crackHit);
    camBegin(960 + sx, 530 + sy, .94 + .05 * ease(seg(t, LEVEL, LOOM)) + .015 * pulse2(t, 7), roll);
    const scared = t > CRACK + .06, recoil = backOut(seg(t, CRACK + .04, CRACK + .3));
    const md = clawd.emotions(t, [[UP, 'determined', { mouth: 'grin' }], [CRACK + .06, 'scared', { mouth: 'O', emote: null }]]);
    const hL = scared ? lerp(strokeH(CRACK, 0), 1, recoil) : strokeH(t, 0), hR = scared ? lerp(strokeH(CRACK, .5), 1, recoil) : strokeH(t, .5);
    const lift = 140 * recoil * (scared ? 1 : 0), HL = [PL, barTop(hL) - 30 - lift], HR = [PR, barTop(hR) - 30 - lift];
    stageBack(t, {
      backdrop: () => {
        cover('#2A0E18');
        // giant Clawd fills the opening, its head jammed under the valance; its arms are redrawn in front below
        clawd(GX, GY, GU, { ...md, emote: null, dx: (md.dx || 0) * .25, dy: (md.dy || 0) * .1 - .08 * pulse2(t, 8) * (scared ? 0 : 1), sq: (md.sq || 0) * .3, rot: 0,
          lookY: scared ? -.2 : .7, lookX: scared ? 0 : Math.sin(bpOf(t) * Math.PI) * .25, aL: armAim(-1, ...HL), aR: armAim(1, ...HR), noShadow: true, noLegs: true, boilKey: 'giant clawd' });
      },
      floor: '#7A3A34'
    });
    sirenBeams(t);
    // the meter shakes on every stroke and rattles after the crack
    const mx = MX + (t > CRACK ? Math.sin(t * 90) * 4 * (1 + 2 * crackHit) : Math.sin(t * 70) * 2 * pulse2(t, 10));
    pumpProp(PL, PY, PS, hL, [BULB[0] - 60, BULB[1]]);
    pumpProp(PR, PY, PS, hR, [BULB[0] + 60, BULB[1]]);
    meterProp(mx, MY, MS, pdoomAt(t), { glow: .5 + .5 * pulse(t, 4) });
    meterCrack(t, mx);
    // the Researcher, panicking on the spot between the pump and the meter
    const rm = researcher.emotions(t, [[UP, 'nervous'], [CRACK + .1, 'scared']]);
    researcher(770, 948, 17, { ...rm, run: t < CRACK ? bpOf(t) * 2 : null, dy: (rm.dy || 0) - Math.abs(Math.sin(bpOf(t) * TAU)) * .25, lookX: .8, lookY: -.6,
      aL: t < CRACK ? 1.1 + .6 * Math.sin(t * 19) : rm.aL, aR: t < CRACK ? 1.1 + .6 * Math.cos(t * 17) : rm.aR, boilKey: 'researcher' });
    // the arms reach forward onto the handles; after the crack they jerk up off them
    bigArm(-1, ...HL, t);
    bigArm(1, ...HR, t);
    stageFront(t, { alarm: .25 + .3 * sirenK(t) });
    beacons(t);
    camEnd();
    flushLetters();                                      // the meter's lettering belongs to the stage, under the red
    flash(1 - seg(lt, 0, .35), ALARM);                   // the Seam in: Chapter 7's solid alarm red fades off
  }

  // ======================================================================================================================
  // B · "Just as foretold by Loom" · Clawd the seer in a starry hood works a giant loom; the shuttle flies across on
  // each beat and a stripe of cloth grows. On the third pass the warp threads burst off the top and branch across the
  // night into a glowing tree of futures; on "Loom" one golden branch races straight at the lens. Seam in: cut on the
  // beat. Seam out: the branch's tip fills the frame and turns sepia.
  // ======================================================================================================================
  const LX0 = 800, LX1 = 1460, LTOP = 250, LBOT = 800, NW = 15, ROWH = 17, ROWS0 = 9;
  const wx = i => lerp(LX0 + 34, LX1 - 34, i / (NW - 1));
  const STRIPE = [RED, '#E8B23A', PAL.teal, PAL.rose, PAL.cream, PAL.violet];
  const BRANCH = [GOLDL, '#FF9C84', '#A8E6DC', '#F7B7D0', '#FFE6A8'];
  const TREE = [], TIPS = [];
  (() => {
    const grow = (x, y, a, len, d, id, root) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, k = (hash(id) - .5) * .3 * len;
      TREE.push({ x, y, mx: (x + x1) / 2 - Math.sin(a) * k, my: (y + y1) / 2 + Math.cos(a) * k, x1, y1, d, root });
      if (d < 3) { const sp = .3 + hash(id + 3) * .22; grow(x1, y1, a - sp, len * .74, d + 1, id * 2 + 1, root); grow(x1, y1, a + sp, len * .74, d + 1, id * 2 + 2, root); }
      else TIPS.push({ x: x1, y: y1, id, root });
    };
    [2, 5, 7, 9, 12].forEach((wi, r) => grow(wx(wi), LTOP, -Math.PI / 2 + (r - 2) * .36, 265, 0, 11 + r * 37, r));
  })();
  const RACE = TIPS.reduce((b, p) => Math.hypot(p.x - 1180, p.y + 240) < Math.hypot(b.x - 1180, b.y + 240) ? p : b, TIPS[0]);
  const STARS = Array.from({ length: 30 }, (_, i) => [lerp(-300, 2300, hash(i * 3.3)), lerp(-760, 720, hash(i * 7.1)), 2 + hash(i * 1.9) * 4]);
  function tube(sp, w0, w1, o) {
    const L = [], R = [];
    for (let i = 0; i < sp.length; i++) {
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, i / (sp.length - 1)) / 2;
      L.push([sp[i][0] - dy / d * w, sp[i][1] + dx / d * w]); R.push([sp[i][0] + dy / d * w, sp[i][1] - dx / d * w]);
    }
    paint(L.concat(R.reverse()), o);
  }
  function shuttleAt(t) {
    let x = LX0 - 80, fly = 0, dir = 1;
    PASS.forEach((a, j) => {
      const k = seg(t, a - .26, a), from = j % 2 ? LX1 + 80 : LX0 - 80, to = j % 2 ? LX0 - 80 : LX1 + 80;
      if (t >= a - .26) { x = lerp(from, to, ease(k)); fly = k > 0 && k < 1 ? 1 : 0; dir = j % 2 ? -1 : 1; }
    });
    return { x, fly, dir };
  }
  function drawTree(t, g) {
    boilSeed('tree');
    for (const s of TREE) {
      const k = clamp(g * 4 - s.d); if (k <= 0) continue;
      const e = easeOut(k);
      inkLine([[s.x, s.y], [lerp(s.x, s.mx, e), lerp(s.y, s.my, e)], [lerp(s.x, s.x1, e), lerp(s.y, s.y1, e)]], 3.8 - s.d * .7, BRANCH[s.root], 'ink', .5);
    }
    const k = clamp(g * 4 - 3.4) * 1.7;
    if (k > 0) for (const p of TIPS) {
      const tw = .75 + .25 * Math.sin(t * 8 + p.id), r = 20 * Math.min(1, k) * tw;
      disc(p.x, p.y, r * 1.9, BRANCH[p.root], 90, 14);
      disc(p.x, p.y, r * .8, '#FFF6DE', 240, 10);
    }
  }
  function loomFrame(t, ba, weaveY, rows) {
    boilSeed('loom');
    const lw = { wash: '#8A5A36', fill: '#5A3520', fillOp: 60, tex: .6, border: .5, ink: PAL.ink, sw: 1.3 };
    for (let i = 0; i < rows; i++) paint(rectPts(LX0 + 16, LBOT - (i + 1) * ROWH, LX1 - LX0 - 32, ROWH + 1), { wash: STRIPE[i % STRIPE.length], washOp: 235, ink: null });
    paint(rectPts(LX0 + 16, weaveY, LX1 - LX0 - 32, LBOT - weaveY), { ink: PAL.ink, sw: 1 });
    for (let i = 0; i < NW; i++) {                                              // warp threads (whip upward at the burst)
      const x = wx(i);
      if (ba < 0) inkLine([[x, weaveY], [x, LTOP + 14]], .9, '#F2D9A0', 'inkfine', 0);
      else { const a = 26 * Math.exp(-ba * 5); inkLine([[x, weaveY], [x + Math.sin(i + ba * 30) * a, lerp(weaveY, LTOP, .5)], [x, LTOP]], 1, '#F7E2AE', 'inkfine', .5); }
    }
    for (const x of [LX0 - 44, LX1 + 10]) paint(rectPts(x, LTOP - 70, 34, LBOT - LTOP + 150, 2), lw);
    paint(rectPts(LX0 - 110, LBOT + 76, LX1 - LX0 + 220, 26, 2), lw);
    paint(rrPts(LX0 - 24, LBOT, LX1 - LX0 + 48, 44, 18, 2), lw);
    if (ba < 0) paint(rrPts(LX0 - 64, LTOP - 34, LX1 - LX0 + 128, 40, 16, 2), lw);
    else {                                                                      // the top beam blasts off
      push(); translate((LX0 + LX1) / 2, LTOP - 14 - 2600 * ba - 6000 * ba * ba); rotate(ba * 1.5);
      paint(rrPts(-(LX1 - LX0) / 2 - 64, -20, LX1 - LX0 + 128, 40, 16, 2), lw); pop();
    }
  }
  function raceBranch(P, q) {
    boilSeed('race branch');
    const f = ease(Math.min(1, q * 1.15)), r = 12 + 1500 * Math.pow(q, 3);
    const C1 = [P[0] - 560, P[1] + 220], C2 = [240, 1000], E = [930, 600];
    const bez = u => { const a = 1 - u, b0 = a * a * a, b1 = 3 * a * a * u, b2 = 3 * a * u * u, b3 = u * u * u; return [b0 * P[0] + b1 * C1[0] + b2 * C2[0] + b3 * E[0], b0 * P[1] + b1 * C1[1] + b2 * C2[1] + b3 * E[1]]; };
    const sp = []; for (let i = 0; i <= 14; i++) sp.push(bez(f * i / 14));
    const N = sp[sp.length - 1];
    tube(sp, 10, Math.max(30, r * 1.15), { wash: '#E8B23A', fill: GOLDL, fillOp: 120, bleed: .1, tex: .3, border: .3, ink: PAL.ink, sw: 1.4, curv: .5 });
    for (let i = 3; i < 14; i += 3) { const [bx, by] = sp[i]; paint(starPts(bx, by, 10 + 20 * q * i / 14, .4, 4, i), { wash: GOLDL, ink: null }); }
    glow(N[0], N[1], r * 1.6 + 60, GOLDL, .8);
    disc(N[0], N[1], r, mixCol(GOLDL, SEPC, q), 255, 30);
    if (q < .9) disc(N[0] - r * .22, N[1] - r * .25, r * .42, '#FFF6DE', 210 * (1 - q), 20);
  }
  function loom(t, lt, dur) {
    const ba = t - TB, burst = ba >= 0;
    const rows = ROWS0 + PASS.filter(a => t >= a).length, weaveY = LBOT - rows * ROWH;
    const g = burst ? clamp(ba / .42) : 0, rq = seg(t, RACE0, MASKED), up = burst ? ease(ba / .4) : 0;
    const cz = burst ? lerp(1.05 + .05 * (TB - LOOM), .64, up) : 1 + .05 * lt;
    const ccx = lerp(1010, 1120, up), ccy = lerp(545, 120, up);
    const [sx, sy] = shakeXY(t, (burst ? 14 * Math.exp(-ba * 7) : 0) + 3 * pulse(t, 9));
    camBegin(ccx + sx + (RACE.x - ccx) * .3 * ease(rq), ccy + sy + (RACE.y - ccy) * .3 * ease(rq), cz * (1 + .3 * easeIn(rq)) + .02 * pulse(t, 6), 0);
    boilSeed('loom night');
    cover('#1A0F1E');
    bloom(1130, 430, 1100, 700, '#5A1428', 150);
    bloom(1130, -260, 950, 520, '#3A1640', 130);
    if (burst) bloom(1130, -60, 1000 * g + 40, 650 * g + 40, '#E8B23A', 70 * g, .35);
    STARS.forEach(([x, y, r], i) => disc(x, y, r * (.7 + .3 * Math.sin(t * 5 + i)), PAL.cream, 200, 8));
    if (burst) drawTree(t, g);
    loomFrame(t, ba, weaveY, rows);
    // the shuttle
    boilSeed('shuttle');
    const sh = shuttleAt(t), shy = weaveY - 14 - (burst ? 900 * ba + 2600 * ba * ba : 0);
    if (sh.fly) {
      inkLine([[sh.dir > 0 ? LX0 + 16 : LX1 - 16, weaveY - 6], [sh.x, shy]], 1.3, GOLDL, 'inkfine', 0);
      for (let k = 0; k < 3; k++) inkLine([[sh.x - sh.dir * (70 + k * 26), shy - 16 + k * 16], [sh.x - sh.dir * (150 + k * 40), shy - 16 + k * 16]], .8, PAL.cream, 'inkfine', 0);
    }
    push(); translate(sh.x, shy); if (burst) rotate(ba * 9);
    paint([[-60, 0], [-32, -14], [32, -14], [60, 0], [32, 14], [-32, 14]], { wash: '#C98A4A', fill: '#7A4A2A', fillOp: 60, ink: PAL.ink, sw: 1.1, curv: .5 });
    paint(ellPts(0, 0, 22, 8, 12), { wash: '#E8B23A', ink: PAL.ink, sw: .7 });
    pop();
    // Clawd the seer flings the shuttle with a flourish on every pass, then gapes at the burst
    const pk = Math.max(0, ...PASS.map(a => (t >= a - .3 && t < a + .25) ? Math.sin(Math.PI * clamp((t - a + .3) / .55)) : 0));
    const md = clawd.emotions(t, [[LOOM, 'proud', { emote: null }], [TB, 'starstruck']]);
    const cx = 580, cy = 872;
    clawd(cx, cy, 27, { ...md, hat: 'hood', mouth: burst ? 'O' : 'smile', blush: burst ? 0 : .6, dy: -.6 * pulse(t, 5) - (burst ? 1.2 * Math.exp(-ba * 5) : 0) + (md.dy || 0) * .3,
      aL: burst ? 1.4 : .7 + .25 * Math.sin(t * 5), aR: burst ? 1.4 : .3 + 1.1 * pk, rot: -.05 * pk, emote: burst ? null : md.emote, boilKey: 'clawd' });
    if (!burst && pk > .2) for (let i = 0; i < 3; i++) {                            // weaving magic off the hand
      boilSeed('sparkle' + i);
      const a = i * 2.1 + t * 6, r = 40 + 20 * i;
      paint(starPts(cx + 7.3 * 27 + Math.cos(a) * r * .6, cy - 7 * 27 + Math.sin(a) * r * .5, 12 * pk), { wash: GOLDL, ink: PAL.ink, sw: .5 });
    }
    const P = toScreen(RACE.x, RACE.y);
    camEnd();
    if (rq > 0) raceBranch(P, rq);
  }

  // ======================================================================================================================
  // C · "From masked pre-training days" · A sepia flashback on scratched film: baby Clawd in a masquerade mask at a
  // school desk. The teacher (the Researcher) taps the blank in "the cat sat on the [MASK]"; baby Clawd's hand shoots up
  // on "masked", its arm s-t-r-e-t-c-h-e-s to the board and writes "mat!", and gets a gold star on "days". Seam in: out
  // of the branch's sepia glare. Seam out: the film catches in the gate and burns through from the centre.
  // ======================================================================================================================
  const SEP = { wall: '#D8C09A', floor: '#A9875E', board: '#4E4B3E', frame: '#8A6A48', chalk: '#F1E8D4', ink: '#3E2E22' };
  const BABY = { col: '#CF9A6C', dk: '#99693F', lt: '#E8C39A' };
  const MASKX = 1400, ROWY = 290, MATX = 1318, MATY = 455;      // the [MASK] on the board, and where "mat!" goes
  const KX = 790, KY = 790, KU = 24, TX = 1660, TY = 905, TS = 24;
  const chalk = (pts, sw = 1.3, curv = .4) => inkLine(pts, sw, SEP.chalk, 'charcoal', curv);
  function chalkBoard(t) {
    boilSeed('chalkboard');
    paint(rectPts(560, 150, 1000, 470, 3), { wash: SEP.frame, ink: SEP.ink, sw: 1.4 });
    paint(rectPts(582, 172, 956, 426, 2), { wash: SEP.board, fill: '#2E2C24', fillOp: 70, tex: .8, border: .5, ink: null });
    paint(rectPts(600, 604, 920, 14, 1), { wash: SEP.frame, ink: SEP.ink, sw: .9 });   // chalk tray
    paint(rectPts(700, 596, 30, 9), { wash: SEP.chalk, ink: null });
    for (let i = 0; i < 3; i++) bloom(700 + i * 300, 330 + (i % 2) * 90, 120, 60, '#8A8670', 40);   // old smudges
    // the sentence (a Sound Word: the joke is the writing)
    letter('the cat sat on the', 930, ROWY, 54, SEP.chalk, { ink: false, alpha: .92 });
    letter('[MASK]', MASKX, ROWY, 54, SEP.chalk, { ink: false, alpha: .92 });
    chalk([[MASKX - 96, ROWY + 40], [MASKX + 96, ROWY + 42]], 1.2, 0);           // underlined
    // the answer: written letter by letter, then an arrow up to the blank
    const m = seg(t, DRAW0, DRAW1), n = Math.min(4, Math.floor(m * 4.4));
    if (n > 0) letter('mat!'.slice(0, n), MATX, MATY, 82, SEP.chalk, { ink: false, align: 'left', rot: -.06 });
    if (m >= 1) chalk([[MATX - 34, MATY - 8], [MASKX - 70, ROWY + 64], [MASKX - 60, ROWY + 52]], 1.2, .4);
    const sk = backOut((t - STAR) / .18);                                      // teacher's gold star
    if (t > STAR) { push(); translate(1222, 478); rotate(-.2 + .2 * sk); scale(sk); paint(starPts(0, 0, 44, .45, 5), { wash: '#D9B35C', fill: '#A8823A', fillOp: 60, ink: SEP.ink, sw: 1 }); pop(); }
  }
  function chalkTip(t) {                                                        // where the chalk is while it writes
    if (t < DRAW0) return [MATX + 20, MATY];
    const k = seg(t, DRAW0, DRAW1);
    return [MATX + 10 + 150 * k, MATY + 10 + Math.sin(k * 50) * 22];
  }
  function flashback(t, lt, dur) {
    const f = Math.floor(t * 12), weave = (hash(f * 1.3) - .5) * 6;
    camBegin(1085, 520 + weave, 1.28 + .04 * lt, 0);
    boilSeed('classroom');
    cover(SEP.wall);
    for (let i = 0; i < 9; i++) inkLine([[i * 240 - 100, -200], [i * 240 - 100, 830]], .5, '#C4A77E', 'inkfine', 0);   // wallpaper stripes
    paint(rectPts(-600, 820, W + 1200, 700), { wash: SEP.floor, fill: SEP.ink, fillOp: 40, tex: .7, border: .4, ink: SEP.ink, sw: 1 });
    chalkBoard(t);
    // the teacher taps the blank with a pointer on the beat, then beams
    const happy = t > DRAW1 + .05;
    const tgt = happy ? [1500, 820] : [MASKX + 110, ROWY + 30 - 12 * pulse2(t, 10)];
    const shx = TX - 1.75 * TS, shy = TY - 7.6 * TS, dx = shx - tgt[0], dyy = tgt[1] - shy;
    const aim = Math.atan2(-dyy, dx), plen = Math.max(40, Math.hypot(dx, dyy) - 3.2 * TS - 8);
    const tm = researcher.emotions(t, [[MASKED, 'neutral'], [DRAW1 + .05, 'happy']]);
    researcher(TX, TY, TS, { ...tm, flip: true, eyes: happy ? 'closed' : 'look', lookX: -1, mouth: happy ? 'grin' : 'smile', pants: '#6B5A4A', shirt: '#8C7A5A',
      aR: aim, aL: happy ? 1.3 + .2 * Math.sin(t * 20) : -1.2, dy: happy ? -.5 * pulse(t, 5) : 0, boilKey: 'teacher',
      handR: (s, sw) => { inkLine([[0, 0], [plen, 0]], 2, '#6E4B2E', 'ink', 0); disc(plen, 0, 3, SEP.ink, 255, 6); } });
    // desk legs, then baby Clawd, then the desk top over its tummy
    boilSeed('desk legs');
    paint(rectPts(KX - 150, 736, 16, 170), { wash: '#6E5236', ink: SEP.ink, sw: .9 });
    paint(rectPts(KX + 134, 736, 16, 170), { wash: '#6E5236', ink: SEP.ink, sw: .9 });
    // the arm: ooh-ooh hand up on the beat, then it s-t-r-e-t-c-h-e-s to the board, writes, and snaps back
    const up = elasticOut(seg(t, HAND, HAND + .3)), reach = ease(seg(t, HAND + .3, DRAW0)), back = seg(t, DRAW1, DRAW1 + .22);
    const tip = chalkTip(t), px = KX + 4.9 * KU, py = KY - 4.5 * KU;
    const aimA = Math.atan2(py - tip[1], tip[0] - px), full = Math.hypot(tip[0] - px, tip[1] - py) - 2.2 * KU;
    let aR = lerp(.2, 1.45, up) + (t < HAND + .3 ? .15 * Math.sin(t * 34) * up : 0), ext = 0;
    if (t >= HAND + .3) { aR = lerp(1.45, aimA, reach); ext = full * reach; }
    if (back > 0) { const b = elasticOut(back); ext = full * (1 - b); aR = lerp(aimA, -.35, b); }
    const proud = t > DRAW1 + .08;
    const bm = clawd.emotions(t, [[MASKED, 'neutral'], [HAND, 'excited', { emote: '!' }], [DRAW1 + .08, 'proud']]);
    clawd(KX, KY, KU, { ...bm, eyes: 'normal', hat: 'masq', blush: 1, noLegs: true, noShadow: true, col: BABY.col, dk: BABY.dk, lt: BABY.lt, tint: null, sx: 1.04, sy: .94,
      mouth: proud ? 'grin' : t > HAND ? 'O' : 'o', dy: proud ? -.4 - .5 * pulse(t, 6) : -.25 * Math.abs(Math.sin(bpOf(t) * Math.PI)), aL: proud ? -.45 : .15, aR, rot: 0, dx: 0,
      draw: (u, sw) => {
        inkLine([[0, -8 * u], [.35 * u, -8.9 * u], [-.1 * u, -9.6 * u], [-.6 * u, -9.1 * u], [-.3 * u, -8.6 * u]], sw * .9, SEP.ink, 'ink', .6);   // baby curl
        for (const ex of [-2.5, 2.5]) {                                          // eyes glinting behind the mask
          if (proud) inkLine([[ex * u - .6 * u, -6.2 * u], [ex * u, -6.8 * u], [ex * u + .6 * u, -6.2 * u]], sw, PAL.cream, 'ink', .3);
          else disc(ex * u + .25 * u, -6.55 * u, .24 * u, PAL.cream, 240, 8);
        }
      },
      armR: (u, sw) => {
        if (ext > 2) paint(rectPts(-.2 * u, -.45 * u, ext + .2 * u, .9 * u, u * .03), { wash: BABY.col, ink: SEP.ink, sw: sw * .8 });
        paint(rectPts(ext - .1 * u, -.22 * u, 1.1 * u, .44 * u), { wash: SEP.chalk, ink: SEP.ink, sw: sw * .4 });
      }, boilKey: 'baby clawd' });
    if (t > DRAW0 && t < DRAW1 + .1) { boilSeed('chalk dust'); for (let i = 0; i < 4; i++) {
      const a = hash(f + i) * TAU, r = 10 + hash(f * 2 + i) * 26; disc(tip[0] + Math.cos(a) * r, tip[1] + Math.sin(a) * r, 3 + hash(i + f) * 4, SEP.chalk, 160, 8);
    } }
    boilSeed('desk top');
    paint([[KX - 175, 718], [KX + 175, 718], [KX + 188, 742], [KX - 188, 742]], { wash: '#8C6A48', fill: SEP.ink, fillOp: 40, tex: .6, ink: SEP.ink, sw: 1.1 });
    paint(rectPts(KX - 165, 742, 330, 70), { wash: '#7A5A3C', fill: SEP.ink, fillOp: 40, tex: .6, ink: SEP.ink, sw: 1 });
    camEnd();
    flushLetters();                                                              // the chalk belongs under the film
    // old film: sepia tone, flicker, scratches, dust, the gate
    boilSeed('film');
    cover('#9C7448', 45);
    flash(.05 + .07 * hash(f * 7.1), hash(f * 3.3) > .5 ? '#FFF1D0' : '#3E2E22');
    for (let k = 0; k < 3; k++) {
      if (hash(f * 5.1 + k) < .35) continue;
      const x = hash(f * 3.7 + k * 11) * W, w = (hash(f + k) - .5) * 14;
      inkLine([[x, -10], [x + w, H * .5], [x - w * .5, H + 10]], .5, k % 2 ? '#F5EAD0' : '#3E2E22', 'inkfine', .5);
    }
    for (let k = 0; k < 6; k++) disc(hash(f * 1.7 + k) * W, hash(f * 2.9 + k) * H, 1.5 + hash(f + k * 3) * 4, hash(k + f) > .5 ? '#2E2218' : '#F8EED8', 200, 7);
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) bloom(x, y, 520, 400, '#3E2E22', 150);
    irisShape(rrPts(26, 18, W - 52, H - 36, 80), '#2A1E16');
    flash(1 - lt / .32, SEPC);                                                   // out of the branch's glare
    const bk = seg(t, MASKED + dur - .2, MASKED + dur);                         // the film catches and burns through
    if (bk > 0) {
      boilSeed('burn');
      const r = 30 + 1500 * easeIn(bk), ring = m => { const p = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, rr = r * m * (1 + .14 * (hash(i * 3.1) - .5) + .06 * Math.sin(i * 1.7 + t * 30)); p.push([960 + Math.cos(a) * rr, 520 + Math.sin(a) * rr * .85]); } return p; };
      paint(ring(1.14), { wash: '#3A2012', washOp: 200, ink: null, curv: .6 });
      paint(ring(1), { wash: '#E0782A', ink: null, curv: .6 });
      paint(ring(.9), { wash: '#FFC45A', ink: null, curv: .6 });
      paint(ring(.78), { wash: '#FFF3D0', ink: null, curv: .6 });
    }
  }

  // ======================================================================================================================
  // D · "To recursive self-upgrade" · Out of the white-hot film burn, colour returns: Clawd in a party hat hammers
  // together a bigger Clawd around itself (crown), which hammers a bigger one (halo), which hammers a bigger one, each
  // finished on a beat, while the camera zooms out without a cut. Drawn in screen space so ink weights stay right at
  // every scale. Seam out: the zoom keeps going, everything shrinks to a gold point, and lands on the door.
  // ======================================================================================================================
  const RR = 3, US = 30;
  const LV = [
    { S: -1, E: -1, hat: 'party' },
    { S: RECUR - .03, E: DONE[0], hat: 'crown' },
    { S: DONE[0] + .03, E: DONE[1], hat: 'halo' },
    { S: DONE[1] + .03, E: DONE[2], hat: null },
  ];
  const GYL = [0]; for (let k = 1; k < 5; k++) GYL[k] = GYL[k - 1] + 2.6 * Math.pow(RR, k);   // each one stands inside the next
  const PLANK = [[-5, -2.6, 5, .6], [0, -2.6, 5, .6], [-4, -2.2, 1, 2.2], [3, -2.2, 1, 2.2], [-2, -2.2, 1, 2.2], [1, -2.2, 1, 2.2],
    [-5.3, -5.2, .7, 3], [4.6, -5.2, .7, 3], [-5.3, -8.2, .7, 3.1], [4.6, -8.2, .7, 3.1], [-5, -8.4, 5, .6], [0, -8.4, 5, .6]];
  const hammer = (u, sw) => {
    paint(rectPts(-.3 * u, -.22 * u, 3.1 * u, .44 * u), { wash: PLANKC, ink: PAL.ink, sw: sw * .6 });
    paint(rrPts(2.3 * u, -1.1 * u, 1.3 * u, 2.2 * u, .25 * u), { wash: STEEL, fill: STEELD, fillOp: 60, ink: PAL.ink, sw: sw * .7 });
  };
  function scaffold(gx, gy, u, S, E, t) {
    boilSeed('scaffold');
    const n = PLANK.length, sw = clamp(u / 22, .5, 1.6);
    paint(rectPts(gx - 5 * u, gy - 8 * u, 10 * u, 6 * u), { fill: PAL.clay, fillOp: 30 + 40 * seg(t, S, E), bleed: .05, tex: .5, border: .3, ink: '#F2D9A0', sw: sw * .7, br: 'inkfine' });   // blueprint
    for (const ex of [-3, 2]) paint(rectPts(gx + ex * u, gy - 7 * u, u, 2 * u), { ink: '#F2D9A0', sw: sw * .6, br: 'inkfine' });
    PLANK.forEach(([x, y, w, h], i) => {
      const ti = lerp(S, E, (i + .5) / n); if (t < ti) return;
      const k = backOut((t - ti) / .09), cx = gx + (x + w / 2) * u, cy = gy + (y + h / 2) * u;
      paint(rectPts(cx - w / 2 * u * k, cy - h / 2 * u * k, w * u * k, h * u * k, u * .04), { wash: PLANKC, fill: '#7C4A2C', fillOp: 50, tex: .6, ink: PAL.ink, sw });
      disc(cx - (w / 2 - .25) * u * k, cy - (h / 2 - .25) * u * k, .12 * u, PAL.ink, 255, 6);
    });
  }
  function recursion(t, lt, dur) {
    const x = seg(t, RECUR, WHAT), p = .42 + 2.1 * (x * .75 + .25 * x * x), Z = US / Math.pow(RR, p);
    const cyOf = k => GYL[k] - 5.6 * Math.pow(RR, k), k0 = Math.floor(p), fr = p - k0;
    const cy = cyOf(k0) + (cyOf(k0 + 1) - cyOf(k0)) * (Math.pow(RR, fr) - 1) / (RR - 1);
    const [shx, shy] = shakeXY(t, 5 * pulse2(t, 10));
    const S = (wx_, wy) => [960 + shx + wx_ * Z, 580 + shy + (wy - cy) * Z];
    // background: concentric bands that shrink as we pull back
    boilSeed('recursion bg');
    cover('#1E0A14');
    const [ox, oy] = S(0, cyOf(3) * .6);
    for (let j = Math.floor(2 * p) + 9; j >= Math.floor(2 * p) - 3; j--) {
      const r = 2.2 * Math.pow(RR, j / 2) * Z; if (r < 10 || r > 2600) continue;
      disc(ox, oy, r, j % 2 ? '#4A1022' : '#2A0A16', 255, 44);
    }
    bloom(960, 560, 620, 460, '#E8B23A', 45);
    for (let i = 0; i < 18; i++) {                                              // sparkles riding the zoom
      const a = hash(i * 5.1) * TAU, rw = 3 * Math.pow(RR, (i % 9) / 3 + hash(i) * .3), r = rw * Z;
      if (r < 30 || r > 1400) continue;
      paint(starPts(ox + Math.cos(a) * r * 1.3, oy + Math.sin(a) * r, 10 + 8 * Math.sin(t * 9 + i)), { wash: GOLDL, ink: null });
    }
    // levels, outermost first; a finished shell hides everything inside it
    for (let k = LV.length - 1; k >= 0; k--) {
      const L = LV[k], u = Z * Math.pow(RR, k), [gx, gy] = S(0, GYL[k]);
      if (k > 0 && t < L.S) continue;
      if (k > 0 && t < L.E) { if (u < 300) scaffold(gx, gy, u, L.S, L.E, t); continue; }
      if (u < 1.2) break;
      const age = k > 0 ? t - L.E : 9, nx = LV[k + 1], building = nx && t >= nx.S && t < nx.E;
      const f = frac(bpOf(t) * 4), aR = !building ? .3 : f < .35 ? lerp(1.5, -.4, easeIn(f / .35)) : lerp(-.4, 1.5, easeOut((f - .35) / .65));
      const md = k === 0 ? { eyes: 'happy' } : clawd.emotions(t, [[L.E, 'proud', { emote: null }], [L.E + .2, k === 1 ? 'smug' : 'starstruck', { emote: null }]]);
      const settle = age < 1 ? .3 * Math.exp(-age * 8) * Math.cos(age * 32) : 0;
      if (k === 2 && age > 0) {                                                  // divine rays behind the halo one
        boilSeed('halo rays');
        const hx = gx, hy = gy - 9 * u;
        for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU + t * .8, a1 = a0 + .16, R = 34 * u * ease(age / .4); paint([[hx, hy], [hx + Math.cos(a0) * R, hy + Math.sin(a0) * R], [hx + Math.cos(a1) * R, hy + Math.sin(a1) * R]], { fill: GOLDL, fillOp: 60, bleed: .05, tex: .2, border: .1, ink: null }); }
      }
      const drop = k > 0 && L.hat ? (1 - backOut(seg(age, .08, .36))) * 7 * u : 0;
      clawd(gx, gy, u, { ...md, dy: 0, dx: 0, rot: 0, sq: settle, mouth: k === 0 ? 'smile' : k === 1 ? 'grin' : k === 2 ? 'smile' : 'open', blush: k !== 1 ? .6 : 0, noShadow: k > 0,
        hat: k === 0 ? 'party' : null, aR, aL: building ? .5 + .2 * Math.sin(t * 12) : 1.2, armR: building ? hammer : null, boilKey: 'level' + k,
        draw: k > 0 && L.hat && age > .08 ? (uu, sw) => { push(); translate(0, -drop); hat(uu, L.hat, sw * (L.hat === 'halo' ? 1.6 : 1)); pop(); } : null });
      if (building && f >= .35 && f < .6) {                                     // BONK stars at the hammer head
        boilSeed('bonk');
        const a = -.4, hx = gx + 4.9 * u + 5.4 * u * Math.cos(a), hy = gy - 4.5 * u - 5.4 * u * Math.sin(a), s = 1.6 * u * (1 - (f - .35) / .25);
        paint(starPts(hx, hy, s, .4, 5, t * 3), { wash: GOLDL, ink: PAL.ink, sw: .8 });
      }
      if (k > 0 && age < .36) {                                                  // completion: a sparkle burst
        boilSeed('tada');
        glow(gx, gy - 5 * u, 9 * u, GOLDL, .8 * (1 - age / .36));
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + .3, r = (6 + 4 * easeOut(age / .36)) * u, s = u * 1.1 * Math.sin(Math.PI * age / .36);
          paint(starPts(gx + Math.cos(a) * r * 1.05, gy - 5 * u + Math.sin(a) * r * .8, s), { wash: i % 2 ? GOLDL : PAL.cream, ink: PAL.ink, sw: .6 });
        }
      }
      break;
    }
    flash(1 - easeOut(lt / .25), '#FFF3D0');                                    // out of the white-hot film burn
    flash(easeIn(seg(t, WHAT - .3, WHAT)) * .92, GOLDL);                        // the Seam out: everything to gold
  }

  // ======================================================================================================================
  // E · "What did Ilya see? We'll never know." · The gold clears onto a door standing in the void, golden light
  // leaking from its crack. The Researcher and Clawd tiptoe up and peek in; on "Ilya" the light floods their faces and
  // their eyes swirl. On "see?" (the bar) the door SLAMs, blowing them back onto the floor; two chains snap across it and
  // a padlock pops on with each beat of "we'll never know". The void dims around the one light left. Push in, then a
  // snap back and a shake on the SLAM. Seam in: out of D's gold, the pull-back lands. Seam out: the lights die.
  // ======================================================================================================================
  const DX = 960, DY = 860, CRX = DX - 140;                       // the door, and its crack's x (left edge of the slab)
  function lockedAt(t) {                                          // the door's `locked` value: chains on SLAM, a lock per beat
    return kf(t, [[SLAM, 0], [SLAM + .12, .36], [LOCKT[0] - .02, .4], [LOCKT[0] + .08, .5], [LOCKT[1] - .02, .65], [LOCKT[1] + .08, .75], [LOCKT[2] - .02, .9], [LOCKT[2] + .08, 1]], x => x);
  }
  function rays(t, cw, lit, over) {                                              // light pouring out of the crack
    if (lit <= 0) return;
    boilSeed('rays' + over);
    const ox = CRX + cw / 2;
    for (let i = 0; i < 6; i++) {
      const y0 = lerp(DY - 460, DY - 60, i / 5), a = Math.PI + (i - 2.5) * .15 + Math.sin(t * 3 + i) * .03, s = .05 + hash(i) * .04, L = 1100;
      paint([[ox, y0 - 30], [ox, y0 + 30], [ox + Math.cos(a + s) * L, y0 + Math.sin(a + s) * L], [ox + Math.cos(a - s) * L, y0 + Math.sin(a - s) * L]],
        { fill: GOLDL, fillOp: (over ? 34 : 56) * lit, bleed: .1, tex: .2, border: .1, ink: null });
    }
    if (!over) paint([[CRX + cw, DY], [CRX, DY], [CRX - 900, 1300], [CRX - 200, 1300]], { fill: GOLDL, fillOp: 90 * lit, bleed: .1, tex: .3, border: .2, ink: null });
  }
  function voidRoom(t) {
    boilSeed('void');
    cover(VOID);
    bloom(960, 520, 900, 520, '#2E1A30', 120);
    paint(rectPts(-600, DY, W + 1200, 900), { wash: VFLOOR, washOp: 255, ink: null });
    paint(ellPts(DX, DY + 6, 230, 22, 20), { wash: PAL.ink, washOp: 120, ink: null });   // the door's shadow
  }
  function spotCone(op) {                                                         // the lone spotlight (see the SEAM OUT block)
    boilSeed('spot cone');
    paint(coneHole(), { wash: '#3A2C30', washOp: 255 * op, ink: null });
    paint(ellPts(960, 880, 500, 90, 30), { wash: '#B98F6A', washOp: 255 * op, fill: '#E8C38E', fillOp: 120 * op, bleed: .1, tex: .4, border: .3, ink: null });
  }
  const RXE = 610, KXE = 700, RSIT = 470, KSIT = 560;            // peeking spots, and where the SLAM throws them
  function ilya(t, lt, dur) {
    const pre = t < SLAM, ta = t - SLAM;
    const peek = ease(seg(t, DID - .1, DID + .3)), awe = ease(seg(t, ILYA - .1, ILYA + .2));
    const cw = pre ? lerp(14, 30, peek) / 30 : 0, lit = pre ? 1 + .4 * awe : 0;   // cw in CAST.door's lit units
    let z, cx, cy;
    const landK = easeOut(seg(t, WHAT, WHAT + .55));
    if (pre) {
      const k = ease(seg(t, DID - .2, SLAM - .05));
      z = lerp(lerp(1.4, 1.0, landK), 1.4, k); cx = lerp(DX - 60, 800, k); cy = lerp(600 - 60 / z, 580, k);
    } else {
      const k = backOut(seg(t, SLAM, SLAM + .24));
      z = lerp(1.4, .97, k) + .015 * ease(seg(t, SLAM + .4, DIE)); cx = lerp(800, 960, k); cy = lerp(580, 600 - 60 / z, k);
    }
    const lockHit = LOCKT.reduce((s, l) => s + (t >= l ? 12 * Math.exp(-(t - l) * 12) : 0), 0);
    const [sx, sy] = shakeXY(t, pre ? 0 : 30 * Math.exp(-ta * 5) + lockHit);
    camBegin(cx + sx, cy + sy, z, pre ? 0 : .04 * Math.exp(-ta * 6) * Math.sin(ta * 40));
    voidRoom(t);
    const dim = pre ? 0 : ease(seg(ta, .1, .5));
    if (!pre) spotCone(dim);
    rays(t, cw * 30, lit, false);
    push();
    if (!pre) { translate(DX + 170, DY); rotate(.014 * Math.exp(-ta * 6) * Math.sin(ta * 50)); translate(-DX - 170, -DY); }
    CAST.door(DX, DY, 1, t, { lit: pre ? cw : 0, locked: pre ? 0 : lockedAt(t) });
    pop();
    // the two tiptoe in, peek, and get blasted back by the slam
    const walkK = seg(t, WHAT + .05, DID + .05), tip = walkK < 1 ? Math.abs(Math.sin(walkK * 6 * Math.PI)) : 0;
    const blown = pre ? 0 : easeOut(seg(t, SLAM, SLAM + .32)), landed = !pre && ta > .32;
    const rx = pre ? lerp(250, RXE, ease(walkK)) : lerp(RXE, RSIT, blown), kx = pre ? lerp(330, KXE, ease(walkK)) : lerp(KXE, KSIT, blown);
    const cm = clawd.emotions(t, [[WHAT, 'nervous', { lookX: 1, emote: null }], [ILYA, 'starstruck', { eyes: 'swirl', mouth: 'O', emote: null }], [SLAM, 'scared', { emote: '!!' }]]);
    const rm = researcher.emotions(t, [[WHAT, 'nervous', { emote: null }], [ILYA, 'charmed', { eyes: 'swirl', mouth: 'O', emote: null }], [SLAM, 'scared']]);
    if (!landed) {
      researcher(rx, DY, 24, { ...rm, lookX: 1, walk: walkK > 0 && walkK < 1 ? walkK * 3.5 : null, dy: (rm.dy || 0) - tip * .4 - (pre ? 0 : Math.sin(blown * Math.PI) * 3), rot: pre ? .3 * peek : -.5 * blown,
        aL: pre ? .5 : 1.4, aR: pre ? .4 - .6 * peek : 1.2, hairUp: pre ? .2 * awe : 1, glassesTilt: pre ? 0 : .3, boilKey: 'researcher' });
      clawd(kx, DY, 26, { ...cm, lookX: pre ? 1 : cm.lookX, walk: walkK > 0 && walkK < 1 ? walkK * 3.5 : null, view: pre ? 'q' : 'front', dy: (cm.dy || 0) * .5 - tip * .7 - (pre ? 0 : Math.sin(blown * Math.PI) * 2.5), rot: pre ? .18 * peek : -.45 * blown,
        dx: 0, aL: pre ? .6 : 1.4, aR: pre ? .6 + .5 * peek : 1.3, boilKey: 'clawd' });
    } else {
      const bump = Math.exp(-(ta - .32) * 9), flinch = LOCKT.reduce((s, l) => s + (t >= l ? Math.exp(-(t - l) * 10) : 0), 0);
      researcher(RSIT, DY, 24, { ...rm, sit: true, dy: 1.1, hairUp: .4 + .6 * bump, glassesTilt: .3, mouth: 'O', sq: .2 * bump + .12 * flinch, aL: -.6 + .8 * flinch, aR: -.6 + .8 * flinch, lookX: 1, boilKey: 'researcher' });
      clawd(KSIT, DY, 26, { ...cm, noLegs: true, dy: 2, dx: 0, mouth: 'wobble', sq: .25 * bump + .15 * flinch, rot: 0, aL: .1 + .9 * flinch, aR: .1 + .9 * flinch, lookX: .6, boilKey: 'clawd' });
    }
    rays(t, cw * 30, lit, true);                                                   // the light falls on their faces
    if (!pre) {
      boilSeed('slam fx');
      if (ta < .3) for (let i = 0; i < 16; i++) {                                  // shockwave
        const a = i / 16 * TAU, r0 = 300 + ta * 700, r1 = r0 + 140 * (1 - ta / .3);
        inkLine([[DX + Math.cos(a) * r0, DY - 260 + Math.sin(a) * r0 * .9], [DX + Math.cos(a) * r1, DY - 260 + Math.sin(a) * r1 * .9]], 1.4, PAL.cream, 'ink', 0);
      }
      if (ta < .8) for (let i = 0; i < 5; i++) {                                   // dust from under the door
        const d = easeOut(ta / .8), px = lerp(DX - 120, DX + 120, i / 4) + (i - 2) * 80 * d;
        bloom(px, DY - 20 - 40 * d * hash(i), 50 + 60 * d, 34 + 30 * d, '#9A8A90', 150 * (1 - ta / .8));
      }
      darkAround(coneHole(), DARK, 150 * dim);                                      // the void dims around the one light
      sfx('SLAM', 1240, 210, 210, RED, ta, { life: 1.3, rot: -.07, screen: true });   // a Sound Word
    }
    camEnd();
    flash(.92 * (1 - easeOut(seg(lt, 0, .35))), GOLDL);                          // the Seam in: out of D's gold
  }

  // ======================================================================================================================
  // F · Interlude · The lights die except one spotlight on the locked door (it stutters once). In the dark at the
  // edge of its pool the two get up; the Researcher steps into the light on the left, Clawd crosses in front of the door
  // to the right, turns, and they look at each other. Then everything holds, breathing, for Chapter 9. Slow push in,
  // then the pull back begins. Seam in: the dim void snaps to black. Seam out: see the SEAM OUT block at the top.
  // ======================================================================================================================
  function darkness(t, lt, dur) {
    const z = t < END - .6 ? lerp(.985, 1, ease(seg(t, DIE, MARKS))) : 1 - .06 * Math.pow(seg(t, END - .6, END), 2);
    const clunk = Math.exp(-lt * 9);
    const [sx, sy] = shakeXY(t, 4 * clunk);
    seamCam(z, sx, sy);
    voidRoom(t);
    spotCone(1);
    CAST.door(DX, DY, 1, t, { lit: 0, locked: 1, flat: 0 });
    // the Researcher: up on the beat, steps right into the light, then turns its eyes to Clawd
    const rUp = seg(t, RISE, RISE + .2);
    const rs = stroll(t, RISE + .22, MARKS - .12, RSIT, 700, 24);
    const rm = researcher.emotions(t, [[DIE, 'scared', { emote: null }], [RISE + .2, 'nervous', { emote: null }], [LOOK, 'neutral', { eyes: 'dot', mouth: 'flat' }]]);
    const rLook = t < LOOK ? lerp(-.6, .4, ease(seg(t, RISE, MARKS))) : 1;
    if (t < RISE) researcher(RSIT, DY, 24, { ...rm, sit: true, dy: 1.1, glassesTilt: .3 * (1 - seg(t, DIE, RISE)), lookX: .6, aL: -.6, aR: -.6, boilKey: 'researcher' });
    else researcher(rs.x, DY, 24, { ...rm, walk: rs.moving ? rs.walk : null, dy: (rm.dy || 0) + rs.dy - Math.sin(rUp * Math.PI) * 1.2, lookX: rLook, aL: t < LOOK ? rm.aL : -1.25, aR: t < LOOK ? rm.aR : -1.25, boilKey: 'researcher' });
    // Clawd: up a moment later, crosses in front of the door, turns to face the Researcher on the beat
    const kUp = seg(t, RISE + .12, RISE + .32);
    const ks = clawd.stroll(t, RISE + .3, MARKS, KSIT, 1255, 26);
    const km = clawd.emotions(t, [[DIE, 'scared', { emote: null }], [RISE + .3, 'nervous', { emote: null }], [LOOK, 'neutral', { mouth: 'flat' }]]);
    const turnK = clawd.turn(t, MARKS, LOOK + .15, .125, -.125);
    if (t < RISE + .12) clawd(KSIT, DY, 26, { ...km, noLegs: true, dy: 2, dx: 0, rot: 0, lookX: .3, aL: .1, aR: .1, boilKey: 'clawd' });
    else if (t < MARKS) clawd(ks.x, DY, 26, { ...km, ...ks, dy: (km.dy || 0) * .4 + ks.dy - Math.sin(kUp * Math.PI) * 1.6, dx: 0, rot: 0, lookX: .4, boilKey: 'clawd' });
    else clawd(1255, DY, 26, { ...km, ...turnK, dx: 0, rot: 0, lookX: .5, boilKey: 'clawd' });
    // everything outside the cone goes black; the spotlight stutters once as the lights die
    const stutter = lt > .16 && lt < .23;
    darkAround(coneHole(), DARK, lerp(150, 250, seg(lt, 0, .1)));
    if (stutter) cover(DARK, 235);
    else { glow(960, 300, 520, SPOT, .35); glow(960, 870, 420, SPOT, .45); }
    camEnd();
  }

  chapter('chorus4', CHO.start, INT.end, [[UP, redAlert], [LOOM, loom], [MASKED, flashback], [RECUR, recursion], [WHAT, ilya], [DIE, darkness]]);
})();
