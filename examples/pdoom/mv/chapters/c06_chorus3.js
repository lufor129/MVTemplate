// c06_chorus3: Chorus 3 + Interlude, "paperclips". The Researcher falls out of Chapter 5's glowing chasm into a heap of
// paperclips on the chorus stage: the pump is now a paperclip machine, worked by a Clawd too big for the stage, and the
// meter climbs from 61. The clips flood the theatre and Clawd surfs the wave until it breaks over the lens; nobody is at
// the killswitch (an empty chair, a jacket still swinging) because the killswitch guys are on a beach, which turns out
// to be the last island on a planet made of paperclips. Planet-sized Clawd strikes a match, the fuse races round the
// globe to a cartoon bomb, and the wordless white flash clears as smoke into a jazz club: orthogonality thesis blues.
// Ported from PDoomVideo/src/ch/c06_chorus3.js and re-timed to the analysed song: every event hangs off a Lyric Line,
// a word in it, or the Beat Grid.
(() => {
  // ---------- palette: steel grey, then jazz blue ----------
  const STL = '#8E99A8', STL_DK = '#5B6579', STL_LT = '#C4CCD7', SILV = '#EEF2F6', CINK = '#343B4A';
  const SEA = '#A9B3C1', SEA_DK = '#6E798C', SEA_LT = '#D6DDE6';
  const VINYL = ['#F29BB0', '#F5CD5F', '#7DCBC3', '#B89CE2'];
  const CREAM_WHITE = '#FFF1C9', BOOM_WHITE = '#FFF9EC';
  const STAGE = { a: '#A6B3C5', b: '#F0C28E', wall: '#ECE6DC' };
  STAGE.backdrop = t => { paint(rectPts(-1600, -400, W + 3200, 1900), { wash: '#2A2438', washOp: 255, ink: null }); paint(rectPts(-400, -400, W + 800, 1240), { wash: STAGE.wall, washOp: 255, ink: null }); sunburst(960, 430, STAGE.a, STAGE.b, t * .12, 16, 1500); };
  const sq2 = x => x * x;
  const boilN = t => Math.floor(t * BOIL);

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                 // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);  // n beats after the beat nearest t
  const CHO = sec('Chorus 3'), INTER = SECTIONS.find(s => s.kind === 'interlude' && s.start >= CHO.end - .01);
  // A · "I'm upping my P(doom),"
  const UP = CHO.start, LAND = nearestBeat(word(28, 1));         // "upping": the Researcher lands in the clips
  const BONK = beatsAfter(LAND, 2);                               // a clip lands on their head (the bar)
  // B · "as paperclips fill the room."
  const FLOOD = LINES[29].start, BOARD = nearestBeat(word(29, 1)); // "paperclips": the swell lifts Clawd onto a board
  const FULL = nearestBar(word(29, 4));                           // "room" (a bar): the room is full, the wave rears
  // C · "Killswitch guys on PTO,"
  const KILL = LINES[30].start, CRASH = KILL - .3;                // the wave breaks over the lens into the office
  const BEACH = nearestBar(word(30, 3));                          // "PTO" (a bar): cut to the beach
  // D · "Now there's nowhere left to go."
  const NOWHERE = LINES[31].start, OUT_END = word(31, 5);         // zoom out from the beach until "go"
  // E · "Too late now, we lit the fuse."
  const FUSE_T = LINES[32].start, STRIKE = nearestBeat(word(32, 1)); // "late": the match strikes
  const LIGHT = nearestBeat(word(32, 5));                         // "lit": it touches the fuse
  const BOOM = barAt(barN(LIGHT) + 2), ARRIVE = beatsAfter(BOOM, -2); // the spark reaches the bomb; it goes off on the bar
  // F · "Orthogonality thesis blues." + Interlude
  const BLUES = LINES[33].start, LOCK = nearestBeat(word(33, 1)); // "thesis": the spotlights lock at 90°
  const SOLO = nearestBar(INTER.start), END = INTER.end;          // the interlude: Clawd leans back into a solo

  // ======================================================================================
  // paths and geometry
  // ======================================================================================
  function densify(ctrl, per = 8) {
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const s = k / per, s2 = s * s, s3 = s2 * s;
        out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3)));
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }
  function cumLen(p) { const c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return c; }
  function pointAt(p, c, u) {
    const s = clamp(u) * c[c.length - 1]; let i = 1;
    while (i < c.length - 1 && c[i] < s) i++;
    const k = clamp((s - c[i - 1]) / ((c[i] - c[i - 1]) || 1));
    return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k), i];
  }
  function subPath(p, c, u0, u1) {
    const a = pointAt(p, c, u0), b = pointAt(p, c, u1), out = [[a[0], a[1]]];
    for (let i = a[2]; i < b[2]; i++) out.push(p[i]);
    out.push([b[0], b[1]]);
    return out;
  }
  // Sutherland–Hodgman: keeps huge zoomed polygons (the planet at 12×) to a sane size
  function clipPoly(pts, x0 = -300, y0 = -300, x1 = W + 300, y1 = H + 300) {
    const cut = (a, b, ax, v) => { const k = (v - a[ax]) / (b[ax] - a[ax]); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; };
    const planes = [[p => p[0] >= x0, 0, x0], [p => p[0] <= x1, 0, x1], [p => p[1] >= y0, 1, y0], [p => p[1] <= y1, 1, y1]];
    let out = pts;
    for (const [inside, ax, v] of planes) {
      const inp = out; out = [];
      for (let i = 0; i < inp.length; i++) {
        const a = inp[i], b = inp[(i + 1) % inp.length];
        if (inside(b)) { if (!inside(a)) out.push(cut(a, b, ax, v)); out.push(b); }
        else if (inside(a)) out.push(cut(a, b, ax, v));
      }
      if (out.length < 3) return [];
    }
    return out;
  }
  const paintC = (pts, o) => { if (pts.length >= 3) paint(pts, o); };

  // ======================================================================================
  // paperclips
  // ======================================================================================
  const CLIP = (() => {
    const p = [[.07, .30], [.07, .72]];
    const bend = (cx, cy, r, a0, a1, n = 7) => { for (let i = 1; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    bend(-.03, .72, .10, 0, Math.PI); p.push([-.13, .14]);
    bend(.02, .14, .15, Math.PI, TAU); p.push([.17, .84]);
    bend(0, .84, .17, 0, Math.PI); p.push([-.17, .42]);
    return p.map(([x, y]) => [x, y - .5]);
  })();
  // one paperclip, L long: dark wire with a silver (or vinyl-coloured) core
  function clip(x, y, L, rot, sw = 1, o = {}) {
    push(); translate(x, y); rotate(rot);
    const pts = CLIP.map(([px, py]) => [px * L, py * L]);
    inkLine(pts, sw, o.ink || CINK, 'ink', .3);
    if (L > 20) inkLine(pts, sw * (o.col ? .6 : .42), o.col || SILV, 'inkfine', .3);
    pop();
  }
  const vinyl = (i, p = .2) => hash(i * 7.7 + 1.3) < p ? VINYL[Math.floor(hash(i * 3.1) * 4)] : null;

  // a sea of clips: a watercolour mass under a wavy surface fy(x)
  function seaLayer(fy, col, dk, o = {}) {
    const x0 = o.x0 ?? -300, x1 = o.x1 ?? W + 300, pts = [];
    for (let x = x0; x <= x1;) { pts.push([x, fy(x)]); x += o.step || 80; }
    pts.push([x1, o.bottom ?? 1150], [x0, o.bottom ?? 1150]);
    paint(pts, { wash: col, fill: dk, fillOp: o.op ?? 110, bleed: .05, tex: .8, border: .5, ink: CINK, sw: o.sw ?? 1.2 });
  }
  function surfClips(fy, t, n, x0, x1, seed, L = 46, depth = 40) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + .5 + (hash(seed + i) - .5) * .7) / n), y = fy(x) + 8 + hash(seed + i * 2.3) * depth;
      clip(x, y, L * (.8 + .4 * hash(seed + i * 3.9)), hash(seed + i * 5.3) * TAU + Math.sin(t * 2.2 + i) * .35, .95, { col: vinyl(seed + i) });
    }
  }
  // a heap of clips on the floor: { cx, base, w, h, n }
  const heapTop = (x, H0) => { const f = clamp((x - (H0.cx - H0.w / 2)) / H0.w); return H0.base - H0.h * Math.pow(Math.sin(Math.PI * f), .8); };
  function heap(H0, key) {
    boilSeed('heap ' + key);
    const top = [];
    for (let i = 0; i <= 14; i++) { const x = H0.cx - H0.w / 2 + H0.w * i / 14; top.push([x, heapTop(x, H0) + (i % 14 ? (hash(i * 3.7 + H0.cx) - .5) * 16 : 0)]); }
    paint([...top, [H0.cx + H0.w / 2 + 20, H0.base + 16], [H0.cx - H0.w / 2 - 20, H0.base + 16]], { wash: SEA, fill: SEA_DK, fillOp: 120, bleed: .06, tex: .8, border: .6, ink: CINK, sw: 1.1, curv: .4 });
    paint(ellPts(H0.cx - H0.w * .12, H0.base - H0.h * .62, H0.w * .2, H0.h * .2, 16), { fill: SILV, fillOp: 120, bleed: .25, tex: .5, ink: null });
    for (let i = 0; i < H0.n; i++) {
      const x = H0.cx - H0.w / 2 + H0.w * (.08 + .84 * hash(H0.cx + i * 1.3)), tp = heapTop(x, H0);
      const y = lerp(tp + 14, H0.base - 8, Math.pow(hash(H0.cx + i * 2.9), 1.4) * .85);
      clip(x, y, 42 + hash(i * 1.1 + H0.cx) * 24, hash(i * 5.1 + H0.cx) * TAU, .9, { col: vinyl(i + H0.cx) });
    }
  }

  // ======================================================================================
  // the paperclip machine: the bicycle pump, promoted. Base on the floor at (x, y), s = 1 is ~300px tall; h = plunger
  // height (pumpH). Its chute faces screen-right. Returns the chute's mouth (world).
  // ======================================================================================
  function machine(x, y, s, h, t, v) {
    boilSeed('clip machine');
    const p = pulse(t, 7), sw = 1.1;
    push(); translate(x, y); scale(-s * (1 + p * .06), s * (1 - p * .07));
    paint(rectPts(-128, -26, 256, 26, 2), { wash: '#4A5366', fill: CINK, fillOp: 60, tex: .5, ink: CINK, sw });
    paint([[-70, -205], [-168, -262], [-212, -222], [-104, -150]], { wash: STL_LT, fill: STL, fillOp: 90, tex: .6, ink: CINK, sw });
    paint(ellPts(-190, -242, 22, 32, 16, 0, .75), { wash: '#262B3A', ink: CINK, sw: sw * .8 });
    const rod = 90 * h;
    paint(rectPts(-10, -268 - rod, 20, rod + 30), { wash: '#CBD1D9', ink: CINK, sw: sw * .7 });
    paint(rrPts(-80, -294 - rod, 160, 30, 14), { wash: '#2E3345', ink: CINK, sw: sw * .7 });
    for (const gx of [-80, 46]) paint(rrPts(gx, -292 - rod, 34, 26, 11), { wash: '#D8394E', ink: null });
    paint(rrPts(-108, -262, 216, 240, 36, 2), { wash: STL, fill: STL_DK, fillOp: 100, bleed: .05, tex: .75, border: .6, ink: CINK, sw: sw * 1.3 });
    paint(ellPts(-50, -222, 46, 22, 14, 0, -.2), { fill: SILV, fillOp: 150, bleed: .2, ink: null });
    paint(rectPts(-108, -168, 216, 22), { wash: STL_DK, ink: CINK, sw: sw * .7 });
    for (let i = 0; i < 6; i++) paint(ellPts(-88 + i * 35, -157, 4.5, 4.5, 8), { wash: SILV, ink: null });
    paint(rrPts(-90, -130, 96, 94, 14), { wash: '#3F475A', ink: CINK, sw: sw * .7 });
    clip(-42, -83, 68, .55 + p * .25, 1.1);
    // the gauge, needle shivering into the red zone
    const gx = 56, gy = -84;
    paint(ellPts(gx, gy, 32, 32, 20), { wash: PAL.cream, ink: CINK, sw });
    const zone = [[gx, gy]]; for (let i = 0; i <= 6; i++) { const a = lerp(-1.0, -.15, i / 6); zone.push([gx + Math.cos(a) * 29, gy + Math.sin(a) * 29]); }
    paint(zone, { wash: '#E0485A', washOp: 210, ink: null });
    const na = lerp(-2.7, -.2, clamp(v / 100)) + p * .3 * Math.sin(t * 70);
    inkLine([[gx, gy], [gx + Math.cos(na) * 26, gy + Math.sin(na) * 26]], 1.1, '#B52438', 'ink', 0);
    pop();
    // a puff of steam after each stroke
    boilSeed('machine steam');
    const age = frac(bpOf(t)) * BEAT;
    paint(ellPts(x - 70 * s - age * 30, y - 270 * s - age * 150, 12 + age * 50, 10 + age * 38, 14), { fill: PAL.cream, fillOp: 150 * (1 - age / BEAT), bleed: .3, ink: null });
    return [x + 190 * s, y - 242 * s];
  }
  // clips the machine spits on every beat (two per beat): an arc from the chute to land(i) = [x, y, rot], where they stay
  function spitClips(t, chute, land, b0, b1, tEnd = Infinity) {
    for (let b = b0; b <= b1; b++) for (let j = 0; j < 2; j++) {
      const t0 = beatAt(b) + j * .09, age = t - t0, fl = .45 + j * .1; if (age < 0 || t0 > tEnd) continue;
      boilSeed('spit ' + b + j);
      const [lx, ly, lr] = land(b * 2 + j), k = Math.min(1, age / fl);
      clip(lerp(chute[0], lx, k), lerp(chute[1], ly, k) - Math.sin(Math.PI * k) * (170 + 70 * j), 54, lr + (1 - k) * 9, 1, { col: vinyl(b * 2 + j, .35) });
    }
  }

  // ======================================================================================
  // the stage, Chorus 3's version: the sunburst in steel and peach, the fly space above, and the proscenium pushed out
  // wide because Clawd no longer fits
  // ======================================================================================
  function flySpace() {
    boilSeed('fly space');
    paint(rectPts(-1600, -2000, W + 3200, 1990), { wash: '#23273C', fill: '#3B416A', fillOp: 90, bleed: .05, tex: .7, border: .3, ink: null });
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 290 + hash(i) * 70, yb = -380 - hash(i + 3) * 1100;
      inkLine([[x, -2000], [x + 3, yb]], .8, '#9C8D76', 'inkfine', 0);
      paint(rrPts(x - 22, yb, 44, 58, 14), { wash: '#8E7657', fill: '#5E4A36', fillOp: 80, tex: .6, ink: PAL.ink, sw: .8 });
    }
    for (const by of [-1500, -900, -330]) {
      paint(rectPts(-400, by, W + 800, 14), { wash: '#15182A', ink: null });
      for (let i = 0; i < 6; i++) {
        const lx = 200 + i * 300 + (by % 7) * 12;
        paint(ellPts(lx, by + 110, 70, 50, 16), { fill: '#F4D58A', fillOp: 70, bleed: .3, ink: null });
        paint([[lx - 24, by + 10], [lx + 24, by + 10], [lx + 32, by + 64], [lx - 32, by + 64]], { wash: '#2B2F45', ink: PAL.ink, sw: .7 });
      }
    }
  }
  function bigFront(t, k = 1.45) { push(); translate(960, 0); scale(k); translate(-960, 0); stageFront(t, {}); pop(); }

  // the layout of the stage in Shots A and B (world)
  const CX = 580, GY = 935, U = 105, MCX = CX + 7.05 * U, MS = 1.3;     // giant Clawd and its machine
  const MTX = 300, MTY = 985, MTS = .85;                                 // the meter, downstage left
  const HEAP = { cx: 1650, base: 975, w: 420, h: 150, n: 18 }, HEAP_F = { cx: 1660, base: 995, w: 300, h: 100, n: 8 };
  const RX = 1650, RGY = heapTop(RX, HEAP) + 46, RS = 20;                // the Researcher, sunk in the heap
  const heapLand = i => { const x = lerp(1480, 1820, hash(i * 7.3)); return [x, heapTop(x, HEAP) + 10 + hash(i * 2.1) * 18, hash(i * 4.4) * TAU]; };
  const hairClip = s2 => clip(1.5 * s2, -13.3 * s2, 2.6 * s2, .8, .75);
  const B_SPIT0 = beatN(UP) + 1;

  // giant Clawd pumping the machine with its right hand; the plunger lands on each beat. Returns the chute.
  function pumper(t, md, h) {
    const dy = -h * .22, sq = (1 - h) * .06;
    const handleY = GY - (279 + 90 * h) * MS, pivY = GY + dy * U - 4.5 * U * (1 - sq);
    const aR = Math.asin(clamp((pivY - handleY) / (2.2 * U), -1, 1));
    clawd(CX, GY, U, { ...md, dx: 0, dy: (md.dy || 0) * .2 + dy, sq: (md.sq || 0) * .3 + sq, aR, rot: 0, blush: 1, boilKey: 'clawd' });
    return machine(MCX, GY, MS, h, t, pdoomAt(t));
  }
  function meterHose(t) {
    boilSeed('meter hose');
    inkLine([[MCX - 120, GY - 10], [1000, 1010], [600, 1030], [MTX - 52 * MTS, MTY - 80 * MTS]], 2.6, PAL.ink, 'ink', .7);
  }

  // ======================================================================================
  // A · "I'm upping my P(doom)," · Out of Chapter 5's cream-white glow, the Researcher drops from the fly space and
  // lands in a heap of paperclips on the beat. Pull back: Clawd, bigger than ever, works a paperclip machine that spits
  // clips onto the heap on every stroke, and the meter climbs from 61. Seam in: the cream-white fades off. Seam out:
  // the same camera carries on into the flood.
  // reads: 94.76–95.68 someone falling (eye on the figure) · 95.68–96.1 lands in clips · 96.1–96.85 giant Clawd pumping,
  //        clips raining, the meter rising
  // ======================================================================================
  function fallPose(t) {
    const k = seg(t, UP - .1, LAND), y = lerp(-650, RGY, k * k), th = TAU * 1.4 * (1 - easeOut(k));
    return { k, y, th, cy: y - 6.6 * RS };
  }
  function upping(t, lt, dur) {
    const a = t - LAND, landed = a >= 0, f = fallPose(t);
    // camera: up in the fly space with the falling Researcher, down with them, then back to reveal the stage
    const follow = [lerp(1400, 1480, f.k), Math.min(640, Math.max(-250, f.cy + 100)), 1.2];
    const wide = ease(seg(t, LAND + .15, LAND + .95)), WIDE = [960, 520, .93];
    const cam = landed ? [lerp(1480, WIDE[0], wide), lerp(640, WIDE[1], wide), lerp(1.2, WIDE[2], wide) - .012 * seg(t, LAND + .95, FLOOD)] : follow;
    const [sx, sy] = shakeXY(t, landed ? 16 * Math.exp(-a * 6) : 0);
    camBegin(cam[0] + sx, cam[1] + sy, cam[2] + .01 * pulse(t, 6) * wide, 0);
    stageBack(t, STAGE);
    flySpace();
    const md = clawd.emotions(t, [[UP, 'excited'], [LAND + .06, 'surprised', { lookX: .9, lookY: .3 }], [beatsAfter(LAND, 1) + .1, 'mischief', { lookX: .8, lookY: .2 }]]);
    const chute = pumper(t, md, pumpH(t));
    meterHose(t);
    meterProp(MTX, MTY, MTS, pdoomAt(t), { glow: .6 * pulse(t, 5) });
    heap(HEAP, 'back');
    spitClips(t, chute, heapLand, B_SPIT0, beatN(FLOOD) + 1);
    // the Researcher: tumbling down out of the glow, then a splash-landing on the beat
    if (!landed) {
      boilSeed('fall streaks');
      for (let i = 0; i < 5; i++) { const lx = RX + (i - 2) * 46 + jit(4), l0 = f.cy - 170 - hash(i) * 80; inkLine([[lx, l0], [lx, l0 - 160 - hash(i + 5) * 140]], .8, '#9AA3C6', 'inkfine', 0); }
      researcher(RX - Math.sin(f.th) * 6.6 * RS, f.cy + Math.cos(f.th) * 6.6 * RS, RS, { rot: f.th, aL: 1.3 + .4 * wob(t, 4), aR: 1.1 + .4 * wob(t, 4, .3), eyes: 'wide', brows: 'worried', mouth: 'O', hairUp: 1, run: t * 4, noShadow: true, boilKey: 'researcher' });
    } else {
      const rm = researcher.emotions(t, [[LAND, 'ko'], [BONK, 'nervous', { lookY: -.6, lookX: -.4 }]]);
      const land = .4 * Math.exp(-a * 7) * Math.cos(a * 24), bt = take(t, BONK, .8);
      researcher(RX, RGY, RS, { ...rm, sq: (rm.sq || 0) + land + bt.sq, dy: (rm.dy || 0) * .5 + bt.dy, hairUp: Math.max(rm.hairUp || 0, 1 - a * 1.2), noShadow: true, boilKey: 'researcher',
        draw: t > BONK ? hairClip : null });
      // the bonk: one clip drops onto their head on the bar
      if (t > BONK - .4 && t < BONK) { boilSeed('bonk clip'); const k = seg(t, BONK - .4, BONK); clip(lerp(RX + 140, RX + 30, k), lerp(RGY - 500, RGY - 13.3 * RS, easeIn(k)), 52, k * 8, 1); }
    }
    heap(HEAP_F, 'front');
    // the landing splash of clips
    if (landed && a < .8) for (let i = 0; i < 9; i++) {
      boilSeed('splash ' + i);
      const ang = -Math.PI / 2 + (i - 4) * .36, vv = 620 + hash(i * 4.4) * 320, x = RX + Math.cos(ang) * vv * a, y = RGY - 60 + Math.sin(ang) * vv * a + 1700 * a * a;
      if (y < RGY + 60) clip(x, y, 46, i + a * 14, .9, { col: vinyl(i + 40, .3) });
    }
    bigFront(t);
    camEnd();
    flash(1 - ease(seg(lt, 0, .35)), CREAM_WHITE);       // the Seam in: Chapter 5's glow fades off
  }

  // ======================================================================================
  // B · "as paperclips fill the room." · The clips rise like a flood. On "paperclips" the swell lifts Clawd onto a
  // surfboard and it rides the wave across the theatre, grinning, while the Researcher and the troupe bob in the clips
  // and the meter floats. On "room" the room is full; the wave rears up and breaks over the lens.
  // reads: 96.85–97.3 the clips are rising · 97.3–98.4 Clawd surfing a wave of clips · 98.4–98.85 the wave rears and
  //        breaks over us
  // ======================================================================================
  function surfboard(x, y, rot, L, h) {
    boilSeed('surfboard');
    push(); translate(x, y); rotate(rot);
    paint([[L / 2, -h * .1], [L * .3, -h], [-L * .28, -h], [-L / 2, -h * .45], [-L / 2, h * .35], [-L * .28, h * .7], [L * .3, h * .6]], { wash: '#F5CD5F', fill: '#E39A36', fillOp: 70, tex: .5, ink: PAL.ink, sw: 1.6, curv: .5 });
    inkLine([[L * .42, -h * .2], [-L * .47, -h * .1]], 2, '#E0474C', 'ink', .3);
    pop();
  }
  function waveSea(t) {
    const lvl = kf(t, [[FLOOD, 1080], [BOARD, 880], [FULL, 430], [KILL, 380]], ease);
    const HH = 480 * ease(seg(t, BOARD - .25, BOARD + .35)) + 700 * easeIn(seg(t, FULL - .2, KILL));
    const xw = lerp(CX + 420, 1800, ease(seg(t, BOARD - .1, KILL - .1)));
    const bump = d => d < 0 ? Math.exp(-sq2(d / 600)) : Math.exp(-sq2(d / 280));
    const rip = (x, ph = 0) => 13 * Math.sin(x * .011 - t * 5 + ph) + 7 * Math.sin(x * .027 + t * 3.1 + ph);
    return {
      lvl, HH, xw,
      front: x => lvl + 34 + rip(x) - HH * bump(x - xw),
      back: x => lvl - 40 + rip(x, 1.3) - .35 * HH * bump(x + 400 - xw),
      near: x => lvl + 70 + rip(x, 2.6) * 1.3,
    };
  }
  const TROUPE = [[200, 0], [470, 1], [2350, 2]];
  function flood(t, lt, dur) {
    const S = waveSea(t), { front, back, near, xw, HH } = S;
    // Clawd: lifted onto the board by the swell, then riding high on the wave, just behind its breaking crest
    const ride = ease(seg(t, BOARD - .2, BOARD + .25)), cxp = lerp(CX, xw - 420, ride);
    const by = lerp(GY, front(cxp) - 8, ride), slope = Math.atan2(front(cxp + 90) - front(cxp - 90), 180), brot = clamp(slope * .6, -.14, .14) * ride;
    // camera: from Shot A's wide, riding up with the wave and Clawd
    const rk = ease(seg(t, BOARD - .1, BOARD + .5));
    const cam = [lerp(960, Math.min(1400, cxp + 220), rk), lerp(520, by - 400, rk), lerp(.93, .74, rk), .02 * Math.sin(t * 2.6) * rk];
    camBegin(cam[0], cam[1], cam[2], cam[3]);
    stageBack(t, STAGE);
    flySpace();
    const h = pumpH(t), chute = machine(MCX, GY, MS, h, t, pdoomAt(t));   // nobody pumps it now: it pumps itself
    if (S.lvl > 820) { heap(HEAP, 'back'); spitClips(t, chute, heapLand, beatN(FLOOD) - 1, beatN(FLOOD) + 2, BOARD); }
    // the meter floats up as the clips lift it (its lettering goes under the sea)
    const mBase = Math.min(MTY, front(MTX) + 40 + 10 * Math.sin(t * 4));
    meterProp(MTX, mBase, MTS, pdoomAt(t), { glow: .6 * pulse(t, 5) });
    bigFront(t);
    camEnd(); flushLetters(); camBegin(cam[0], cam[1], cam[2], cam[3]);
    // the back swell
    boilSeed('back sea');
    seaLayer(back, SEA_DK, '#4F5A6E', { sw: 1, x0: -700, x1: 2700, bottom: 2200, step: 100 });
    boilSeed('back clips'); surfClips(back, t, 18, -600, 2600, 11, 44, 30);
    // the troupe pops up in the clips, bobbing
    TROUPE.forEach(([x, i]) => {
      const up = backOut(seg(t, BOARD + .2 + i * .2, BOARD + .55 + i * .2)); if (up <= 0) return;
      const u = 22, m = clawd.dance('bounce', t - i * .07, i);
      miniClawd(x, back(x) + 3 * u + (1 - up) * 9 * u + m.dy * u * .5, u, { ...m, dy: 0, eyes: 'happy', mouth: 'grin', hat: 'party', noShadow: true, rot: Math.sin(t * 3 + i) * .12, key: 'troupe' + i });
    });
    // the main sea, with the wave in it
    boilSeed('front sea');
    seaLayer(front, SEA, SEA_DK, { x0: -700, x1: 2700, bottom: 2200, step: 50 });
    boilSeed('front clips'); surfClips(front, t, 26, -600, 2600, 23, 52, 70);
    // the board and Clawd on it
    const bIn = backOut(seg(t, BOARD - .18, BOARD - .02));
    if (bIn > 0) surfboard(cxp, by + 30, brot, 1300 * bIn, 70);
    const md = clawd.emotions(t, [[FLOOD, 'mischief'], [BOARD, 'starstruck'], [FULL, 'excited']]);
    const ba = .2 * wob(t, 1.4) * ride;
    clawd(cxp + Math.sin(brot) * 30, by - Math.cos(brot) * 10 + 20, U, {
      ...md, view: ride > .5 ? 'q' : 'front', rot: brot + ba * .1, dx: 0, dy: (md.dy || 0) * .25, sq: (md.sq || 0) * .4,
      aL: ride > .1 ? 1.25 + ba : md.aL, aR: ride > .1 ? .35 - ba : md.aR, mouth: 'grin', blush: 1, noShadow: true, boilKey: 'clawd'
    });
    // the wave's lip curls over Clawd's front
    if (HH > 100) {
      boilSeed('wave lip');
      const RL = .7 * HH, c0 = front(xw), L = (dx, dy) => [xw - dx * RL, c0 + dy * RL];
      paint(ellPts(xw + .62 * RL, c0 + .78 * RL, .62 * RL, .5 * RL, 18, 0, -.3), { fill: '#3B4357', fillOp: 170, bleed: .2, tex: .4, border: .3, ink: null });
      const lipPts = [L(.9, .22), L(.35, -.1), L(-.15, -.2), L(-.6, -.12), L(-.95, .12), L(-1.1, .48), L(-1.02, .86), L(-.84, .98), L(-.76, .8), L(-.82, .58), L(-.66, .38), L(-.4, .3), L(-.12, .42), L(.1, .7)];
      paint(lipPts, { wash: SEA_LT, fill: SEA, fillOp: 100, tex: .6, border: .5, ink: null, curv: .5 });
      inkLine(densify([L(.35, -.1), L(-.15, -.2), L(-.6, -.12), L(-.95, .12), L(-1.1, .48), L(-1.02, .86), L(-.84, .98), L(-.76, .8), L(-.82, .58), L(-.66, .38), L(-.4, .3), L(-.12, .42)], 4), 2, CINK, 'ink', .4);
      for (let i = 0; i < 7; i++) { const [fx, fy] = L(.2 - i * .19, -.16 + Math.sin(i * .9) * .05 + (i > 4 ? (i - 4) * .12 : 0)); paint(ellPts(fx, fy, .13 * RL, .09 * RL, 12, 0, .3), { wash: PAL.cream, washOp: 230, ink: null }); }
      for (let i = 0; i < 6; i++) { const [cx2, cy2] = L(-.1 - i * .17, .02 + (i > 3 ? (i - 3) * .2 : 0)); clip(cx2, cy2, 60, i * 1.3 + t * 3, 1.2, { col: vinyl(i + 70, .45) }); }
      for (let i = 0; i < 8; i++) { const ph = frac(t * 2 + i / 8), [sx0, sy0] = L(-.9, 0); clip(sx0 + ph * 260 + i * 8, sy0 - Math.sin(ph * Math.PI) * 180 + ph * 140, 44, i + ph * 8, 1, { col: vinyl(i + 90, .3) }); }
    }
    // the Researcher bobbing in the foreground, flailing, a clip in their hair
    const lift = ease(seg(t, FLOOD, BOARD + .2)), rx = lerp(RX, cxp + 900, ride), ry = Math.min(lerp(RGY, near(rx) + 2 * 24, lift), near(rx) + 2 * 24) + 10 * Math.sin(t * 5) * lift;
    researcher(rx, ry, lerp(RS, 24, lift), { ...researcher.feel('scared', t), rot: Math.sin(t * 3.4) * .14, aL: 1.35 + .35 * wob(t, 2.2), aR: 1.2 + .35 * wob(t, 2.2, .5), lookX: -1, emote: null, noShadow: true, draw: hairClip, boilKey: 'researcher' });
    boilSeed('near sea');
    seaLayer(near, SEA, SEA_DK, { x0: -700, x1: 2700, bottom: 2200, step: 60, op: 130 });
    boilSeed('near clips'); surfClips(near, t, 22, -600, 2600, 37, 60, 90);
    camEnd();
    flushLetters();
    // the Seam out: the wave breaks over the lens
    const k = easeIn(seg(t, CRASH, KILL));
    if (k > 0) crashCover(t, lerp(-260, H + 260, k), -400);
  }
  // a screen-space wall of clips with a foaming edge: covers the frame between y0 (top) and y1 (bottom)
  function crashCover(t, y1, y0, drain) {
    boilSeed('crash');
    const pts = [];
    if (drain) for (let i = 0; i <= 12; i++) pts.push([i * W / 12, y0 + Math.sin(i * 1.3 - t * 7) * 40 + (i % 2 ? -30 : 20)]);
    else pts.push([-100, y0], [W + 100, y0]);
    for (let i = 12; i >= 0; i--) pts.push([i * W / 12, y1 + Math.sin(i * 1.7 + t * 9) * 40 + (i % 2 ? 30 : -20)]);
    paint(pts, { wash: SEA, fill: SEA_DK, fillOp: 120, bleed: .05, tex: .8, border: .5, ink: CINK, sw: 2 });
    for (let i = 0; i < 13; i++) { const fy = drain ? y0 + Math.sin(i * 1.3 - t * 7) * 40 : y1 + Math.sin(i * 1.7 + t * 9) * 40; paint(ellPts(i * W / 12, fy, 90, 46, 12), { wash: PAL.cream, washOp: 220, ink: null }); }
    for (let i = 0; i < 24; i++) {
      const x = hash(i * 3.3) * W, y = lerp(y0, y1, hash(i * 5.1)); if (y < -80 || y > H + 80) continue;
      clip(x, y, 80 + hash(i) * 50, hash(i * 2.2) * TAU + t * 2, 1.6, { col: vinyl(i + 140, .3) });
    }
  }

  // ======================================================================================
  // C1 · "Killswitch guys on PTO," · The wave drains off the lens into a steel-grey office. A big red button on its
  // pedestal blinks on the beat with no one to press it; pan right to an empty office chair, still rolling, a jacket
  // swinging on its back: whoever was here just left. Seam out: a cut on the bar to the beach.
  // reads: 98.85–99.55 the big red button, unattended · 99.55–100.24 the empty chair, the jacket swinging
  // ======================================================================================
  function chairAndJacket(t, x, y) {
    const lt = t - KILL, roll = 60 * (1 - Math.exp(-lt * 2.2)), rock = .06 * Math.exp(-lt * 1.2) * Math.sin(lt * 7), cx = x + roll;
    boilSeed('chair');
    // five-star base and casters
    paint(ellPts(cx, y + 8, 150, 20, 18), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null });
    for (const ex of [-120, -55, 0, 60, 125]) { inkLine([[cx, y - 28], [cx + ex, y - 4]], 2.2, '#2A2E3E', 'ink', 0); paint(ellPts(cx + ex, y + 2, 13, 9, 10), { wash: PAL.ink, ink: null }); }
    paint(rectPts(cx - 10, y - 160, 20, 134), { wash: '#3A4052', ink: CINK, sw: .8 });
    push(); translate(cx, y - 160); rotate(rock);
    paint(rrPts(-130, -36, 260, 48, 20), { wash: '#39445E', fill: '#252C40', fillOp: 90, tex: .6, ink: CINK, sw: 1.2 });
    inkLine([[-90, -30], [-104, -120]], 2.6, '#2A2E3E', 'ink', 0);
    paint(rrPts(-150, -360, 240, 250, 38), { wash: '#4A5876', fill: '#232A3D', fillOp: 80, tex: .6, ink: CINK, sw: 1.4 });
    // the jacket, hung by its collar on the backrest's corner, still swinging
    boilSeed('jacket');
    const sw = .28 * Math.exp(-lt * .9) * Math.sin(lt * 6.2 + .6) + .04 * Math.sin(lt * 2.1);
    push(); translate(70, -350); rotate(sw);
    paint([[-30, 0], [30, 0], [70, 30], [86, 250], [40, 262], [0, 240], [-40, 262], [-84, 250], [-70, 30]], { wash: '#C8A15A', fill: '#9C7A3A', fillOp: 80, tex: .6, ink: CINK, sw: 1.3, curv: .25 });
    inkLine([[-30, 0], [0, 70], [30, 0]], 1.2, CINK, 'ink', .2);
    inkLine([[0, 70], [0, 240]], .9, '#7A5C2A', 'inkfine', 0);
    for (const s of [-1, 1]) {
      const swing = Math.sin(lt * 6.2 + s) * .1 * Math.exp(-lt * .9);
      push(); translate(s * 72, 34); rotate(s * .08 + swing);
      paint(rrPts(-20, 0, 40, 220, 14), { wash: '#BE9650', fill: '#9C7A3A', fillOp: 70, tex: .5, ink: CINK, sw: 1.1 });
      pop();
    }
    paint(ellPts(-40, 150, 16, 8, 8), { wash: '#7A5C2A', ink: null });
    pop();
    pop();
  }
  function office(t, lt, dur) {
    const pan = ease(seg(t, KILL + .65, BEACH - .25)), gl = pulse(t, 4);
    camBegin(lerp(760, 1180, pan), lerp(560, 575, pan), lerp(1.32, 1.24, pan) + .01 * gl, 0);
    boilSeed('office');
    paint(rectPts(-200, -200, W + 400, 1000), { wash: '#7B879B', fill: '#58647C', fillOp: 90, bleed: .05, tex: .7, border: .4, ink: null });
    for (let i = 0; i < 7; i++) inkLine([[-100 + i * 380, -100], [-100 + i * 380, 760]], .5, '#6A768B', 'inkfine', 0);
    paint(rectPts(-200, 760, W + 400, 30), { wash: '#4E586D', ink: CINK, sw: .8 });
    paint(rectPts(-200, 790, W + 400, 500), { wash: '#5A6479', fill: '#3F4759', fillOp: 90, tex: .6, border: .4, ink: null });
    // the big red button on its pedestal, blinking on the beat, unattended
    const px = 720;
    boilSeed('button');
    push(); translate(px, 805); scale(1.18); translate(-px, -805);
    paint(ellPts(px, 805, 150, 26, 20), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null });
    paint(rectPts(px - 85, 515, 170, 290, 2), { wash: STL, fill: STL_DK, fillOp: 90, tex: .7, border: .5, ink: CINK, sw: 1.2 });
    paint(rectPts(px - 85, 560, 170, 46), { wash: '#F2C53D', ink: CINK, sw: .9 });
    for (let i = 0; i < 4; i++) { const x0 = px - 85 + i * 42; paint([[x0, 606], [x0 + 20, 606], [x0 + 40, 560], [x0 + 20, 560]], { wash: PAL.ink, ink: null }); }
    paint(rrPts(px - 100, 500, 200, 24, 8), { wash: '#4A5366', ink: CINK, sw: 1 });
    const dome = [[px - 76, 503]]; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; dome.push([px + Math.cos(a) * 76, 503 + Math.sin(a) * 62]); }
    paint(dome, { wash: mixCol('#C21F38', '#FF4A5E', gl), fill: '#9B1428', fillOp: 90, tex: .6, ink: CINK, sw: 1.4 });
    paint(ellPts(px - 30, 466, 18, 10, 12, 0, -.5), { wash: PAL.cream, washOp: 220, ink: null });
    const wc = [px + 96, 470];
    for (const [ex, ey] of [[px + 58, 466], [px + 72, 490], [px + 100, 500], [px + 130, 500]]) inkLine([wc, [ex, ey]], .45, '#E4E8EF', 'inkfine', 0);
    for (const r of [.4, .75]) inkLine([[lerp(wc[0], px + 58, r), lerp(wc[1], 466, r)], [lerp(wc[0], px + 72, r), lerp(wc[1], 490, r) + 3], [lerp(wc[0], px + 100, r), lerp(wc[1], 500, r) + 2], [lerp(wc[0], px + 130, r), lerp(wc[1], 500, r)]], .4, '#E4E8EF', 'inkfine', .5);
    pop();
    glow(px, 805 - 1.18 * 340, 240, '#FF3A52', .35 + .65 * gl);
    chairAndJacket(t, 1250, 860);
    // what's left of the wave: clips sloshing across the floor
    boilSeed('office slosh');
    const slosh = x => 880 + 14 * Math.sin(x * .012 - t * 4) + 30 * Math.exp(-lt * 3) * Math.sin(x * .006 + lt * 8);
    seaLayer(slosh, SEA, SEA_DK, { x0: -200, x1: W + 200, bottom: 1300, sw: 1 });
    boilSeed('office clips'); surfClips(slosh, t, 14, -150, W + 150, 51, 46, 50);
    camEnd();
    // the Seam in: the wave of clips drains off the lens
    const k = ease(seg(lt, 0, .3));
    if (k < 1) crashCover(t, H + 400, lerp(-60, H + 200, k), true);
  }

  // ======================================================================================
  // C2 + D + E · one continuous camera, from the beach out to the planet and along the fuse.
  // C2 · on the bar: a beach, two Clawds in shades on loungers sipping coconuts, a phone buzzing on the table between
  //      them; they don't look. The sea behind them is paperclips.
  // D  · "Now there's nowhere left to go." · a fast zoom out without a cut: the beach is the last little island on a
  //      planet made of paperclips; the Researcher hugs its palm tree.
  // E  · "Too late now, we lit the fuse." · planet-sized Clawd floats in with a match and strikes it on the planet on
  //      "late", lights the fuse on "lit"; the spark races round the globe past the island to a cartoon bomb, which
  //      swells and goes off on the bar in a wordless white flash. Seam out: the white clears as smoke (Shot F).
  // reads: 100.24–100.67 the Clawds ignore the phone · 100.67–102.16 it's an island on a planet of clips · 102.16–103.4
  //        giant Clawd, the match · 103.4–104.8 the spark racing (eye on the spark) · 104.8–105.7 the bomb swells · BOOM
  // ======================================================================================
  const P = [960, 600], R = 360, ISL = [960, 238], BOMB = [640, 330], BR = 76;
  const BZ = 12, BC = [960, 760];                                    // the beach is the island at 12×; BC lands on ISL
  const PCLIPS = (() => {
    const out = [];
    for (let i = 0; i < 46; i++) {
      const r = Math.sqrt(hash(i * 2.3 + 1)) * R * .92, a = hash(i * 5.7 + 2) * TAU, x = P[0] + Math.cos(a) * r, y = P[1] + Math.sin(a) * r;
      if (Math.hypot(x - ISL[0], y - ISL[1]) < 70) continue;
      out.push({ x, y, L: 50 * (1 - .45 * sq2(r / R)), rot: hash(i * 9.1) * TAU, col: vinyl(i + 200, .3) });
    }
    for (let i = 0; i < 42; i++) {
      const a = -Math.PI / 2 + (hash(i * 4.1 + 7) - .5) * .9, rr = R - 6 - hash(i * 6.3 + 3) * 75, x = P[0] + Math.cos(a) * rr, y = P[1] + Math.sin(a) * rr;
      if (Math.abs(x - ISL[0]) < 70 && y < ISL[1] + 30) continue;
      out.push({ x, y, L: 9 + hash(i * 2.2) * 5, rot: hash(i * 8.8) * TAU, col: vinyl(i + 300, .12) });
    }
    return out;
  })();
  const FUSE = densify([[1222, 520], [1172, 566], [1115, 548], [1075, 465], [1058, 380], [1020, 315], [960, 292], [888, 302], [826, 342], [768, 334], [730, 300], [712, 268]], 8);
  const FUSE_L = cumLen(FUSE);

  // the camera over the planet (world = planet coordinates), as a pure function of t
  function viewAt(t) {
    if (t < NOWHERE) { const z = BZ * (1 + .02 * (t - BEACH)); return { cx: ISL[0], cy: ISL[1] - (760 - 540) / z, z }; }
    if (t < FUSE_T) {
      const k = ease(seg(t, NOWHERE, OUT_END)), z = Math.exp(lerp(Math.log(BZ * (1 + .02 * (NOWHERE - BEACH))), 0, k)), isy = lerp(760, 540 + (ISL[1] - P[1]), k);
      return { cx: lerp(ISL[0], P[0], k), cy: ISL[1] - (isy - 540) / z, z: z * (1 - .03 * seg(t, OUT_END, FUSE_T)) };
    }
    const mid = lerp(LIGHT, ARRIVE, .5);
    const c = kf(t, [[FUSE_T, [960, 600, .97]], [STRIKE - .12, [1400, 500, 1.6]], [LIGHT + .1, [1330, 500, 1.65]], [mid, [1010, 400, 1.4]], [ARRIVE, [760, 350, 1.7]], [BOOM, [650, 335, 2.5]]], ease);
    const [sx, sy] = shakeXY(t, 14 * seg(t, ARRIVE, BOOM));
    return { cx: c[0] + sx / c[2], cy: c[1] + sy / c[2], z: c[2] };
  }
  let V = { cx: 960, cy: 540, z: 1 };
  const SX = x => W / 2 + (x - V.cx) * V.z, SY = y => H / 2 + (y - V.cy) * V.z, SP = pts => pts.map(p => [SX(p[0]), SY(p[1])]);
  const onScr = (x, y, m = 120) => x > -m && x < W + m && y > -m && y < H + m;
  const zw = sw => sw * clamp(Math.pow(V.z, .6), .8, 3);

  function space(t) {
    boilSeed('space');
    paint(rectPts(-100, -100, W + 200, H + 200), { wash: '#171B38', fill: '#2A2F63', fillOp: 110, bleed: .05, tex: .8, border: .3, ink: null });
    for (const [x, y, r, c] of [[380, 240, 400, PAL.violet], [1520, 860, 440, PAL.indigo], [1620, 180, 260, PAL.rose]]) paint(ellPts(x, y, r, r * .6, 22, 20), { fill: c, fillOp: 70, bleed: .35, tex: .5, border: .3, ink: null });
    const pz = Math.pow(V.z, .12);
    for (let i = 0; i < 38; i++) {
      const x = W / 2 + (hash(i * 3.3) * W - W / 2) * pz, y = H / 2 + (hash(i * 7.1) * H - H / 2) * pz, r = (3 + hash(i * 1.7) * 7) * (1 + .35 * Math.sin(t * 6 + i));
      paint(starPts(x, y, r, .32, 4), { wash: i % 5 ? PAL.cream : '#F6D27A', ink: null });
    }
  }
  function planet(t) {
    boilSeed('planet');
    const px = SX(P[0]), py = SY(P[1]), r = R * V.z, disc = (rr, n = 72) => clipPoly(ellPts(px, py, rr, rr, n));
    paintC(disc(r * 1.2), { fill: '#6F7FD0', fillOp: 60, bleed: .3, tex: .3, border: .2, ink: null });
    paintC(disc(r * 1.08), { fill: '#9CC4F0', fillOp: 90, bleed: .25, tex: .3, border: .2, ink: null });
    paintC(disc(r), { wash: '#B5C1D3', fill: '#71809C', fillOp: 110, bleed: .04, tex: .8, border: .6, ink: null });
    const cres = []; for (let i = 0; i <= 16; i++) { const a = lerp(-.45, 2.2, i / 16); cres.push([P[0] + Math.cos(a) * R, P[1] + Math.sin(a) * R]); }
    for (let i = 16; i >= 0; i--) { const a = lerp(-.45, 2.2, i / 16); cres.push([P[0] - 60 + Math.cos(a) * R * .98, P[1] - 70 + Math.sin(a) * R * .98]); }
    paintC(clipPoly(SP(cres)), { fill: '#3E4863', fillOp: 100, bleed: .15, tex: .5, border: .4, ink: null });
    paintC(clipPoly(SP(ellPts(P[0] - 140, P[1] - 140, 110, 64, 24, 0, -.7))), { fill: SILV, fillOp: 140, bleed: .3, tex: .4, ink: null });
    const rim = []; for (let i = 0; i <= 22; i++) { const a = lerp(3.1, 4.9, i / 22); rim.push([P[0] + Math.cos(a) * R * .97, P[1] + Math.sin(a) * R * .97]); }
    inkLine(SP(rim), zw(3.2), '#F8DDA8', 'ink', .4);
    for (const c of PCLIPS) { const x = SX(c.x), y = SY(c.y), L = c.L * V.z; if (L < 11 || !onScr(x, y, L)) continue; clip(x, y, L, c.rot + Math.sin(t * 1.5 + c.x) * .05, clamp(L / 50, .35, 1.6), { col: c.col }); }
    paintC(disc(r), { ink: CINK, sw: zw(1.2) });
  }

  // ---------- the beach, in its own coordinates (a 1920×1080 frame when the camera is at BZ) ----------
  function coconut(u, sw) {
    paint(ellPts(.9 * u, 0, 1.15 * u, 1.05 * u, 16), { wash: '#8A5A3A', fill: '#5E3A24', fillOp: 80, tex: .6, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts(.9 * u, -.75 * u, .75 * u, .28 * u, 12), { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
    inkLine([[1.1 * u, -.8 * u], [1.5 * u, -2.6 * u], [1.0 * u, -3.0 * u]], sw * .9, '#E2476E', 'ink', .2);
    paint([[.2 * u, -1.9 * u], [1.1 * u, -2.4 * u], [.6 * u, -1.5 * u]], { wash: '#F5CD5F', ink: PAL.ink, sw: sw * .4 });
  }
  function lounger(x, y, dir) {   // dir -1: backrest on the left
    const c = '#F4EDE0', sw = 1.1;
    inkLine([[x + dir * 20, y], [x + dir * 20, y + 44]], 1.4, PAL.ink, 'ink', 0);
    inkLine([[x - dir * 250, y], [x - dir * 250, y + 44]], 1.4, PAL.ink, 'ink', 0);
    paint([[x + dir * 40, y + 8], [x - dir * 270, y + 8], [x - dir * 270, y - 12], [x + dir * 40, y - 12]], { wash: c, fill: PAL.teal, fillOp: 60, ink: PAL.ink, sw });
    paint([[x + dir * 40, y - 6], [x + dir * 128, y - 216], [x + dir * 104, y - 226], [x + dir * 16, y - 12]], { wash: c, fill: PAL.teal, fillOp: 60, ink: PAL.ink, sw });
    for (let i = 1; i < 4; i++) inkLine([[x + dir * (40 + i * 20), y - 6 - i * 50], [x + dir * (18 + i * 20), y - 12 - i * 50]], .6, PAL.teal, 'inkfine', 0);
  }
  function umbrella(x, top, rx, hgt) {
    const rimY = top + hgt, ap = [x, top], rim = j => [x - rx + j * rx / 3, rimY];
    const edge = j => { const [ex] = rim(j), f = (ex - x) / rx; return densify([ap, [x + (ex - x) * .78, top + hgt * .36 - Math.abs(f) * 10], rim(j)], 4); };
    inkLine([[x, 810], [x, top + 10]], 2.4, PAL.ink, 'ink', 0);
    for (let j = 0; j < 6; j++) {
      const a = edge(j), b = edge(j + 1).reverse(), [x0] = rim(j), [x1] = rim(j + 1);
      const sc = []; for (let k2 = 1; k2 < 4; k2++) sc.push([lerp(x0, x1, k2 / 4), rimY + Math.sin(Math.PI * k2 / 4) * 20]);
      paint([...a, ...sc, ...b], { wash: j % 2 ? '#FFF6E6' : '#E4474F', fill: j % 2 ? '#F2DCC0' : '#B82C3E', fillOp: 50, tex: .4, ink: PAL.ink, sw: .9 });
    }
    paint(ellPts(x, top - 6, 11, 11, 10), { wash: '#F5CD5F', ink: PAL.ink, sw: .8 });
  }
  function palm(t, x, y) {
    const sway = Math.sin(t * 1.6) * .05;
    paint([[x - 30, y], [x + 16, y], [x + 82, y - 550], [x + 56, y - 554]], { wash: '#A2703F', fill: '#6F4526', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1, curv: .3 });
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * .62 + sway, L = 200 + (i % 2) * 40, hx = x + 70, hy = y - 550, tx = hx + Math.cos(a) * L, ty = hy + Math.sin(a) * L * .7 + 60;
      const mx = hx + Math.cos(a) * L * .5, my = hy + Math.sin(a) * L * .45 - 30;
      paint([[hx, hy], [mx - 20, my - 26], [tx, ty], [mx + 20, my + 24]], { wash: '#5FA457', fill: '#3F7D40', fillOp: 70, tex: .5, ink: PAL.ink, sw: .8, curv: .5 });
    }
  }
  // o: { fade (0 = only the island, 1 = the full beach frame), rhop (the Researcher's hop), rlook, rscare }
  function beach(t, o) {
    const fade = o.fade, bp = bpOf(t);
    if (fade > .02) {
      boilSeed('beach sky');
      const SKYP = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; SKYP.push([960 + Math.cos(a) * 1700, 480 + Math.sin(a) * 1000]); }
      paint(ellPts(960, 560, 1700, 1000, 40), { wash: SEA, washOp: 255 * fade, fill: SEA_DK, fillOp: 100 * fade, bleed: .05, tex: .8, border: .5, ink: null });
      paint(SKYP, { wash: '#94CDEB', washOp: 255 * fade, fill: '#5FA9DA', fillOp: 70 * fade, bleed: .05, tex: .5, border: .3, ink: null });
      paint(ellPts(960, 470, 1150, 170, 24, 20), { fill: '#FFE3A8', fillOp: 120 * fade, bleed: .3, tex: .4, ink: null });
      const SUN = [1450, 180];
      for (let i = 0; i < 12; i++) { const a = t * .5 + i * TAU / 12; paint([[SUN[0] + Math.cos(a - .09) * 110, SUN[1] + Math.sin(a - .09) * 110], [SUN[0] + Math.cos(a) * 190, SUN[1] + Math.sin(a) * 190], [SUN[0] + Math.cos(a + .09) * 110, SUN[1] + Math.sin(a + .09) * 110]], { fill: '#FBE09A', fillOp: 160 * fade, bleed: .1, ink: null }); }
      paint(ellPts(SUN[0], SUN[1], 88, 88, 26), { wash: '#F8C94B', washOp: 255 * fade, ink: fade > .6 ? CINK : null, sw: 1 });
      // the "sea": paperclips to the horizon
      boilSeed('beach clip sea');
      const sea = x => 470 + 6 * Math.sin(x * .02 + t * 3);
      if (fade > .5) { surfClips(sea, t, 18, -100, W + 100, 61, 40, 40); surfClips(x => 600, t, 16, -100, W + 100, 71, 60, 260); }
    }
    // the island
    boilSeed('island');
    const isl = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, r = 1 + .05 * Math.sin(a * 5) + .03 * Math.sin(a * 9); isl.push([960 + Math.cos(a) * 720 * r, 820 + Math.sin(a) * 175 * r]); }
    for (let k = 0; k < 2; k++) { const ph = frac(t * .9 + k * .5); paint(isl.map(([x, y]) => [960 + (x - 960) * (1.04 + ph * .06), 828 + (y - 820) * (1.1 + ph * .2)]), { wash: SILV, washOp: 120 * (1 - ph), ink: null }); }
    paint(isl, { wash: '#F2D6A2', fill: '#E0B475', fillOp: 90, tex: .7, border: .5, ink: CINK, sw: 1.4 });
    inkLine(isl.slice(0, 15).map(([x, y]) => [x, y - 6]), 1.4, PAL.cream, 'ink', .5);
    boilSeed('palm'); palm(t, 330, 800);
    boilSeed('umbrella'); umbrella(960, 238, 330, 150);
    boilSeed('loungers'); lounger(620, 800, -1); lounger(1300, 800, 1);
    // the phone buzzing on the little table between them, on the beat
    boilSeed('phone');
    const bz = pulse(t, 3), jx = Math.sin(t * 90) * 5 * bz, pr = Math.sin(t * 70) * .06 * bz;
    inkLine([[960, 750], [960, 830]], 1.8, PAL.ink, 'ink', 0);
    paint(ellPts(960, 748, 80, 16, 18), { wash: '#F4EDE0', ink: PAL.ink, sw: .9 });
    push(); translate(960 + jx, 740 - bz * 6); rotate(pr - .06);
    paint(rrPts(-34, -112, 68, 112, 12), { wash: '#2B2F45', ink: CINK, sw: 1 });
    paint(rrPts(-27, -104, 54, 94, 7), { wash: '#F2455A', fill: '#FFB0B8', fillOp: 70, tex: .3, ink: null });
    paint(ellPts(0, -58, 17, 17, 14), { wash: '#C21F33', ink: PAL.cream, sw: .7 });
    pop();
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const r = 56 + i * 18 + bz * 8, cx = 960 + jx; inkLine([[cx + s * r, 640], [cx + s * (r + 8), 676], [cx + s * r, 712]], .9 * bz + .1, PAL.ink, 'inkfine', .6); }
    // the two killswitch guys, on PTO
    const sip = Math.max(0, Math.sin((t - BEACH) * 7));
    clawd(720, 792, 22, { eyes: 'shades', mouth: 'smile', rot: -.38, aL: 1.55, aR: .8 + .25 * sip, armR: coconut, noShadow: true, dy: -.1 * Math.abs(Math.sin(bp * Math.PI)), blush: .5, boilKey: 'pto A' });
    clawd(1200, 792, 22, { eyes: 'shades', mouth: 'cat', flip: true, rot: .38, aL: 1.55, aR: .75, armR: coconut, noShadow: true, dy: -.1 * Math.abs(Math.sin(bp * Math.PI + 1)), blush: .5, boilKey: 'pto B' });
    // the Researcher, hugging the palm tree on the last dry sand
    const rm = researcher.emotions(t, [[BEACH, 'nervous'], [LIGHT + .4, 'scared']]);
    researcher(420, 830, 22, { ...rm, dy: (rm.dy || 0) - (o.rhop || 0) * 2, aL: 1.1 + .1 * Math.sin(t * 9), aR: .9, lookX: o.rlook ?? rm.lookX, hairUp: Math.max(rm.hairUp || 0, o.rhop || 0), noShadow: true, draw: hairClip, boilKey: 'researcher' });
  }

  // ---------- the fuse, the spark, the bomb and the match (screen space via SX/SY) ----------
  function fuseLine(u) {
    boilSeed('fuse');
    if (u < .999) { const p = SP(subPath(FUSE, FUSE_L, u, 1)); if (p.length > 1) { inkLine(p, zw(2.6), CINK, 'ink', .4); inkLine(p, zw(1.2), '#D9B27C', 'inkfine', .4); } }
    if (u > .002) { const p = SP(subPath(FUSE, FUSE_L, 0, u)); if (p.length > 1) inkLine(p, zw(.9), '#2A2230', 'inkfine', .4); }
  }
  function spark(x, y, sc, t) {
    boilSeed('spark');
    paint(ellPts(x, y, 60 * sc, 60 * sc, 16), { fill: '#F6B33A', fillOp: 140, bleed: .3, ink: null });
    glow(x, y, 120 * sc, '#FFB54A', 1);
    paint(starPts(x, y, (26 + 9 * Math.sin(t * 50)) * sc, .3, 6, t * 9), { wash: PAL.cream, fill: PAL.ochre, fillOp: 90, ink: CINK, sw: .6 });
    for (let i = 0; i < 7; i++) { const a = hash(Math.floor(t * 24) * 7 + i) * TAU, d = (30 + hash(i * 3 + Math.floor(t * 24)) * 50) * sc; paint(ellPts(x + Math.cos(a) * d, y + Math.sin(a) * d, 4 * sc, 4 * sc, 6), { wash: i % 2 ? '#FFE08A' : PAL.cream, ink: null }); }
  }
  function bomb(t, scl) {
    boilSeed('bomb');
    const bx = SX(BOMB[0]), by = SY(BOMB[1]), r = BR * V.z * scl, a = -.7, cx = bx + Math.cos(a) * r * .92, cy = by + Math.sin(a) * r * .92;
    paint(ellPts(bx, by, r * 1.35, r * 1.35, 24), { fill: '#E0283F', fillOp: 110 * clamp((scl - 1) * 3) * (.6 + .4 * pulse2(t, 3)), bleed: .3, ink: null });
    const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], cap = (q, w) => [cx + d[0] * q * r + n[0] * w * r, cy + d[1] * q * r + n[1] * w * r];
    paint([cap(-.1, -.26), cap(.22, -.26), cap(.22, .26), cap(-.1, .26)], { wash: STL, fill: STL_DK, fillOp: 80, ink: CINK, sw: zw(1) });
    paint(ellPts(bx, by, r, r, 36), { wash: '#262A44', fill: '#3C4270', fillOp: 90, tex: .6, ink: CINK, sw: zw(1.4) });
    paint(ellPts(bx - r * .36, by - r * .38, r * .26, r * .16, 16, 0, -.7), { wash: '#DCE3F0', washOp: 210, ink: null });
    paint(ellPts(bx - r * .12, by - r * .56, r * .08, r * .06, 10), { wash: '#DCE3F0', washOp: 180, ink: null });
  }
  // the tip of Clawd's left arm (front view, unflipped, unrotated), as drawn by clawd.js
  function handL(x, y, u, o) {
    const a = o.aL, sq = o.sq || 0, root = 4.9 + .55 * clamp((Math.abs(a) - .7) / .9);
    return [x + (-root - 2.2 * Math.cos(a)) * u * (1 + sq * .6), y + (o.dy || 0) * u + (-4.5 - 2.2 * Math.sin(a)) * u * (1 - sq)];
  }
  function match(hx, hy, a, u, lit, t) {       // held in the left hand, pointing outward along the arm
    boilSeed('match');
    const d = [-Math.cos(a), -Math.sin(a)], L = 1.5 * u, ex = hx + d[0] * L, ey = hy + d[1] * L, n = [-d[1] * .12 * u, d[0] * .12 * u];
    paint([[hx + n[0], hy + n[1]], [ex + n[0], ey + n[1]], [ex - n[0], ey - n[1]], [hx - n[0], hy - n[1]]], { wash: '#EBCB8B', ink: PAL.ink, sw: .8 });
    paint(ellPts(ex, ey, .28 * u, .24 * u, 12), { wash: lit > 0 ? '#3A2B2B' : '#C8324A', ink: PAL.ink, sw: .7 });
    if (lit > 0) {
      const f = lit * (1 + .12 * Math.sin(t * 40)), fl = 1.7 * u * f;
      glow(ex, ey - .6 * u, 3 * u * lit, '#FFB54A', 1);
      paint([[ex - .45 * u * f, ey], [ex, ey - fl], [ex + .45 * u * f, ey], [ex, ey + .35 * u]], { wash: '#F29A3A', ink: PAL.ink, sw: .6, curv: .6 });
      paint([[ex - .2 * u * f, ey], [ex, ey - fl * .55], [ex + .2 * u * f, ey], [ex, ey + .2 * u]], { wash: PAL.cream, ink: null, curv: .6 });
    }
    return [ex, ey];
  }

  function planetShot(t, lt, dur) {
    V = viewAt(t);
    const bs = V.z / BZ;                                     // the beach's scale on screen
    space(t);
    if (bs < 1.2) planet(t);
    // the fuse and its spark
    const u = t < LIGHT ? 0 : kf(t, [[LIGHT, 0], [ARRIVE, 1]], x => x * (.55 + .45 * x));
    if (t > NOWHERE) fuseLine(u);
    const sp = pointAt(FUSE, FUSE_L, u), dI = Math.hypot(sp[0] - ISL[0], sp[1] - ISL[1]), lit = t >= LIGHT && u < 1;
    // the beach, at its place on the planet
    const rhop = lit && dI < 130 ? Math.sin((1 - dI / 130) * Math.PI / 2) : 0;
    push(); translate(SX(ISL[0]), SY(ISL[1])); scale(bs); translate(-BC[0], -BC[1]);
    beach(t, { fade: easeIn(seg(bs, .45, .95)), rhop, rlook: lit ? clamp((sp[0] - ISL[0]) / 60, -1, 1) : undefined });
    pop();
    if (t < FUSE_T) return;
    // the bomb swells once the spark reaches it
    const infl = seg(t, ARRIVE, BOOM), scl = 1 + .32 * ease(infl) + .05 * infl * Math.sin(t * 55);
    bomb(t, scl);
    if (lit) spark(SX(sp[0]), SY(sp[1]), V.z * .8, t);
    if (t >= ARRIVE && t < BOOM) spark(SX(BOMB[0] + Math.cos(-.7) * BR * scl * 1.1), SY(BOMB[1] + Math.sin(-.7) * BR * scl * 1.1), V.z * .7, t);
    // planet-sized Clawd floats in with a match, strikes it on the planet on "late", lights the fuse on "lit", then braces
    const cx = kf(t, [[FUSE_T, 2350], [STRIKE - .18, 1540]], backOut), cy = 650 + 150 * ease(seg(t, LIGHT - .45, LIGHT - .1)) - 150 * ease(seg(t, LIGHT + .2, LIGHT + .6)), cu = 38, bob = Math.sin(t * 2.2) * .3;
    const aL = kf(t, [[STRIKE - .3, 1.0], [STRIKE - .12, 1.25], [STRIKE, -.55], [STRIKE + .2, .4], [LIGHT - .4, .4], [LIGHT, -.35], [LIGHT + .2, -.25], [ARRIVE - .1, .2], [ARRIVE + .1, 1.4]], ease);
    const aR = kf(t, [[STRIKE, -.4], [ARRIVE - .1, -.4], [ARRIVE + .1, 1.4]], ease);
    const md = clawd.emotions(t, [[FUSE_T, 'mischief'], [STRIKE + .04, 'starstruck'], [LIGHT + .12, 'playful'], [ARRIVE, 'scared', { emote: null }]]);
    const Zu = cu * V.z, pose = { ...md, noShadow: true, dx: 0, dy: bob, sq: 0, rot: 0, aL, aR, blush: 1, boilKey: 'clawd' };
    clawd(SX(cx), SY(cy), Zu, pose);
    if (t < ARRIVE) {
      const litM = t >= STRIKE ? backOut(seg(t, STRIKE, STRIKE + .15)) : 0;
      const [hx, hy] = handL(SX(cx), SY(cy), Zu, pose), [mx2, my2] = match(hx, hy, aL, Zu, litM, t);
      if (t > STRIKE - .02 && t < STRIKE + .16) { boilSeed('strike sparks'); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (hash(i * 3.3) - .5) * 2.8, d = (40 + hash(i) * 90) * seg(t, STRIKE - .02, STRIKE + .16) * V.z; paint(starPts(mx2 + Math.cos(a) * d, my2 + Math.sin(a) * d, 12 * V.z * (1 - seg(t, STRIKE, STRIKE + .16) * .6), .35, 4), { wash: '#FFE08A', ink: null }); } }
    }
    // the bomb goes off on the bar: a starburst, then the white (no word: the flash is the bang)
    if (t >= BOOM) {
      boilSeed('blast');
      const a = t - BOOM, r = (80 + a * 5000) * V.z, bx = SX(BOMB[0]), by = SY(BOMB[1]);
      paint(starPts(bx, by, r, .62, 11, a * 3), { wash: '#F6B33A', fill: '#E8553A', fillOp: 120, ink: CINK, sw: 1.6 });
      paint(starPts(bx, by, r * .66, .6, 9, -a * 4), { wash: '#FFE08A', ink: null });
      paint(ellPts(bx, by, r * .34, r * .34, 20), { wash: PAL.cream, ink: null });
      flash(seg(t, BOOM + .03, BOOM + .12), BOOM_WHITE);
    }
  }

  // ======================================================================================
  // F · "Orthogonality thesis blues." + Interlude · The white clears as smoke into a smoky blue jazz club. Two
  // spotlights swing in and lock at exactly 90° on "thesis"; Clawd (singed, in a fedora) on sax, the Researcher at an
  // old ribbon mic, notes drifting up. In the interlude Clawd leans back into a solo. Slow dolly in.
  // Seam in: the bomb's white clears as smoke. Seam out: a brush wipe in data-centre teal, covering on the bar.
  // reads: 106.14–106.6 smoke clears: a club · 106.6–107.6 the beams lock at 90°, the band plays · 107.52– the solo
  // ======================================================================================
  function sax(u, sw) {   // body-local: mouthpiece at the mouth, horn on Clawd's right side, bell up
    const c = densify([[.9, -4.35], [2.8, -4.6], [4.7, -4.75], [5.9, -4.3], [6.25, -3.0], [6.4, -1.3], [6.9, -.35], [7.8, -.3], [8.4, -.9], [8.7, -2.2], [8.95, -3.2]], 5);
    const L = [], Rr = [];
    for (let i = 0; i < c.length; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const w = lerp(.16, .62, Math.pow(i / (c.length - 1), 1.3)) * u, nx = -dy / d * w, ny = dx / d * w;
      L.push([c[i][0] * u + nx, c[i][1] * u + ny]); Rr.push([c[i][0] * u - nx, c[i][1] * u - ny]);
    }
    paint([...L, ...Rr.reverse()], { wash: '#E8B23A', fill: '#B7791F', fillOp: 90, tex: .5, ink: PAL.ink, sw: sw * .8 });
    inkLine(c.slice(18, 34).map(([x, y]) => [x * u - .15 * u, y * u]), sw * .5, '#FFF1C4', 'inkfine', .5);
    for (let i = 0; i < 4; i++) { const p = c[22 + i * 3]; paint(ellPts(p[0] * u + .05 * u, p[1] * u, .17 * u, .17 * u, 8), { wash: PAL.cream, ink: PAL.ink, sw: sw * .3 }); }
    paint(ellPts(9.05 * u, -3.45 * u, 1.05 * u, .42 * u, 18, 0, -.25), { wash: '#E8B23A', ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(9.05 * u, -3.45 * u, .75 * u, .24 * u, 14, 0, -.25), { wash: '#5A3A1A', ink: null });
    paint(rectPts(.55 * u, -4.55 * u, .6 * u, .4 * u), { wash: PAL.ink, ink: null });
  }
  function ribbonMic(x, y, h) {
    boilSeed('mic');
    const cy = y - h;
    paint(ellPts(x, y, 46, 10, 16), { wash: '#2A2E40', ink: CINK, sw: .8 });
    inkLine([[x, y], [x, cy + 70]], 1.7, CINK, 'ink', 0);
    inkLine([[x - 36, cy + 10], [x - 38, cy + 56], [x, cy + 70], [x + 38, cy + 56], [x + 36, cy + 10]], 1.2, '#B7BDC8', 'ink', .5);
    paint(rrPts(x - 30, cy - 48, 60, 96, 28), { wash: '#C9CFD8', fill: STL, fillOp: 80, tex: .6, ink: CINK, sw: 1.1 });
    for (let i = 0; i < 7; i++) inkLine([[x - 21, cy - 34 + i * 11], [x + 21, cy - 34 + i * 11]], .5, STL_DK, 'inkfine', 0);
    paint(rectPts(x - 31, cy - 5, 62, 10), { wash: '#3B3F52', ink: null });
  }
  // a painted music note (a reaction mark, not lettering)
  function note(x, y, s, col, a, twin) {
    const o = { wash: col, washOp: 255 * a, ink: null };
    paint(ellPts(x, y, s * .55, s * .4, 12, 0, -.35), o);
    paint(rectPts(x + s * .38, y - s * 1.7, s * .16, s * 1.7), o);
    if (twin) { paint(ellPts(x + s * 1.3, y - s * .25, s * .55, s * .4, 12, 0, -.35), o); paint(rectPts(x + s * 1.68, y - s * 1.95, s * .16, s * 1.7), o); paint([[x + s * .38, y - s * 1.7], [x + s * 1.84, y - s * 1.95], [x + s * 1.84, y - s * 1.6], [x + s * .38, y - s * 1.35]], o); }
    else paint([[x + s * .5, y - s * 1.7], [x + s * 1.15, y - s * 1.05], [x + s * 1.05, y - s * .8], [x + s * .5, y - s * 1.25]], o);
  }
  function beamQuad(sx, sy, ang, len, w0, w1, col, op, flat) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, ex = sx + dx * len, ey = sy + dy * len;
    paint([[sx + nx * w0, sy + ny * w0], [ex + nx * w1, ey + ny * w1], [ex - nx * w1, ey - ny * w1], [sx - nx * w0, sy - ny * w0]], flat ? { wash: col, washOp: op, ink: null } : { fill: col, fillOp: op, bleed: .06, tex: .25, border: .15, ink: null });
  }
  function patron(x, y, u, t, seed, hatK) {    // a dark Clawd in the audience, seen from behind, bobbing on the beat
    boilSeed('patron ' + seed + hatK);
    const b = Math.abs(Math.sin(bpOf(t) * Math.PI + seed)) * u * .6, c = '#0F1229';
    paint(rrPts(x - 5 * u, y - 6 * u - b, 10 * u, 8 * u, u * .7), { wash: c, washOp: 250, ink: null });
    if (hatK === 1) { paint([[x - 2.6 * u, y - 6 * u - b], [x - 2.2 * u, y - 8.6 * u - b], [x + 2.2 * u, y - 8.6 * u - b], [x + 2.6 * u, y - 6 * u - b]], { wash: c, ink: null }); paint(ellPts(x, y - 6.1 * u - b, 4.4 * u, .6 * u, 16), { wash: c, ink: null }); }
    if (hatK === 2) paint([[x - 1.8 * u, y - 5.9 * u - b], [x + .3 * u, y - 10.4 * u - b], [x + 1.8 * u, y - 5.9 * u - b]], { wash: c, ink: null });
  }
  function blues(t, lt, dur) {
    const k = ease(seg(t, BLUES, END)), bp = bpOf(t), solo = ease(seg(t, SOLO - .15, SOLO + .35));
    camBegin(960 + Math.sin(t * .7) * 16 - 90 * solo, lerp(556, 590, k), lerp(1.08, 1.24, k) + .06 * solo, Math.sin(t * .9) * .008);
    // the room: velvet backdrop, marquee bulbs blinking on the beat
    boilSeed('club room');
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: '#1E2552', ink: null });
    const drape = []; for (let i = 0; i <= 16; i++) drape.push([140 + i * 102.5, 830 + (i % 2) * 12]);
    paint([[140, 70], [1780, 70], ...drape.reverse()], { wash: '#25245A', fill: '#3C2C72', fillOp: 90, tex: .7, border: .4, ink: null });
    for (let i = 0; i < 15; i++) { const x = 190 + i * 106; inkLine([[x, 74], [x + Math.sin(i + t * .8) * 10, 440], [x + 6, 826]], 1.1, '#15163A', 'ink', .6); }
    paint(ellPts(960, 470, 470, 300, 30, 12), { fill: '#4C6FB8', fillOp: 75, bleed: .3, tex: .4, ink: null });
    boilSeed('marquee');
    for (let i = 0; i < 17; i++) { const x = 170 + i * 98, on = .55 + .45 * (((beatN(t) + i) % 2) ? 1 : pulse(t, 3)); paint(ellPts(x, 100, 9, 9, 10), { wash: mixCol('#8A6A3A', '#FFE7A0', on), ink: PAL.ink, sw: .5 }); glow(x, 100, 30, '#F6C35A', on * .8); }
    // the stage
    boilSeed('club stage');
    paint([[-200, 820], [W + 200, 820], [W + 200, 1300], [-200, 1300]], { wash: '#2C2238', fill: '#4A3048', fillOp: 90, tex: .6, border: .4, ink: null });
    paint([[120, 800], [1800, 800], [1830, 858], [90, 858]], { wash: '#5B3A3A', fill: '#7C4A2C', fillOp: 80, tex: .6, ink: PAL.ink, sw: 1.1 });
    inkLine([[92, 857], [1828, 857]], 1.1, '#E8B23A', 'ink', 0);
    // two spotlights swing in and lock at exactly 90°
    boilSeed('beams');
    const th = kf(t, [[BLUES, .12], [LOCK - .25, .9], [LOCK, Math.PI / 4]], ease), SLx = 345, SRx = 1575, Sy = -120;
    for (const [sx, ang, col] of [[SLx, Math.PI / 2 - th, '#FFF3D6'], [SRx, Math.PI / 2 + th, '#DDE8FF']]) {
      beamQuad(sx, Sy, ang, 1460, 34, 230, col, 46, true);
      beamQuad(sx, Sy, ang, 1460, 12, 90, col, 90);
    }
    const tipL = [SLx + Math.sin(th) * (850 - Sy) / Math.cos(th), 850], tipR = [SRx - Math.sin(th) * (850 - Sy) / Math.cos(th), 850];
    for (const [x, c] of [[tipL[0], '#FFF3D6'], [tipR[0], '#DDE8FF']]) paint(ellPts(x, 856, 230, 34, 20), { fill: c, fillOp: 110, bleed: .2, ink: null });
    const cross = [960, Sy + (960 - SLx) / Math.tan(th)], lock = backOut(seg(t, LOCK, LOCK + .3));
    if (lock > 0) {
      boilSeed('right angle');
      const ax = .35 + .65 * (1 - seg(t, LOCK + .3, LOCK + 1.2)), Lx = 520 * Math.min(1, lock);
      for (const dd of [[Math.SQRT1_2, Math.SQRT1_2], [-Math.SQRT1_2, Math.SQRT1_2]]) inkLine([[960 - dd[0] * Lx, cross[1] - dd[1] * Lx], [960 + dd[0] * Lx, cross[1] + dd[1] * Lx]], 1.1 * ax, mixCol('#6C7BC0', PAL.cream, ax), 'inkfine', 0);
      const d1 = [Math.SQRT1_2, Math.SQRT1_2], d2 = [-Math.SQRT1_2, Math.SQRT1_2], a = 48 * lock;
      glow(cross[0], cross[1], 140, '#FFF3D6', lock * .8);
      inkLine([[cross[0] + d1[0] * a, cross[1] + d1[1] * a], [cross[0] + (d1[0] + d2[0]) * a, cross[1] + (d1[1] + d2[1]) * a], [cross[0] + d2[0] * a, cross[1] + d2[1] * a]], 2, PAL.cream, 'ink', 0);
      const tw = 1 - seg(t, LOCK, LOCK + .7);
      if (tw > 0) paint(starPts(cross[0], cross[1], 50 * tw * lock, .25, 4), { wash: PAL.cream, ink: null });
    }
    // Clawd on sax: singed and dizzy at first, then lost in it; on the interlude it leans back into a solo
    const sway = Math.sin(bp * Math.PI / 2);
    const cm = clawd.emotions(t, [[BLUES, 'dizzy', { emote: null }], [BLUES + .5, 'relieved', { emote: 'music' }], [SOLO, 'proud', { emote: 'music' }]]);
    const u = 40, cX = 600, cY = 850, crot = sway * .07 - .03 + .2 * solo, cdy = -Math.abs(Math.sin(bp * Math.PI)) * .5;
    const soot = 1 - seg(t, BLUES, SOLO);
    clawd(cX, cY, u, {
      ...cm, hat: 'fedora', rot: crot, dx: 0, dy: cdy + (cm.dy || 0) * .3, sq: .06 * pulse(t, 6) + (cm.sq || 0) * .5 - .05 * solo, aL: .35 + .25 * Math.sin(bp * Math.PI) + .4 * solo, aR: -.55, mouth: 'o', blush: 1,
      tint: '#6A6070', tintK: .5 * soot, draw: sax, boilKey: 'clawd'
    });
    // the Researcher at the old ribbon mic, singing the line, then swaying with eyes shut
    const s = 28, rX = 1330, rY = 850;
    ribbonMic(1232, 858, 262);
    const singing = t > BLUES + .3 && t < INTER.start;
    const rm = researcher.emotions(t, [[BLUES, 'dizzy', { emote: null }], [BLUES + .45, 'neutral', { eyes: 'closed', brows: 'up' }], [INTER.start + .1, 'happy']]);
    researcher(rX, rY, s, {
      ...rm, rot: -sway * .04, aL: -.42, aR: singing ? .55 + .35 * Math.sin(bp * Math.PI / 2) : rm.aR, mouth: singing ? (pulse2(t, 4) > .45 ? 'O' : 'o') : rm.mouth,
      hairUp: .7 * soot, glassesTilt: .14 * (1 - seg(t, BLUES, BLUES + .9)), blush: singing ? .6 : rm.blush, boilKey: 'researcher',
      draw: (s2) => { paint(ellPts(1.4 * s2, -9.9 * s2, .55 * s2, .32 * s2, 12), { fill: '#3F3A48', fillOp: 110 * soot, bleed: .2, ink: null }); }
    });
    if (soot > .3) for (let i = 0; i < 3; i++) { boilSeed('singe ' + i); const ph = frac((t - BLUES) * .8 + i / 3), y0 = rY - 14.3 * s - ph * 120; inkLine([[rX - 10 + i * 12, y0 + 40], [rX + Math.sin(ph * 6 + i) * 14, y0 + 20], [rX - 6 + Math.sin(ph * 6 + i + 2) * 14, y0]], .8, '#9AA3B8', 'inkfine', .6); }
    // notes drift up from the bell (every beat) and the mic (every other beat, while there's singing)
    const bell = (() => { const lx = 9.05 * u, ly = (-3.45 + cdy) * u, c = Math.cos(crot), sn = Math.sin(crot); return [cX + lx * c - ly * sn, cY + lx * sn + ly * c]; })();
    const NC = [PAL.cream, '#F6C35A', PAL.sky, PAL.rose], b0 = Math.ceil(bpOf(BLUES));
    for (let n = b0; n <= b0 + 9; n++) for (const [src, off] of [[bell, 0], [[1232, 560], .5]]) {
      const age = t - beatAt(n) - off * BEAT; if (age < 0 || age > 2.6 || (off && (n % 2 || beatAt(n) > INTER.start))) continue;
      boilSeed('note ' + n + off);
      const a = Math.min(1, age / .2) * (1 - seg(age, 1.7, 2.6)), big = !off && beatAt(n) >= SOLO ? 1.4 : 1;
      note(src[0] + Math.sin(age * 2.4 + n) * 34 + age * (off ? -34 : 30), src[1] - 30 - age * 160, (30 + age * 8) * big, NC[(n + off * 2) % 4], a, (n + off * 2) % 3 === 0);
    }
    // haze
    for (let i = 0; i < 4; i++) { boilSeed('haze ' + i); const x = ((hash(i) * 2400 + t * (20 + i * 8) * (i % 2 ? 1 : -1)) % 2400 + 2400) % 2400 - 240, y = 180 + i * 140; paint(ellPts(x, y, 380, 62, 18, 10), { fill: '#9FB2D8', fillOp: 32, bleed: .35, tex: .3, ink: null }); }
    // the Seam in: the blast's smoke clears
    const clear = 1 - ease(seg(t, BLUES, BLUES + .7));
    if (clear > 0) for (let i = 0; i < 7; i++) { boilSeed('smoke ' + i); const r = (230 + hash(i) * 170) * (1 + (1 - clear) * .8); paint(ellPts(200 + hash(i * 3.1) * 1520, 150 + hash(i * 5.3) * 780, r, r * .8, 20, 20), { fill: i % 3 ? '#F4F1EA' : '#C9D0E4', fillOp: 230 * clear, bleed: .3, tex: .4, ink: null }); }
    camEnd();
    // the audience at little candle tables, in silhouette at the front
    for (const [tx, dir] of [[170, -1], [1750, 1]]) {
      boilSeed('table ' + tx);
      paint(ellPts(tx, 1005, 92, 16, 16), { wash: '#15182E', ink: null });
      paint(rectPts(tx - 8, 968, 16, 32), { wash: '#F4D58A', washOp: 230, ink: null });
      paint([[tx - 6, 968], [tx, 946 + Math.sin(t * 13) * 3], [tx + 6, 968]], { wash: '#FFE08A', ink: null, curv: .5 });
      glow(tx, 955, 90, '#F6C35A', .7);
      patron(tx - dir * 120, 1110, 17, t, dir, 1); patron(tx + dir * 150, 1130, 16, t, dir + 1, 2);
    }
    flash(1 - ease(seg(lt, 0, .45)), BOOM_WHITE);
    if (lt > dur - .3) { flushLetters(); brushWipe((lt - (dur - .3)) / .6, [PAL.teal, PAL.indigo]); }
  }

  chapter('chorus3', CHO.start, END, [[UP, upping], [FLOOD, flood], [KILL, office], [BEACH, planetShot], [NOWHERE, planetShot], [FUSE_T, planetShot], [BLUES, blues]]);
})();
