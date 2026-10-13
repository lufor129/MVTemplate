// c01_lab: Intro + Verse 1. Curtain up; then the lab at night: Clawd wakes up on a monitor, sparks fly, it sleds down
// the loss curve, bursts out person-sized, takes the boss chair, and chases the Researcher through a hallway of doors
// until its lunchbox mouth CHOMPs shut over the camera. Ported from PDoomVideo/src/ch/c01_lab.js and re-timed to the
// analysed song: every event hangs off a Lyric Line, a word in it, or the Beat Grid.
(() => {
  const CASE = '#E6D6B8', CASE_DK = '#A89170', SCR = '#2E8C8A', GLOW = '#7FE0D2', DESK = '#4B3346', WALL = '#232A5C';

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n); // n beats after the beat nearest t
  const INTRO = sec('Intro'), VERSE = sec('Verse 1');
  const WAKE = nearestBeat(word(0, 2));                        // "sparks": Clawd's eyes open
  const SPARKS = nearestBar(word(0, 4));                       // "AGI": close on the screen
  const STARS = beatsAfter(SPARKS, 1);                         // the eyes turn to stars
  const REACT = nearestBar(LINES[1].start), NERVOUS = LINES[1].start;   // "Your circuits make me nervous"
  const SCOOTS = [1, 2, 3].map(n => beatsAfter(REACT, n));     // the chair scoots back on three beats
  const SHRUG = LINES[2].start, WINK = nearestBeat(word(2, 2)); // "that's no surprise"
  const CHART_POP = beatsAfter(WINK, 1);
  const LOSS = LINES[3].start, EDGE = nearestBeat(word(3, 4)); // "drop": the sled reaches the cliff
  const FALL = beatsAfter(EDGE, 1), LAND = beatsAfter(EDGE, 2);
  const BURST = beatsAfter(LAND, 1.5), HIT = beatsAfter(LAND, 2);
  const BOSS = LINES[4].start, REVEAL = nearestBeat(word(4, 3));        // "servant": the chair has spun round
  const TOSS = [1, 2, 3, 4].map(n => beatsAfter(REVEAL, n));             // a mug lands on each beat
  const CREAK = nearestBeat(word(4, 7));                                 // "boss": the lid creaks open
  const CHASE = LINES[5].start, B0 = Math.round(bpOf(CHASE));           // "ChatGPT, please don't eat me alive"
  const RUN = k => beatAt(B0 + 2 * k), RUN_DUR = 1.6 * BEAT;            // a dash through the doors every two beats
  const OUT = beatAt(B0 + 10), SMASH = beatAt(B0 + 11), CHOMP = beatAt(B0 + 12), SHUT = beatAt(B0 + 13);

  // ---------- helpers ----------
  function partial(p, u) {                               // polyline cut at fraction u of its length
    const d = []; let L = 0;
    for (let i = 1; i < p.length; i++) { d.push(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); L += d[i - 1]; }
    let s = clamp(u) * L; const out = [p[0]];
    for (let i = 1; i < p.length; i++) {
      if (s >= d[i - 1]) { out.push(p[i]); s -= d[i - 1]; }
      else { const f = s / d[i - 1]; out.push([lerp(p[i - 1][0], p[i][0], f), lerp(p[i - 1][1], p[i][1], f)]); break; }
    }
    return out;
  }

  // ---------- set pieces ----------
  function wall(col = WALL) {
    boilSeed('wall');
    paint(rectPts(-700, -700, W + 1400, H + 1400), { wash: col, washOp: 255, fill: PAL.indigo, fillOp: 140, bleed: .08, tex: .8, border: .3, ink: null });
  }
  function floorBand(y, col = '#2C2548') {
    boilSeed('floor');
    paint([[-700, y + jit(2)], [W + 700, y + jit(2)], [W + 700, H + 700], [-700, H + 700]], { wash: col, fill: PAL.violet, fillOp: 50, bleed: .05, tex: .8, border: .5, ink: PAL.ink, sw: 1.2 });
  }
  function windowMoon(x, y, w, h) {
    boilSeed('window');
    paint(rectPts(x, y, w, h, 3), { wash: '#3C4C8C', fill: PAL.violet, fillOp: 80, tex: .6, ink: PAL.ink, sw: 1.2 });
    paint(ellPts(x + w * .68, y + h * .28, w * .15, w * .15, 18, 2), { wash: PAL.cream, fill: PAL.ochre, fillOp: 50, ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 4; i++) paint(starPts(x + w * (.12 + hash(i) * .45), y + h * (.12 + hash(i + 5) * .75), 6 + hash(i + 2) * 6, .4), { wash: PAL.cream, ink: null });
    inkLine([[x + w / 2, y], [x + w / 2, y + h]], 1.1, PAL.ink, 'ink', 0);
    inkLine([[x, y + h / 2], [x + w, y + h / 2]], 1.1, PAL.ink, 'ink', 0);
    paint(rectPts(x - 16, y + h - 4, w + 32, 22, 2), { wash: '#6B5A7E', ink: PAL.ink, sw: .9 });
  }
  function shelf(x, y, w, seed) {
    boilSeed('shelf' + seed);
    for (let i = 0; i < 5; i++) {
      const bw = 34 + hash(seed + i) * 26, bh = 50 + hash(seed + i + 9) * 60, bx = x + 16 + i * (w - 30) / 5;
      const col = [PAL.teal, PAL.rose, PAL.ochre, PAL.sap, PAL.violet][(seed + i) % 5];
      if (i % 2) {
        paint(rectPts(bx + bw * .35, y - bh, bw * .3, bh * .5), { wash: col, washOp: 200, ink: PAL.ink, sw: .7 });
        paint(ellPts(bx + bw / 2, y - bh * .3, bw * .6, bh * .32, 14, 1.5), { wash: col, washOp: 220, fill: PAL.cream, fillOp: 40, tex: .5, ink: PAL.ink, sw: .8 });
      } else paint(rrPts(bx, y - bh, bw, bh, 8, 1.5), { wash: col, washOp: 220, fill: PAL.ink, fillOp: 30, tex: .5, ink: PAL.ink, sw: .8 });
    }
    paint(rectPts(x, y, w, 16, 2), { wash: '#6B4A3A', ink: PAL.ink, sw: 1 });
  }
  function desk(y, x0 = -700, x1 = W + 700) {
    boilSeed('desk');
    paint([[x0, y + jit(2)], [x1, y + jit(2)], [x1, H + 700], [x0, H + 700]], { wash: DESK, fill: PAL.violet, fillOp: 60, bleed: .05, tex: .8, border: .5, ink: PAL.ink, sw: 1.3 });
    inkLine([[x0, y + 28], [x1, y + 28]], .8, '#2E1F2C', 'inkfine', 0);
  }
  function lamp(x, y, s = 1, k = 1) {
    boilSeed('lamp');
    if (k > 0) paint([[x + 80 * s, y - 165 * s], [x + 125 * s, y - 180 * s], [x + 330 * s, y + 6], [x - 10 * s, y + 6]], { fill: PAL.ochre, fillOp: 75 * k, bleed: .25, tex: .3, border: .1, ink: null });
    paint(ellPts(x, y - 8 * s, 55 * s, 14 * s, 16), { wash: '#3E3550', ink: PAL.ink, sw: .9 });
    inkLine([[x, y - 10 * s], [x + 25 * s, y - 150 * s], [x + 100 * s, y - 195 * s]], 2.4 * s, '#3E3550', 'ink', 0);
    push(); translate(x + 100 * s, y - 195 * s); rotate(.55);
    paint([[-28 * s, -20 * s], [28 * s, -20 * s], [52 * s, 28 * s], [-52 * s, 28 * s]], { wash: PAL.ochre, fill: PAL.clayDk, fillOp: 50, tex: .5, ink: PAL.ink, sw: .9 });
    paint(ellPts(0, 28 * s, 22 * s, 8 * s, 12), { wash: PAL.cream, ink: null });
    pop();
  }
  // chunky CRT; returns the screen rectangle so content can be painted inside it
  function monitor(cx, cy, w, h, o = {}) {
    boilSeed('monitor' + (o.key || ''));
    const x = cx - w / 2, y = cy - h / 2, sw = clamp(w / 380, .8, 2.2);
    if (o.glow) paint(ellPts(cx, cy, w * 1.05, h * .95, 26, 10), { fill: GLOW, fillOp: 70 * o.glow, bleed: .35, tex: .3, border: .1, ink: null });
    paint([[cx - w * .16, y + h - 6], [cx + w * .16, y + h - 6], [cx + w * .25, y + h * 1.1], [cx - w * .25, y + h * 1.1]], { wash: CASE_DK, ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(x, y, w, h, w * .07, 2), { wash: CASE, fill: CASE_DK, fillOp: 70, bleed: .05, tex: .7, border: .6, ink: PAL.ink, sw });
    const s = { x: x + w * .08, y: y + h * .08, w: w * .84, h: h * .72 };
    paint(rrPts(s.x, s.y, s.w, s.h, w * .05, 1.5), { wash: o.screen || '#1F5F63', fill: SCR, fillOp: 150 * (o.bright ?? 1), bleed: .15, tex: .5, border: .5, ink: PAL.ink, sw: sw * .9 });
    paint(ellPts(x + w * .88, y + h * .895, w * .017, w * .017, 10), { wash: o.led || PAL.sap, ink: null });
    for (let i = 0; i < 4; i++) inkLine([[x + w * (.1 + i * .035), y + h * .86], [x + w * (.1 + i * .035), y + h * .93]], sw * .5, CASE_DK, 'inkfine', 0);
    return s;
  }
  function screenFloor(s) { boilSeed('screenFloor'); paint(rectPts(s.x + 6, s.y + s.h * .8, s.w - 12, s.h * .18), { fill: '#1A4A50', fillOp: 120, bleed: .1, tex: .5, ink: null }); }
  function glass(s, t) {                                 // soft glare + drifting scanlines over the screen
    boilSeed('glass');
    paint([[s.x + s.w * .06, s.y + s.h * .08], [s.x + s.w * .34, s.y + s.h * .08], [s.x + s.w * .15, s.y + s.h * .5], [s.x + s.w * .04, s.y + s.h * .5]], { fill: '#FFFFFF', fillOp: 40, bleed: .2, tex: .2, ink: null });
    for (let i = 1; i < 5; i++) { const yy = s.y + s.h * ((i / 5 + t * .06) % 1); inkLine([[s.x + 10, yy], [s.x + s.w - 10, yy]], .35, GLOW, 'inkfine', 0); }
  }
  function mug(x, y, s, col = PAL.rose, rot = 0, steam = 0) {
    push(); translate(x, y); rotate(rot);
    paint(ellPts(28 * s, -30 * s, 13 * s, 14 * s, 12), { ink: PAL.ink, sw: clamp(s * 1.2, .5, 1.6) });
    paint(rrPts(-26 * s, -56 * s, 52 * s, 56 * s, 9 * s), { wash: col, fill: PAL.ink, fillOp: 25, tex: .5, ink: PAL.ink, sw: clamp(s, .5, 1.4) });
    paint(ellPts(0, -54 * s, 22 * s, 5 * s, 12), { wash: '#5A3A2A', ink: null });
    if (steam) for (const k of [-9, 8]) inkLine([[k * s, -64 * s], [k * s + 9 * s * Math.sin(T * 4 + k), -84 * s], [k * s - 5 * s, -106 * s]], .6, PAL.cream, 'inkfine', .6);
    pop();
  }
  // rolling office chair; (x, floorY) is the floor under the seat and s matches the sitter's unit.
  // Seat the Researcher with researcher(x, floorY - 1.2 * s, s, { sit: true, noShadow: true }).
  function officeChair(x, floorY, s, o = {}) {
    boilSeed('chair');
    const seatY = floorY - 3.2 * s, col = o.col || '#9A5A6E', sw = clamp(s / 14, .5, 1.8);
    paint(ellPts(x, floorY + .1 * s, 3.2 * s, .6 * s, 16), { fill: PAL.ink, fillOp: 80, bleed: .2, tex: .3, ink: null });
    if (o.back !== false) paint(rrPts(x - 2.9 * s, seatY - 8.4 * s, 5.8 * s, 7.8 * s, 1.5 * s, s * .06), { wash: col, fill: PAL.violet, fillOp: 60, tex: .6, ink: PAL.ink, sw });
    paint(rectPts(x - .25 * s, seatY, .5 * s, 2.5 * s), { wash: '#6D6A80', ink: PAL.ink, sw: sw * .6 });
    for (const dx of [-2.2, -1, 1, 2.2]) { inkLine([[x, floorY - .7 * s], [x + dx * s, floorY - .2 * s]], sw, PAL.ink, 'ink', 0); paint(ellPts(x + dx * s, floorY - .15 * s, .32 * s, .32 * s, 10), { wash: PAL.ink, ink: null }); }
    paint(rrPts(x - 2.7 * s, seatY - .5 * s, 5.4 * s, 1 * s, .45 * s), { wash: col, fill: PAL.violet, fillOp: 50, tex: .5, ink: PAL.ink, sw });
  }

  // =====================================================================================
  // Intro · Curtain up: the curtains sweep open on the painted title, Clawd pops up through a trapdoor and waves.
  // Seam out: a brush wipe in the lab's night colours, on the bar where the singing starts.
  function curtainUp(t, lt, dur) {
    const k = lt / dur;                                  // events in fractions of the intro
    camBegin(960, 540, 1 + .05 * ease(k), 0);
    stageBack(t, { spots: [[960, PAL.cream]] });
    letter("I'M UPPING MY", 960, 245, 100, PAL.cream, { rot: -.03 });                     // the title: the MV's opening
    letter('P(DOOM)', 960, 425, 250, PAL.clay, { rot: -.03 + Math.sin(bpOf(t) * Math.PI) * .015 }); // Sound Word, on the backdrop
    flushLetters();                                      // the title is painted on the backdrop, under Clawd and the curtains
    const hx = 960, hy = 885, open = easeOut(seg(k, .28, .4)), rx = 190 * open, ry = 46 * open;
    boilSeed('trapdoor');
    if (open > .02) {
      paint(rectPts(hx - rx, hy - 130 * open, rx * 2, 130 * open, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1 });
      paint(ellPts(hx, hy, rx, ry, 26), { wash: '#2A1A22', ink: PAL.ink, sw: 1.2 });
    }
    const rise = seg(k, .35, .6), popT = INTRO.start + dur * .6;
    if (rise > 0) {
      const m = clawd.dance('wave', t), y = lerp(hy + 300, hy + 8, backOut(rise));
      clawd(hx, y, 24, { ...m, dy: rise < 1 ? 0 : m.dy, sq: rise < .35 ? -.2 : m.sq, eyes: 'happy', mouth: 'smile', blush: 1, noShadow: true, emote: 'music', emoteK: seg(t, popT, popT + .25), emoteAge: t - popT });
    }
    boilSeed('trapdoor lip');
    if (open > .02) {                                    // front lip of the hole hides whatever is still below the floor
      const lip = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; lip.push([hx + Math.cos(a) * rx, hy + Math.sin(a) * ry]); }
      paint([...lip, [hx - rx - 30, 1250], [hx + rx + 30, 1250]], { wash: WOOD, fill: WOOD_DK, fillOp: 60, bleed: .05, tex: .8, border: .6, ink: null });
      inkLine(lip, 1.1, PAL.ink, 'ink', .4);
    }
    const age = t - popT;                                // confetti puff as Clawd pops out
    if (age > 0) for (let i = 0; i < 16; i++) {
      boilSeed('confetti' + i);
      const a = -Math.PI / 2 + (hash(i) - .5) * 2.4, v = 520 + hash(i + 3) * 560;
      push(); translate(hx + Math.cos(a) * v * age, hy - 120 + Math.sin(a) * v * age + 1100 * age * age); rotate(age * 9 + i);
      paint(rectPts(-10, -6, 20, 12), { wash: [PAL.rose, PAL.ochre, PAL.sky, PAL.sap, PAL.violet][i % 5], ink: null });
      pop();
    }
    stageFront(t, { curtain: 1 - easeOut(seg(k, 0, .42)) });
    camEnd();
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [PAL.indigo, PAL.violet]);
  }

  // "I see sparks…" · Over the Researcher's shoulder: the dark lab, a chunky monitor, tiny Clawd asleep on screen…
  // its eyes open on "sparks". Seam out: the camera keeps pushing in, and cuts closer on the bar.
  function labOver(t, lt, dur) {
    const e = ease(lt / dur);
    camBegin(lerp(960, 1030, e), lerp(540, 470, e), lerp(1, 1.32, e), 0);
    wall();
    windowMoon(150, 110, 300, 330);
    shelf(1420, 290, 390, 1); shelf(1450, 460, 350, 7);
    desk(700);
    lamp(420, 700, 1, 1);
    const s = monitor(1040, 455, 560, 450, { glow: 1 });
    screenFloor(s);
    const asleep = t < WAKE, md = clawd.emotions(t, [[VERSE.start, 'sleepy'], [WAKE, 'surprised'], [WAKE + 3 * BEAT, 'neutral']]);
    clawd(s.x + s.w / 2, s.y + s.h - 22, 11, { ...md, lookX: -1, lookY: .4, sq: (md.sq || 0) + (asleep ? .05 * Math.sin(t * 3) : 0), noShadow: true, aL: -.2, aR: -.2, blush: asleep ? 0 : 1 });
    glass(s, t);
    boilSeed('keyboard');
    paint(rrPts(870, 716, 360, 52, 10, 1.5), { wash: CASE, fill: CASE_DK, fillOp: 50, tex: .5, ink: PAL.ink, sw: 1 });
    for (const ky of [733, 751]) inkLine([[890, ky], [1210, ky]], .6, CASE_DK, 'inkfine', 0);
    mug(1390, 760, 1, PAL.rose, 0, 1);
    push(); translate(1296, 300); rotate(.12); paint(rectPts(-24, -24, 48, 48, 1), { wash: PAL.ochre, ink: PAL.ink, sw: .6 }); pop();
    push(); translate(1290, 360); rotate(-.08); paint(rectPts(-22, -22, 44, 44, 1), { wash: PAL.rose, ink: PAL.ink, sw: .6 }); pop();
    camEnd();
    // the Researcher, back to us, in the foreground (slower push = parallax)
    const rx = 400 - e * 150, ry = 1260 + e * 40, rs = 40 * (1 + e * .08);
    boilSeed('rim light');
    paint(ellPts(rx, ry - 10.7 * rs, 4 * rs, 3.4 * rs, 20, 6), { fill: GLOW, fillOp: 60, bleed: .3, tex: .3, ink: null });
    researcher(rx, ry, rs, { view: 'back', sit: true, noShadow: true, aL: -.8, aR: -.8, dy: -.05 * Math.sin(t * 2), boilKey: 'researcher' });
    boilSeed('chair back');
    paint(rrPts(rx - 2.8 * rs, ry - 8.1 * rs, 5.6 * rs, 6.6 * rs, 1.3 * rs, 2), { wash: '#3A3552', fill: PAL.violet, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.6 });
    if (lt < .3) brushWipe(.5 + lt / .6, [PAL.indigo, PAL.violet]);
  }

  // "…of AGI in your eyes" · Close on the screen: Clawd's eyes turn to stars and sparks burst out of the monitor like
  // fireworks, one burst a half-beat. Seam out: cut on the bar to the reverse shot.
  const BURSTS = [[2, 430, 250, PAL.rose], [2.5, 1500, 220, PAL.sky], [3, 980, 150, PAL.ochre], [3.5, 330, 560, PAL.sap], [3.75, 1620, 560, PAL.violet]]
    .map(([n, x, y, c]) => [beatsAfter(SPARKS, n), x, y, c]);
  function sparks(t, lt, dur) {
    const e = ease(lt / dur);
    camBegin(960, 540 - 30 * e, 1 + .1 * e, 0);
    wall();
    const s = monitor(960, 520, 1760, 1100, { glow: 1, bright: 1.25, key: 'big' });
    screenFloor(s);
    const md = clawd.emotions(t, [[SPARKS, 'neutral'], [STARS, 'starstruck']]), u = 42, y0 = s.y + s.h - 36;
    clawd(960, y0, u, { ...md, noShadow: true });
    glass(s, t);
    const ey = y0 + (md.dy || 0) * u - 6 * u;
    for (let i = 0; i < 16; i++) {                       // stars fly out of the eyes and grow as they come at the lens
      const l0 = STARS + .03 + i * .085; if (t < l0) continue;
      boilSeed('eye star' + i);
      const ph = ((t - l0) / 1.25) % 1, ang = hash(i + 20) * TAU, ex = 960 + (i % 2 ? 2.5 : -2.5) * u, fly = easeOut(ph);
      paint(starPts(ex + Math.cos(ang) * fly * 1000, ey + Math.sin(ang) * fly * 640, 10 + 56 * ph, .4), { wash: i % 3 ? PAL.cream : PAL.sky, fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: .5 });
    }
    for (const [tb, bx, by, col] of BURSTS) {            // firework bursts on the beat
      const a = t - tb; if (a < 0 || a > .9) continue;
      boilSeed('burst' + bx);
      const r = 40 + 320 * easeOut(a / .8), d = 18 * (1 - a / .9) + 4;
      if (a < .14) paint(starPts(bx, by, 90 * (1 - a / .14) + 20, .3, 4, a * 4), { wash: PAL.cream, ink: null });
      for (let k = 0; k < 12; k++) { const aa = k / 12 * TAU + hash(bx) * 3; paint(ellPts(bx + Math.cos(aa) * r, by + Math.sin(aa) * r + 90 * a * a, d, d, 10), { wash: k % 2 ? col : PAL.cream, ink: null }); }
    }
    camEnd();
  }

  // "Your circuits make me nervous" · Reverse on the Researcher: starry glasses → sweat. Circuit vines crawl across the
  // wall; the chair scoots back a notch on each of three beats. Seam out: the vines reach the lens and wipe the frame.
  const VINES = [];
  for (let i = 0; i < 12; i++) {
    let x = 1700 + hash(i * 5) * 180, y = 620 + hash(i * 5 + 1) * 280; const p = [[x, y]];
    for (let k = 0; k < 6; k++) { if (k % 2 === 0) x -= 120 + hash(i * 9 + k) * 330; else y += (hash(i * 9 + k + 50) - .64) * 400; p.push([x, y]); }
    VINES.push(p);
  }
  function reaction(t, lt, dur) {
    const e = ease(lt / dur), nerv = seg(t, NERVOUS, NERVOUS + 1.6);
    camBegin(lerp(930, 860, e), 600, 1.32 - .12 * e, 0);
    wall();
    boilSeed('screen glow');
    paint(ellPts(1060, 560, 780, 520, 26, 10), { fill: GLOW, fillOp: 50, bleed: .35, tex: .3, border: .1, ink: null });
    windowMoon(110, 110, 240, 270);
    floorBand(840);
    VINES.forEach((p, i) => {
      const g = easeOut(seg(t, NERVOUS + .05 + i * .09, NERVOUS + 1.3 + i * .05)); if (g < .01) return;
      boilSeed('vine' + i);
      const q = partial(p, g), col = mixCol(PAL.teal, PAL.rose, nerv * (.4 + .6 * hash(i + 3)));
      inkLine(q, 1.3, col, 'ink', 0);
      for (let k = 1; k < q.length - 1; k++) paint(ellPts(q[k][0], q[k][1], 8, 8, 10), { wash: col, ink: PAL.ink, sw: .4 });
      const tip = q[q.length - 1]; paint(ellPts(tip[0], tip[1], 11, 11, 10), { wash: PAL.cream, ink: null });
    });
    const scoot = (a, b) => kf(t, SCOOTS.flatMap((s, i) => [[s, lerp(a, b, i / 3)], [s + .2, lerp(a, b, (i + 1) / 3)]]), easeOut);
    const X = scoot(990, 660), S = scoot(40, 31), FY = scoot(1010, 935);
    const md = researcher.emotions(t, [[REACT, 'charmed'], [NERVOUS, 'nervous']]), nervous = t >= NERVOUS;
    officeChair(X, FY, S);
    researcher(X + (nervous ? jit(2) : 0), FY - 1.2 * S, S, { ...md, sit: true, noShadow: true, lookX: 0, hairUp: seg(t, NERVOUS + .5, NERVOUS + 1.4), aL: nervous ? -.95 : -.5, aR: nervous ? -.95 : -.5, rot: nervous ? -.04 : 0, emote: null, boilKey: 'researcher' });
    const hy = FY - 1.2 * S - 10.7 * S;
    if (t < NERVOUS + .3) for (let i = 0; i < 7; i++) {  // leftover sparkles drifting in the room
      boilSeed('sparkle' + i);
      const k = 1 - seg(t, NERVOUS - .2 + hash(i) * .3, NERVOUS + .3);
      paint(starPts(300 + hash(i + 1) * 1300, 150 + hash(i + 2) * 500 + (t - REACT) * 120, 26 * k, .4), { wash: PAL.cream, fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: .4 });
    }
    if (nervous) for (let i = 0; i < 4; i++) {           // sweat drops flicking off
      boilSeed('sweat' + i);
      const ph = ((t - NERVOUS) * 1.5 + i / 4) % 1, side = i % 2 ? 1 : -1, dx = X + side * (3 + ph * 2.2) * S, dy = hy - S + ph * 300 * ph;
      paint([[dx, dy - 30], [dx + 16, dy + 2], [dx, dy + 16], [dx - 16, dy + 2]], { wash: PAL.sky, ink: PAL.ink, sw: .6, curv: .7 });
    }
    // back of the monitor in the foreground, glowing at its rim
    boilSeed('monitor back');
    paint([[1500, 1120], [1580, 770], [1990, 700], [1990, 1120]], { wash: '#8C7A5E', fill: PAL.ink, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.4 });
    inkLine([[1585, 772], [1990, 704]], 2, GLOW, 'ink', 0);
    // the vines reach the lens
    const p = easeIn(seg(lt, dur - .45, dur));
    if (p > 0) [[260, 1], [600, 1.25], [900, .9]].forEach(([yy, sp], i) => {
      boilSeed('lens vine' + i);
      const x1 = lerp(W + 100, -300, clamp(p * sp)), path = [[W + 100, yy], [lerp(W + 100, x1, .5), yy], [lerp(W + 100, x1, .5), yy + 80 * (i - 1)], [x1, yy + 80 * (i - 1)]];
      inkLine(path, 7, i === 1 ? PAL.rose : GLOW, 'ink', 0);
      paint(ellPts(x1, yy + 80 * (i - 1), 30, 30, 14), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    });
    camEnd();
  }

  // "that's no surprise" · On screen: Clawd shrugs and winks on "surprise"… and a loss chart pops up on the next beat.
  // Seam out: the camera dives into the chart, and the next Shot is inside it.
  const CHART = { x: 1180, y: 170, w: 460, h: 340 };
  const chartCurve = c => { const p = []; for (let i = 0; i <= 14; i++) { const f = i / 14, x = c.x + 40 + f * (c.w - 70); p.push([x, f < .6 ? c.y + 110 + Math.sin(f * 30) * 8 * (1 - f) + f * 20 : f < .66 ? lerp(c.y + 125, c.y + c.h - 50, (f - .6) / .06) : c.y + c.h - 48]); } return p; };
  function shrug(t, lt, dur) {
    const dive = easeIn(seg(lt, dur - .3, dur));
    camBegin(lerp(960, CHART.x + CHART.w * .5, dive), lerp(540, CHART.y + CHART.h * .5, dive), lerp(.95, 3.4, dive), 0);
    wall();
    const s = monitor(960, 520, 1760, 1100, { glow: 1, bright: 1.1, key: 'big' });
    screenFloor(s);
    const md = clawd.emotions(t, [[SHRUG, 'neutral'], [WINK, 'playful'], [CHART_POP, 'neutral']], { take: .5 });
    const sh = backOut(seg(t, SHRUG + .1, SHRUG + .3)) * (1 - ease(seg(t, CHART_POP - .2, CHART_POP)));
    clawd(720, s.y + s.h - 36, 40, { ...md, lookX: 1, lookY: -.6, aL: lerp(.2, 1.05, sh), aR: lerp(.2, 1.05, sh), dx: 0, dy: (md.dy || 0) - sh * .5, rot: -.05 * sh, mouth: 'smile', noShadow: true, blush: 1 });
    const k = backOut(seg(t, CHART_POP, CHART_POP + .18));
    if (k > .02) {
      boilSeed('chart');
      const c = CHART; push(); translate(c.x + c.w / 2, c.y + c.h / 2); scale(k); translate(-c.x - c.w / 2, -c.y - c.h / 2);
      paint(rrPts(c.x, c.y, c.w, c.h, 16, 1.5), { wash: PAL.cream, ink: PAL.ink, sw: 1.3 });
      paint(rrPts(c.x, c.y, c.w, 42, 14), { wash: PAL.rose, ink: PAL.ink, sw: 1.1 });
      for (let i = 0; i < 3; i++) paint(ellPts(c.x + 26 + i * 26, c.y + 21, 7, 7, 10), { wash: PAL.cream, ink: null });
      inkLine([[c.x + 36, c.y + 64], [c.x + 36, c.y + c.h - 30], [c.x + c.w - 24, c.y + c.h - 30]], 1, PAL.ink, 'ink', 0);
      inkLine(chartCurve(c), 2.2, PAL.teal, 'ink', .1);
      pop();
    }
    glass(s, t);
    camEnd();
  }

  // "There was a sudden drop in your training loss" · Inside the chart: Clawd hops onto the loss curve, sleds along,
  // teeters at the cliff on "drop", plunges on the next beat and lands with a SPLASH on the one after.
  const CLIFF = 1500;
  const lossY = x => x < CLIFF ? 300 + 16 * Math.sin(x * .018) * (1 - x / 1600) + x * .03 : x < CLIFF + 60 ? lerp(345, 1650, ease((x - CLIFF) / 60)) : 1650 + 8 * Math.sin(x * .01);
  const slope = x => Math.atan2(lossY(x + 8) - lossY(x - 8), 16);
  const HOPPED = LOSS + .35;
  function sledAt(t) {                                   // [x, y, rot, phase]
    if (t < HOPPED) { const p = seg(t, LOSS, HOPPED); return [lerp(-480, -150, p), lerp(lossY(-150) - 120, lossY(-150), p) - Math.sin(p * Math.PI) * 200, 0, 'hop']; }
    if (t < EDGE) { const x = lerp(-150, CLIFF - 8, Math.pow(seg(t, HOPPED, EDGE), 1.7)); return [x, lossY(x), slope(x), 'slide']; }
    if (t < FALL) { const a = t - EDGE; return [CLIFF - 4, lossY(CLIFF - 4), .5 * Math.sin(a * 22) * .25 * (1 - a * 1.2) + .1, 'teeter']; }
    if (t < LAND) { const p = easeIn(seg(t, FALL, LAND)); return [lerp(CLIFF, CLIFF + 90, p), lerp(lossY(CLIFF - 4), 1650, p), lerp(.1, .5, p), 'fall']; }
    return [CLIFF + 90, 1650, 0, 'land'];
  }
  function sled(u) {
    paint(rrPts(-6.2 * u, -.2 * u, 12.4 * u, 1 * u, .4 * u), { wash: '#C8324A', fill: CURTAIN_DK, fillOp: 60, tex: .5, ink: PAL.ink, sw: 1 });
    inkLine([[5.6 * u, .1 * u], [7 * u, -.6 * u], [6.8 * u, -2 * u], [6 * u, -1.6 * u]], 1.8, '#C8324A', 'ink', .5);
    inkLine([[-5.5 * u, 1.2 * u], [6.2 * u, 1.2 * u], [7 * u, .4 * u]], 1.1, PAL.ink, 'ink', .3);
  }
  function lossRide(t, lt) {
    const [px, py, rot, ph] = sledAt(t), [lx, ly] = sledAt(Math.max(LOSS, t - .14)), u = 22;
    const tee = ease(seg(t, EDGE, EDGE + .2)) * (1 - ease(seg(t, FALL - .02, FALL + .13))), land = ease(seg(t, LAND - .15, LAND + .15));
    let cx = lerp(lx + 280, px + 60, tee), cy = lerp(ly - 150, py - 80, tee), z = 1 + .16 * tee;
    if (ph === 'fall') { cx = px + 80; cy = ly - 40; z = .95; }
    cx = lerp(cx, CLIFF + 150, land); cy = lerp(cy, 1470, land); z = lerp(z, 1, land);
    if (t > LAND) { const [sx, sy] = shakeXY(t, 22 * (1 - seg(t, LAND, LAND + .35))); cx += sx; cy += sy; }
    camBegin(cx, cy, z, ph === 'fall' ? .05 : 0);
    const x0 = cx - 1150 / z, x1 = cx + 1150 / z, y0 = cy - 700 / z, y1 = cy + 700 / z, grid = mixCol(PAL.paper, PAL.sky, .45);
    boilSeed('chart paper');
    for (const [bx, by, r, col] of [[-300, 120, 380, PAL.sky], [520, 620, 420, PAL.rose], [1150, 80, 360, PAL.ochre], [1350, 1050, 480, PAL.sky], [1900, 1400, 520, PAL.violet], [1250, 1800, 420, PAL.ochre]])
      if (bx + r > x0 && bx - r < x1 && by + r > y0 && by - r < y1) paint(ellPts(bx, by, r, r * .7, 22, 12), { fill: col, fillOp: 95, bleed: .3, tex: .4, border: .3, ink: null });
    for (let gx = Math.ceil(x0 / 160) * 160; gx < x1; gx += 160) { boilSeed('gx' + gx); inkLine([[gx, y0], [gx, (y0 + y1) / 2], [gx, y1]], .8, grid, 'rotring', 0); }
    for (let gy = Math.ceil(y0 / 160) * 160; gy < y1; gy += 160) { boilSeed('gy' + gy); inkLine([[x0, gy], [(x0 + x1) / 2, gy], [x1, gy]], .8, grid, 'rotring', 0); }
    boilSeed('curve');
    const cp = []; for (let x = Math.max(-900, Math.floor(x0 / 50) * 50); x <= x1; x += 50) { cp.push([x, lossY(x)]); if (x === CLIFF - 50) for (const d of [58, 64, 70, 80, 95]) cp.push([CLIFF - 50 + d, lossY(CLIFF - 50 + d)]); }
    if (cp.length > 1) {
      paint([...cp, [cp[cp.length - 1][0], 2600], [cp[0][0], 2600]], { fill: PAL.teal, fillOp: 80, bleed: .08, tex: .5, border: .4, ink: null });
      inkLine(cp, 3, '#1F6F6C', 'ink', 0);
    }
    if (x0 < -560) inkLine([[-600, -300], [-600, 1900]], 1.3, PAL.ink, 'ink', 0);
    if (y1 > 1860) inkLine([[-600, 1900], [2800, 1900]], 1.3, PAL.ink, 'ink', 0);
    const md = clawd.emotions(t, [[LOSS, 'happy'], [EDGE + .04, 'scared', { emote: '!' }], [LAND + .02, 'dizzy'], [LAND + .33, 'excited']]);
    if (ph === 'hop') { push(); translate(-150, lossY(-150)); sled(u); pop(); }
    boilSeed('speed lines');
    if (ph === 'slide' && seg(t, HOPPED, EDGE) > .3) for (let k = 0; k < 5; k++) inkLine([[px - 170 - k * 30, py - 40 - k * 26], [px - 330 - k * 50, py - 44 - k * 26]], .8, PAL.ink, 'inkfine', 0);
    if (ph === 'fall') for (let k = 0; k < 5; k++) inkLine([[px - 90 + k * 45, py - 260 - hash(k) * 80], [px - 90 + k * 45, py - 440 - hash(k) * 120]], .8, PAL.ink, 'inkfine', 0);
    let sq = 0, arms = .3, dy = 0;
    if (ph === 'hop') { sq = -.12; arms = 1.1; }
    if (ph === 'slide') { arms = lerp(.3, 1.25, seg(t, HOPPED + .25, HOPPED + .75)); sq = t < HOPPED + .15 ? .2 * (1 - seg(t, HOPPED, HOPPED + .15)) : 0; }
    if (ph === 'teeter') arms = .3 + .6 * Math.sin((t - EDGE) * 24);
    if (ph === 'fall') { sq = -.25; arms = 1.35; }
    if (ph === 'land') { const a = t - LAND; sq = .35 * (1 - elasticOut(a / .5)); dy = -Math.max(0, Math.sin(seg(t, LAND + .3, LAND + .6) * Math.PI)) * 1.5; arms = t > LAND + .3 ? 1.3 : -.2; }
    if (ph === 'land') {                                // paint splash at the bottom of the drop
      boilSeed('splash');
      const a = t - LAND, sx = CLIFF + 90;
      paint(ellPts(sx, 1660, 120 + 300 * easeOut(a / .35), 34 + 40 * easeOut(a / .35), 22, 5), { wash: PAL.rose, fill: PAL.ochre, fillOp: 70, tex: .5, ink: PAL.ink, sw: 1 });
      if (a < .45) paint(starPts(sx, 1640, 90 + 330 * easeOut(a / .3), .5, 9, -Math.PI / 2 + .2), { wash: PAL.sky, washOp: 230 * (1 - a / .45), fill: PAL.teal, fillOp: 60, ink: null });
      for (let i = 0; i < 14; i++) {
        const an = -Math.PI * (.1 + .8 * hash(i + 40)), v = 500 + hash(i + 41) * 700;
        paint(ellPts(sx + Math.cos(an) * v * a, 1640 + Math.sin(an) * v * a + 1500 * a * a, 14 + hash(i) * 16, 14 + hash(i) * 16, 10), { wash: [PAL.rose, PAL.ochre, PAL.sky, PAL.teal][i % 4], ink: PAL.ink, sw: .5 });
      }
    }
    push(); translate(px, py); rotate(rot);
    clawd(0, -.9 * u, u, { ...md, sq: sq + (md.sq || 0), aL: arms, aR: arms, dx: 0, dy: dy + (md.dy || 0) * .3, rot: 0, noShadow: true, mouth: ph === 'fall' ? 'O' : ph === 'land' && t > LAND + .3 ? 'grin' : 'smile', blush: ph !== 'fall' ? .5 : 0, boilKey: 'sledder' });
    if (ph !== 'hop') sled(u);
    pop();
    camEnd();
  }

  // Back in the lab: the monitor bulges, Clawd bursts out of the screen person-sized on the beat, and the Researcher
  // tips over backwards. Seam out: cut on action to the chair spinning round.
  function burst(t, lt) {
    const a = seg(t, HIT, HIT + .3);
    const [sx, sy] = t > HIT ? shakeXY(t, 20 * (1 - seg(t, HIT, HIT + .4))) : [0, 0];
    camBegin(880 + sx, 610 + sy, 1.28 + .04 * seg(t, BURST, BOSS), 0);
    wall(); windowMoon(150, 110, 260, 290); shelf(1470, 330, 360, 3);
    floorBand(820);
    boilSeed('side desk');
    paint(rectPts(700, 640, 640, 40, 2), { wash: '#6B4A5E', fill: DESK, fillOp: 80, tex: .6, ink: PAL.ink, sw: 1.1 });
    for (const lx of [730, 1270]) paint(rectPts(lx, 680, 40, 150), { wash: DESK, ink: PAL.ink, sw: 1 });
    lamp(760, 640, .6, .8);
    const wob = t < HIT ? seg(t, BURST, HIT) : 0, bulge = 1 + .07 * Math.sin((t - BURST) * 46) * wob;
    push(); translate(1020, 500); scale(bulge, 2 - bulge); translate(-1020, -500);
    const s = monitor(1020, 500, 360, 280, { glow: t < HIT ? 1 + wob : .6, bright: t < HIT ? 1 + wob : .2, led: t < HIT ? PAL.sap : '#D8394E' });
    if (t < HIT) clawd(1020, s.y + s.h - 14, 8 + 3 * wob, { eyes: 'narrow', noShadow: true, sq: .25 * wob, aL: -.3, aR: -.3, boilKey: 'clawd' });
    else { boilSeed('cracks'); for (let i = 0; i < 7; i++) inkLine([[1020, 470], [1020 + Math.cos(i * .9) * 130, 470 + Math.sin(i * .9) * 90]], .8, PAL.ink, 'inkfine', 0); }
    pop();
    // the Researcher tips over backwards as the chair shoots away
    const fall = easeOut(seg(t, HIT + .05, HIT + .4));
    push(); translate(430 - fall * 120, 880); rotate(-fall * .9); translate(-430, -880);
    officeChair(430, 880, 16);
    researcher(430, 880 - 1.2 * 16, 16, { sit: true, noShadow: true, eyes: t < HIT ? 'look' : 'wide', lookX: 1, lookY: -.2, mouth: t < HIT ? 'o' : 'O', brows: 'worried', hairUp: fall, aL: t < HIT ? -.9 : 1.2, aR: t < HIT ? -.9 : 1.3, boilKey: 'researcher' });
    pop();
    if (t >= HIT) {
      const age = t - HIT;
      boilSeed('burst glow');
      paint(ellPts(1020, 500, 260 * (1 + age * 3), 200 * (1 + age * 3), 22, 12), { fill: GLOW, fillOp: 120 * (1 - seg(age, 0, .4)), bleed: .3, tex: .3, ink: null });
      for (let i = 0; i < 12; i++) {                     // glass shards
        boilSeed('shard' + i);
        const an = hash(i + 60) * TAU, v = 700 + hash(i + 61) * 700;
        push(); translate(1020 + Math.cos(an) * v * age, 490 + Math.sin(an) * v * age + 1300 * age * age); rotate(age * 12 * (hash(i) - .5));
        paint([[-14, -10], [16, -4], [-2, 16]], { wash: '#CFF3EC', ink: PAL.ink, sw: .6 });
        pop();
      }
      const md = clawd.emotions(t, [[HIT, 'neutral', { eyes: 'closed', emote: null }], [HIT + .3, 'excited']], { take: .4 });
      const x = lerp(1020, 1250, a), y = lerp(560, 880, a) - Math.sin(a * Math.PI) * 260, u = lerp(6, 24, easeOut(a));
      clawd(x, y, u, { ...md, rot: (1 - a) * -1.4, dx: 0, dy: a >= 1 ? md.dy : 0, sq: a >= 1 ? .3 * (1 - elasticOut((t - HIT - .3) / .45)) + (md.sq || 0) : -.15, aL: a >= 1 ? 1.25 : .9, aR: a >= 1 ? 1.25 : .9, mouth: 'grin', noShadow: a < 1, boilKey: 'clawd' });
    }
    camEnd();
  }

  // "now I'm your servant and you're my boss" · The villain chair spins round to Clawd in a crown on "servant". The
  // Researcher, in a bowtie, tosses a mug onto the pile on each beat and fans the boss. On "boss" the pile topples, the
  // Researcher freezes, and Clawd's lid creaks open. Seam out: the camera pushes in on the lid.
  function boss(t, lt) {
    const spin = ease(seg(t, REVEAL - .48, REVEAL)), sxc = Math.cos(spin * Math.PI);
    const pushIn = easeIn(seg(t, CREAK + .2, CHASE));
    camBegin(960, lerp(560, 580, pushIn), 1.2 + .06 * ease(seg(t, REVEAL, CREAK)) + .5 * pushIn, 0);
    wall('#2A2F66');
    boilSeed('boss glow');
    paint(ellPts(960, 470, 560, 420, 26, 10), { fill: PAL.ochre, fillOp: 70, bleed: .3, tex: .4, border: .2, ink: null });
    windowMoon(140, 110, 240, 270);
    shelf(1480, 300, 330, 11);
    floorBand(860, '#3A2B4E');
    // the wrecked monitor on a side desk, still smoking
    boilSeed('wreck desk');
    paint(rectPts(80, 690, 330, 30, 2), { wash: '#6B4A5E', ink: PAL.ink, sw: 1 });
    paint(rectPts(110, 720, 30, 150), { wash: DESK, ink: PAL.ink, sw: .9 });
    const ms = monitor(240, 590, 200, 160, { bright: .1, led: '#D8394E', key: 'wreck' });
    inkLine([[ms.x + 20, ms.y + 12], [ms.x + ms.w / 2, ms.y + ms.h / 2], [ms.x + ms.w - 16, ms.y + 20]], .8, PAL.ink, 'inkfine', 0);
    for (let i = 0; i < 3; i++) { boilSeed('smoke' + i); const ph = ((t * .5 + i / 3) % 1); paint(ellPts(240 + Math.sin(ph * 6 + i) * 20, 500 - ph * 260, 22 + ph * 40, 18 + ph * 30, 14, 4), { fill: '#8A8AA0', fillOp: 90 * (1 - ph), bleed: .3, ink: null }); }
    // executive chair
    boilSeed('exec chair');
    const cx = 960, seatY = 700, bw = 540 * Math.max(.05, Math.abs(sxc)), dark = '#5A2E4A';
    paint(ellPts(cx, 866, 300, 34, 20), { fill: PAL.ink, fillOp: 90, bleed: .2, ink: null });
    paint(rectPts(cx - 16, seatY + 40, 32, 120), { wash: '#6D6A80', ink: PAL.ink, sw: .9 });
    for (const dx of [-170, -80, 80, 170]) { inkLine([[cx, 830], [cx + dx, 858]], 1.6, PAL.ink, 'ink', 0); paint(ellPts(cx + dx, 860, 14, 14, 10), { wash: PAL.ink, ink: null }); }
    if (spin > .1 && spin < .9) for (let i = 0; i < 3; i++) inkLine(ellPts(cx, 520, 380 + i * 40, 60 + i * 10, 16).slice(2, 9), 1, PAL.cream, 'inkfine', .6);
    if (sxc > 0) {                                       // back view hides the sitter
      paint(rrPts(cx - bw / 2, 250, bw, 520, 90 * sxc, 2), { wash: dark, fill: CURTAIN_DK, fillOp: 70, tex: .7, border: .5, ink: PAL.ink, sw: 1.4 });
      for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) paint(ellPts(cx + c * bw * .25, 360 + r * 120, 8 * sxc + 2, 8, 8), { wash: PAL.ink, ink: null });
    } else {
      const k = -sxc;
      paint(rrPts(cx - bw / 2, 250, bw, 520, 90 * k, 2), { wash: '#7A3A5A', fill: CURTAIN_DK, fillOp: 50, tex: .7, border: .5, ink: PAL.ink, sw: 1.4 });
      const c = CREAK, lid = kf(t, [[c, 0], [c + .2, .1], [c + .3, .08], [c + .45, .22], [c + .55, .2], [c + .72, .38], [CHASE, .52]], easeOut) + (t > c ? jit(.012) : 0);
      const md = clawd.emotions(t, [[BOSS, 'smug'], [CREAK + .4, 'mischief']], { take: .4 });
      const pointing = t < CREAK ? .4 + .35 * pulse(t, 5) : .2;
      clawd(cx, seatY + 10, 31, { ...md, sx: k, hat: 'crown', lid, mouth: 'smile', noShadow: true, dx: 0, rot: 0, dy: -.25 * pulse(t, 4), aL: pointing, aR: .15, armR: (u) => mug(u * .9, u * .5, u / 34, PAL.teal), boilKey: 'clawd' });
      boilSeed('exec seat');
      paint(rrPts(cx - 290 * k, seatY - 10, 580 * k, 70, 30, 2), { wash: dark, fill: CURTAIN_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1.3 });
      for (const s of [-1, 1]) paint(rrPts(cx + s * 300 * k - 40, seatY - 110, 80, 40, 16), { wash: dark, ink: PAL.ink, sw: 1.1 });
    }
    // side table with the growing, wobbling mug pile
    boilSeed('side table');
    paint(rectPts(1250, 760, 220, 26, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1 });
    paint(rectPts(1350, 786, 22, 80), { wash: WOOD_DK, ink: PAL.ink, sw: .8 });
    const landed = TOSS.filter(x => t >= x).length, n = 3 + landed, topple = easeIn(seg(t, CREAK + .1, CREAK + .65));
    for (let i = 0; i < n; i++) {
      boilSeed('mug' + i);
      const w = Math.sin(t * 5 + i) * i * 1.6 + topple * Math.pow(i, 1.4) * 34, bump = i >= 3 && t - TOSS[i - 3] < .2 ? .2 * (1 - (t - TOSS[i - 3]) / .2) : 0;
      mug(1360 + w, 760 - i * 50 * (1 - bump * .4) + topple * i * i * 3, .85, [PAL.rose, PAL.cream, PAL.teal, PAL.ochre][i % 4], topple * i * .22 + Math.sin(t * 5 + i) * .02 * i, i === n - 1 && !topple ? 1 : 0);
    }
    // the Researcher: toss, fan, toss, fan… then freeze
    const rx = 540, rs = 20, frozen = t > CREAK + .1;
    TOSS.forEach((tl, j) => {
      const p = seg(t, tl - .42, tl); if (p <= 0 || p >= 1) return;
      boilSeed('flying mug' + j);
      const i = j + 3, px = lerp(rx + 40, 1360, p), py = lerp(660, 760 - i * 50, p) - Math.sin(p * Math.PI) * 340;
      mug(px, py, .85, [PAL.rose, PAL.cream, PAL.teal, PAL.ochre][i % 4], p * TAU);
    });
    const toss = TOSS.some(tl => t > tl - .5 && t < tl - .3), fan = Math.sin(bpOf(t) * TAU);
    const rm = researcher.emotions(t, [[BOSS, 'happy', { eyes: 'dot', emote: null }], [CREAK + .1, 'surprised']]);
    researcher(rx, 862, rs, { ...rm, bowtie: true, mouth: frozen ? 'O' : 'smile', blush: frozen ? 0 : .8, brows: frozen ? 'up' : 'worried', hairUp: frozen ? seg(t, CREAK + .15, CREAK + .5) : 0, rot: 0, dx: 0,
      dy: frozen ? rm.dy : -.25 * Math.abs(Math.sin(bpOf(t) * Math.PI)), aR: frozen ? .2 : toss ? .9 : -.6, aL: frozen ? -1 : .5 + .45 * fan, boilKey: 'researcher',
      handL: frozen ? null : (s) => { push(); rotate(-.4 + fan * .3); paint([[0, 0], [2.6 * s, -2.2 * s], [4.6 * s, -1.2 * s], [3.4 * s, 1 * s]], { wash: PAL.sap, fill: '#3E7A4A', fillOp: 70, ink: PAL.ink, sw: .7, curv: .5 }); inkLine([[0, 0], [4.2 * s, -1 * s]], .6, PAL.ink, 'inkfine', .3); pop(); } });
    camEnd();
  }

  // "ChatGPT, please don't eat me alive" · Hallway door chase, Scooby-Doo style: a dash between doors every two beats,
  // Clawd bigger every time; then the Researcher bursts out at the camera and Clawd smashes through after them.
  const DOORS = [400, 960, 1520], DW = 230, DH = 400, HF = 830;
  const ROUTES = [[0, 2], [2, 1], [1, 0], [0, 2], [2, 1]], CU = [13, 17, 22, 28, 34];
  function runner(t, k, delay) {
    const t0 = RUN(k) + delay * BEAT, p = (t - t0) / RUN_DUR;
    if (p < 0 || p > 1) return null;
    const [a, b] = ROUTES[k], out = Math.min(p / .14, (1 - p) / .14, 1);
    return { x: lerp(DOORS[a], DOORS[b], p), y: lerp(HF - 34, HF + 26, out), sc: lerp(.82, 1, out), dir: Math.sign(DOORS[b] - DOORS[a]), out };
  }
  function doorOpen(t, d) {
    let v = 0;
    ROUTES.forEach(([a, b], k) => [0, .6].forEach(dl => {
      const t0 = RUN(k) + dl * BEAT, t1 = t0 + RUN_DUR;
      for (const [door, te] of [[a, t0], [b, t1]]) if (door === d) v = Math.max(v, seg(t, te - .14, te - .02) * (1 - seg(t, te + .1, te + .24)));
    }));
    if (d === 1) v = Math.max(v, seg(t, OUT - .12, OUT) * (1 - seg(t, OUT + .3, OUT + .45)));
    return v;
  }
  function hallway(t, smashed) {
    boilSeed('hall wall');
    paint(rectPts(-700, -700, W + 1400, HF + 700), { wash: '#B9A4D0', washOp: 255, fill: PAL.violet, fillOp: 70, bleed: .06, tex: .8, border: .4, ink: null });
    paint(rectPts(-700, 630, W + 1400, HF - 630), { wash: '#7D5E97', fill: PAL.indigo, fillOp: 60, tex: .7, ink: null });
    inkLine([[-700, 626], [W + 700, 626]], 1.4, '#5B4172', 'ink', 0);
    for (const x of [680, 1240]) {
      boilSeed('hall lamp' + x);
      paint(ellPts(x, 330, 150, 170, 20, 6), { fill: PAL.ochre, fillOp: 90, bleed: .3, tex: .3, border: .1, ink: null });
      paint([[x - 26, 300], [x + 26, 300], [x + 18, 350], [x - 18, 350]], { wash: PAL.ochre, fill: PAL.cream, fillOp: 90, ink: PAL.ink, sw: .9 });
      inkLine([[x, 350], [x, 380]], 1.2, PAL.ink, 'ink', 0);
    }
    boilSeed('hall floor');
    paint([[-700, HF], [W + 700, HF], [W + 700, H + 700], [-700, H + 700]], { wash: '#4A3A5E', fill: PAL.night, fillOp: 70, bleed: .05, tex: .8, border: .5, ink: PAL.ink, sw: 1.3 });
    paint([[-700, HF + 70], [W + 700, HF + 70], [W + 700, HF + 170], [-700, HF + 170]], { wash: CURTAIN, fill: CURTAIN_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: .9 });
    DOORS.forEach((x, d) => {
      boilSeed('door' + d);
      const x0 = x - DW / 2, y0 = HF - DH;
      paint(rectPts(x0 - 22, y0 - 22, DW + 44, DH + 22, 2), { wash: '#8A5A3C', ink: PAL.ink, sw: 1.2 });
      paint(rectPts(x0, y0, DW, DH, 2), { wash: '#1E1628', ink: PAL.ink, sw: 1 });
      if (smashed && d === 1) { for (let i = 0; i < 4; i++) paint([[x0 + i * 58, y0], [x0 + i * 58 + 50, y0], [x0 + i * 58 + 30, y0 + 40 + hash(i) * 50]], { wash: WOOD, ink: PAL.ink, sw: .8 }); return; }
      const th = doorOpen(t, d), w = DW * (1 - .82 * th), sk = 26 * th;
      paint([[x0, y0], [x0 + w, y0 - sk], [x0 + w, HF + sk * .5], [x0, HF]], { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .7, ink: PAL.ink, sw: 1.1 });
      if (w > 90) {
        for (const py of [y0 + 30, y0 + DH * .55]) paint(rectPts(x0 + w * .16, py, w * .68, DH * .34), { ink: WOOD_DK, sw: .8 });
        paint(ellPts(x0 + w * .86, y0 + DH * .52, 10, 10, 10), { wash: GOLD, ink: PAL.ink, sw: .6 });
      }
    });
  }
  function chase(t, lt) {
    const smash = t >= SMASH, bp = bpOf(t);
    const [sx, sy] = smash ? shakeXY(t, 16 * (1 - seg(t, SMASH, SMASH + .3))) : [0, 0];
    camBegin(960 + sx + Math.sin(t * 1.3) * 20, 580 + sy, 1.12, 0);
    hallway(t, smash);
    for (let k = 0; k < ROUTES.length; k++) {
      const c = runner(t, k, .6);
      if (c) {
        const u = CU[k] * c.sc, squeeze = Math.min(1, (DW + 30) / (10 * CU[k]));
        clawd(c.x, c.y, u, { ...clawd.dance('run', t), view: 'side', flip: c.dir < 0, sx: lerp(squeeze, 1, c.out), rot: -.06, eyes: 'happy', aL: .6, aR: .6, boilKey: 'clawd' + k });
      }
      const r = runner(t, k, 0);
      if (r) researcher(r.x, r.y, 14 * r.sc, { run: t * 3.4, flip: r.dir < 0, eyes: 'wide', mouth: 'O', brows: 'worried', hairUp: 1, aL: 1 + .5 * Math.sin(t * 22), aR: 1 - .5 * Math.sin(t * 22), rot: r.dir * .12, boilKey: 'researcher' + k });
    }
    if (t >= OUT && t < SMASH + .15) {                  // the Researcher bursts out of the middle door, straight at the camera
      const p = easeIn(seg(t, OUT, SMASH + .12));
      researcher(960 - p * 330, lerp(HF - 20, 1560, p), lerp(10, 64, p), { run: t * 3.4, eyes: 'wide', mouth: 'O', brows: 'worried', hairUp: 1, aL: 1.2 + .4 * Math.sin(t * 22), aR: 1.2 - .4 * Math.sin(t * 22), emote: 'sweat', emoteAge: t - OUT, boilKey: 'researcher out' });
    }
    if (smash) {                                         // …and Clawd smashes through it, lunging at the lens, jaws wide
      const p = seg(t, SMASH, CHOMP), u = lerp(30, 150, easeIn(p));
      clawd(960, lerp(HF + 10, 1290, easeIn(p)), u, { lid: lerp(.45, 1, ease(p * 2)), eyes: 'happy', aL: 1.2, aR: 1.2, noShadow: p > .2, sq: -.08, boilKey: 'clawd lunge' });
      const a = t - SMASH;
      for (let i = 0; i < 9; i++) {
        boilSeed('plank' + i);
        const an = -Math.PI * (.05 + .9 * hash(i + 80)), v = 700 + hash(i + 81) * 800;
        push(); translate(960 + Math.cos(an) * v * a, 640 + Math.sin(an) * v * a + 1400 * a * a); rotate(a * 10 * (hash(i) - .5) + i);
        paint(rectPts(-60, -14, 120, 28, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 60, ink: PAL.ink, sw: .9 });
        pop();
      }
    }
    camEnd();
  }

  // "…alive" · Inside the mouth: the jaws slam shut over the camera on the beat. CHOMP (a Sound Word). Black, and the
  // Chorus opens from inside the mouth.
  function chomp(t, lt) {
    const close = easeIn(seg(t, CHOMP, SHUT));
    camBegin(960, 520, 1.12, 0);
    hallway(t, true);
    camEnd();
    const h = lerp(1500, 0, close);
    boilSeed('jaws');
    if (h > 14) {
      const top = 540 - h / 2, bot = 540 + h / 2;
      irisShape(rrPts(-240, top, W + 480, h, Math.min(140, h / 2 - 4)), '#3A1320');
      for (let i = 0; i < 9; i++) {
        const tx = -140 + i * 250;
        paint([[tx, top - 6], [tx + 210, top - 6], [tx + 105, top + 150]], { wash: PAL.cream, fill: CASE, fillOp: 60, ink: PAL.ink, sw: 1.2 });
        paint([[tx + 125, bot + 6], [tx + 335, bot + 6], [tx + 230, bot - 150]], { wash: PAL.cream, fill: CASE, fillOp: 60, ink: PAL.ink, sw: 1.2 });
      }
    } else paint(rectPts(-60, -60, W + 120, H + 120), { wash: PAL.ink, ink: null });
    if (t >= SHUT) {
      const [sx, sy] = shakeXY(t, 14);
      letter('CHOMP!', 960 + sx, 520 + sy, 240, PAL.ochre, { pop: (t - SHUT) * 6, rot: -.08, alpha: 1 - seg(t, VERSE.end - .08, VERSE.end), screen: true });
    }
  }

  chapter('lab', INTRO.start, VERSE.end, [[INTRO.start, curtainUp], [VERSE.start, labOver], [SPARKS, sparks], [REACT, reaction], [SHRUG, shrug],
    [LOSS, lossRide], [BURST, burst], [BOSS, boss], [CHASE, chase], [CHOMP, chomp]]);
})();
