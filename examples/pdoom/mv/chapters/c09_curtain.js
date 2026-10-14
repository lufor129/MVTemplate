// c09_curtain: the Outro, "Was it all for show?". The camera keeps pulling back from Chapter 8's locked door: it's a
// painted flat, and we're in a theatre. The house lights come up, stagehands clear the scenery (the door flies out,
// the basilisk puppet is wheeled off, the moon and the paperclip planet are carried away) and the giant Clawd costume
// splits open: three small Clawds tumble out. Then the curtain call: the whole cast bows down the line, the P(doom)
// meter rises through the trapdoor reading 99.9, swells, and pops like a balloon; one last bow and a dance; and the
// house curtain falls with the title painted on it (the same title as the opening backdrop), the cast's feet still
// dancing under the hem, until the feet stop and everything fades to paper. Ported from PDoomVideo/src/ch/c09_finale.js
// and the reveal at the end of PDoomVideo/src/ch/c08_chorus4.js, re-timed to the analysed song: every event hangs off a
// Lyric Line, a word in it, or the Beat Grid.
(() => {
  const DARK = '#140D17', VOID = '#1A121E', VFLOOR = '#2A1D28', SPOT = '#FFE2A8', GOLDL = '#F8D66A';
  const CRIMSON = '#C23B4E', HOUSE = '#4A1626', HEAD = '#2A1F33', STEEL = '#A3AAB6', STEELD = '#5E6575', PLANKC = '#C8915A';
  const CONF = [PAL.rose, PAL.ochre, PAL.sky, PAL.sap, PAL.violet, PAL.cream, GOLD];
  const FULL = () => rectPts(-3000, -3000, 8000, 8000);
  const cover = (col, op = 255) => { if (op >= 2) paint(FULL(), { wash: col, washOp: op, ink: null }); };
  const bloom = (x, y, rx, ry, col, op = 90, bleed = .3) => paint(ellPts(x, y, rx, ry, 24), { fill: col, fillOp: op, bleed, tex: .3, border: .2, ink: null });
  const disc = (x, y, r, col, op = 255, n = 12) => paint(ellPts(x, y, r, r, n), { wash: col, washOp: op, ink: null });

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                  // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);   // n beats after the beat nearest t
  const barsAfter = (t, n) => barAt(barN(t) + n);                 // n bars after the bar t is in
  const OUT = sec('Outro'), START = OUT.start, SHOW = LINES[45];  // "Was it all for show?"
  const LOOK0 = nearestBeat(136.0);                               // Chapter 8's last emotion key (they looked at each other)
  // A · the pull back
  const LIGHT1 = beatsAfter(START, 1), LIGHT2 = nearestBar(word(45, 2));   // the house lights come up in two banks; "all"
  const SPLIT = nearestBeat(word(45, 3));                          // "for": the giant costume splits open
  const TUMBLE = beatsAfter(SPLIT, 1), TADA = nearestBar(word(45, 4));    // three small Clawds tumble out… ta-da on "show"
  // B · the curtain call
  const CALL = nearestBeat(SHOW.end);                              // cut on the beat after "show?"
  const RISE = beatsAfter(CALL, 1);                                // the meter rises through the trapdoor
  const BOW0 = barsAfter(CALL, 1), BOWB = Math.round(bpOf(BOW0));  // the guests bow one per beat from here
  const bowT = i => beatAt(BOWB + i);                              // i = 0..5 the guests, 6 the troupe
  const POP = barsAfter(CALL, 3), SWELL1 = beatsAfter(POP, -1);    // the meter swells beat by beat, trembles, pops on the bar
  const LEADS = barsAfter(CALL, 4), DANCE = beatsAfter(LEADS, 1);  // the company bow; then the last dance on the beat
  // C · the curtain falls
  const CURT = barsAfter(CALL, 5);                                 // cut on the bar
  const DROP = barsAfter(CURT, 1), DROP0 = beatsAfter(DROP, -1);   // the curtain lands on the bar
  const STOP = barsAfter(DROP, 2), FADE0 = beatsAfter(STOP, 1);    // the feet stop on the bar; fade to paper on the last beat
  const FADE1 = Math.min(OUT.end - .35, FADE0 + .95);

  // ======================================================================================================================
  // The theatre: Chapter 1's stage (stageBack / stageFront) inside a proscenium arch, with footlights and the house.
  // ======================================================================================================================
  const LIP = 1100;                                                // the stage lip (below the frame at zoom 1, as in Chapter 1)
  function backdrop(t, o = {}) {
    stageBack(t, { a: CRIMSON, b: GOLD, spots: o.spots });
  }
  function proscenium(t, lights = 1) {
    boilSeed('proscenium');
    const hole = [[-60, -20], [-60, LIP], [1980, LIP], [1980, -20]];
    const o = [[-3000, -3000], [5000, -3000], [5000, 5000], [-3000, 5000]];
    paint([...o, o[0], hole[hole.length - 1], ...hole], { wash: HOUSE, washOp: 255, fill: CURTAIN_DK, fillOp: 90, bleed: .05, tex: .7, border: .3, ink: null });
    // the apron in front of the arch
    paint([[-400, LIP], [2320, LIP], [2320, LIP + 70], [-400, LIP + 70]], { wash: WOOD_DK, fill: '#4A2A1A', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.2 });
    // gilded moulding round the opening, and a crest at the top
    for (const [a, b] of [[[-60, LIP], [-60, -20]], [[-60, -20], [960, -32]], [[960, -32], [1980, -20]], [[1980, -20], [1980, LIP]]]) {
      inkLine([a, b], 9, GOLD, 'ink', 0); inkLine([[a[0] - 22 * Math.sign(a[0] - 960 || 1), a[1] - 22], [b[0] - 22 * Math.sign(b[0] - 960 || 1), b[1] - 22]], 2.5, '#B8862A', 'ink', 0);
    }
    paint(ellPts(960, -70, 90, 52, 22), { wash: GOLD, fill: '#B8862A', fillOp: 80, tex: .5, ink: PAL.ink, sw: 1.2 });
    paint(ellPts(960, -70, 46, 26, 16), { wash: CRIMSON, ink: PAL.ink, sw: .8 });
    // footlights along the lip, warming with the house lights
    for (let i = 0; i < 12; i++) {
      const fx = 40 + i * 168;
      paint(rrPts(fx - 24, LIP - 18, 48, 22, 8), { wash: GOLD, ink: PAL.ink, sw: .8 });
    }
  }
  function footGlow(t, k) {
    if (k <= .02) return;
    for (let i = 0; i < 12; i++) glow(40 + i * 168, LIP - 14, 70, '#FFE7A8', k * (.5 + .2 * pulse(t + i * .05, 3)));
  }
  // the audience: a front row of heads below the lip, bobbing on the beat; arms go up when they cheer (world space)
  function audience(t, cheer = 0) {
    boilSeed('audience');
    const bp = bpOf(t);
    for (let i = 0; i < 15; i++) {
      const x = -330 + i * 185 + hash(i + 70) * 50, bob = Math.abs(Math.sin((bp + hash(i) * .5) * Math.PI)) * (4 + 14 * cheer);
      const y = LIP + 120 - bob + (i % 2) * 22, r = 64 + hash(i + 71) * 22;
      if (cheer > .15 && i % 3 !== 1) for (const sd of [-1, 1]) {
        const a = -Math.PI / 2 + sd * (.45 + .25 * Math.sin(bp * TAU + i)), L = r * 1.5 * cheer, sx = x + sd * r * .7, sy = y - r * .1;
        inkLine([[sx, sy], [sx + Math.cos(a) * L * .6, sy + Math.sin(a) * L * .6], [sx + Math.cos(a) * L, sy + Math.sin(a) * L]], 5.5, HEAD, 'marker', .4);
        paint(ellPts(sx + Math.cos(a) * L, sy + Math.sin(a) * L, 15, 15, 10), { wash: HEAD, ink: null });
      }
      paint(ellPts(x, y, r, r * 1.05, 18), { wash: HEAD, fill: PAL.violet, fillOp: 45, tex: .4, border: .3, ink: null });
      inkLine([[x - r * .7, y - r * .72], [x, y - r * 1.04], [x + r * .7, y - r * .72]], .7, GOLD, 'inkfine', .6);
    }
  }

  // ---------- Chapter 8's dark: the void, the lone spotlight (see c08's SEAM OUT block) ----------
  const DX = 960, DY = 860;
  function coneHole() {
    const p = [[860, -80], [1060, -80]];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; p.push([960 + 500 * Math.cos(a), 880 + 90 * Math.sin(a)]); }
    return p;
  }
  function darkAround(hole, col, op) {
    if (op < 2) return;
    const o = [[-3000, -3000], [5000, -3000], [5000, 5000], [-3000, 5000]], h = hole.slice().reverse();
    paint([...o, o[0], h[h.length - 1], ...h], { wash: col, washOp: op, ink: null });
  }
  function voidRoom(k) {                                         // k = how much of the void is left (1 = all of it)
    boilSeed('void');
    cover(VOID, 255 * k);
    if (k > .02) bloom(960, 520, 900, 520, '#2E1A30', 120 * k);
    paint(rectPts(-600, DY, W + 1200, 900), { wash: VFLOOR, washOp: 255 * k, ink: null });
    paint(ellPts(DX, DY + 6, 230, 22, 20), { wash: PAL.ink, washOp: 120, ink: null });   // the door's shadow
  }
  function spotCone(op) {
    if (op < .01) return;
    boilSeed('spot cone');
    paint(coneHole(), { wash: '#3A2C30', washOp: 255 * op, ink: null });
    paint(ellPts(960, 880, 500, 90, 30), { wash: '#B98F6A', washOp: 255 * op, fill: '#E8C38E', fillOp: 120 * op, bleed: .1, tex: .4, border: .3, ink: null });
  }

  // ---------- small props ----------
  function puff(x, y, age, dir = 1, s = 1) {
    if (age < 0 || age > .5) return;
    boilSeed('puff' + Math.round(x));
    for (let k = 0; k < 3; k++) {
      const r = (18 + k * 8) * s * (.4 + easeOut(age / .5)), op = 170 * (1 - age / .5);
      paint(ellPts(x - dir * (20 + k * 34) * s * easeOut(age / .4), y - 8 - k * 6, r, r * .75, 12), { fill: '#EADBC4', fillOp: op, bleed: .15, tex: .3, ink: null });
    }
  }
  function confettiRain(t, t0, n = 40) {                         // screen space, after camEnd()
    if (t < t0) return;
    boilSeed('confetti rain');
    for (let i = 0; i < n; i++) {
      const ti = t0 + hash(i + 300) * 1.1; if (t < ti) continue;
      const age = t - ti, v = 230 + hash(i + 301) * 220;
      const y = -40 + (age * v) % 1200, x = hash(i + 302) * 2040 - 60 + Math.sin(age * 2.2 + i) * 50;
      push(); translate(x, y); rotate(age * (2 + hash(i) * 4) + i); scale(Math.cos(age * 7 + i), 1);
      paint(rectPts(-11, -6, 22, 12), { wash: CONF[i % CONF.length], ink: null });
      pop();
    }
  }
  function burstConfetti(x, y, age, n = 18, v0 = 600, up = -Math.PI / 2, spread = 2.6, key = '') {
    if (age < 0 || age > 2.2) return;
    boilSeed('burst confetti' + key);
    for (let i = 0; i < n; i++) {
      const a = up + (hash(i + 7) - .5) * spread, v = v0 * (.6 + hash(i + 8) * .8), drag = 1 - Math.exp(-age * 3);
      push(); translate(x + Math.cos(a) * v * drag / 3, y + Math.sin(a) * v * drag / 3 + 180 * age * age); rotate(age * 8 + i); scale(Math.cos(age * 9 + i), 1);
      paint(rectPts(-11, -6, 22, 12), { wash: CONF[i % CONF.length], ink: null });
      pop();
    }
  }
  function rose(x, y, rot, col, s = 1) {
    push(); translate(x, y); rotate(rot); scale(s);
    inkLine([[0, 0], [4, 26], [2, 52]], 1.1, '#3E7A3A', 'ink', .5);
    paint([[3, 30], [18, 20], [8, 38]], { wash: PAL.sap, ink: null });
    paint(ellPts(0, -6, 17, 15, 14), { wash: col, fill: '#8E1F33', fillOp: 70, tex: .5, ink: PAL.ink, sw: .7 });
    inkLine([[-6, -8], [2, -13], [7, -5], [0, 0]], .7, '#8E1F33', 'inkfine', .6);
    pop();
  }

  // ======================================================================================================================
  // A · "Was it all for show?" · The pull back carries on out of Chapter 8 without a cut: a plywood edge, a brace and a
  // stage weight fade in behind the door (it's a flat), and the house lights come up in two banks (a beat, then the bar
  // on "all"): a theatre, the proscenium, the audience. Stagehands clear the scenery: the door flies out on its lines,
  // a stagehand wheels the basilisk puppet off left, another carries the moon (on a string) and the paperclip planet (on a
  // stick) off right. Behind the door stood the giant Clawd costume: on "for" it unzips and swings open and three small
  // Clawds tumble out, landing in a ta-da on "show". The Researcher and Clawd gape, then crack up.
  // Seam in: Chapter 8's camera formula continued (z → .8, same speed at the cut). Seam out: cut on the beat.
  // ======================================================================================================================
  const Z0 = .94, V0 = .2, ZF = .85;                              // zoom and pull-back speed at the cut (from c08), and where it settles
  const zA = t => ZF + (Z0 - ZF) * Math.exp(-(t - START) * V0 / (Z0 - ZF));
  const RX0 = 700, KX0 = 1255;                                   // the Researcher and Clawd, on their marks from Chapter 8
  // the giant costume, standing behind the door, and the three small Clawds inside it
  const CX = 960, CY = 832, CU = 58, SU = 15;
  const SMALL = [
    { from: [CX - 120, CY - 2.3 * CU], to: [855, 905], t0: TUMBLE - .3, t1: TUMBLE + .05, turn: 0, H: 90 },
    { from: [CX + 120, CY - 2.3 * CU], to: [1075, 905], t0: TUMBLE - .24, t1: TUMBLE + .12, turn: 0, H: 100 },
    { from: [CX, CY - 2.3 * CU - 7.4 * SU], to: [965, 925], t0: TUMBLE - .16, t1: TUMBLE + .24, turn: 1, H: 190 },
  ];
  // one half of the costume, hinged at its outer edge; sxh = cos(swing) squeezes it toward the hinge
  function costumeHalf(side, sxh) {
    const u = CU, x = CX, y = CY, sw = 1.6, px = x + side * 5 * u;
    boilSeed('costume ' + side);
    push(); translate(px, y); scale(sxh, 1); translate(-px, -y);
    for (const lx of side < 0 ? [-4, -2] : [1, 3]) paint(rectPts(x + lx * u, y - 2.4 * u, u, 2.3 * u, 1.5), { wash: PAL.clayDk, ink: PAL.ink, sw: sw * .8 });
    push(); translate(x + side * 4.9 * u, y - 4.5 * u); rotate(side * 1.1);                    // a floppy costume arm
    paint(rectPts(side < 0 ? -2.3 * u : 0, -.5 * u, 2.3 * u, u, 1.5), { wash: PAL.clay, ink: PAL.ink, sw: sw * .8 }); pop();
    const x0 = side < 0 ? x - 5 * u : x, body = rectPts(x0, y - 8 * u, 5 * u, 6 * u, 1.5);
    if (sxh < 0) {                                                                // the inside: satin lining, a strut, zipper teeth
      paint(body, { wash: '#8E3048', fill: '#D0647A', fillOp: 100, bleed: .15, tex: .6, border: .6, ink: null });
      paint(rectPts(x0 + .25 * u, y - 5.6 * u, 4.5 * u, .7 * u, 1), { wash: PLANKC, fill: WOOD_DK, fillOp: 50, ink: PAL.ink, sw: sw * .7 });
      for (let i = 0; i < 12; i++) paint(rectPts(side < 0 ? x - .32 * u : x + .04 * u, y - 7.8 * u + i * .48 * u, .28 * u, .24 * u), { wash: STEEL, ink: null });
      paint(body, { ink: PAL.ink, sw });
    } else {
      paint(body, { wash: PAL.clay, ink: null });
      paint(ellPts(x0 + (side < 0 ? 3.2 : 1.8) * u, y - 6.4 * u, 1.9 * u, 1.3 * u, 16, 1), { fill: '#F5B394', fillOp: 110, bleed: .2, tex: .8, border: .8, ink: null });
      paint(rectPts(x0 + .2 * u, y - 3.8 * u, 4.6 * u, 1.6 * u), { fill: PAL.clayDk, fillOp: 110, bleed: .03, tex: .7, border: .5, ink: null });
      paint(body, { ink: PAL.ink, sw });
      const ex = side < 0 ? x - 3 * u : x + 2 * u;                               // a painted-on eye, a bit dead
      paint(rectPts(ex, y - 7 * u, u, 2 * u, 1), { wash: PAL.ink, ink: null });
      disc(ex + .32 * u, y - 6.58 * u, .2 * u, PAL.cream, 230, 10);
    }
    if (side < 0) {                                                               // a halo on a wire…
      inkLine([[x - .5 * u, y - 8 * u], [x - .5 * u, y - 10 * u], [x - .2 * u, y - 10.4 * u]], .9, STEELD, 'inkfine', .5);
      paint(ellPts(x - .2 * u, y - 10.6 * u, 2.6 * u, .7 * u, 22), { ink: GOLD, sw: 2.2 });
    } else {                                                                      // …and a crown, slightly askew
      paint([[x + .8 * u, y - 7.9 * u], [x + .8 * u, y - 10.2 * u], [x + 1.9 * u, y - 9 * u], [x + 3 * u, y - 10.6 * u], [x + 4.1 * u, y - 9 * u], [x + 4.5 * u, y - 10.2 * u], [x + 4.5 * u, y - 7.9 * u]],
        { wash: '#F2C53D', fill: GOLD, fillOp: 90, ink: PAL.ink, sw: 1.1 });
    }
    pop();
  }
  function smalls(t, out) {
    SMALL.forEach((c, i) => {
      if ((t >= c.t0) !== out) return;
      const k = seg(t, c.t0, c.t1), wob = t > SPLIT && t < c.t0 ? Math.sin((t - SPLIT) * 34 + i * 2) * .14 : 0;
      const x = lerp(c.from[0], c.to[0], k), y = lerp(c.from[1], c.to[1], k) - c.H * 4 * k * (1 - k), land = t > c.t1 ? Math.exp(-(t - c.t1) * 10) : 0;
      const md = clawd.emotions(t, [[START, 'neutral'], [SPLIT + .03, 'scared', { emote: i === 2 ? '!' : null }], [TADA + i * .05, 'happy', { emote: i === 1 ? 'sweat' : null }]]);
      const ta = t > TADA + i * .05;
      clawd(x, y, SU, { ...md, rot: c.turn * TAU * ease(k) + wob, sq: (md.sq || 0) + .3 * land, noShadow: k < 1, hat: 'party', seed: i,
        mouth: ta ? 'grin' : k > 0 && k < 1 ? 'O' : md.mouth, blush: ta ? 1 : 0, dy: ta ? (md.dy || 0) - .8 * pulse(t, 6) : 0,
        aL: ta ? (i === 1 ? .3 : 1.3 + .1 * Math.sin(t * 9 + i)) : 1.3, aR: ta ? 1.3 + .1 * Math.sin(t * 8 + i) : 1.3, boilKey: 'small' + i });
    });
  }
  // the moon on a string and the paperclip planet on a stick, carried by a stagehand
  function moonAndPlanet(hx, hy, t) {
    boilSeed('moon');
    const bob = Math.sin(t * 6) * 10, mx = hx - 120 + Math.sin(t * 3) * 20, my = hy - 470 + bob;
    inkLine([[hx - 40, hy - 70], [mx - 10, my + 90], [mx, my + 60]], .8, PAL.ink, 'inkfine', .5);
    paint(ellPts(mx, my, 62, 62, 22), { wash: '#F4E4A6', fill: '#D8C07A', fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.1 });
    for (const [cx_, cy_, r] of [[-18, -14, 12], [16, 10, 9], [-8, 22, 7]]) paint(ellPts(mx + cx_, my + cy_, r, r, 10), { wash: '#E2CC88', ink: '#B89A5A', sw: .5 });
    paint([[mx - 6, my + 60], [mx + 6, my + 60], [mx, my + 70]], { wash: '#D8C07A', ink: PAL.ink, sw: .5 });
    boilSeed('planet');
    const pxp = hx + 110, pyp = hy - 330 + bob * .5;
    inkLine([[hx + 40, hy - 60], [pxp, pyp + 62]], 2.4, WOOD_DK, 'ink', 0);
    paint(ellPts(pxp, pyp, 64, 64, 22), { wash: '#B8BEC8', fill: '#7A8290', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.1 });
    for (let i = 0; i < 6; i++) {
      const a = hash(i * 2.7) * TAU, r = 18 + hash(i) * 30, cx_ = pxp + Math.cos(a) * r, cy_ = pyp + Math.sin(a) * r, ra = hash(i * 4.1) * Math.PI;
      const pts = [[0, 12], [0, -10], [5, -14], [10, -10], [10, 10], [5, 14], [-3, 10], [-3, -6]].map(([x_, y_]) => [cx_ + x_ * Math.cos(ra) - y_ * Math.sin(ra), cy_ + x_ * Math.sin(ra) + y_ * Math.cos(ra)]);
      inkLine(pts, .9, '#3E4656', 'inkfine', .4);
    }
    paint(ellPts(pxp, pyp, 100, 20, 22, 0, -.3), { ink: STEELD, sw: 1.1 });
  }
  function puppetCart(x, y, t) {
    boilSeed('cart');
    paint(rectPts(x - 130, y - 50, 260, 36, 2), { wash: '#8A5A36', fill: WOOD_DK, fillOp: 50, tex: .5, ink: PAL.ink, sw: 1.1 });
    for (const wx of [-90, 90]) paint(ellPts(x + wx, y - 12, 20, 20, 12), { wash: '#3A3040', ink: PAL.ink, sw: .9 });
    CAST.basilisk(x, y - 50, 13, t, { puppet: 1, coil: .6, eyes: 'slit', lids: .5, lookX: -1, sway: .5, seed: 3, boilKey: 'basilisk puppet' });
  }
  const walkMini = (t, seed) => { const m = clawd.dance('walk', t * 1.4, seed); return { dy: m.dy - Math.abs(Math.sin(bpOf(t) * Math.PI * 2)) * .4, aL: .3, aR: .3 }; };

  function reveal(t, lt, dur) {
    const z = zA(t) + .01 * pulse(t, 5) * seg(t, TADA - .1, TADA);
    camBegin(960, 600 - 60 / z, z, 0);
    const L = Math.max(.42 * easeOut(seg(t, LIGHT1 - .05, LIGHT1 + .1)), easeOut(seg(t, LIGHT2 - .05, LIGHT2 + .15)));   // the house lights
    const flat = ease(seg(t, START + .04, LIGHT1 - .05));
    // the theatre, behind everything that was in the dark (not drawn at all until the lights start: washes aren't opaque)
    const lit = L > .001;
    if (lit) backdrop(t);
    // the giant costume behind the door: unzips, then swings open like cabinet doors
    const uz = seg(t, SPLIT - .34, SPLIT - .04), sa = t - SPLIT;
    const sxh = t < SPLIT ? 1 - .07 * uz : Math.cos(2.1 * backOut(seg(t, SPLIT, SPLIT + .3)) + .06 * Math.sin(sa * 9) * Math.exp(-sa * 3));
    if (lit) { smalls(t, false); costumeHalf(-1, sxh); costumeHalf(1, sxh); }
    if (lit && t < SPLIT) {
      boilSeed('zipper');
      const zy = lerp(CY - 7.9 * CU, CY - 2.2 * CU, uz);
      inkLine([[CX, CY - 8 * CU], [CX, CY - 2 * CU]], .8, '#8A8F9A', 'inkfine', 0);
      paint(rrPts(CX - 9, zy - 4, 18, 30, 4), { wash: '#C9CED6', ink: PAL.ink, sw: .8 });
    }
    // stagehands clear the set: the basilisk puppet wheeled off left…
    const cartX = lerp(400, -520, easeIn(seg(t, LIGHT2 + .05, SPLIT + .5)));
    if (lit && cartX > -480) {
      const bx = cartX - 230;
      boilSeed('cart rope'); inkLine([[bx + 50, 820], [cartX - 130, 838]], 1.2, '#9A7A50', 'ink', .3);
      miniClawd(bx, 880, 11, { ...walkMini(t, 2), hat: 'hard', eyes: 'narrow', mouth: 'flat', sx: -1, rot: -.1, aR: 1, key: 'hand1' });
      puppetCart(cartX, 880, t);
    }
    // …the moon and the paperclip planet carried off right
    const hx = lerp(1500, 2350, ease(seg(t, LIGHT2 + .15, SPLIT + .7)));
    if (lit && hx < 2300) { moonAndPlanet(hx, 880, t); miniClawd(hx, 880, 11, { ...walkMini(t + .2, 3), hat: 'hard', eyes: 'happy', mouth: 'flat', aL: 1.1, aR: .9, key: 'hand2' }); }
    // Chapter 8's dark, fading as the lights come up: the void, the beam
    voidRoom(1 - L);
    spotCone(1 - L);
    smalls(t, true);
    // the door: a flat after all; its lines drop from the flies and it flies out, revealing the costume behind it
    const fly = easeIn(seg(t, LIGHT2 + .1, SPLIT - .2)), lines = easeOut(seg(t, LIGHT1, LIGHT2));
    const dyD = -1100 * fly;
    if (lines > 0) { boilSeed('fly lines'); for (const lx of [-150, 150]) inkLine([[DX + lx, -500], [DX + lx, lerp(-500, DY - 520, lines) + dyD]], 1.1, '#8A7A60', 'inkfine', 0); }
    if (fly < 1) CAST.door(DX, DY + dyD, 1, t, { lit: 0, locked: 1, flat, boilKey: 'door' });
    // the Researcher and Clawd: on their marks, then they gape at the theatre, follow the scenery out, and crack up
    const rm = researcher.emotions(t, [[LOOK0, 'neutral', { eyes: 'dot', mouth: 'flat' }], [LIGHT1 - .12, 'confused', { emote: '?' }], [LIGHT2, 'surprised', { emote: '!' }],
      [SPLIT + .05, 'scared', { emote: null }], [TADA + .08, 'happy']]);
    const look = t < LIGHT1 ? 1 : t < LIGHT2 ? .8 : t < LIGHT2 + .5 ? -1 : t < SPLIT ? .3 : .7;
    const lookY = t >= LIGHT1 && t < LIGHT2 ? -.6 : t >= LIGHT2 + .5 && t < SPLIT ? -1 : 0;
    const laugh = t > TADA + .08;
    researcher(RX0, DY, 24, { ...rm, lookX: look, lookY, hairUp: t > SPLIT && !laugh ? .8 : 0,
      aL: laugh ? 1.1 + .15 * Math.sin(t * 13) : t > SPLIT ? .6 : rm.aL ?? -1.25, aR: laugh ? -.4 : t > SPLIT ? .6 : rm.aR ?? -1.25,
      rot: laugh ? .05 * Math.sin(t * 12) : 0, boilKey: 'researcher' });
    const km = clawd.emotions(t, [[LOOK0, 'neutral', { mouth: 'flat' }], [LIGHT1 - .05, 'confused'], [LIGHT2 + .04, 'surprised'], [SPLIT + .08, 'surprised', { emote: '!!' }], [TADA, 'laugh']]);
    const tk = clawd.turn(t, LIGHT2 + .06, LIGHT2 + .3, -.125, 0);
    clawd(KX0, DY, 26, { ...km, ...tk, dx: 0, rot: 0, lookX: t < LIGHT2 ? .5 : -look, lookY, boilKey: 'clawd' });
    if (lit) { stageFront(t, {}); proscenium(t); }
    // what's still dark (the valance inside the beam too), and the last of the spotlight
    if (L < 1) {
      boilSeed('house dark');
      darkAround(coneHole(), DARK, 255 * (1 - L));
      paint([[860, -80], [1060, -80], [1060 + 400 * 300 / 960, 220], [860 - 400 * 300 / 960, 220]], { wash: '#3A2C30', washOp: 255 * clamp(1 - L * 2.4), ink: null });
      glow(960, 300, 520, SPOT, .35 * (1 - L)); glow(960, 870, 420, SPOT, .45 * (1 - L));
    }
    footGlow(t, L);
    if (lit) audience(t, .15 + .6 * easeOut(seg(t, TADA, TADA + .3)));
    camEnd();
  }

  // ======================================================================================================================
  // The line-up for the curtain call: everyone on CAST, the Researcher, Clawd and the troupe, on one scale (U).
  // ======================================================================================================================
  const U = 15, GY = 900, MX = 960, MS = .7, TRAP_RX = 112;
  const RX = 828, KX = 1095;
  const LINE = [{ k: 'shog', x: 330 }, { k: 'syd', x: 502 }, { k: 'bas', x: 668 }, { k: 'gato', x: 1262 }, { k: 'chin', x: 1422 }, { k: 'door', x: 1572 }];
  const TROUPE = [415, 585, 1342, 1497], RISER_Y = 722;
  const bowAt = (t, t0, hold = .28) => ease(seg(t, t0 - .04, t0 + .2)) * (1 - ease(seg(t, t0 + .2 + hold, t0 + .5 + hold)));
  const shifted = (dy, s, fn) => { push(); translate(0, dy * s); fn(); pop(); };
  // one guest. p: { dy, sq, rot, aL, aR, bow, look, happy (eyes), startle, wave }
  function guest(k, x, y, t, p = {}) {
    const b = clamp(p.bow || 0), dy = p.dy || 0, sq = p.sq || 0, rot = p.rot || 0, happy = p.happy || b > .3;
    switch (k) {
      case 'shog':
        shifted(dy, U, () => CAST.shoggoth(x, y, U * .92, t, { bow: b, mask: 0, wave: p.wave || 0, look: p.look || 0, startle: p.startle || 0, boilKey: 'shoggoth' })); break;
      case 'syd':
        CAST.sydney(x, y, U, t, { dy, sq, rot, aL: p.aL ?? .35, aR: p.aR ?? .35, bow: b, eyes: happy ? 'happy' : 'heart', lookX: p.look || 0, boilKey: 'sydney' }); break;
      case 'bas':
        shifted(dy, U, () => CAST.basilisk(x, y, U * .62, t, { coil: 1, bow: b, eyes: happy ? 'happy' : 'wide', blush: .7, lookX: p.look || 0, sway: .6, seed: 1, boilKey: 'basilisk' })); break;
      case 'gato':
        CAST.gato(x, y, U, t, { dy, sq, rot, aL: p.aL ?? .2, aR: p.aR ?? .2, bow: b, eyes: happy ? 'happy' : undefined, lookX: p.look || 0, boilKey: 'gato' }); break;
      case 'chin':
        if (CAST.chinchilla) CAST.chinchilla(x, y, U, t, { dy, sq, rot, bow: b, eyes: happy ? 'happy' : p.startle > .3 ? 'wide' : 'normal', lookX: p.look || 0, blush: .6, boilKey: 'chinchilla' });
        break;
      case 'door':                                                 // a door's bow: it leans over, and the light peeks out
        push(); translate(x, y + dy * U); rotate(-.22 * b + rot); scale(1, 1 - .1 * b - sq * .5);
        CAST.door(0, 0, .33, t, { flat: 1, locked: 1, lit: .7 * b, boilKey: 'door' });
        pop(); break;
    }
  }
  function mini(i, x, y, t, p = {}) {
    const b = clamp(p.bow || 0);
    miniClawd(x, y, 10, { dy: p.dy || 0, sq: (p.sq || 0) + .25 * b, rot: (p.rot || 0) + (i % 2 ? .12 : -.12) * b, aL: lerp(p.aL ?? .3, -.6, b), aR: lerp(p.aR ?? .3, -.6, b),
      eyes: 'happy', mouth: b > .3 ? 'smile' : 'grin', hat: 'party', key: 'troupe' + i });
  }
  function riser() {
    boilSeed('riser');
    paint(rectPts(300, RISER_Y - 14, 1320, 30, 3), { wash: '#C99A68', fill: WOOD, fillOp: 70, tex: .6, ink: PAL.ink, sw: 1 });
    paint(rectPts(300, RISER_Y + 14, 1320, 800 - RISER_Y + 4, 2), { wash: WOOD_DK, fill: '#4A2A1A', fillOp: 70, tex: .7, ink: PAL.ink, sw: 1 });
    for (let i = 1; i < 8; i++) inkLine([[300 + i * 165, RISER_Y + 18], [300 + i * 165, 800]], .6, '#4A2A1A', 'inkfine', 0);
  }
  function trapHole(open) {
    if (open < .02) return;
    boilSeed('trap');
    const rx = TRAP_RX * open, ry = 26 * open;
    paint(rectPts(MX - rx, GY + 5 - 80 * open, rx * 2, 80 * open, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw: 1 });
    paint(ellPts(MX, GY + 5, rx, ry, 24), { wash: '#2A1A22', ink: PAL.ink, sw: 1.1 });
  }
  function trapLip(open) {
    if (open < .02) return;
    boilSeed('trap lip');
    const rx = TRAP_RX * open, ry = 26 * open, lip = [];
    for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; lip.push([MX + Math.cos(a) * rx, GY + 5 + Math.sin(a) * ry]); }
    paint([...lip, [MX - rx - 30, 1500], [MX + rx + 30, 1500]], { wash: WOOD, fill: WOOD_DK, fillOp: 60, bleed: .05, tex: .8, border: .6, ink: null });
    inkLine(lip, 1.1, PAL.ink, 'ink', .4);
  }
  // the meter, inflating like a balloon: inf 0 is meterProp's thermometer, 1 a fat red balloon about to go
  function balloonMeter(x, y, s, inf, t) {
    boilSeed('meter balloon');
    const col = meterColor(99.9), sw = clamp(1.3 * s, .5, 2.2), trem = t > SWELL1 && t < POP ? Math.sin(t * 70) * .035 : 0;
    const bw = 76 * (1 + 4.4 * inf) * (1 + trem), bh = 440 * (1 + .14 * inf) * (1 - trem), top = -80 - bh;
    const fw = lerp(48, bw - 10, Math.min(1, inf * 1.6));
    push(); translate(x, y); scale(s);
    paint(rectPts(-110, -30, 220, 30, 3), { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .6, ink: PAL.ink, sw });
    paint(rectPts(-12, -80, 24, 55), { wash: WOOD_DK, ink: PAL.ink, sw: sw * .7 });
    paint(rrPts(-bw / 2, top, bw, bh, Math.min(bw, bh) / 2 * .98, 2), { wash: PAL.cream, washOp: 255, ink: PAL.ink, sw });
    paint(rrPts(-fw / 2, top + 10 + 4 * inf, fw, bh - 10, Math.min(fw, bh) / 2 * .98, 1.5), { wash: col, washOp: 235, fill: '#8E1F33', fillOp: 30 + 50 * inf, tex: .6, ink: null });
    paint(ellPts(0, -92, 70, 70, 26, 2), { wash: col, washOp: 245, fill: PAL.ink, fillOp: 25, ink: PAL.ink, sw });
    paint(ellPts(0, -92, 120 + 60 * inf, 120 + 60 * inf, 26, 6), { fill: col, fillOp: 70 + 60 * pulse(t, 4), bleed: .3, ink: null });
    inkLine([[-bw * .3, top + bh * .12], [-bw * .38, top + bh * .3], [-bw * .34, top + bh * .5]], 1 + 2 * inf, '#FFFFFF', 'ink', .6);   // the shine
    if (inf > .55) for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * .5; inkLine([[Math.cos(a) * bw * .46, top + bh / 2 + Math.sin(a) * bh * .48], [Math.cos(a) * bw * .54, top + bh / 2 + Math.sin(a) * bh * .55]], .9, PAL.ink, 'inkfine', 0); }
    paint(rrPts(-120, top - 90, 240, 70, 12, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 60, tex: .6, ink: PAL.ink, sw });
    pop();
    letter('P(DOOM)', x, y + (top - 55) * s, 46 * s, PAL.cream);                  // the meter's own label (a Sound Word)
    letter('99.9%', x, y - 92 * s, 40 * s, PAL.cream);
    return y + (top + bh / 2) * s;                                                  // the balloon's middle
  }
  function popFx(x, cy, age) {
    if (age < 0) return;
    boilSeed('pop');
    if (age < .2) paint(starPts(x, cy, 90 + 260 * easeOut(age / .2), .5, 12, age * 2), { wash: PAL.cream, fill: GOLD, fillOp: 90, ink: PAL.ink, sw: 1.4 });
    if (age < .45) paint(ellPts(x, cy, 200 + 650 * easeOut(age / .45), 170 + 520 * easeOut(age / .45), 30), { fill: '#FFF3C8', fillOp: 120 * (1 - age / .45), bleed: .2, tex: .2, ink: null });
    for (let i = 0; i < 9; i++) {                                                    // rubber tatters
      const an = hash(i + 400) * TAU, v = 600 + hash(i + 401) * 500;
      push(); translate(x + Math.cos(an) * v * age, cy + Math.sin(an) * v * age + 900 * age * age); rotate(age * 10 * (hash(i) - .5) + an);
      paint([[-18, -8], [14, -12], [22, 4], [-4, 12], [-20, 6]], { wash: '#D8394E', ink: PAL.ink, sw: .6, curv: .5 });
      pop();
    }
    burstConfetti(x, cy, age, 36, 1400, -Math.PI / 2, TAU, 'pop');
  }
  // roses thrown from the house: one at each guest's feet as it bows, a bunch at the leads' feet for the company bow
  const ROSES = [...LINE.map((c, i) => ({ x1: c.x + 40, tl: bowT(i) + .3, i })),
    ...[0, 1, 2, 3, 4, 5].map(j => ({ x1: (j % 2 ? KX : RX) + (hash(j + 60) - .5) * 120, tl: LEADS + .1 + j * .09, i: 10 + j }))]
    .map(r => ({ ...r, y1: GY + 14 + hash(r.i + 91) * 26, x0: r.x1 + (hash(r.i + 92) - .5) * 600, r: (hash(r.i + 93) - .5) * 2.4, col: r.i % 3 ? '#D8394E' : PAL.rose }));
  function roses(t) {
    boilSeed('roses');
    for (const f of ROSES) {
      const a = (t - (f.tl - .5)) / .5; if (a < 0) continue;
      if (a < 1) rose(lerp(f.x0, f.x1, a), lerp(1300, f.y1, a) - Math.sin(a * Math.PI) * 360, a * 9 + f.r, f.col);
      else rose(f.x1, f.y1, Math.PI / 2 + f.r * .3, f.col, .95);
    }
  }

  // ======================================================================================================================
  // B · Curtain call · Cut on the beat to the full stage: the whole company in a line, waving to the house; on the next
  // beat the trapdoor opens and the P(doom) meter rises through it reading 99.9 (Chapter 1's trapdoor, again). From the
  // bar the guests bow one per beat down the line (shoggoth, Sydney, basilisk, Gato, chinchilla, the door), roses
  // landing at their feet, then the troupe on the riser; all the while the meter swells, a puff on every beat. It
  // trembles, everyone looks up… and on the bar it POPS like a balloon: confetti, rubber tatters, a flinch down the line.
  // Relief and laughter; on the next bar the company bow (the Researcher and Clawd in the middle), then one last dance on
  // the beat. Slow push. Seam out: cut on the bar.
  // ======================================================================================================================
  const company = (t, i) => {                                     // the shared pose of company member i at time t (B and C)
    const popAge = t - POP, flinch = popAge > 0 ? Math.exp(-popAge * 6) : 0;
    const up = t > SWELL1 && t < POP;                              // everyone looks up at the trembling balloon
    let m;
    if (t < BOW0) m = clawd.dance('wave', t - i * .05, i);
    else if (t < DANCE) m = clawd.dance('idle', t + i * .1, i);
    else m = clawd.dance(i % 3 === 0 ? 'hop' : i % 3 === 1 ? 'bounce' : 'stomp', t - i * BEAT * .1, i);
    const tk = take(t, POP, 1.1);
    return { dy: (m.dy || 0) * (t < DANCE ? 1 : .8) + tk.dy, sq: (m.sq || 0) + tk.sq, rot: m.rot || 0, aL: up ? -.3 : m.aL + 1.2 * flinch, aR: up ? -.3 : m.aR + 1.2 * flinch,
      startle: flinch, look: up ? 0 : Math.sin(t * 1.3 + i) * .4 };
  };
  function curtainCall(t, lt, dur) {
    const popAge = t - POP, popped = t >= POP;
    const [sx, sy] = popped ? shakeXY(t, 24 * Math.exp(-popAge * 7)) : t > SWELL1 ? shakeXY(t, 3) : [0, 0];
    const z = 1.24 + .08 * ease(lt / dur) + .012 * pulse(t, 5);
    camBegin(960 + sx, lerp(812, 822, ease(lt / dur)) + sy, z, 0);
    const sw = Math.sin(t * 1.6) * 380;
    backdrop(t, { spots: [[960 + sw, PAL.cream], [960 - sw * .8, '#FFD2C4']] });
    // the troupe, upstage on a riser
    riser();
    TROUPE.forEach((x, i) => { const p = company(t, i + 3); mini(i, x, RISER_Y - 2, t, { ...p, bow: Math.max(bowAt(t, bowT(6) + i * .06), bowAt(t, LEADS, .3)) }); });
    // the meter: up through the trapdoor, swelling, and POP
    const open = easeOut(seg(t, RISE - .35, RISE - .15)) * (1 - easeOut(seg(t, RISE + .5, RISE + .75)));
    trapHole(open);
    const n = Math.floor(bpOf(t) - bpOf(BOW0)), f = frac(bpOf(t) - bpOf(BOW0)), NB = Math.round(bpOf(SWELL1) - bpOf(BOW0));
    const inf = t < BOW0 ? 0 : clamp((Math.max(0, n) + easeOut(clamp(f * 3))) / NB);
    if (!popped) {
      const ry = lerp(470, 0, backOut(seg(t, RISE - .15, RISE + .3)));
      if (t > RISE - .15) {
        if (inf <= 0) meterProp(MX, GY + ry, MS, 99.9, { glow: .6 + .4 * pulse(t, 4) });
        else balloonMeter(MX, GY, MS, inf, t);
      }
    } else {                                                         // what's left: the stand and a limp scrap
      boilSeed('meter scrap');
      push(); translate(MX, GY); scale(MS);
      paint(rectPts(-110, -30, 220, 30, 3), { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.2 });
      paint(rectPts(-12, -80, 24, 55), { wash: WOOD_DK, ink: PAL.ink, sw: .9 });
      paint([[-22, -80], [22, -80], [30, -120], [10, -104], [0, -140], [-12, -106], [-34, -118]], { wash: '#D8394E', ink: PAL.ink, sw: .9 });
      pop();
    }
    trapLip(open);
    flushLetters();                                                   // the meter's lettering sits behind the cast
    // the guests: one bow per beat down the line, then the company bow
    LINE.forEach((c, i) => {
      const p = company(t, i), b = Math.max(bowAt(t, bowT(i)), bowAt(t, LEADS, .3));
      const done = t > bowT(i) + .5 && t < LEADS;
      guest(c.k, c.x, GY, t, { ...p, bow: b, happy: done || t > POP + .5, wave: c.k === 'shog' ? (t < BOW0 || done ? 1 : 0) : 0 });
    });
    // the Researcher: waves to the house, flinches at the swelling meter, covers its ears, laughs, bows
    const rp = company(t, 7), rb = bowAt(t, LEADS, .3), laugh = t > POP + .45;
    const rm = researcher.emotions(t, [[CALL - 1, 'happy'], [RISE + .1, 'surprised', { emote: null }], [BOW0 + .3, 'happy'], [SWELL1, 'scared', { emote: null }], [POP, 'surprised', { emote: '!!' }], [POP + .45, 'happy']]);
    const ears = t > SWELL1 && t < POP + .3;
    researcher(RX, GY, U * .93, { ...rm, bowtie: true, blush: laugh ? .8 : 0, eyes: rb > .3 ? 'closed' : rm.eyes, dy: (rm.dy || 0) * .5 + rp.dy * .7, sq: (rm.sq || 0) + .22 * rb + rp.sq * .5,
      aL: rb > .01 ? lerp(-1.25, -.5, rb) : ears ? 1.75 : t < BOW0 ? 1.1 + .4 * Math.sin(bpOf(t) * TAU * 2) : rm.aL ?? -1.25, aR: rb > .01 ? lerp(-1.25, -.5, rb) : ears ? 1.75 : rm.aR ?? -1.25,
      hairUp: popped ? 1 - seg(popAge, .3, 1) : 0, lookX: t > RISE && t < BOW0 ? .7 : 0, lookY: t > SWELL1 && t < POP ? -1 : 0, boilKey: 'researcher' });
    // Clawd: the showman in a top hat
    const kp = company(t, 8), kb = bowAt(t, LEADS, .3);
    const km = clawd.emotions(t, [[CALL - 1, 'happy'], [RISE + .1, 'proud', { emote: null }], [SWELL1, 'nervous'], [POP, 'surprised', { emote: '!' }], [POP + .45, 'laugh'], [DANCE, 'happy']]);
    clawd(KX, GY, U, { ...km, hat: 'top', blush: 1, eyes: kb > .3 ? 'happy' : km.eyes, dy: (km.dy || 0) * .5 + kp.dy + kb * .5, sq: (km.sq || 0) + kp.sq, rot: kp.rot + kb * .15, sy: 1 - .24 * kb,
      aL: lerp(t < BOW0 ? kp.aL : km.aL ?? kp.aL, -1.1, kb), aR: lerp(kp.aR, -1.1, kb), lookX: t > RISE && t < BOW0 ? -.7 : 0, lookY: t > SWELL1 && t < POP ? -1 : 0, boilKey: 'clawd' });
    roses(t);
    if (popped) popFx(MX, GY - (80 + 440 * 1.14 / 2) * MS, popAge);
    stageFront(t, {});
    proscenium(t);
    footGlow(t, 1);
    audience(t, popped ? .95 : t > BOW0 ? .55 : .7);
    camEnd();
    if (popped) flash(.6 * (1 - seg(popAge, 0, .1)), '#FFF3C8');
    confettiRain(t, CALL - .3, popped ? 44 : 22);
  }

  // ======================================================================================================================
  // C · The curtain falls · Cut on the bar to Chapter 1's frame, locked off: the company dancing on. The house curtain
  // drops and lands on the bar with a thump and a puff of dust, the title painted on it exactly where Chapter 1's
  // backdrop had it. Under its hem the cast's feet keep dancing… and on the bar they stop together. On the last beat
  // everything fades to paper. Seam out of the MV: the fade; the last frames are plain paper.
  // ======================================================================================================================
  const HEM = 850;
  function houseCurtain(t, hemY) {
    boilSeed('house curtain');
    const pts = [[-140, -200]];
    for (let i = 0; i <= 24; i++) { const x = lerp(-140, 2060, i / 24); pts.push([x, hemY + Math.sin(i * 2.1) * 6 + (i % 2) * 10]); }
    pts.push([2060, -200]);
    paint(pts, { wash: CURTAIN, washOp: 255, fill: CURTAIN_DK, fillOp: 90, bleed: .05, tex: .8, border: .7, ink: null });
    for (let f = 0; f < 16; f++) {                                  // folds
      const fx = -60 + f * 135, fl = [];
      for (let i = 0; i <= 6; i++) fl.push([fx + Math.sin(i * 1.4 + f + t * 1.5) * 9, lerp(hemY - 1100, hemY - 12, i / 6)]);
      inkLine(fl, 1, CURTAIN_DK, 'inkfine', .5);
    }
    const fr = []; for (let i = 0; i <= 26; i++) fr.push([lerp(-140, 2060, i / 26), hemY - 10 + (i % 2) * 9]);
    inkLine(fr, 3, GOLD, 'ink', .3);
    inkLine(fr.map(([x, y]) => [x, y + 10]), 1, PAL.ink, 'inkfine', .3);
  }
  function curtainFall(t, lt, dur) {
    const a = seg(t, DROP0, DROP), land = t - DROP;
    let hemY = lerp(-140, HEM, easeIn(a));
    if (land > 0) hemY = HEM - Math.abs(Math.sin(land * 9)) * 24 * Math.exp(-land * 6);
    const [sx, sy] = land > 0 ? shakeXY(t, 10 * Math.exp(-land * 7)) : [0, 0];
    camBegin(960 + sx, 540 + sy, 1, 0);
    backdrop(t, { spots: [[960, PAL.cream]] });
    // the company: dancing on, then the feet stop together on the bar
    const still = t >= STOP, stopAge = t - STOP;
    const pose = i => {
      if (!still) return company(t, i);
      return { dy: 0, sq: .25 * Math.exp(-stopAge * 8) * Math.cos(stopAge * 18), rot: 0, aL: 1.3, aR: 1.3, look: 0 };
    };
    riser();
    TROUPE.forEach((x, i) => mini(i, x, RISER_Y - 2, t, pose(i + 3)));
    LINE.forEach((c, i) => guest(c.k, c.x, GY, t, { ...pose(i), happy: true, wave: c.k === 'shog' ? 1 : 0 }));
    const rp = pose(7), kp = pose(8);
    researcher(RX, GY, U * .93, { ...researcher.feel('happy', t), bowtie: true, dy: rp.dy * .7, sq: rp.sq * .5, aL: 1.3, aR: 1.3, boilKey: 'researcher' });
    clawd(KX, GY, U, { ...clawd.feel('happy', t), hat: 'top', blush: 1, dy: kp.dy, sq: kp.sq, rot: kp.rot, aL: 1.3, aR: 1.3, boilKey: 'clawd' });
    roses(t);
    // the curtain, with the title painted on it (Chapter 1's lettering, in Chapter 1's place)
    houseCurtain(t, hemY);
    if (land > 0) { boilSeed('hem shadow'); paint(rectPts(-140, HEM + 4, 2200, 14), { fill: PAL.ink, fillOp: 70, bleed: .2, tex: .3, ink: null }); }
    const off = hemY - HEM;
    letter("I'M UPPING MY", 960, 245 + off, 100, PAL.cream, { rot: -.03 });
    letter('P(DOOM)', 960, 425 + off, 250, PAL.clay, { rot: -.03 + Math.sin(bpOf(t) * Math.PI) * .015 });
    flushLetters();                                                    // painted on the curtain, under the valance
    if (land > 0) for (let k = 0; k < 9; k++) puff(80 + k * 220, HEM + 6, land * .8 - hash(k) * .05, k % 2 ? 1 : -1);
    stageFront(t, {});
    proscenium(t);
    camEnd();
    confettiRain(t, CALL - .3, Math.round(30 * (1 - seg(t, DROP, STOP))));
    flash(ease(seg(t, FADE0, FADE1)), PAL.paper);                      // the Seam out of the MV: fade to paper
  }

  chapter('curtain', OUT.start, OUT.end, [[OUT.start, reveal], [CALL, curtainCall], [CURT, curtainFall]]);
})();
