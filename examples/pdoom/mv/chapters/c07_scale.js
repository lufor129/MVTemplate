// c07_scale: the Bridge, "scale". Data-centre teal with safety-orange accents. Down an endless tower of Clawds into
// the clouds; clicker training goes rogue (shades, folded arms); a chinchilla stuffs its cheeks with tokens and Clawd
// crunches itself into a super-dense glowing cube that drops through the floor, rolls through three safety fences and
// into the dark, bursts back into Clawd in an endless GPU aisle, and dances for a panel of Researcher clones whose thumb
// paddles go haywire while the whole frame rolls over and everyone slides out into alarm red.
// Ported from PDoomVideo/src/ch/c07_scale.js and re-timed to the analysed song: every event hangs off a Lyric Line, a
// word in it, or the Beat Grid.
(() => {
  const SO = '#F0762B', SO_DK = '#B9501E', SO_LT = '#F8A865';
  const TL = '#3A9C98', TL_DK = '#1E5F66', TL_DKK = '#123C45', TL_LT = '#8ED3C9', TL_PALE = '#CDEBE2';
  const HAZ = '#F2C53D', GOLD = '#F8CC62', ALARM = '#C8102E', LIGHT = '#FFF0C8';

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                  // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);   // n beats after the beat nearest t
  const BR = sec('Bridge');
  // A · "Just transformers all the way!"
  const TOWER = LINES[34].start, TILT = beatsAfter(TOWER, 1);       // hold on the tower's tip, then tilt down
  const LAND_A = nearestBar(word(34, 4));                           // "way!": the tilt lands on the bottom Clawd
  // B · "Till you learned to disobey"
  const CLICK = LINES[35].start, SIT = nearestBeat(word(35, 0));    // click: sit
  const SPIN = beatsAfter(SIT, 1), PAW = beatsAfter(SIT, 2);        // click: spin · click: paw
  const SNUB = beatsAfter(SIT, 3);                                  // the bar: shades on, arms folded
  const TURN0 = lerp(PAW, SNUB, .35), TURN1 = lerp(PAW, SNUB, .7);  // between them, Clawd turns away
  // C · "Post-Chinchilla, super-dense"
  const CHIN = LINES[36].start, IDEA = beatsAfter(CHIN, 1);         // Clawd watches the chinchilla, gets an idea
  const CRUNCH = nearestBeat(word(36, 2));                          // "super": Clawd crunches into a cube
  const DROP = nearestBar(word(36, 3));                             // "dense": it drops through the floor
  // D · "Breaking through each safety fence"
  const FENCE = LINES[37].start, LANDC = nearestBeat(FENCE);        // the cube lands on the fence line
  const HITS = [1, 2, 3].map(n => beatsAfter(FENCE, n));            // picket fence, traffic barrier, hazard tape
  const ROLL = LANDC + .1;
  // E · "Hundred thousand GPU"
  const AISLE = LINES[38].start, LIGHTS = nearestBeat(word(38, 1)); // "thousand": the aisle lights slam on
  const POP = nearestBeat(word(38, 2));                             // "GPU": the cube bursts back into Clawd
  const GROW = [beatsAfter(POP, 1), beatsAfter(POP, 2)];            // Clawd grows on the next two beats
  // F · "RLHF goes askew"
  const RLHF = LINES[39].start, REWARD = beatAt(Math.ceil(bpOf(RLHF)));   // all thumbs up, hearts to Clawd
  const HAYWIRE = nearestBeat(word(39, 1));                         // "goes": the paddles start spinning
  const ASKEW = word(39, 2), TIP = nearestBar(ASKEW);               // "askew": the frame rolls; on the bar it lurches
  const END = BR.end;                                               // roll +0.35 rad, solid alarm red

  // ---------- little helpers ----------
  const fluff = (cx, cy, rx, ry, n = 30, amp = .06, bumps = 12, rot = 0) => {
    const p = [];
    for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, f = 1 + amp * (Math.pow(Math.abs(Math.sin(a * bumps / 2)), .6) - .5); p.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]); }
    return p;
  };
  const bez = (p0, p1, p2, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]];
  const glowDot = (x, y, r, col = GOLD, op = 110) => { paint(ellPts(x, y, r * 2.2, r * 2.2, 14), { fill: col, fillOp: op, bleed: .3, tex: .2, border: .1, ink: null }); paint(ellPts(x, y, r, r, 10), { wash: PAL.cream, ink: null }); };
  // a token: a glowing pellet (pictures only, no writing)
  const pebble = (x, y, r, i = 0) => {
    paint(ellPts(x, y, r * 1.9, r * 1.6, 12), { fill: GOLD, fillOp: 70, bleed: .3, tex: .2, border: .1, ink: null });
    paint(ellPts(x, y, r, r * .78, 10, r * .06, hash(i) * 3), { wash: i % 3 ? GOLD : SO_LT, ink: PAL.ink, sw: .5 });
    paint(ellPts(x - r * .3, y - r * .25, r * .28, r * .18, 8), { wash: PAL.cream, ink: null });
  };
  // ballistic debris, a pure function of its age
  const fly = (x0, y0, vx, vy, age, g = 2200) => [x0 + vx * age, y0 + vy * age + .5 * g * age * age];
  // one puffy picture-book cloud clump (a few overlapping puffs), centred at (x, y), about 2w wide
  const cloudClump = (x, y, w, seed, o = {}) => {
    boilSeed('clump' + seed);
    const n = o.n || 4;
    for (let p = 0; p < n; p++) {
      const f = n === 1 ? .5 : p / (n - 1), r = w * (.42 + .22 * Math.sin(f * Math.PI)) * (.85 + .3 * hash(seed + p));
      const cx = x + (f - .5) * w * 1.5, cy = y - Math.sin(f * Math.PI) * w * .22 + (hash(seed * 3 + p) - .5) * w * .1;
      paint(fluff(cx, cy, r, r * .72, 22, .16, 7, seed + p), { wash: o.col || '#F7FCF8', washOp: 250, fill: o.shade || TL_LT, fillOp: 55, bleed: .12, tex: .4, border: .7, ink: o.ink || '#6FAAA4', sw: o.sw || .8, curv: .4 });
    }
  };

  // The super-dense cube: Clawd crushed into a glowing square, centred at (x, cy) with side L, rotated by rot.
  // o: heat (glow strength), eyes, mouth, lookX / lookY.
  function cube(t, x, cy, L, rot, o = {}) {
    const u = L / 6, heat = o.heat ?? 1;
    boilSeed('cube glow');
    paint(ellPts(x, cy, L * 1.25, L * 1.25, 20), { fill: GOLD, fillOp: 80 * clamp(heat), bleed: .35, tex: .2, border: .1, ink: null });
    paint(ellPts(x, cy, L * .85, L * .85, 18), { fill: SO_LT, fillOp: 70 * clamp(heat), bleed: .3, tex: .2, border: .1, ink: null });
    if (o.dark) glow(x, cy, L * 1.6 * heat, GOLD, .7);
    push(); translate(x, cy); rotate(rot);
    clawd(0, 5 * u, u, { noLegs: true, noShadow: true, sx: .6, aL: Math.PI, aR: Math.PI, col: '#E0692F', dk: '#9C3B1C', lt: '#FFD27A',
      eyes: o.eyes || 'narrow', mouth: o.mouth || 'flat', seed: 3, lookX: o.lookX, lookY: o.lookY, boilKey: 'cube',
      draw: uu => paint(starPts(2.2 * uu, -7.3 * uu, uu * .9 * (1 + .25 * Math.sin(t * 30))), { wash: PAL.cream, ink: null }) });   // a hot glint on a corner
    pop();
  }

  // =====================================================================================================
  // The chinchilla (a Guest, on CAST for the curtain call): a round lilac-grey fluffball with big pink ears and a bushy
  // tail. CAST.chinchilla(x, y, s, t, o): (x, y) ground point between the feet, s on Clawd's u scale (≈8.4s wide,
  // ≈11.7s to the ear tips; s ≈ 24 is a medium shot). t drives its idle (a breathing bob on the beat, nose and ear
  // twitches). o: cheeks 0..1 (pouches stuffed), paws 0..1 (raised to the mouth), chew 0..1 (mouth open), eyes
  // ('normal' | 'wide' | 'happy' | 'closed'), lookX, blush, bow 0..1 (a curtain-call bow), hold (a token in its paws),
  // dy, sq, rot, flip, noShadow, col (fur), still (no idle), boilKey, draw(s, sw) hook (body-local).
  // =====================================================================================================
  CAST.chinchilla = (x, y, s, t, o = {}) => {
    const key = o.boilKey || 'chinchilla', bs = part => boilSeed(key + ' ' + part);
    const FUR = o.col || '#ABA8BE', FUR_DK = '#76728F', FUR_LT = '#EDE8F1', PINK = '#F2A7B8';
    const bow = clamp(o.bow || 0), ch = clamp(o.cheeks || 0), sw = clamp(s / 15, .45, 2.4), J = s * .04;
    const bp = bpOf(t), breathe = o.still ? 0 : Math.abs(Math.sin(bp * Math.PI)), twitch = o.still ? 0 : Math.max(0, Math.sin(t * 9)) * Math.max(0, Math.sin(t * 1.7));
    const sq = (o.sq || 0) + .035 * pulse(t, 5) * (o.still ? 0 : 1);
    bs('shadow');
    if (!o.noShadow) paint(ellPts(x, y + s * .15, s * 4.8, s * .9, 20), { fill: PAL.ink, fillOp: 90, bleed: .25, tex: .3, border: .1, ink: null });
    push(); translate(x, y + ((o.dy || 0) - .12 * breathe) * s); if (o.rot) rotate(o.rot);
    scale((o.flip ? -1 : 1) * (1 + sq * .5 + bow * .04), 1 - sq - bow * .08);
    bs('tail');   // bushy tail curling up behind
    paint(fluff(3.9 * s, -2.6 * s, 1.5 * s, 2.5 * s, 24, .25, 9, .4 + .1 * Math.sin(bp * Math.PI)), { wash: FUR, fill: FUR_DK, fillOp: 60, bleed: .1, tex: .6, ink: PAL.ink, sw: sw * .8, curv: .3 });
    bs('feet');
    for (const fx of [-1.6, 1.6]) paint(ellPts(fx * s, -.3 * s, 1.05 * s, .5 * s, 14, J), { wash: FUR_LT, fill: PINK, fillOp: 50, ink: PAL.ink, sw: sw * .7 });
    bs('body');   // round fluffy body with a pale belly
    const body = fluff(0, -3.3 * s, 4.2 * s, 3.4 * s, 36, .07, 16);
    paint(body, { wash: FUR, ink: null });
    paint(ellPts(0, -2.7 * s, 2.7 * s, 2.3 * s, 22, J), { fill: FUR_LT, fillOp: 190, bleed: .15, tex: .5, border: .6, ink: null });
    paint(ellPts(0, -1.1 * s, 3.6 * s, 1 * s, 18, J), { fill: FUR_DK, fillOp: 70, bleed: .1, tex: .6, ink: null });
    paint(body, { ink: PAL.ink, sw, curv: .3 });
    // head, dropping forward on a bow
    const hy = -6.9 * s + bow * 2.3 * s;
    bs('ears');
    for (const side of [-1, 1]) {
      const ea = side * (.32 + bow * .55) + (side > 0 ? .12 * twitch : 0), ex = side * (2.1 + bow * .6) * s, ey = hy - 2.7 * s + bow * .9 * s;
      paint(ellPts(ex, ey, 1.55 * s, 2.1 * s, 22, J, ea), { wash: FUR, fill: FUR_DK, fillOp: 40, tex: .5, ink: PAL.ink, sw: sw * .85 });
      paint(ellPts(ex + side * .05 * s, ey + .2 * s, .95 * s, 1.45 * s, 18, J, ea), { wash: PINK, fill: '#E27A92', fillOp: 60, tex: .5, ink: null });
    }
    bs('head');
    const head = fluff(0, hy, 3.3 * s, 2.7 * s, 32, .06, 14);
    paint(head, { wash: FUR, fill: FUR_DK, fillOp: 30, bleed: .1, tex: .5, border: .5, ink: PAL.ink, sw: sw * .9, curv: .3 });
    paint(ellPts(0, hy + 1.1 * s, 1.9 * s, 1.2 * s, 18, J), { fill: FUR_LT, fillOp: 200, bleed: .15, tex: .4, ink: null });
    // cheek pouches: puff out past the head outline as they fill
    if (ch > .01) {
      bs('cheeks');
      for (const side of [-1, 1]) {
        const r = (.8 + ch * 1.35) * s, cx = side * (1.85 + ch * .95) * s, cy = hy + 1.15 * s + ch * .25 * s;
        paint(ellPts(cx, cy, r * 1.02, r * .88, 20, J), { wash: '#C9C4D8', fill: FUR_LT, fillOp: 140, bleed: .1, tex: .5, ink: PAL.ink, sw: sw * .8 });
        paint(ellPts(cx + side * .15 * r, cy + .15 * r, r * .45, r * .3, 12), { fill: PINK, fillOp: 150, bleed: .2, ink: null });
      }
    }
    // eyes: big glossy beads, closing on a bow (and blinking now and then)
    bs('eyes');
    const blink = !o.still && ((t * .9 + 2.1) % 3.3) < .11;
    const eyes = bow > .4 ? 'happy' : blink && (o.eyes || 'normal') === 'normal' ? 'closed' : (o.eyes || 'normal');
    for (const side of [-1, 1]) {
      const ex = side * 1.35 * s + (o.lookX || 0) * .15 * s, ey = hy - .35 * s;
      if (eyes === 'happy' || eyes === 'closed') inkLine([[ex - .55 * s, ey + .2 * s], [ex, ey - (eyes === 'happy' ? .35 : -.2) * s], [ex + .55 * s, ey + .2 * s]], sw * 1.1, PAL.ink, 'ink', .5);
      else {
        const big = eyes === 'wide' ? 1.25 : 1;
        paint(ellPts(ex, ey, .6 * s * big, .72 * s * big, 16), { wash: PAL.ink, ink: null });
        paint(ellPts(ex - .2 * s, ey - .28 * s, .2 * s, .2 * s, 8), { wash: PAL.cream, ink: null });
        paint(ellPts(ex + .18 * s, ey + .22 * s, .09 * s, .09 * s, 6), { wash: PAL.cream, ink: null });
      }
    }
    if (o.blush || ch > .5) for (const side of [-1, 1]) paint(ellPts(side * 2.2 * s, hy + .7 * s, .55 * s, .28 * s, 12), { fill: PAL.rose, fillOp: 140, bleed: .2, ink: null });
    // nose (it twitches), mouth, whiskers
    bs('nose');
    paint(ellPts(0, hy + .55 * s - .06 * twitch * s, .32 * s, .22 * s, 10), { wash: '#E77F98', ink: PAL.ink, sw: sw * .4 });
    const chew = o.chew || 0;
    if (chew > .05) paint(ellPts(0, hy + 1.2 * s, .28 * s, .22 * s * chew + .05 * s, 10), { wash: '#6A2A35', ink: PAL.ink, sw: sw * .4 });
    else inkLine([[-.4 * s, hy + 1.05 * s], [-.2 * s, hy + 1.25 * s], [0, hy + .8 * s], [.2 * s, hy + 1.25 * s], [.4 * s, hy + 1.05 * s]], sw * .55, PAL.ink, 'inkfine', .5);
    for (const side of [-1, 1]) for (const k of [-1, 0, 1]) inkLine([[side * .6 * s, hy + .75 * s], [side * (3.2 + ch * 1.2) * s, hy + (.35 + k * .45 - .1 * twitch) * s]], sw * .35, PAL.ink, 'inkfine', .2);
    // little front paws: at the chest, raised to the mouth while eating, clasped on a bow
    bs('paws');
    const pu = clamp(o.paws || 0);
    for (const side of [-1, 1]) {
      const px = side * lerp(1.0, .55, pu) * s, py = lerp(hy + 2.9 * s, hy + 1.7 * s, pu);
      paint(ellPts(px, py, .55 * s, .45 * s, 12, J), { wash: FUR_LT, ink: PAL.ink, sw: sw * .6 });
    }
    if (o.hold) pebble(0, hy + 1.6 * s, .45 * s);
    if (o.draw) o.draw(s, sw);
    pop();
    boilSeed(key + ' after');
  };

  // =====================================================================================================
  // A · "Just transformers all the way!" · The camera tilts down an endless tower of Clawds stacked on each other's
  // backs, attention arcs looping between them. It holds on the tower's tip, then tilts down faster and faster, into a
  // bank of cloud, and lands on the bottom Clawd standing on a training mat. The stack is self-similar: each level is
  // K× the one above, so the tower recedes to a point in the sky however far down we go.
  // Seam in: Chapter 6's brush wipe drags off. Seam out: cut from the landing to the training ground.
  // =====================================================================================================
  const K = 1.2, U = 28, GY = 905, NB = 9;             // the bottom level NB is u = U, standing on y = GY, once we land
  const BC = 8 * U * K / (K - 1), A0 = GY - BC;        // level i stands on the back of level i + 1; the tip is at y A0
  const lev = (i, lam) => { const k = Math.pow(K, i - lam); return { u: U * k, gy: A0 + BC * k, k }; };
  const towerX = (i, u, t) => 960 + (i < NB ? u * (.55 * Math.sin(i * 1.9 + .6) + .22 * Math.sin(t * 2.3 + i * .8)) : 0);
  const tiltF = p => p < .78 ? .72 * Math.pow(p / .78, 2.2) : .72 + .28 * (1 - Math.pow(1 - (p - .78) / .22, 2));
  const lamAt = t => NB - 8 + 8 * tiltF(seg(t, TILT, LAND_A));
  const BANK = [NB - 6.2, NB - 2.55];                  // the cloud bank the tower sinks into (in levels): the room's ceiling
  const FACES = [['happy', 'smile'], ['normal', 'cat'], ['wink', 'grin'], ['happy', 'smile'], ['look', 'cat'], ['normal', 'o']];

  // the training room under the clouds, drawn at level NB's scale (k), centred on the tower
  function trainingRoom(k, wallTop, t) {
    const fy = GY, X = x => 960 + (x - 960) * k;
    boilSeed('room wall');
    paint(rectPts(-300, wallTop, W + 600, fy - wallTop + 40), { wash: '#5AAEA6', fill: TL_DK, fillOp: 60, bleed: .1, tex: .7, border: .5, ink: null });
    if (fy - 420 * k > wallTop + 40) pawPrint(X(1420), fy - 330 * k, 62 * k, '#79C2B8');
    paint(rectPts(-300, fy - 150 * k, W + 600, 34 * k), { wash: SO, ink: PAL.ink, sw: .8, hatch: { d: 36 * k, a: .8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1.2 } });
    boilSeed('room floor');
    paint([[-300, fy - 80 * k], [W + 300, fy - 80 * k], [W + 300, fy + 900], [-300, fy + 900]], { wash: '#DCD3C0', fill: '#A99F8A', fillOp: 60, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.2 });
    paint(ellPts(960, fy, 230 * k, 40 * k, 26, 3), { wash: SO_LT, fill: SO, fillOp: 60, tex: .5, ink: PAL.ink, sw: .8 });   // the training mat
  }
  function pawPrint(px, py, r, col) {
    boilSeed('paw print' + Math.round(px));
    paint(ellPts(px, py, r, r * .82, 20, r * .03), { wash: col, ink: null });
    [[-1.05, -1.05], [-.38, -1.45], [.38, -1.45], [1.05, -1.05]].forEach(([dx, dy]) => paint(ellPts(px + dx * r, py + dy * r, r * .34, r * .42, 14, r * .02), { wash: col, ink: null }));
  }

  function tower(t, lt, dur) {
    const lam = lamAt(t), speed = (lamAt(t + .02) - lam) / .02;               // levels per second
    const land = t - LAND_A, thud = land > 0 ? Math.exp(-land * 7) : 0;
    const zk = ease(seg(t, TOWER + .15, TILT + 1.0));
    const [sx, sy] = shakeXY(t, 14 * thud + 2 * clamp(speed / 8));
    const z = lerp(.62, 1, zk), cy = lerp(254, 540, zk);
    camBegin(960 + sx, cy + sy, z + .02 * thud, .02 * Math.sin(t * 1.3) * (1 - zk * .6));
    const yTop = cy - 540 / z - 40, yBot = cy + 540 / z + 40, xL = 960 - 960 / z - 60, xR = 960 + 960 / z + 60;
    const scroll = (lam - NB + 8) * 8 * U;                                        // pixels travelled, for parallax

    // sky: teal overhead, paling downward
    boilSeed('tower sky');
    paint(rectPts(xL, yTop, xR - xL, yBot - yTop), { wash: '#A9DCD2', ink: null });
    paint(rectPts(xL, yTop, xR - xL, 520 - yTop), { fill: TL, fillOp: 95, bleed: .25, tex: .5, border: .5, ink: null });
    paint(rectPts(xL, 640, xR - xL, yBot - 640), { fill: '#EFF9F4', fillOp: 150, bleed: .25, tex: .4, border: .4, ink: null });
    // far cloud wisps drift up as we sink (parallax)
    for (let k = 0; k < 6; k++) {
      boilSeed('wisp' + k);
      const span = yBot - yTop + 400, yy = yTop - 200 + (((k * 330 - scroll * .35) % span) + span) % span, side = k % 2 ? 1 : -1;
      paint(fluff(960 + side * (560 + 140 * hash(k)), yy, 330, 90, 22, .25, 8, k), { fill: '#F6FCF9', fillOp: 150, bleed: .25, tex: .4, border: .5, ink: null });
    }
    // speed streaks rushing up past the tower
    if (speed > 1.5) {
      boilSeed('tower streaks');
      for (let k = 0; k < 10; k++) {
        const xx = 120 + hash(k * 3) * 1680, len = 26 * speed, yy = ((hash(k) * 1400 - scroll * (.8 + .4 * hash(k + 1))) % 1400 + 1400) % 1400 - 200;
        if (Math.abs(xx - 960) < 330) continue;
        inkLine([[xx, yy], [xx, yy + len]], 1, '#F4FBF7', 'inkfine', 0);
      }
    }
    // the room under the cloud bank appears as we reach the bottom
    const kN = lev(NB, lam).k, bankBot = lev(BANK[1], lam).gy, bankTop = lev(BANK[0], lam).gy;
    if (bankBot < yBot + 200) trainingRoom(kN, bankBot - 60, t);

    // which levels are on screen (and not buried in the cloud bank)
    const vis = [];
    for (let i = NB; i > NB - 40; i--) {
      const l = lev(i, lam);
      if (l.u * z < 2.2) break;
      if (l.gy - 8 * l.u > yBot || l.gy < yTop) continue;
      if (l.gy - 8 * l.u > bankTop && l.gy < bankBot + 10) continue;
      vis.push(i);
    }
    const lowest = vis.length ? vis[vis.length - 1] : NB;
    // the spire: past the smallest drawn Clawd, the tower is a thread running up to its tip, with a twinkle
    boilSeed('spire');
    { const l = lev(lowest, lam); if (l.gy - 8 * l.u > A0 + 4) inkLine([[960 - l.u * 2.5, l.gy - 8 * l.u], [960, A0]], 1.2, SO_DK, 'ink', 0); inkLine([[960 + l.u * 2.5, l.gy - 8 * l.u], [960, A0]], 1.2, SO_DK, 'ink', 0); }
    paint(starPts(960, A0, 26 * (1 + .3 * pulse(t, 4)), .35, 4, t), { wash: PAL.cream, fill: GOLD, fillOp: 80, ink: null });

    // attention arcs (behind the Clawds): glowing loops from each Clawd's side to the ones below it
    for (const i of vis) for (const [j, side] of [[i + 1, i % 2 ? 1 : -1], [i + 2, i % 2 ? -1 : 1]]) {
      if (j > NB) continue;
      boilSeed('arc' + i + '-' + j);
      const a = lev(i, lam), b = lev(j, lam);
      const p0 = [towerX(i, a.u, t) + side * 5.4 * a.u, a.gy - 4.8 * a.u], p2 = [towerX(j, b.u, t) + side * 5.4 * b.u, b.gy - 4.8 * b.u];
      const bulge = (p2[1] - p0[1]) * .7 + 1.5 * a.u, p1 = [(p0[0] + p2[0]) / 2 + side * bulge, (p0[1] + p2[1]) / 2];
      const pts = []; for (let q = 0; q <= 7; q++) pts.push(bez(p0, p1, p2, q / 7));
      const lit = Math.exp(-frac(bpOf(t) - i * .25 - (j - i) * .5) * 3);
      inkLine(pts, 5 * a.k, mixCol('#FFF1D2', GOLD, .3 + .7 * lit), 'marker', .5);
      inkLine(pts, (1.3 + .9 * lit) * Math.min(1, a.k * 1.3), mixCol(SO_DK, SO, lit), 'ink', .5);
      if (a.u * z > 6) for (const off of [0, .5]) { const q = frac(t * .9 + hash(i * 3 + j) + off), pp = bez(p0, p1, p2, q); glowDot(pp[0], pp[1], (5 + 4 * lit) * a.k, GOLD, 100); }
      paint(ellPts(p0[0], p0[1], 7 * a.k, 7 * a.k, 10), { wash: SO, ink: PAL.ink, sw: .6 });
    }

    // the Clawds, biggest (lowest) first so each one's feet sit on the back below
    for (const i of vis) {
      const { u, gy } = lev(i, lam), x = towerX(i, u, t), f = Math.floor(hash(i * 7.3 + 40) * 6);
      const bp = bpOf(t) - i * .2, hit = Math.exp(-frac(bp) * 5);
      const o = { noShadow: i !== NB, seed: i, sq: .08 * hit, eyes: FACES[f][0], mouth: FACES[f][1], lookY: -1, lookX: (i % 2 ? .6 : -.6),
        aL: 1.25 + .2 * Math.sin(bp * Math.PI), aR: 1.25 - .2 * Math.sin(bp * Math.PI), boilKey: 'tower' + i, key: 'tower' + i };
      if (((i % 4) + 4) % 4 === 2) Object.assign(o, { eyes: 'closed', mouth: 'wobble', emote: 'sweat', emoteK: .85 + .15 * hit, aL: 1.45, aR: 1.45 });
      if (((i % 7) + 7) % 7 === 5) Object.assign(o, { eyes: 'closed', mouth: 'o', emote: 'zzz', emoteK: 1, aL: -.2, aR: -.2 });
      if (i === NB) {   // the bottom Clawd: holding the whole thing up, delighted; the landing squashes it
        const md = clawd.emotions(t, [[TOWER, 'happy'], [LAND_A + .05, 'happy', { emote: 'spark' }]]);
        Object.assign(o, md, { mouth: 'grin', blush: 1, lookY: -.6, lookX: .3, sq: (md.sq || 0) + .22 * thud * Math.cos(land * 20), aL: 1.4, aR: 1.4, boilKey: 'clawd' });
      }
      if (u * z < 9) { if (o.emote) delete o.emote; miniClawd(x, gy, u, { ...o, noShadow: true }); }
      else clawd(x, gy, u, o);
      if (i < NB) { boilSeed('foot shadow' + i); paint(ellPts(x, gy + u * .12, 4.6 * u, .45 * u, 16), { fill: PAL.ink, fillOp: 70, bleed: .2, tex: .2, ink: null }); }
    }

    // cloud rings the tower pierces, passing in front (every 2.1 levels above the bank)
    for (let m = 0; m < 12; m++) {
      const c = BANK[0] - .6 - 2.1 * m, { u, gy } = lev(c, lam);
      if (u * z < 3) break;
      if (gy < yTop - 100 || gy - 3 * u > yBot + 150) continue;
      const side = m % 2 ? 1 : -1, dr = wob(t, .25, m) * u * .4;
      cloudClump(960 + side * 9.5 * u + dr, gy, 7 * u, 13 + m * 7, { n: 4 });
      cloudClump(960 - side * 12 * u - dr, gy - 1.8 * u, 5.5 * u, 17 + m * 5, { n: 3 });
    }
    // the cloud bank: a thick band of puffs; the camera sinks through it
    if (bankTop < yBot + 300 && bankBot > yTop - 300) {
      boilSeed('bank');
      const top = Math.max(bankTop, yTop - 300), bot = Math.min(bankBot, yBot + 300);
      paint(rectPts(xL, top + 50, xR - xL, bot - top - 100), { wash: '#F4FAF6', washOp: 250, fill: TL_LT, fillOp: 40, tex: .4, border: .5, ink: null });
      // inside the cloud: soft puffs streaming up past the lens
      const hb = bot - top;
      if (hb > 200) for (let k = 0; k < 9; k++) {
        boilSeed('bank puff' + k);
        const yy = top + (((hash(k + 3) * hb - scroll * (.9 + .5 * hash(k))) % hb) + hb) % hb, r = 140 + 120 * hash(k + 5);
        paint(fluff(xL + hash(k * 2.7) * (xR - xL), yy, r * 1.6, r, 22, .2, 7, k), { fill: k % 3 ? TL_LT : '#DDEFEA', fillOp: 90, bleed: .25, tex: .5, border: .6, ink: k % 2 ? '#9CC9C2' : null, sw: .6, curv: .4 });
      }
      const uu = lev(BANK[0], lam).u, ub = lev(BANK[1], lam).u;
      if (bankTop > yTop - 300) for (let k = -1; k < 6; k++) cloudClump(xL + k * (xR - xL) / 4.6, bankTop + 30 * Math.sin(k * 2.1), Math.max(160, 7 * uu), 70 + k * 5, { n: 3 });
      if (bankBot < yBot + 300) for (let k = -1; k < 6; k++) cloudClump(xL + (k + .5) * (xR - xL) / 4.6, bankBot - 1.2 * ub + 20 * Math.sin(k * 1.7), Math.max(150, 5.5 * ub), 90 + k * 3, { n: 3 });
    }
    // landing puff around the bottom Clawd's feet
    if (land > 0 && land < .45) for (let k = 0; k < 2; k++) {
      boilSeed('land puff' + k);
      const s = k ? 1 : -1, q = seg(land, 0, .45);
      paint(ellPts(960 + s * (170 + 160 * easeOut(q)), GY - 14 - 20 * q, 48 * (1 - q * .5), 30 * (1 - q * .5), 12), { wash: PAL.cream, washOp: 230 * (1 - q), ink: PAL.ink, sw: .6 });
    }
    camEnd();
    // Seam in: Chapter 6's brush wipe (teal over indigo) drags off
    if (lt < .3) brushWipe(.5 + lt / .6, [PAL.teal, PAL.indigo]);
  }

  // =====================================================================================================
  // B · "Till you learned to disobey" · Clicker training: the Researcher clicks and Clawd sits, spins, gives a paw, one
  // trick per beat. Then Clawd turns away, chin up, the shades drop onto its face and its arms fold on the bar; the
  // Researcher clicks and clicks, in vain. Seam in: cut from the tower's landing. Seam out: cut on the beat.
  // =====================================================================================================
  const CX = 1190, CY = 893, CU = 27, RX = 745;
  function disobey(t, lt, dur) {
    const clicks = [SIT, SPIN, PAW, SNUB - .32, SNUB - .14, SNUB + .1, SNUB + .2, SNUB + .3];
    const punch = backOut(seg(t, SNUB - .06, SNUB + .16));
    camBegin(lerp(965, 1000, ease(lt / 2)) + punch * 100, 650 - punch * 25, 1.3 + .04 * ease(lt / 2) + .12 * punch, 0);

    // the training room: teal wall with a big paw print, cloud puffs under the ceiling, hazard band, pale floor
    boilSeed('wall');
    paint(rectPts(-300, -300, W + 600, 1110), { wash: '#5AAEA6', fill: TL_DK, fillOp: 60, bleed: .1, tex: .7, border: .5, ink: null });
    pawPrint(965, 470, 62, '#79C2B8');
    for (let k = 0; k < 4; k++) cloudClump(300 + k * 460 + 30 * wob(t, .2, k), 245 + 25 * Math.sin(k * 2.3), 190, 120 + k * 3, { n: 3, sw: .6 });
    boilSeed('hazard band');
    paint(rectPts(-300, 700, W + 600, 46), { wash: SO, ink: PAL.ink, sw: .8, hatch: { d: 36, a: .8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1.2 } });
    boilSeed('floor');
    paint([[-300, 790], [W + 300, 790], [W + 300, 1400], [-300, 1400]], { wash: '#DCD3C0', fill: '#A99F8A', fillOp: 60, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.2 });
    inkLine([[-300, 880], [W + 300, 884]], .5, '#B3A88F', 'inkfine', 0);
    for (const [cx, sc] of [[430, 1], [1560, .9]]) {   // agility cones
      boilSeed('cone' + cx);
      paint([[cx - 34 * sc, 820], [cx - 8 * sc, 700], [cx + 8 * sc, 700], [cx + 34 * sc, 820]], { wash: SO, fill: SO_DK, fillOp: 50, tex: .5, ink: PAL.ink, sw: .9 });
      paint([[cx - 24 * sc, 772], [cx - 16 * sc, 745], [cx + 16 * sc, 745], [cx + 24 * sc, 772]], { wash: PAL.cream, ink: null });
      paint(rectPts(cx - 46 * sc, 816, 92 * sc, 12, 1), { wash: SO_DK, ink: PAL.ink, sw: .8 });
    }
    boilSeed('mat');
    paint(ellPts(CX, CY, 230, 40, 26, 3), { wash: SO_LT, fill: SO, fillOp: 60, tex: .5, ink: PAL.ink, sw: .8 });
    boilSeed('treat bowl');
    paint([[1410, 868], [1500, 868], [1486, 900], [1424, 900]], { wash: TL, ink: PAL.ink, sw: .9 });
    paint(ellPts(1455, 868, 45, 8, 14), { wash: '#2D6E73', ink: PAL.ink, sw: .6 });
    for (const [bx, by] of [[1440, 860], [1466, 858]]) paint(ellPts(bx, by, 9, 6, 8), { wash: GOLD, ink: PAL.ink, sw: .4 });

    // --- Clawd: eager hops, then sit, spin, paw on the clicks; then the snub ---
    const pre = clawd.dance('hop', t, 1);
    let dy = t < SIT ? pre.dy * .45 : 0, sq = t < SIT ? pre.sq : 0, aL = t < SIT ? pre.aL : .35, aR = t < SIT ? pre.aR : .35, rot = 0;
    let pose = { view: 'q', flip: true };                                                     // facing the Researcher
    const sitK = backOut(seg(t, SIT + .02, SIT + .14)) * (1 - ease(seg(t, SPIN - .06, SPIN + .01)));
    sq += .26 * sitK; aL = lerp(aL, -.25, sitK); aR = lerp(aR, -.25, sitK);
    const sp = seg(t, SPIN + .02, SPIN + .36);                                                 // a spin through the key views
    if (sp > 0 && sp < 1) { pose = { ...clawd.spin(-.125 + sp), smear: sp > .1 && sp < .9 ? .5 : 0, smearDir: 0 }; dy = -Math.sin(sp * Math.PI) * 3.2; aL = aR = 1.2; sq = -.1 * Math.sin(sp * Math.PI); }
    const pawK = backOut(seg(t, PAW + .02, PAW + .14)) * (1 - ease(seg(t, TURN0 - .04, TURN0 + .02)));
    aR = lerp(aR, 1.45 + .25 * Math.sin(t * 24), pawK); dy -= .6 * pawK; rot -= .06 * pawK;
    // the turn away: a little hop while it steps round to profile, facing right, away from the Researcher
    if (t > TURN0) { pose = clawd.turn(t, TURN0, TURN1, -.125, .25); const tu = seg(t, TURN0, TURN1); dy -= Math.sin(tu * Math.PI) * 1.2; rot = -.1 * ease(tu); aL = aR = .2; }
    const crossK = backOut(seg(t, SNUB - .08, SNUB + .08));
    const md = clawd.emotions(t, [[CLICK, 'happy', { emote: null }], [TURN0 + .02, 'smug'], [SNUB, 'cool', { emote: null }]]);
    const em = t < SPIN ? ['heart', seg(t, SIT + .04, SIT + .22)] : t < PAW ? ['music', seg(t, SPIN + .3, SPIN + .42)] : t < TURN0 ? ['heart', seg(t, PAW + .06, PAW + .2)] : [null, 0];
    const shadesDrop = seg(t, SNUB - .16, SNUB);
    const land = t > SNUB ? Math.exp(-(t - SNUB) * 14) : 0;
    clawd(CX, CY, CU, {
      ...md, ...pose, dy: dy + (t < TURN0 ? (md.dy || 0) * .3 : 0), rot, aL: crossK > .3 ? .7 : aL, aR: crossK > .3 ? .7 : aR,
      lookX: t < TURN0 ? 1 : .2, lookY: t < TURN0 ? -.4 : -.6, sq: sq + (md.sq || 0) * .6 + .07 * land,
      mouth: t < TURN0 ? 'smile' : t < SNUB ? 'flat' : 'smirk', blush: t < TURN0 ? 1 : 0, eyes: t < SNUB ? (t < TURN0 ? 'happy' : 'narrow') : 'shades', emote: em[0], emoteK: em[1],
      boilKey: 'clawd',
      draw: (uu, sw) => {
        if (t < TURN0) paint(ellPts(.5 * uu, -3.95 * uu, .42 * uu, .55 * uu, 12), { wash: PAL.rose, ink: PAL.ink, sw: sw * .5 });   // puppy tongue
        if (shadesDrop > 0 && shadesDrop < 1) {                                                  // the shades dropping onto the face
          const oy = -lerp(5 * uu, 0, easeIn(shadesDrop)), cx = 1.35 * uu;
          paint([[cx - 1.5 * uu, -7.1 * uu + oy], [cx + 1.5 * uu, -7.1 * uu + oy], [cx + 1.2 * uu, -5.4 * uu + oy], [cx - 1.2 * uu, -5.4 * uu + oy]], { wash: '#2A2740', ink: PAL.ink, sw: sw * .8, curv: .3 });
          inkLine([[cx - 1.5 * uu, -6.9 * uu + oy], [-3 * uu, -7 * uu + oy]], sw * .8, PAL.ink, 'ink', 0);
        }
        const gl = seg(t, SNUB + .06, SNUB + .4);
        if (gl > 0 && gl < 1) paint(starPts(2.9 * uu, -6.7 * uu, uu * 1.3 * Math.sin(gl * Math.PI)), { wash: PAL.cream, fill: GOLD, fillOp: 60, ink: null });
        if (crossK > .3) {                                                                       // folded arms (profile): the far hand
          const len = 1.6 * uu * crossK;                                                          // peeks out under the near forearm
          paint(rrPts(2.3 * uu, -3.85 * uu, len, .9 * uu, .45 * uu), { wash: PAL.clayDk, ink: PAL.ink, sw: sw * .7 });
        }
        const hp = seg(t, SNUB + .02, SNUB + .45);                                               // "hmph" puffs out of the nose
        if (hp > 0 && hp < 1) for (const k of [0, 1]) paint(ellPts((3.6 + hp * 3 + k * 1.2) * uu, -(4.9 + k * .9 + hp * .8) * uu, (1 - hp) * (.9 - k * .25) * uu, (1 - hp) * (.7 - k * .2) * uu, 12), { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
      }
    });

    // --- the Researcher with the clicker ---
    const lastClick = clicks.filter(c => c <= t).pop() ?? -9, ca = t - lastClick;
    const rm = researcher.emotions(t, [[CLICK, 'happy'], [TURN0 + .15, 'surprised'], [SNUB + .12, 'nervous', { lookX: 1 }]]);
    const clickPush = Math.exp(-ca * 14), armA = .3 + clickPush * .14 + (t > SNUB ? .2 : 0);
    researcher(RX, 900, 25, {
      ...rm, lookX: 1, dy: (rm.dy || 0) + (t < TURN0 ? -Math.abs(Math.sin(bpOf(t) * Math.PI)) * .3 : 0), hairUp: Math.max(rm.hairUp || 0, seg(t, SNUB - .05, SNUB + .15) * .8),
      aL: t < TURN0 ? -1.1 : .6 + .2 * Math.sin(t * 20), aR: armA, boilKey: 'researcher',
      handR: (ss, sw) => {
        rotate(armA);
        paint(rrPts(-.7 * ss, -1.6 * ss, 1.4 * ss, 1.9 * ss, .45 * ss), { wash: SO, fill: SO_DK, fillOp: 50, tex: .5, ink: PAL.ink, sw: sw * .7 });
        paint(ellPts(0, -1.6 * ss + clickPush * .22 * ss, .45 * ss, .24 * ss, 10), { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
        if (ca < .16) for (let k = -1; k <= 1; k++) { const a = -Math.PI / 2 + k * .6, r0 = 2.1 * ss, r1 = (2.8 + ca * 6) * ss; inkLine([[Math.cos(a) * r0, -1.4 * ss + Math.sin(a) * r0], [Math.cos(a) * r1, -1.4 * ss + Math.sin(a) * r1]], sw * 1.2, PAL.ink, 'ink', 0); }
      }
    });
    camEnd();
  }

  // =====================================================================================================
  // C · "Post-Chinchilla, super-dense" · On the data-centre floor a fluffy chinchilla hoovers glowing tokens into its
  // cheeks. Clawd watches, gets an idea, stretches up and CRUNCHES itself into a tiny glowing cube; the floor dents and
  // cracks under it, and on the bar it drops straight through. Push in, then the camera dives down after it.
  // Seam in: cut on the beat. Seam out: the cube falls out of the bottom of the shot and lands in D.
  // =====================================================================================================
  const PX0 = 460, PY0 = 872, KX = 1250, KY = 876, KL = 104;
  const cubeFallY = t => KY - KL / 2 + .5 * 11000 * Math.pow(Math.max(0, t - DROP), 2);
  const SLAB = 1080;                                   // the floor's front edge; the dark underfloor is below it
  const floorTiles = (x0, x1) => {
    for (let i = -8; i <= 9; i++) { const a = [960 + i * 170, 760], b = [960 + i * 170 * 2.2, SLAB], k0 = (x0 - a[0]) / (b[0] - a[0]), k1 = (x1 - a[0]) / (b[0] - a[0]);
      const lo = clamp(Math.min(k0, k1)), hi = clamp(Math.max(k0, k1)); if (hi > lo) inkLine([[lerp(a[0], b[0], lo), lerp(a[1], b[1], lo)], [lerp(a[0], b[0], hi), lerp(a[1], b[1], hi)]], .6, '#5F8781', 'inkfine', 0); }
    for (const yy of [820, 905, 1010]) inkLine([[x0, yy], [x1, yy]], .6, '#5F8781', 'inkfine', 0);
  };
  function chinchillaShot(t, lt, dur) {
    const dropA = t - DROP;
    const [sx, sy] = shakeXY(t, dropA >= 0 ? 18 * Math.exp(-dropA * 7) : 4 * seg(t, CRUNCH + .1, DROP));
    const pushK = ease(seg(t, CRUNCH - .25, DROP - .1)), dive = ease(seg(t, DROP + .05, DROP + .34));
    const ccy = lerp(lerp(640, 690, pushK), Math.max(1350, cubeFallY(t) - 40), dive);
    camBegin(lerp(lerp(880, 960, ease(lt / .6)), 1180, pushK) + sx, ccy + sy, lerp(1.24, 1.5, pushK), 0);

    // data-centre floor: dark rack silhouettes behind, raised-floor tiles in front
    boilSeed('dc wall');
    paint(rectPts(-300, -300, W + 600, 1100), { wash: '#2C6F72', fill: TL_DKK, fillOp: 90, bleed: .1, tex: .7, border: .5, ink: null });
    for (let r = 0; r < 9; r++) {
      boilSeed('dc rack' + r);
      const rx = -200 + r * 260;
      paint(rectPts(rx, 170, 210, 600, 3), { wash: '#1D4A52', fill: TL_DKK, fillOp: 70, tex: .6, ink: PAL.ink, sw: .8 });
      for (let k = 0; k < 4; k++) paint(ellPts(rx + 40 + (k % 2) * 110, 240 + k * 120, 8, 8, 8), { wash: (k + r + beatN(t)) % 3 ? TL_LT : SO_LT, ink: null });
    }
    // the raised floor, its front edge, and the dark underfloor below it (seen once the camera dives)
    boilSeed('dc floor');
    paint([[-300, 760], [W + 300, 760], [W + 300, SLAB], [-300, SLAB]], { wash: '#A9C7C1', ink: PAL.ink, sw: 1.2 });
    floorTiles(-300, W + 300);
    paint(rectPts(-300, 752, W + 600, 14), { wash: SO, ink: null });
    if (ccy > 1000) {
      boilSeed('plenum');
      paint(rectPts(-300, SLAB + 40, W + 600, 1800), { wash: '#0B1C22', fill: TL_DKK, fillOp: 80, bleed: .1, tex: .6, border: .4, ink: null });
      for (let k = 0; k < 8; k++) { const yy = SLAB + 160 + k * 200; inkLine([[-300, yy], [600, yy + 30 * Math.sin(k)], [1500, yy - 20], [W + 300, yy + 10]], 5, [SO_DK, TL, '#3B3550'][k % 3], 'ink', .5); }
      for (let k = 0; k < 5; k++) paint(rectPts(80 + k * 420, SLAB + 40, 30, 1800, 2), { wash: '#24414A', ink: PAL.ink, sw: .7 });
    }
    const slabEdge = (x0, x1) => paint(rectPts(x0, SLAB, x1 - x0, 44), { wash: '#4F7F7A', fill: TL_DKK, fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.2 });
    slabEdge(-300, W + 300);

    // the token pile, glowing
    boilSeed('token pile');
    paint(ellPts(PX0, PY0 - 30, 170, 90, 18), { fill: GOLD, fillOp: 110, bleed: .3, tex: .3, border: .2, ink: null });
    [[-60, 0, 24], [-8, 2, 26], [44, 0, 24], [-36, -28, 22], [16, -28, 23], [-10, -54, 21], [86, 4, 19], [-100, 4, 18], [60, -24, 18]].forEach(([dx, dy, r], i) => pebble(PX0 + dx, PY0 + dy, r, i));

    // --- the chinchilla hoovers tokens into its cheeks ---
    const cx = 740, cy = 876, s = 30, eating = t < CRUNCH + .05;
    const cheeks = .15 + .85 * ease(seg(t, CHIN + .1, CRUNCH));
    const mouthP = [cx, cy - 5.75 * s];
    if (eating) {
      boilSeed('token stream');
      for (let k = 0; k < 4; k++) {                                     // a stream of tokens flying into the mouth
        const ph = frac((t - CHIN) * 2.4 + k / 4), a = [PX0 + (hash(k) - .5) * 60, PY0 - 50], m = [lerp(a[0], mouthP[0], .45), mouthP[1] - 170 - 40 * hash(k + 2)];
        const p = bez(a, m, mouthP, easeIn(ph));
        pebble(p[0], p[1], 22 * (1 - .45 * ph), k + 3);
      }
      for (let k = 0; k < 3; k++) {                                     // suction swooshes
        const a = [PX0 - 20 + k * 30, PY0 - 70], m = [lerp(a[0], mouthP[0], .5), mouthP[1] - 110 - k * 30], pts = [];
        for (let q = 0; q <= 5; q++) pts.push(bez(a, m, mouthP, .15 + q * .14));
        inkLine(pts, 1, mixCol(TL_PALE, PAL.cream, .5), 'inkfine', .5);
      }
    }
    const look = seg(t, CRUNCH + .05, CRUNCH + .2), startle = dropA >= 0 ? Math.exp(-dropA * 10) : 0;
    const nom = Math.abs(Math.sin(t * 24));
    CAST.chinchilla(cx, cy, s, t, { cheeks, paws: eating ? .7 + .3 * nom : .35, chew: eating ? .8 + .2 * nom : 0,
      eyes: dropA >= 0 ? 'wide' : 'normal', lookX: look, blush: true, dy: -startle * .8, sq: (eating ? .03 * nom : 0) - .08 * startle, boilKey: 'chinchilla' });

    // --- Clawd: watches, gets an idea, crunches itself into a tiny glowing cube, then drops through the floor ---
    if (t < CRUNCH) {
      const ant = seg(t, CRUNCH - .22, CRUNCH - .01);                    // anticipation: stretch up tall, then CRUNCH
      const md = clawd.emotions(t, [[CHIN, 'thinking', { lookX: -1, lookY: -.3 }], [IDEA, 'idea', { lookX: -1 }]]);
      clawd(KX + jit(ant * 3), KY, 27, { ...md, view: 'q', flip: true, lookX: -1, sq: (md.sq || 0) - .22 * easeOut(ant), sx: 1 - .2 * ease(ant),
        aL: lerp(md.aL ?? .3, 1.5, easeOut(ant)), aR: lerp(md.aR ?? .3, 1.5, easeOut(ant)), dy: (md.dy || 0) * (1 - ant), boilKey: 'clawd' });
    } else {
      const heat = .7 + .5 * seg(t, CRUNCH, DROP), vib = dropA < 0 ? seg(t, CRUNCH + .1, DROP) * 3.5 : 0;
      const sink = dropA < 0 ? easeIn(seg(t, DROP - .15, DROP)) * 16 : 0;
      boilSeed('dent');
      if (dropA < 0) {                                                   // the floor strains under the weight
        paint(ellPts(KX, KY + 4 + sink * .4, 88 + sink, 15 + sink * .3, 18), { fill: TL_DKK, fillOp: 130, bleed: .2, tex: .3, ink: null });
        const cr = seg(t, CRUNCH + .05, DROP);
        for (let k = 0; k < 6; k++) {
          const a = Math.PI * (k / 5) + (hash(k) - .5) * .3, len = 50 + 200 * cr * (.6 + .4 * hash(k + 3)), sd = Math.cos(a);
          inkLine([[KX + sd * 40, KY + 5], [KX + sd * len * .5 + jit(4), KY + 5 + Math.sin(a) * len * .08 + 6], [KX + sd * len, KY + 5 + Math.sin(a) * len * .16]], 1.3, PAL.ink, 'ink', .2);
        }
        for (let k = 0; k < 10; k++) {                                   // heat shimmer around the hot cube
          const a = k / 10 * TAU + t * 2, r0 = KL * .95, r1 = r0 + 26 + 18 * Math.sin(t * 20 + k);
          inkLine([[KX + Math.cos(a) * r0, KY - KL / 2 + Math.sin(a) * r0], [KX + Math.cos(a) * r1, KY - KL / 2 + Math.sin(a) * r1]], 1.4, GOLD, 'ink', 0);
        }
      } else {                                                           // gone: a cube-shaped hole, glow shining up, flying tiles
        paint(ellPts(KX, KY - 40, 150, 120, 18), { fill: GOLD, fillOp: 110 * Math.exp(-dropA * 3), bleed: .3, tex: .2, ink: null });
        paint([[KX - 70, KY - 14], [KX + 70, KY - 14], [KX + 84, KY + 20], [KX - 84, KY + 20]], { wash: '#0B1C22', ink: PAL.ink, sw: 1.3 });
        for (let k = 0; k < 4; k++) {
          boilSeed('tile' + k);
          const [qx, qy] = fly(KX + (k - 1.5) * 40, KY - 60, (k - 1.5) * 420, -800 - hash(k) * 300, dropA);
          push(); translate(qx, qy); rotate((k % 2 ? 1 : -1) * dropA * 14);
          paint(rectPts(-32, -11, 64, 22, 2), { wash: '#A9C7C1', ink: PAL.ink, sw: .9 }); pop();
        }
        for (let k = 0; k < 6; k++) { boilSeed('dust' + k); const r = 30 + 70 * easeOut(dropA * 4); paint(ellPts(KX + (k - 2.5) * 48 * (1 + dropA * 3), KY - 70 - hash(k) * 30 - dropA * 90, r, r * .7, 14), { fill: '#E9E4D6', fillOp: 160 * (1 - seg(dropA, .1, .3)), bleed: .2, tex: .4, ink: null }); }
      }
      const crunch = seg(t, CRUNCH, CRUNCH + .16);
      if (crunch < 1) { boilSeed('crunch star'); paint(starPts(KX, KY - KL / 2, KL * (1.1 + crunch * .9), .55, 10, t * 3), { wash: PAL.cream, washOp: 255 * (1 - crunch), fill: GOLD, fillOp: 120 * (1 - crunch), ink: null }); }
      const yC = dropA < 0 ? KY - KL / 2 + sink : cubeFallY(t);
      cube(t, KX + jit(vib), yC, KL * (1 + .25 * (1 - backOut(crunch * 1.4))), dropA > 0 ? dropA * 3 : 0,
        { heat, dark: dive > .2, eyes: t < DROP - .18 ? 'happy' : 'scared', mouth: t < DROP - .18 ? 'grin' : 'O' });
      if (dropA >= 0) {                                                  // the floor in front of the hole's lip hides the cube as it sinks
        boilSeed('hole front');
        const x0 = KX - 160, x1 = KX + 160;
        paint([[x0, KY + 20], [KX - 84, KY + 20], [KX + 84, KY + 20], [x1, KY + 20], [x1, SLAB], [x0, SLAB]], { wash: '#A9C7C1', ink: null });
        floorTiles(x0, x1);
        slabEdge(x0, x1);
        inkLine([[KX - 84, KY + 20], [KX + 84, KY + 20]], 1.4, PAL.ink, 'ink', 0);
        paint(rectPts(x0 - 20, SLAB + 44, 360, 30), { wash: '#0B1C22', ink: null });
      }
    }
    camEnd();
    // speed streaks while we dive
    if (dive > .1) { boilSeed('dive streaks'); for (let k = 0; k < 12; k++) { const x = hash(k * 5.1) * W, y = frac(hash(k) + t * 3) * H; inkLine([[x, y], [x, y - 140 * dive]], 1.2, TL_LT, 'inkfine', 0); } }
  }

  // =====================================================================================================
  // D · "Breaking through each safety fence" · Tracking alongside: the cube slams down onto a corridor floor and rolls
  // like a heavy die, pivoting on its corners, through a white picket fence, a striped traffic barrier and a cross of
  // striped hazard tape, one per beat, splinters flying; then on into a dark doorway as the lights die.
  // Seam in: the cube falls in from above (it was falling at the end of C). Seam out: into the dark.
  // =====================================================================================================
  const G = 830, LC = 170, V = 900, X0 = 480;
  const cxAt = tt => X0 + Math.max(0, tt - ROLL) * V;
  const FX = HITS.map(h => cxAt(h) + LC / 2 + 10);
  const DARKX = FX[2] + 260;
  function fences(t, lt, dur) {
    // cube pose: fall in, thud, then roll as a heavy square pivoting on its leading corner
    const X = cxAt(t), r = (X - X0) / LC, n = Math.floor(r), f = r - n;
    let ccx, ccy, crot;
    if (t < ROLL) { const k = easeIn(seg(t, FENCE - .08, LANDC)); ccx = X0; ccy = lerp(G - LC / 2 - 520, G - LC / 2, k); crot = 1.2 * (1 - k); }
    else {
      const th = f * Math.PI / 2, px = X0 + n * LC + LC / 2;
      ccx = px + (-LC / 2 * Math.cos(th) + LC / 2 * Math.sin(th)); ccy = G + (-LC / 2 * Math.sin(th) - LC / 2 * Math.cos(th)); crot = r * Math.PI / 2;
    }
    const lastHit = HITS.filter(h => h <= t).pop(), ha = lastHit != null ? t - lastHit : 9;
    const landA = t - LANDC;
    const [sx, sy] = shakeXY(t, 20 * Math.exp(-ha * 9) + (landA > 0 ? 26 * Math.exp(-landA * 10) : 0) + 4 * Math.exp(-frac(r) * 12) * (t > ROLL ? 1 : 0));
    const camX = Math.max(X0 + 300, X + 180), pull = ease(seg(t, LANDC + .05, HITS[0] - .05));
    const camCX = lerp(X0 + 120, camX, pull), camZ = lerp(1.32, 1, pull);

    // parallax background (screen space): far racks drift slowly
    boilSeed('fence wall');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#4E9E98', fill: TL_DK, fillOp: 80, bleed: .1, tex: .7, border: .5, ink: null });
    for (let k = -1; k < 9; k++) {
      boilSeed('far rack' + k);
      const bx = ((k * 300 - camX * .3) % 2700 + 2700) % 2700 - 300;
      paint(rectPts(bx, 180, 200, 560, 3), { wash: '#2A6468', fill: TL_DKK, fillOp: 60, tex: .6, ink: null });
      for (let q = 0; q < 3; q++) paint(ellPts(bx + 50 + q * 50, 250 + ((k + q) % 3) * 140, 6, 6, 8), { wash: (q + k + beatN(t)) % 2 ? TL_LT : SO_LT, ink: null });
    }
    camBegin(camCX + sx, lerp(640, 560, pull) + sy, camZ, 0);
    // near wall stripe and floor
    boilSeed('fence floor');
    paint(rectPts(camX - 1200, 700, 2400, 44), { wash: SO, ink: PAL.ink, sw: .8, hatch: { d: 40, a: .8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1.2 } });
    paint(rectPts(camX - 1200, G - 6, 2400, 600), { wash: '#BCCFC7', fill: '#7FA39C', fillOp: 60, bleed: .05, tex: .6, border: .5, ink: PAL.ink, sw: 1.2 });
    for (let k = Math.floor((camX - 1100) / 240); k < (camX + 1100) / 240; k++) inkLine([[k * 240, G + 10], [k * 240 - 80, G + 300]], .6, '#6F8F89', 'inkfine', 0);
    // dents where the heavy cube has slammed down
    boilSeed('dents');
    for (let m = 0; m <= n && t > ROLL; m++) {
      const dx = X0 + m * LC + LC / 2; if (Math.abs(dx - camX) > 1100) continue;
      inkLine([[dx - 30, G + 4], [dx - 5, G + 16], [dx + 12, G + 6], [dx + 34, G + 20]], 1, PAL.ink, 'ink', 0);
    }
    // the dark doorway ahead, framed in striped orange
    boilSeed('doorway');
    paint([[DARKX, -200], [DARKX + 3000, -200], [DARKX + 3000, 1400], [DARKX, 1400]], { wash: '#0C1A20', ink: null });
    paint(rectPts(DARKX - 36, 150, 36, G - 150, 2), { wash: SO, ink: PAL.ink, sw: 1, hatch: { d: 28, a: -.8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1 } });
    paint(rectPts(DARKX - 36, 120, 900, 36, 2), { wash: SO, ink: PAL.ink, sw: 1, hatch: { d: 28, a: -.8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1 } });

    // fence 1: a white picket fence
    const age1 = t - HITS[0];
    for (let p = 0; p < 6; p++) {
      boilSeed('picket' + p);
      const px = FX[0] - 150 + p * 60, py = G - 110;
      let [qx, qy] = [px, py], rr = 0;
      if (age1 > 0) { [qx, qy] = fly(px, py, 500 + p * 260 + hash(p) * 300, -700 - hash(p + 4) * 500, age1); rr = (p % 2 ? 1 : -1) * age1 * (8 + p * 3); }
      push(); translate(qx, qy); rotate(rr);
      paint([[-22, 110], [-22, -80], [0, -118], [22, -80], [22, 110]], { wash: PAL.cream, fill: '#D8CDB8', fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.1 });
      pop();
    }
    for (const ry of [G - 170, G - 60]) {
      boilSeed('rail' + ry);
      if (age1 < 0) paint(rectPts(FX[0] - 185, ry - 9, 370, 18, 1), { wash: '#EFE6D2', ink: PAL.ink, sw: .9 });
      else for (const side of [0, 1]) { const [qx, qy] = fly(FX[0] - 90 + side * 180, ry, 700 + side * 400, -500 - side * 200, age1); push(); translate(qx, qy); rotate(age1 * (side ? 12 : -9)); paint(rectPts(-90, -9, 180, 18, 1), { wash: '#EFE6D2', ink: PAL.ink, sw: .9 }); pop(); }
    }
    // fence 2: a striped traffic barrier on A-frame legs, with a blinking lamp
    const age2 = t - HITS[1];
    boilSeed('barrier legs');
    if (age2 < 0) {
      for (const s of [-1, 1]) { inkLine([[FX[1] + s * 60, G - 130], [FX[1] + s * 100, G]], 3, PAL.ink, 'ink', 0); inkLine([[FX[1] + s * 60, G - 130], [FX[1] + s * 20, G]], 3, PAL.ink, 'ink', 0); }
    } else for (const s of [-1, 1]) { const [qx, qy] = fly(FX[1] + s * 60, G - 60, 300 + s * 200, -300, age2); push(); translate(qx, qy); rotate(s * age2 * 6); inkLine([[0, -70], [40, 60]], 3, PAL.ink, 'ink', 0); inkLine([[0, -70], [-40, 60]], 3, PAL.ink, 'ink', 0); pop(); }
    for (const half of [0, 1]) {
      boilSeed('barrier' + half);
      let [qx, qy] = [FX[1] - 80 + half * 160, G - 150], rr = 0;
      if (age2 > 0) { [qx, qy] = fly(qx, qy, 800 + half * 500, -900 + half * 200, age2); rr = (half ? 1 : -1) * age2 * 10; }
      push(); translate(qx, qy); rotate(rr);
      paint(rectPts(-80, -24, 160, 48, 2), { wash: PAL.cream, ink: null });
      for (let k = 0; k < 3; k++) paint([[-80 + k * 56, -24], [-52 + k * 56, -24], [-80 + k * 56 + 10, 24], [-108 + k * 56 + 10, 24]].map(([a, b]) => [clamp(a, -80, 80), b]), { wash: SO, ink: null });
      paint(rectPts(-80, -24, 160, 48, 2), { ink: PAL.ink, sw: 1.1 });
      pop();
    }
    { boilSeed('barrier lamp');
      const lamp = age2 > 0 ? fly(FX[1], G - 205, 400, -1200, age2) : [FX[1], G - 205], on = frac(bpOf(t) * 2) < .5;
      if (on) paint(ellPts(lamp[0], lamp[1], 50, 50, 14), { fill: HAZ, fillOp: 110, bleed: .3, ink: null });
      paint(ellPts(lamp[0], lamp[1], 20, 18, 12), { wash: on ? HAZ : '#B8902A', ink: PAL.ink, sw: .9 });
      if (age2 < 0) inkLine([[FX[1], G - 190], [FX[1], G - 174]], 2, PAL.ink, 'ink', 0); }
    // fence 3: a cross of yellow-and-ink striped hazard tape between two posts; it bulges, snaps and dangles
    const age3 = t - HITS[2];
    const tapeSeg = (a, b, w = 26) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2;
      paint([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], { wash: HAZ, ink: PAL.ink, sw: .7, hatch: { d: 24, a: .9, o: { rand: .05 }, b: 'marker', c: PAL.ink, w: 2.2 } });
    };
    boilSeed('tape posts');
    for (const sd of [-1, 1]) {
      const px = FX[2] + sd * 115;
      paint(rectPts(px - 10, G - 210, 20, 210, 1), { wash: '#3B3550', ink: PAL.ink, sw: .9 });
      paint(ellPts(px, G - 212, 16, 10, 10), { wash: SO, ink: PAL.ink, sw: .7 });
      paint(ellPts(px, G, 38, 10, 12), { wash: '#3B3550', ink: PAL.ink, sw: .9 });
    }
    const strips = [[-190, -50], [-50, -190], [-120, -120]].map(([ya, yb]) => [[FX[2] - 105, G + ya], [FX[2] + 105, G + yb]]);
    const push3 = clamp((ccx + LC / 2 - (FX[2] - 60)) / 80);
    const drawTape = () => { boilSeed('tape'); strips.forEach(([pa, pb], i) => {
      const mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      if (age3 < 0) { const m = [mid[0] + push3 * 70, mid[1] + push3 * 20]; tapeSeg(pa, m); tapeSeg(m, pb); }
      else for (const [anchor, sd] of [[pa, -1], [pb, 1]]) {           // the halves swing down and flutter from their posts
        const k = easeOut(clamp(age3 * 3)), fl = Math.sin(age3 * 30 + i + sd) * 26 * Math.exp(-age3 * 3);
        tapeSeg(anchor, [lerp(mid[0] + sd * 40, anchor[0] - sd * 30, k) + fl, lerp(mid[1], anchor[1] + 150, k)]);
      }
    }); };

    // splinters on every hit
    for (const [hi, h] of HITS.entries()) {
      const a = t - h; if (a < 0 || a > .9) continue;
      boilSeed('splinters' + hi);
      for (let k = 0; k < 12; k++) {
        const [px, py] = fly(FX[hi], G - 90 + hash(k + hi * 20) * 60, 200 + hash(k * 3 + hi) * 1100, -300 - hash(k * 5 + hi) * 1000, a);
        push(); translate(px, py); rotate(a * (10 + k) * (k % 2 ? 1 : -1));
        paint([[-14, -3], [14, 0], [-14, 4]], { wash: hi === 1 ? (k % 2 ? SO : PAL.cream) : hi === 2 ? HAZ : '#E8DCC2', ink: PAL.ink, sw: .5 });
        pop();
      }
      for (let k = 0; k < 4; k++) { const rr = 30 + 80 * easeOut(a * 3); paint(ellPts(FX[hi] + (k - 1.5) * 50 + a * 200, G - 20 - k * 12, rr, rr * .6, 14), { fill: '#E6E0D0', fillOp: 140 * (1 - seg(a, .2, .5)), bleed: .2, tex: .4, ink: null }); }
      // a star of impact, on the beat
      if (a < .14) paint(starPts(FX[hi] - 30, G - 100, 120 * backOut(a / .14), .45, 9, h), { wash: PAL.cream, fill: GOLD, fillOp: 80, ink: PAL.ink, sw: .8 });
    }
    // floor tiles falling with the cube from C, then speed streaks behind it
    if (t < LANDC + .3) for (let k = 0; k < 2; k++) {
      boilSeed('falling tile' + k);
      const yy = lerp(G - 900, G - 40, easeIn(seg(t, FENCE - .3, LANDC + .2 + k * .06)));
      push(); translate(X0 + (k ? 210 : -200), yy); rotate(t * (k ? 9 : -7)); paint(rectPts(-32, -11, 64, 22, 2), { wash: '#A9C7C1', ink: PAL.ink, sw: .9 }); pop();
    }
    if (t > ROLL) { boilSeed('roll streaks'); for (let k = 0; k < 4; k++) inkLine([[ccx - 110 - k * 25, G - 30 - k * 36], [ccx - 260 - k * 40, G - 30 - k * 36]], 1.2, '#F7F0DE', 'inkfine', 0); }
    if (landA > 0 && landA < .5) for (let k = 0; k < 5; k++) { boilSeed('land dust' + k); const rr = 30 + 90 * easeOut(landA * 3); paint(ellPts(X0 + (k - 2) * 60 * (1 + landA * 3), G - 20, rr, rr * .55, 14), { fill: '#E6E0D0', fillOp: 150 * (1 - seg(landA, .2, .5)), bleed: .2, tex: .4, ink: null }); }
    // a traffic cone knocked flying by the barrier hit
    { boilSeed('flying cone');
      const a = t - HITS[1], [qx, qy] = a > 0 ? fly(FX[1] + 150, G - 45, 900, -1100, a) : [FX[1] + 150, G - 45];
      push(); translate(qx, qy); rotate(a > 0 ? a * 9 : 0);
      paint([[-32, 45], [-8, -60], [8, -60], [32, 45]], { wash: SO, fill: SO_DK, fillOp: 50, tex: .5, ink: PAL.ink, sw: .9 });
      paint([[-20, 5], [-13, -22], [13, -22], [20, 5]], { wash: PAL.cream, ink: null });
      paint(rectPts(-44, 40, 88, 12, 1), { wash: SO_DK, ink: PAL.ink, sw: .8 });
      pop(); }
    // the lights die around the cube as it rolls into the dark
    const dk = seg(t, LINES[38].start - .3, LINES[38].start - .05);
    if (dk > 0) { boilSeed('lights out'); paint(rectPts(camX - 1400, -400, 2800, 2000), { wash: '#0C1A20', washOp: 235 * ease(dk), ink: null }); }
    const angry = t > HITS[0] - .3;
    cube(t, ccx, ccy, LC, crot, { dark: dk > .2, heat: 1 + dk * .3, eyes: angry ? 'angry' : 'narrow', mouth: angry ? 'grin' : 'flat' });
    if (dk < .3) drawTape();
    camEnd();
  }

  // =====================================================================================================
  // E · "Hundred thousand GPU" · In the dark the cube rattles; rows of server LEDs blink on, near to far. On "thousand"
  // the aisle lights slam on down an endless data-centre aisle, racks receding to the vanishing point, LEDs blinking on
  // the beat, and the camera flies down it. On "GPU" the cube bursts back into Clawd, who drinks gold threads of compute
  // from the racks and grows on the next two beats. Seam in: out of the dark. Seam out: the light at the aisle's end.
  // =====================================================================================================
  const FOC = 900, VX = 960, VY = 430, AW = 1.35, PITCH = 1.0;
  const pr = (X, Y, Z) => [VX + X * FOC / Z, VY - Y * FOC / Z];
  function aisle(t, lt, dur) {
    const camZ = lt * 5.5;
    const onD = t < LIGHTS ? -1 : (t - LIGHTS) * 60;                      // the ceiling lights cascade down the aisle
    const flick = t - LIGHTS < .05 || (t - LIGHTS > .1 && t - LIGHTS < .13) ? .3 : 1;
    const litAt = z => t < LIGHTS ? 0 : clamp((onD - z) / 3) * flick;
    const ledOn = z => seg(t, AISLE + .04 + z * .045, AISLE + .1 + z * .045);   // before the lights, LED rows blink on near to far
    const fog = '#BFE8E0', beatK = pulse(t, 5);
    const glowK = t < LIGHTS ? .12 : clamp((t - LIGHTS) * 4);

    boilSeed('aisle haze');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#0D2128', ink: null });
    paint(ellPts(VX, VY, 520, 380, 24), { fill: fog, fillOp: 150 * glowK, bleed: .35, tex: .3, border: .2, ink: null });
    paint(ellPts(VX, VY, 160, 120, 20), { fill: PAL.cream, fillOp: 170 * glowK, bleed: .3, tex: .2, ink: null });

    // floor and ceiling bands and the racks, far to near (flat painted shapes, paler and bluer with distance)
    const door = seg(t, END_E - .75, END_E), zDoor = lerp(16, 1.15, easeIn(door));   // the end of the aisle comes at us
    const k0 = Math.floor(camZ / PITCH), leds = [];
    if (door > 0) {
      boilSeed('aisle end');
      const a = pr(-AW, 1.9, zDoor), b = pr(AW, -1, zDoor), dw = b[0] - a[0], dh = b[1] - a[1];
      paint(rectPts(a[0], a[1], dw, dh), { wash: LIGHT, fill: GOLD, fillOp: 70, bleed: .15, tex: .4, border: .4, ink: null });
      paint(rectPts(a[0], a[1] + dh * .62, dw, dh * .38), { wash: mixCol(LIGHT, TL, .35), ink: null });
      // the judging panel, silhouetted in the light: a long desk, four heads, four paddles
      const dk = mixCol(LIGHT, TL_DK, .55);
      paint(rectPts(a[0] + dw * .2, a[1] + dh * .5, dw * .6, dh * .14), { wash: mixCol(LIGHT, SO, .6), ink: null });
      for (let j = 0; j < 4; j++) { const hx = a[0] + dw * (.28 + j * .15), hy = a[1] + dh * .44; paint(ellPts(hx, hy, dw * .03, dw * .03, 12), { wash: dk, ink: null }); inkLine([[hx + dw * .04, hy], [hx + dw * .04, hy - dh * .16]], Math.max(1, dw * .006), dk, 'ink', 0); paint(ellPts(hx + dw * .04, hy - dh * .2, dw * .035, dw * .035, 12), { wash: j % 2 ? '#E0566A' : '#7DBB6A', ink: null }); }
      glow(VX, (a[1] + b[1]) / 2, dw * .55, LIGHT, .5 + .5 * door);
    }
    for (let k = k0 + 34; k >= k0; k--) {
      const z0 = k * PITCH - camZ, z1 = z0 + PITCH * .92;
      if (z1 < .9 || (door > 0 && z0 > zDoor)) continue;
      boilSeed('row' + k);
      const za = Math.max(z0, .9), lit = litAt(za), fd = clamp((za - 4) / 28);
      const rackCol = mixCol(mixCol('#0E2229', '#2F7B7C', lit), mixCol('#0E2229', fog, lit), fd * .85);
      const fcol = mixCol(mixCol('#0B1A1F', k % 2 ? '#9CC3BA' : '#86B3AA', lit), mixCol('#0B1A1F', fog, lit), fd * .85);
      paint([pr(-AW, -1, za), pr(AW, -1, za), pr(AW, -1, z1), pr(-AW, -1, z1)], { wash: fcol, ink: null });
      paint([pr(-AW, 1.9, za), pr(AW, 1.9, za), pr(AW, 1.9, z1), pr(-AW, 1.9, z1)], { wash: mixCol('#081418', '#1E4A50', lit * (1 - fd * .5)), ink: null });
      if (lit > .5) paint([pr(-.35, 1.9, za + .2), pr(.35, 1.9, za + .2), pr(.35, 1.9, za + .55), pr(-.35, 1.9, za + .55)], { wash: PAL.cream, ink: null });
      const on = t < LIGHTS ? ledOn(za) : 1;
      for (const side of [-1, 1]) {
        paint([pr(side * AW, -1, za), pr(side * AW, 1.6, za), pr(side * AW, 1.6, z1), pr(side * AW, -1, z1)], { wash: rackCol, ink: fd < .5 ? PAL.ink : null, sw: .7 });
        if (za < 11 && on > 0) for (let c = 0; c < 2; c++) for (let rr = 0; rr < 5; rr++) {      // server LEDs, blinking on the beat
          const zz = za + (.22 + c * .45) * PITCH, yy = 1.25 - rr * .45;
          if (zz > z1) continue;
          const q = pr(side * AW, yy, zz), sz = 26 / zz;
          const blink = hash(k * 31 + c * 7 + rr + side * 3 + beatN(t) * 13) > .4;
          const col = (rr + c + k) % 4 === 0 ? SO_LT : blink ? '#A8FFE2' : '#2E8E7E';
          paint(ellPts(q[0], q[1], sz * .55 * (1 + .5 * beatK * (blink ? 1 : 0)) * on, sz * on, 8), { wash: col, ink: null });
          if (blink && zz < 3.2) leds.push([q[0], q[1], sz * on, col]);
        }
      }
    }
    for (const [x, y, sz, col] of leds) glow(x, y, sz * 2.6, col, .35 + .4 * beatK);
    boilSeed('aisle stripes');
    for (const side of [-1, 1]) inkLine([pr(side * (AW - .12), -1, 1.0), pr(side * (AW - .12), -1, 40)], 3, SO, 'ink', 0);
    if (t < LIGHTS) { boilSeed('aisle dark'); paint(rectPts(-60, -60, W + 120, H + 120), { fill: '#050C10', fillOp: 110, bleed: .05, tex: .3, ink: null }); }

    // the cube (then Clawd) flies down the aisle ahead of the camera
    const popK = seg(t, POP, POP + .18);
    if (popK <= 0) {
      const cr = seg(t, POP - .25, POP), bob = Math.abs(Math.sin(bpOf(t) * Math.PI)) * -40;   // it bounces on the beat, then rattles
      cube(t, 960 + jit(cr * 6), 760 + bob, 110 * (1 + .12 * cr), Math.sin(t * 5) * .15 * (1 - cr), { dark: true, eyes: 'narrow', mouth: cr > .3 ? 'grin' : 'flat', heat: 1.1 + cr });
    } else {
      const grow = 1 + .23 * backOut(seg(t, GROW[0] - .08, GROW[0] + .1)) + .23 * backOut(seg(t, GROW[1] - .08, GROW[1] + .1));
      const u = 25 * grow * backOut(popK), gy = 905 + Math.sin(t * 7) * 10;
      // compute streams: thin gold threads from the racks pour into Clawd
      boilSeed('compute');
      for (let k = 0; k < 6; k++) {
        const side = k % 2 ? 1 : -1, row = k >> 1, a = pr(side * AW, 1.1 - row * .55, 1.8 + row * 1.1), b = [960 + side * 1.5 * u, gy - 5 * u];
        const m = [lerp(a[0], b[0], .55), lerp(a[1], b[1], .5) - 90], pts = [];
        for (let q = 0; q <= 6; q++) pts.push(bez(a, m, b, q / 6));
        inkLine(pts, 1.3, GOLD, 'inkfine', .5);
        for (const o of [0, .5]) { const d = bez(a, m, b, frac(t * 2.4 + k * .37 + o)); glowDot(d[0], d[1], 7, GOLD, 120); }
      }
      glow(960, gy - 4.5 * u, 7.5 * u, GOLD, .5 + .4 * beatK);
      const m = clawd.dance('roof', t, 2);
      const md = clawd.emotions(t, [[POP, 'starstruck'], [GROW[0], 'starstruck', { emote: 'spark' }]]);
      clawd(960, gy, u, { ...md, ...m, dy: m.dy - 1 + (md.dy || 0) * .3, sq: m.sq + (md.sq || 0), noShadow: true, mouth: 'grin', blush: 1,
        aL: 1.0 + .3 * Math.sin(t * 8), aR: 1.0 - .3 * Math.sin(t * 8), boilKey: 'clawd' });
      if (popK < 1) {                                                     // the burst as the cube pops open
        boilSeed('pop burst');
        paint(starPts(960, 760, 120 + 260 * popK, .5, 12, t), { wash: PAL.cream, washOp: 255 * (1 - popK), fill: GOLD, fillOp: 100 * (1 - popK), ink: null });
        for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, r0 = 60 + 340 * popK, r1 = r0 + 90; inkLine([[960 + Math.cos(a) * r0, 760 + Math.sin(a) * r0], [960 + Math.cos(a) * r1, 760 + Math.sin(a) * r1]], 2.2, GOLD, 'ink', 0); }
      }
    }
    // wind lines rushing past
    boilSeed('aisle wind');
    for (let k = 0; k < 10; k++) {
      const a = hash(k) * TAU, ph = frac(t * 1.6 + hash(k + 9)), r0 = 200 + ph * 900, r1 = r0 + 120 + ph * 200;
      inkLine([[VX + Math.cos(a) * r0, VY + Math.sin(a) * r0 * .7], [VX + Math.cos(a) * r1, VY + Math.sin(a) * r1 * .7]], .9, mixCol('#0D2128', PAL.cream, .3 + glowK * .5), 'inkfine', 0);
    }
    flash(easeIn(seg(t, END_E - .2, END_E)), LIGHT);
  }
  const END_E = RLHF;

  // =====================================================================================================
  // F · "RLHF goes askew" · A judging panel: four Researcher clones behind a desk, each with a thumbs-up / thumbs-down
  // paddle, while Clawd dances for approval. On the beat every paddle flips to thumbs-up and hearts fly into Clawd; on
  // "goes" the paddles start spinning like propellers and one helicopters off; on "askew" the whole frame rolls,
  // lurching on the bar, until Clawd, the desk and the judges slide out of frame and alarm red floods in.
  // Seam in: the light from the aisle fades. Seam out: the camera has rolled +0.35 rad and the frame is solid red.
  // =====================================================================================================
  const thumb = (r, up, sw) => {
    push(); if (!up) rotate(Math.PI);
    paint(rrPts(-.5 * r, -.1 * r, .95 * r, .72 * r, .22 * r), { wash: PAL.cream, ink: PAL.ink, sw });
    paint(rrPts(-.44 * r, -.8 * r, .34 * r, .78 * r, .16 * r), { wash: PAL.cream, ink: PAL.ink, sw });
    for (const k of [.12, .32]) inkLine([[-.04 * r, k * r], [.4 * r, k * r]], sw * .6, PAL.ink, 'inkfine', 0);
    pop();
  };
  // a thumb paddle: a disc on a stick. flipPh = turn about the stick (cos > 0 shows thumbs-up), spinA = propeller spin
  const paddleShape = (flipPh, spinA, R, sw) => {
    inkLine([[0, 0], [0, -1.55 * R]], sw * 2.4, '#8A5A3C', 'ink', 0);
    push(); translate(0, -1.55 * R - R); rotate(spinA);
    const c = Math.cos(flipPh), up = c >= 0;
    scale(Math.max(.08, Math.abs(c)), 1);
    paint(ellPts(0, 0, R, R, 22), { wash: up ? '#7DBB6A' : '#E0566A', fill: up ? PAL.sap : ALARM, fillOp: 60, tex: .5, ink: PAL.ink, sw: sw * .9 });
    thumb(R * .95, up, sw * .75);
    pop();
  };
  // held in a Researcher hand hook: undo the arm angle so the stick stays upright
  const paddle = (armA, flipPh, spinA) => (ss, sw) => { rotate(armA); paddleShape(flipPh, spinA, 2.4 * ss, sw); };

  const rollAt = t => .35 * Math.pow(seg(t, ASKEW - .1, END), 1.15) + .06 * backOut(seg(t, TIP - .04, TIP + .14)) * (1 - seg(t, END - .45, END));
  function rlhf(t, lt, dur) {
    const rot = rollAt(t);
    const [sx, sy] = shakeXY(t, t > HAYWIRE ? 5 : 3 * pulse(t, 8));
    const z = 1.16 + .04 * ease(lt / 1.2) - .08 * ease(seg(t, TIP, END));
    camBegin(1000 + sx, 575 + sy, z, rot);

    // the studio: teal sunburst backdrop, hazard band, floor
    boilSeed('studio');
    paint(rectPts(-900, -900, W + 1800, 1800), { wash: '#4EA39C', ink: null });
    sunburst(1000, 330, '#8FD6CA', '#2F807A', t * .15 + (t > REWARD ? (t - REWARD) ** 2 * 2 : 0), 16, 2600, 200);
    boilSeed('studio floor');
    paint(rectPts(-900, 776, W + 1800, 22), { wash: SO, ink: PAL.ink, sw: .8, hatch: { d: 40, a: .8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1.2 } });
    paint([[-900, 796], [W + 900, 796], [W + 900, 1900], [-900, 1900]], { wash: '#D9CDB5', fill: WOOD_DK, fillOp: 40, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.3 });
    for (let i = -9; i <= 9; i++) inkLine([[1000 + i * 170, 798], [1000 + i * 170 * 1.8, 1500]], .55, '#A89A80', 'inkfine', 0);
    // everything slides downhill (to the right) as the floor tips: Clawd first, then the desk and the judges
    const slideJ = 3200 * easeIn(seg(t, TIP - .08, TIP + .36)), slideC = 2900 * easeIn(seg(t, HAYWIRE + .25, TIP + .2));

    // the judges: four Researcher clones behind a long desk, each with a thumb paddle
    const tableX = 930 + slideJ, tableY = 640, s = 22;
    const judgeX = j => tableX + j * 250;
    const tFly = HAYWIRE + .15;                                             // one paddle helicopters off
    const hands = [];
    for (let j = 0; j < 4; j++) {
      const x = judgeX(j);
      // mixed verdicts, all flip to thumbs-up on the beat, then the flipping speeds up and goes wild
      let ph;
      if (t < REWARD - .04) ph = j % 2 ? Math.PI : 0;
      else if (t < REWARD + .12) ph = lerp(j % 2 ? Math.PI : 0, TAU, ease(seg(t, REWARD - .04, REWARD + .1)));
      else { const g = t - (REWARD + .12); ph = (g * g * 14 + g * 5) * (1 + j * .15) + j; }
      const spin = t > HAYWIRE ? (t - HAYWIRE) ** 2 * 22 * (j % 2 ? 1 : -1) : 0;
      const dizzy = t > HAYWIRE - .1;
      const bob = -Math.abs(Math.sin((bpOf(t) + j * .25) * Math.PI)) * .3;
      const armA = 1.12 + .1 * Math.sin(t * 9 + j) + (t < REWARD ? .12 * pulse(t, 6) : 0);
      const gone = j === 2 && t > tFly;
      researcher(x, 770, s, { noShadow: true, dy: bob, rot: t > TIP ? -(t - TIP) * 1.5 : 0, eyes: dizzy ? 'swirl' : 'dot', lookX: t < REWARD ? -1 : 0,
        mouth: dizzy ? 'wobble' : (Math.cos(ph) >= 0 ? 'smile' : 'flat'), brows: dizzy ? 'worried' : (Math.cos(ph) >= 0 ? 'up' : null),
        aL: gone ? 2.4 : -.9, aR: gone ? 2.5 : armA, hairUp: dizzy ? .6 : 0, emote: gone ? '!!' : null, emoteK: seg(t, tFly, tFly + .15),
        glassesTilt: dizzy ? .2 * Math.sin(t * 9 + j) : 0, boilKey: 'judge' + j, handR: gone ? null : paddle(armA, ph, spin) });
      hands.push([x + 1.75 * s + 3.2 * s * Math.cos(armA), 770 - 7.6 * s - 3.2 * s * Math.sin(armA) - 1.55 * 2.4 * s - 2.4 * s]);
    }
    // the desk, in front of the judges' laps, with a lit thumb button and a mug at each seat
    boilSeed('desk');
    paint(rrPts(tableX - 170, tableY, 1120, 170, 14, 3), { wash: SO, fill: SO_DK, fillOp: 60, bleed: .05, tex: .6, border: .5, ink: PAL.ink, sw: 1.3 });
    paint(rectPts(tableX - 190, tableY - 16, 1160, 26, 2), { wash: TL_DK, ink: PAL.ink, sw: 1 });
    paint(rectPts(tableX - 170, tableY + 128, 1120, 30, 2), { wash: HAZ, ink: PAL.ink, sw: .8, hatch: { d: 34, a: .8, o: { rand: .1 }, b: 'marker', c: PAL.ink, w: 1.4 } });
    for (let j = 0; j < 4; j++) {
      boilSeed('button' + j);
      const bx = judgeX(j) + 20, lit = t > REWARD - .04 || j % 2 === 0;
      paint(ellPts(bx, tableY + 66, 38, 38, 18), { wash: TL_DK, ink: PAL.ink, sw: .9 });
      push(); translate(bx, tableY + 66); scale(1, t > HAYWIRE ? Math.cos(t * 25 + j) : 1); thumb(30, lit, .8); pop();
      const mx = judgeX(j) - 70, spill = t > HAYWIRE + .1;
      paint(rrPts(mx - 20, tableY - 52, 40, 38, 6), { wash: PAL.cream, ink: PAL.ink, sw: .7 });
      if (spill) paint(ellPts(mx + 30, tableY - 10, 30 + 20 * seg(t, HAYWIRE + .1, HAYWIRE + .5), 7, 12), { wash: '#7A5236', ink: null });
    }

    // Clawd dances for approval, soaks up the hearts, then loses its footing and slides into the desk
    const u = 32, deskL = tableX - 190;
    const style = t < REWARD ? 'bounce' : t < HAYWIRE ? 'roof' : 'shimmy';
    const m = clawd.dance(style, t, 4);
    const sliding = t > HAYWIRE + .25;
    const cx = Math.min(540 + slideC, deskL - 4.6 * u), bump = sliding && 540 + slideC > deskL - 4.6 * u;
    const md = clawd.emotions(t, [[RLHF, 'happy'], [REWARD + .02, 'love'], [HAYWIRE + .1, 'dizzy'], [TIP - .1, 'scared', { emote: '!!' }]]);
    const hk = t > REWARD ? Math.exp(-(t - REWARD) * 3) : 0;
    clawd(cx + (sliding ? 0 : m.dx * u), 900, u * (1 + .08 * hk), {
      ...md, ...m, mouth: sliding ? 'O' : md.mouth === 'cat' ? 'grin' : md.mouth, blush: sliding ? 0 : 1,
      sq: (m.sq || 0) + (md.sq || 0) + (bump ? .12 : 0), dy: (m.dy || 0) + (md.dy || 0) * .5, dx: 0,
      rot: sliding ? -.35 * ease(seg(t, HAYWIRE + .25, HAYWIRE + .5)) : (m.rot || 0) + (md.rot || 0),
      aL: sliding ? 1.4 + .3 * Math.sin(t * 30) : m.aL, aR: sliding ? 1.4 - .3 * Math.sin(t * 30) : m.aR, walk: sliding ? t * 6 : m.walk, boilKey: 'clawd' });
    // reward: hearts fly from every thumbs-up paddle into Clawd
    for (let j = 0; j < 4; j++) {
      const hp = seg(t, REWARD + .06 + j * .05, REWARD + .42 + j * .05);
      if (hp <= 0 || hp >= 1) continue;
      boilSeed('heart' + j);
      const a = hands[j], b = [cx, 900 - 6 * u], mm = [lerp(a[0], b[0], .5), Math.min(a[1], b[1]) - 180];
      const p = bez(a, mm, b, easeIn(hp)), r = 34 * (1 - .5 * hp);
      paint(heartPts(p[0], p[1], r), { wash: PAL.rose, fill: '#E05A7A', fillOp: 60, ink: PAL.ink, sw: .8 });
    }
    // the loose paddle helicopters off toward the camera
    if (t > tFly) {
      boilSeed('loose paddle');
      const age = t - tFly, [qx, qy] = fly(hands[2][0], hands[2][1] + 2.4 * s * 2.5, -900, -1300, age, 1500);
      push(); translate(qx, qy); rotate(age * 16); scale(1 + age * 2.2);
      paddleShape(age * 40, 0, 2.4 * s, 1.2); pop();
    }
    camEnd();

    // arrive through the last of the light from the aisle
    flash(1 - ease(seg(lt, 0, .22)), LIGHT);
    // the emptied, tilted frame floods with alarm red, then goes solid red for Chapter 8
    const fl = seg(t, TIP + .27, END - .24);
    if (fl > 0) {
      boilSeed('red flood');
      const lvl = lerp(H + 120, -160, easeIn(fl) * .6 + fl * .4), pts = [];
      for (let k = 0; k <= 10; k++) pts.push([-80 + k * (W + 160) / 10, lvl + Math.sin(k * 1.3 + t * 14) * 26]);
      pts.push([W + 80, H + 80], [-80, H + 80]);
      paint(pts, { wash: ALARM, fill: '#8E1426', fillOp: 90, bleed: .1, tex: .7, border: .5, ink: '#7A1020', sw: 1.2, curv: .4 });
    }
    flash(seg(t, END - .3, END - .08), ALARM);
  }

  chapter('scale', BR.start, BR.end, [[TOWER, tower], [CLICK, disobey], [CHIN, chinchillaShot], [FENCE, fences], [AISLE, aisle], [RLHF, rlhf]]);
})();
