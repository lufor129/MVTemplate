// c04_chorus2: Chorus 2, "the bigger show". Sydney's heart bubble pops onto the chorus stage, now an arena with pyro:
// building-sized Clawd works two pumps and the meter climbs from 34. The crowned basilisk bursts up through the floor
// (BOOM) and the Researcher pelts it with GPUs; one flies up and becomes the first point of a green stock line that
// Clawd rides to the moon. Galaxies spiral into the Omega Point, the flare resolves into a planet-sized GPU whose
// odometer overflows, its zeros pouring out like gumballs, and the meter dings at 61. Back on Earth the hard-hat crew
// slams a vault on a glowing monster… and the vault has no back wall. Ported from PDoomVideo/src/ch/c04_chorus2.js and
// re-timed to the analysed song: every event hangs off a Lyric Line, a word in it, or the Beat Grid.
(() => {
  const VIO = '#8B62C9', GOLD2 = '#F2B93B', SPACE = '#2A1F4A', DEEP = '#1B1535', LAV = '#EFDDF3';
  const GREEN = '#6DBE45', GREEN_DK = '#3E7D2A', PINK = '#F4B6C2', PINK_DK = '#DE6F98', FLARE = '#FFF6DE';
  const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const boilN = t => Math.floor(t * BOIL);

  // ---------- when things happen ----------
  const word = (i, k) => LINES[i].tokens[k][0];                 // when word k of Lyric Line i is sung
  const beatsAfter = (t, n) => beatAt(Math.round(bpOf(t)) + n);  // n beats after the beat nearest t
  const CHO = sec('Chorus 2');
  // A · "I'm upping my P(doom)"
  const UP = CHO.start, POPD = .22;                               // the bubble pops in the first .22 s
  const STAR = nearestBeat(word(17, 4));                          // "doom" (a bar start): Clawd goes starry
  // B · "I hear the basilisk boom"
  const HEAR = LINES[18].start, RUMBLE = nearestBeat(word(18, 3)); // "basilisk": the floor starts to bulge
  const BOOM = nearestBeat(word(18, 4));                          // "boom" (a bar start): it bursts through
  const THROW1 = BOOM + BEAT * .5, THROW2 = beatsAfter(BOOM, 1) - .06, FLY1 = .2;   // two offerings
  // C · "NVDA to the moon"
  const NVDA = LINES[19].start, DOT = NVDA + .15;                  // the thrown GPU lands on the chart as a dot
  const LANDC = beatsAfter(NVDA, 1), LAUNCH = LANDC + .2;         // Clawd hops on, crouches, and the line takes off
  const FLAG = nearestBar(word(19, 3)), HITM = FLAG - .22;        // "moon" (a bar): the flag goes in
  // D · "The Omega Point's coming soon"
  const OMEGA = LINES[20].start, POINT = nearestBar(word(20, 4)); // "soon" (a bar): the galaxies meet
  // E · "One E thirty flops a second"
  const FLOPS = LINES[21].start, ROLL = nearestBar(word(21, 5));  // "second" (a bar): the odometer rolls over
  const DING = barAt(Math.round(barOf(ROLL)) + 1);                // the next bar: the meter dings at 61
  // F · "That was safe enough, we reckoned"
  const SAFE = LINES[22].start, SLAM = nearestBeat(word(22, 2));  // "safe": the door slams
  const HF = nearestBar(word(22, 5));                             // "reckoned" (a bar): high five
  const WHIP = beatsAfter(HF, 1), WAVE = beatsAfter(HF, 3);       // whip round the back; the monster turns and waves

  // =====================================================================================================
  // CAST.basilisk(x, y, s, t, o): the crowned basilisk, a Guest (back in Chapter 9 as a puppet on the curtain call).
  // (x, y) = the ground point it rises from or stands on; s is on Clawd's u / the Researcher's s scale: standing, it is
  // about 21s tall (≈1.6× the Researcher at the same s). o:
  //   rise 0..1 (how far it has emerged from a hole; 1 = fully up) · coil 0..1 (sits on its own coiled tail on the
  //   ground point instead of coming out of a hole) · bow 0..1 (a curtsy) · puppet 0..1 (sock cuff, seams, a control
  //   bar on strings held by stagehand arms from above) · open (jaw 0..1) · eyes ('slit' | 'wide' | 'happy' | 'closed')
  //   · lids (0..1 sly half-lids) · lookX / lookY · blush 0..1 · lean (radians) · sway (default 1) · flip · seed
  //   · boilKey. Returns { hx, hy, mx, my, top } (head, mouth and crown top, world).
  // =====================================================================================================
  const BS = { body: '#4FA57B', dk: '#2C6A53', belly: '#F4DB8E', frill: '#8E5CC0', eye: '#F7D24A', maw: '#5A1F33', tongue: '#E2476E', gold: '#F2C53D' };
  CAST.basilisk = (x, y, s, t, o = {}) => {
    const key = o.boilKey || 'basilisk', bs = part => boilSeed(key + ' ' + part);
    const coil = clamp(o.coil || 0), rise = Math.max(0, o.rise ?? 1), bow = clamp(o.bow || 0), pup = clamp(o.puppet || 0), open = clamp(o.open || 0);
    const sw = clamp(s / 12, .5, 2.6), dir = o.flip ? -1 : 1, N = 12, L = 15 * s * rise * (1 - .3 * coil), J = open * 2.4;
    const ph = t * 2.3 + (o.seed || 0), sway = (o.sway ?? 1) * (1 - bow * .75);
    // spine: a gently swaying S-curve; bow arches the neck over into a curtsy
    const sp = [[0, -coil * 2.4 * s]], an = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      an.push(sway * .42 * Math.sin(u * 4.4 - 1.3 + Math.sin(ph) * .45) * (1 - .6 * u) + bow * 2.7 * u * u * u + (o.lean || 0) * u);
      if (i) { const a = (an[i - 1] + an[i]) / 2, p = sp[i - 1]; sp.push([p[0] + Math.sin(a) * L / N, p[1] - Math.cos(a) * L / N]); }
    }
    const wid = u => s * (3.1 - 1.35 * u);
    const off = (i, k) => { const w = wid(i / N) * k, a = an[i]; return [sp[i][0] + Math.cos(a) * w, sp[i][1] + Math.sin(a) * w]; };
    const ah = an[N] * .5 + bow * .45;                 // head angle (straightens up relative to the neck)

    push(); translate(x, y); scale(dir, 1);
    if (coil > .02) {
      // its coiled tail on the ground point: two fat loops, the lower one wider
      bs('coil');
      paint(ellPts(0, s * .2, s * 6.4, s * 1.1, 16), { wash: PAL.ink, washOp: 60, ink: null });
      for (const [cy, rx, ry] of [[-.9, 5.6, 1.6], [-2.6, 4.4, 1.4]]) paint(ellPts(0, cy * s * coil, rx * s, ry * s * coil + .1, 22), { wash: BS.body, fill: BS.dk, fillOp: 70, tex: .6, ink: PAL.ink, sw });
      inkLine([[-5.2 * s, -1 * s * coil], [-2 * s, -.2 * s * coil], [2 * s, -.3 * s * coil], [5.2 * s, -1.1 * s * coil]], sw * .5, BS.dk, 'inkfine', .5);
      paint(ribbon([[4.8 * s, -.6 * s * coil], [6.6 * s, -1.4 * s * coil], [7.2 * s, -3 * s * coil]], s * .7, s * .1), { wash: BS.body, ink: PAL.ink, sw: sw * .8 });
    }
    if (rise > .03) {
      bs('frill');
      // back frill: little violet spikes along the -x edge, drawn first so the body overlaps their roots
      for (let i = 2; i < N - 1; i++) {
        const a = an[i], w = wid(i / N), nx = -Math.cos(a), ny = -Math.sin(a), tx = Math.sin(a), ty = -Math.cos(a);
        const bx = sp[i][0] + nx * w * .8, by = sp[i][1] + ny * w * .8, len = s * (1.3 + .25 * Math.sin(i * 1.7));
        paint([[bx - tx * s * .8, by - ty * s * .8], [bx + nx * len + tx * s * .5, by + ny * len + ty * s * .5], [bx + tx * s * .9, by + ty * s * .9]], { wash: BS.frill, fill: PAL.violet, fillOp: 60, ink: PAL.ink, sw: sw * .6 });
      }
      bs('body');
      const A = [], B = [];
      for (let i = 0; i <= N; i++) { A.push(off(i, i ? 1 : 1.12)); B.push(off(i, i ? -1 : -1.12)); }
      paint([...A, ...B.reverse()], { wash: BS.body, fill: BS.dk, fillOp: 75, bleed: .06, tex: .7, border: .5, ink: PAL.ink, sw, curv: .35 });
      // belly plates (a cream strip slightly to the +x side, with ridges)
      const bA = [], bB = [];
      for (let i = 0; i <= N - 1; i++) { bA.push(off(i, .64)); bB.push(off(i, -.22)); }
      paint([...bA, ...bB.slice().reverse()], { wash: BS.belly, fill: PAL.ochre, fillOp: 50, tex: .5, ink: null, curv: .35 });
      for (let i = 1; i < N - 1; i++) { const p = off(i, .64), q = off(i, -.22), m = off(i, .21); inkLine([q, [m[0], m[1] + s * .3], p], sw * .45, BS.dk, 'inkfine', .6); }
      for (const i of [2, 4, 6, 8]) { const p = off(i, -.64); paint(ellPts(p[0], p[1], s * .5, s * .32, 10, 0, an[i]), { wash: BS.dk, washOp: 170, ink: null }); }
      // puppet: a striped sock cuff at the base and cross-stitch seams
      if (pup > .02) {
        bs('puppet');
        paint([off(0, 1.14), off(1, 1.06), off(1, -1.06), off(0, -1.14)], { wash: PAL.rose, washOp: 255 * pup, ink: PAL.ink, sw: sw * .7 });
        inkLine([off(0, 1.1), off(0, -1.1)], sw * 1.1, PAL.cream, 'ink', 0);
        if (pup > .3) for (let i = 2; i < N; i += 2) { const p = off(i, -.45), q = off(i + 1, -.45); inkLine([p, q], sw * .35, PAL.cream, 'inkfine', 0); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; inkLine([[m[0] - s * .35, m[1] - s * .2], [m[0] + s * .35, m[1] + s * .2]], sw * .35, PAL.cream, 'inkfine', 0); }
      }

      // ---------- head ----------
      bs('head');
      push(); translate(sp[N][0], sp[N][1]); rotate(ah);
      const S = ([a, b]) => [a * s, b * s];
      if (open > .02) {
        paint([[-3.3, -1.1], [3.3, -1.1], [2.8, .5 + J], [0, 1.05 + J], [-2.8, .5 + J]].map(S), { wash: BS.body, fill: BS.dk, fillOp: 70, ink: PAL.ink, sw, curv: .5 });
        paint([[-2.9, -1.2], [2.9, -1.2], [2.3, J * .82], [0, .32 + J * .86], [-2.3, J * .82]].map(S), { wash: BS.maw, ink: null, curv: .5 });
        paint(ellPts(0, (.15 + J * .72) * s, 1.4 * s, .5 * s, 14), { wash: BS.tongue, ink: null });
      }
      const skull = [[-4.3, -2.4], [-4.1, -3.9], [-3.1, -5.1], [-1.5, -5.7], [0, -5.8], [1.5, -5.7], [3.1, -5.1], [4.1, -3.9], [4.3, -2.4], [3.8, -1.1], [2.6, -.2], [0, .15], [-2.6, -.2], [-3.8, -1.1]].map(S);
      paint(skull, { wash: BS.body, fill: BS.dk, fillOp: 55, bleed: .08, tex: .6, border: .5, ink: PAL.ink, sw, curv: .5 });
      paint(ellPts(-.8 * s, -4.6 * s, 2.2 * s, .8 * s, 14, 0, -.15), { fill: '#8FD1A6', fillOp: 110, bleed: .2, tex: .7, border: .7, ink: null });
      // mouth: a wide smile with two fangs (or the fangs hang over the open maw)
      if (open <= .02) inkLine([[-2.9, -1.25], [-1.4, -.62], [0, -.5], [1.4, -.62], [2.9, -1.25]].map(S), sw * 1.1, PAL.ink, 'ink', .6);
      for (const fx of [-1.05, 1.05]) {
        const y0 = open > .02 ? -.05 : -.6, y1 = open > .02 ? 1.0 : .25;
        paint([[fx - .38, y0], [fx + .38, y0], [fx, y1]].map(S), { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
      }
      // forked tongue flick when the mouth is shut
      if (open <= .02 && frac(t * .9 + (o.seed || 0)) < .2) {
        const k = Math.sin(frac(t * .9 + (o.seed || 0)) / .2 * Math.PI), ty = (-.3 + 2.2 * k) * s;
        inkLine([[0, -.4 * s], [.15 * s, ty * .6], [0, ty]], sw * 1.6, BS.tongue, 'ink', .5);
        inkLine([[0, ty], [-.45 * s, ty + .6 * s]], sw * 1.2, BS.tongue, 'ink', 0);
        inkLine([[0, ty], [.45 * s, ty + .6 * s]], sw * 1.2, BS.tongue, 'ink', 0);
      }
      for (const nx of [-.65, .65]) paint(ellPts(nx * s, -1.75 * s, .22 * s, .14 * s, 8), { wash: PAL.ink, ink: null });
      if (o.blush) for (const bx of [-3.0, 3.0]) paint(ellPts(bx * s, -1.75 * s, .85 * s, .42 * s, 12), { fill: PAL.rose, fillOp: 170 * clamp(o.blush), bleed: .2, ink: null });
      const eyes = o.eyes || 'slit';
      for (const ex of [-2.05, 2.05]) {
        const cx = ex * s, cy = -3.4 * s;
        if (eyes === 'happy') { inkLine([[cx - .95 * s, cy + .35 * s], [cx, cy - .65 * s], [cx + .95 * s, cy + .35 * s]], sw * 1.5, PAL.ink, 'ink', .4); continue; }
        if (eyes === 'closed') { inkLine([[cx - .95 * s, cy - .1 * s], [cx, cy + .5 * s], [cx + .95 * s, cy - .1 * s]], sw * 1.4, PAL.ink, 'ink', .4); continue; }
        paint(ellPts(cx, cy, 1.15 * s, 1.25 * s, 18), { wash: BS.eye, fill: PAL.ochre, fillOp: 70, ink: PAL.ink, sw: sw * .8 });
        const lx = (o.lookX || 0) * .42 * s, ly = (o.lookY || 0) * .4 * s;
        if (eyes === 'wide') paint(ellPts(cx + lx, cy + ly, .55 * s, .62 * s, 12), { wash: PAL.ink, ink: null });
        else paint(ellPts(cx + lx, cy + ly, .26 * s, .92 * s, 12), { wash: PAL.ink, ink: null });
        paint(ellPts(cx + lx + .32 * s, cy + ly - .48 * s, .2 * s, .2 * s, 8), { wash: PAL.cream, ink: null });
        const lid = eyes === 'wide' ? 0 : (o.lids ?? .45);
        if (lid > .02) {
          const inner = ex < 0 ? 1 : -1, yO = cy - 1.3 * s + lid * 1.0 * s, yI = cy - 1.3 * s + lid * 1.9 * s;
          const pO = [cx - inner * 1.35 * s, yO], pI = [cx + inner * 1.35 * s, yI];
          paint([[pO[0], cy - 1.9 * s], [pI[0], cy - 1.9 * s], pI, pO], { wash: BS.body, ink: null });
          inkLine([pO, pI], sw * 1.1, PAL.ink, 'ink', 0);
        }
      }
      // the little crown, jauntily tilted
      push(); translate(.45 * s, -5.3 * s); rotate(.24);
      paint([[-1.7, .25], [-1.85, -2.0], [-.9, -1.0], [0, -2.45], [.9, -1.0], [1.85, -2.0], [1.7, .25]].map(S), { wash: BS.gold, fill: PAL.ochre, fillOp: 90, ink: PAL.ink, sw: sw * .8 });
      for (const [gx, gc] of [[-1.0, PAL.teal], [0, PAL.rose], [1.0, PAL.teal]]) paint(ellPts(gx * s, -.5 * s, .28 * s, .28 * s, 8), { wash: gc, ink: null });
      for (const [px, py] of [[-1.85, -2.0], [0, -2.45], [1.85, -2.0]]) paint(ellPts(px * s, py * s, .27 * s, .27 * s, 8), { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
      pop();
      pop(); // head

      // puppet rig: a wooden control bar on strings, held by a stagehand's arms reaching in from above
      if (pup > .02) {
        bs('rig');
        const hx = sp[N][0], hy = sp[N][1], by = hy - 11 * s - (1 - pup) * 60 * s, bx = hx + Math.sin(t * 2.3) * s * .6;
        const tip = (lx, ly) => [hx + lx * Math.cos(ah) - ly * Math.sin(ah), hy + lx * Math.sin(ah) + ly * Math.cos(ah)];
        for (const [a, b] of [[[bx - 4.2 * s, by], tip(-3.6, -3.4)], [[bx + 4.2 * s, by], tip(3.6, -3.4)], [[bx, by], sp[N >> 1]], [[bx - 1.2 * s, by], tip(0, -5.8)]]) inkLine([a, b], sw * .35, PAL.cream, 'inkfine', 0);
        paint(rectPts(bx - 5 * s, by - .45 * s, 10 * s, .9 * s, s * .05), { wash: WOOD, fill: WOOD_DK, fillOp: 70, ink: PAL.ink, sw: sw * .7 });
        paint(rectPts(bx - .45 * s, by - 2.6 * s, .9 * s, 5.2 * s, s * .05), { wash: WOOD, fill: WOOD_DK, fillOp: 70, ink: PAL.ink, sw: sw * .7 });
        for (const side of [-1, 1]) {
          const ax = bx + side * 3.4 * s;
          paint(rectPts(ax - .9 * s, by - 60 * s, 1.8 * s, 59.2 * s), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 50, ink: PAL.ink, sw: sw * .7 });
          paint(rrPts(ax - 1.25 * s, by - 1.1 * s, 2.5 * s, 2.0 * s, .7 * s), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 60, ink: PAL.ink, sw: sw * .7 });
        }
      }
    }
    pop();
    boilSeed(key + ' after');
    const my = (.4 + J * .6) * s, hx = x + dir * sp[N][0], hy = y + sp[N][1];
    return { hx, hy, mx: hx - dir * my * Math.sin(ah), my: hy + my * Math.cos(ah), top: hy - 7 * s };
  };

  // =====================================================================================================
  // CAST.vaultMonster(x, y, s, t, o): the glowing monster locked in the "safe" vault (a Guest). (x, y) ground point,
  // s on the Researcher's scale (about 15s tall). o: view 0 (back) .. .5 (three-quarter) .. 1 (front), wave 0..1 (the
  // right arm waves), happy (eyes), blush, glow 0..1, flip, boilKey.
  // =====================================================================================================
  CAST.vaultMonster = (x, y, s, t, o = {}) => {
    const key = o.boilKey || 'vault monster', bs = part => boilSeed(key + ' ' + part);
    const k = s / 24, view = o.view ?? 1, fl = o.flip ? -1 : 1, wv = clamp(o.wave || 0), MC = '#B97BE6', MD = '#8B4FC9';
    bs('glow');
    if ((o.glow ?? 1) > 0) glow(x, y - 170 * k, 330 * k, GOLD2, .8 * (o.glow ?? 1));
    push(); translate(x, y); scale(fl, 1);
    const bob = Math.abs(Math.sin(bpOf(t) * Math.PI)) * 6 * k;
    translate(0, -bob);
    // arms: the left one rests, the right one waves (behind the body when seen from the back)
    bs('arms');
    const wave = Math.sin(t * 13) * .55 * wv;
    const armL = [[-135 * k, -120 * k], [-205 * k, -70 * k], [-215 * k, -20 * k]];
    const armR = [[135 * k, -130 * k], [lerp(205, 200, wv) * k, -lerp(70, 250, wv) * k], [(lerp(215, 225, wv) + 70 * wave) * k, -lerp(20, 340, wv) * k]];
    for (const ar of [armL, armR]) { paint(ribbon(ar, 16 * k, 12 * k), { wash: MC, ink: PAL.ink, sw: .9 * k }); paint(ellPts(ar[2][0], ar[2][1], 26 * k, 26 * k, 12), { wash: MC, ink: PAL.ink, sw: .8 * k }); }
    bs('body');
    const body = [];
    for (let i = 0; i <= 22; i++) { const a = Math.PI + i / 22 * Math.PI; body.push([Math.cos(a) * 150 * k, -150 * k + Math.sin(a) * 170 * k]); }
    for (let i = 0; i <= 8; i++) body.push([(150 - i * 37.5) * k, -(i % 2 ? 0 : 22) * k + Math.sin(t * 8 + i) * 4 * k]);
    paint(body, { wash: MC, fill: MD, fillOp: 90, bleed: .1, tex: .6, border: .5, ink: PAL.ink, sw: 1.2 * k, curv: .4 });
    paint(ellPts(-40 * k, -240 * k, 70 * k, 40 * k, 14), { fill: '#E7C3F5', fillOp: 140, bleed: .2, ink: null });
    for (const sd of [-1, 1]) paint([[sd * 60 * k, -300 * k], [sd * 95 * k, -360 * k], [sd * 100 * k, -290 * k]], { wash: GOLD2, ink: PAL.ink, sw: .7 * k });
    if (view < .25) {
      // from behind: a ridge of gold spines down its back
      for (let i = 0; i < 4; i++) paint([[-18 * k, (-280 + i * 60) * k], [0, (-320 + i * 60) * k], [18 * k, (-280 + i * 60) * k]], { wash: GOLD2, ink: PAL.ink, sw: .6 * k });
    } else {
      // the face slides round with the view: three-quarter → front
      bs('face');
      const fx = (1 - view) * 70 * k, fw = .6 + .4 * view;
      for (const [ex, ey, er] of [[-70, -215, 26], [0, -240, 36], [70, -215, 26]]) {
        const X = fx + ex * k * fw, Y = ey * k, R = er * k;
        if (o.happy) inkLine([[X - R * .8 * fw, Y + 6 * k], [X, Y - R * .6], [X + R * .8 * fw, Y + 6 * k]], 1.6 * k, PAL.ink, 'ink', .4);
        else { paint(ellPts(X, Y, R * fw, R * 1.1, 14), { wash: PAL.cream, ink: PAL.ink, sw: .7 * k }); paint(ellPts(X + 5 * k, Y + 4 * k, R * .45 * fw, R * .5, 10), { wash: PAL.ink, ink: null }); }
      }
      const my = -140 * k;
      paint([[fx - 80 * k * fw, my], [fx + 80 * k * fw, my], [fx + 50 * k * fw, my + 50 * k], [fx - 50 * k * fw, my + 50 * k]], { wash: '#5A1F33', ink: PAL.ink, sw: .8 * k, curv: .5 });
      for (let i = 0; i < 4; i++) paint([[fx + (-60 + i * 40) * k * fw, my + 2 * k], [fx + (-40 + i * 40) * k * fw, my + 2 * k], [fx + (-50 + i * 40) * k * fw, my + 20 * k]], { wash: PAL.cream, ink: null });
      if (o.blush) for (const sd of [-1, 1]) paint(ellPts(fx + sd * 110 * k * fw, -160 * k, 26 * k, 14 * k, 10), { fill: PAL.rose, fillOp: 170, ink: null });
    }
    pop();
    boilSeed(key + ' after');
  };

  // =====================================================================================================
  // Arena kit: the chorus stage, bigger. Violet-and-gold sunburst, sweeping beams, pyro jets, a crowd.
  // =====================================================================================================
  const arenaBack = (t, spots) => stageBack(t, { a: VIO, b: GOLD2, wall: LAV, spots });
  function beams(t) {
    boilSeed('beams');
    const cols = [VIO, GOLD2, PAL.rose, PAL.cream];
    for (let i = 0; i < 4; i++) {
      const x0 = 330 + i * 420, a = Math.sin(bpOf(t) * Math.PI / 4 + i * 1.9) * .5, len = 1050, w = 150;
      const ex = x0 + Math.sin(a) * len, ey = 120 + Math.cos(a) * len;
      paint([[x0 - 18, 120], [x0 + 18, 120], [ex + w, ey], [ex - w, ey]], { fill: cols[i], fillOp: 42, bleed: .05, tex: .2, border: .1, ink: null });
    }
  }
  // flame envelope: shoots up right on the beat, then dies away
  const jetEnv = (t, ph = 0) => { const f = frac(bpOf(t) - ph); return f < .07 ? f / .07 : Math.exp(-(f - .07) * 3.4); };
  function pyro(x, y, h, t, w = 60, seed = 0) {
    boilSeed('pyro' + seed);
    paint(rectPts(x - w * .55, y - 26, w * 1.1, 30, 2), { wash: '#4A4458', ink: PAL.ink, sw: .8 });
    if (h < 10) return;
    const flame = (sc, hh, col, fcol, ink) => {
      const L = [], R = [], n = 9;
      for (let i = 0; i <= n; i++) {
        const a = i / n, ww = w * sc * Math.pow(1 - a, .75) * (1 + .6 * Math.sin(a * Math.PI)), xo = Math.sin(a * 6 + t * 26 + seed) * w * .35 * a;
        L.push([x + xo - ww, y - 24 - a * hh]); R.push([x + xo + ww, y - 24 - a * hh]);
      }
      paint([...L, ...R.reverse()], { wash: col, washOp: 235, fill: fcol, fillOp: fcol ? 80 : 0, bleed: .15, tex: .4, border: .3, ink: ink ? PAL.ink : null, sw: .9, curv: .5 });
    };
    flame(1, h, '#E8553A', PAL.rose, true);
    flame(.62, h * .78, PAL.ochre, '#F7D24A', false);
    flame(.3, h * .52, PAL.cream, null, false);
    for (let i = 0; i < 5; i++) {
      const ph = frac(t * 1.7 + hash(i + seed * 7)), sx = x + (hash(i * 3 + seed) - .5) * w * 2.4 + Math.sin(t * 9 + i) * 10, sy = y - 24 - h * (.7 + ph * .6);
      paint(ellPts(sx, sy, 7 * (1 - ph) + 2, 7 * (1 - ph) + 2, 8), { wash: i % 2 ? GOLD2 : PAL.cream, ink: null });
    }
  }
  // the arena's valance across the top of the frame (screen space)
  function valanceTop(y0 = 100) {
    boilSeed('valance');
    const v = [[-80, -60], [W + 80, -60]];
    for (let i = 12; i >= 0; i--) { v.push([i * 160 + 80, y0 + 26 + jit(2)]); v.push([i * 160, y0]); }
    paint(v, { wash: CURTAIN, washOp: 255, fill: CURTAIN_DK, fillOp: 110, bleed: .05, tex: .7, border: .6, ink: PAL.ink, sw: 1.5 });
    const fr = []; for (let i = 0; i <= 24; i++) fr.push([i * 80, y0 + (i % 2 ? 14 : 4)]);
    inkLine(fr, 1.2, GOLD, 'ink', .3);
  }
  // the proscenium, scaled up: the arena is bigger than the chorus-1 stage
  function bigFront(t, k = 1.4) { push(); translate(960, 0); scale(k); translate(-960, 0); stageFront(t, {}); pop(); }
  // audience silhouettes along the bottom (screen space), bobbing on the beat, a few glow sticks
  function crowd(t, y0 = 1015, col = '#2A1F4A') {
    boilSeed('crowd');
    const pts = [[-40, 1120]], sticks = [];
    for (let i = 0; i < 20; i++) {
      const x = (i + .5) * (W / 20) + (hash(i) - .5) * 40, bob = pulse(t - hash(i + 3) * .08, 5) * 14, hy = y0 + hash(i + 7) * 34 - bob, r = 30 + hash(i + 11) * 12;
      pts.push([x - r * 1.7, hy + r * 2.2]);
      if (hash(i + 19) < .5) {
        const ax = x - r * 1.2 + Math.sin(bpOf(t) * Math.PI + i) * 14, ay = hy - r * 2.6 - bob;
        pts.push([x - r * 1.35, hy + r * .9], [ax - 9, ay], [ax + 9, ay - 3], [x - r * .95, hy + r * .7]);
        if (i % 3 === 0) sticks.push([ax, ay, i]);
      }
      for (let k = 0; k <= 6; k++) { const a = Math.PI + k / 6 * Math.PI; pts.push([x + Math.cos(a) * r, hy + Math.sin(a) * r * 1.1]); }
      pts.push([x + r * 1.7, hy + r * 2.2]);
    }
    pts.push([W + 40, 1120]);
    paint(pts, { wash: col, washOp: 255, ink: null });
    for (const [ax, ay, i] of sticks) inkLine([[ax - 12, ay - 30], [ax + 8, ay + 4]], 2.2, [GREEN, PAL.rose, GOLD2][i % 3], 'ink', 0);
  }

  // Clawd working two pumps at once, one in each hand. (x, gy) Clawd's ground point; u its size. The pumps stand at its
  // sides, sized so their handles ride at Clawd's shoulder height; the down-stroke lands on each beat (pumpH).
  // o: h (handle height, default pumpH(t)), hoseTo, knock 0..1 (the pumps topple outward), pose (Clawd's pose).
  function twoPumps(x, gy, u, t, o = {}) {
    const h = o.h ?? pumpH(t), ps = 4.5 * u / 332, reach = (4.9 + 2.15) * u, knock = o.knock || 0;
    const dy = -h * .25, sq = (1 - h) * .07;
    const handleY = gy - (257 + 150 * h) * ps, pivY = gy + dy * u - 4.5 * u * (1 - sq);
    const aa = Math.asin(clamp((pivY - handleY) / (2.2 * u), -1, 1));
    for (const side of [-1, 1]) {
      push(); translate(x + side * reach, gy); rotate(side * knock * 1.3);
      pumpProp(0, 0, ps, h, o.hoseTo && side === 1 ? [o.hoseTo[0] - (x + reach), o.hoseTo[1] - gy] : null);
      pop();
    }
    if (o.hoseTo && !knock) { boilSeed('left hose'); inkLine([[x - reach + 30 * ps, gy - 20 * ps], [x, gy + 26 * ps], [o.hoseTo[0], o.hoseTo[1]]], 2.2 * ps, PAL.ink, 'ink', .7); }
    const P = o.pose || {};
    clawd(x, gy, u, { ...P, dy: (P.dy || 0) + (knock ? 0 : dy), sq: (P.sq || 0) + (knock ? 0 : sq), aL: knock ? P.aL : aa, aR: knock ? P.aR : aa, boilKey: P.boilKey || 'clawd' });
  }

  // =====================================================================================================
  // The Seam in: Sydney's heart bubble seen from inside (Chapter 3's last frame: flat pink, a soft white highlight in
  // the upper left) tears open from a puncture in the first POPD seconds, spraying droplets and shreds of film.
  // =====================================================================================================
  // the gloss exactly as Chapter 3 paints it (c03_takeoff.js: gloss / insideBubble), so the frames meet
  function gloss(cx, cy, R, a0, a1, w, op = 235) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = lerp(a0, a1, i / 12); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    for (let i = 12; i >= 0; i--) { const a = lerp(a0, a1, i / 12), k = Math.sin(i / 12 * Math.PI); pts.push([cx + Math.cos(a) * (R - w * k), cy + Math.sin(a) * (R - w * k)]); }
    paint(pts, { wash: '#FFF8FB', washOp: op, ink: null });
  }
  function bubbleFilm(R = 0) {
    boilSeed('inside gloss');
    if (R < 380) gloss(560, 520, 430, 3.3, 4.7, 70, 225);
    if (R < 300) paint(ellPts(840, 150, 44, 26, 14, 0, -.2), { wash: '#FFF8FB', washOp: 230, ink: null });
  }
  function bubblePop(lt) {
    const k = lt / POPD, P = [960, 470];
    if (lt <= 0) { flash(1, PINK); bubbleFilm(); return; }
    if (lt > 1.1) return;
    boilSeed('bubble pop');
    const R = 2100 * Math.pow(Math.min(k, 1.2), 1.5);
    if (k < 1.05) {
      const hole = [];
      for (let i = 0; i < 34; i++) { const a = i / 34 * TAU, rr = Math.max(6, R) * (.84 + .24 * hash(i * 7.3) + .05 * Math.sin(a * 9)); hole.push([P[0] + Math.cos(a) * rr, P[1] + Math.sin(a) * rr * .9]); }
      irisShape(hole, PINK);
      inkLine([...hole, hole[0]], 2.6, PINK_DK, 'ink', .3);
      bubbleFilm(R);
    }
    // the puncture's little white flash
    if (k < .7) paint(starPts(P[0], P[1], 60 + 520 * k, .3, 8, .2), { wash: PAL.cream, washOp: 255 * (1 - k / .7), ink: null });
    // droplets flung off the retreating rim
    if (lt < .8) for (let i = 0; i < 36; i++) {
      const a = hash(i * 3.7) * TAU, d = Math.min(R, 1400) * (.72 + .3 * hash(i + 50)) + lt * 900 * hash(i + 90), r = (8 + 16 * hash(i + 20)) * (1 - lt / .8);
      const x = P[0] + Math.cos(a) * d, y = P[1] + Math.sin(a) * d * .9 + 700 * lt * lt;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      paint(ellPts(x, y, r, r * 1.1, 10), { wash: PINK, ink: PINK_DK, sw: .5 });
      if (r > 9) paint(ellPts(x - r * .3, y - r * .35, r * .28, r * .22, 6), { wash: PAL.cream, ink: null });
    }
    // curly shreds of film
    if (lt < 1.1) for (let j = 0; j < 10; j++) {
      const a = (j + hash(j)) / 10 * TAU, d = Math.min(R, 900) * .8 + 520 * lt, x = P[0] + Math.cos(a) * d, y = P[1] + Math.sin(a) * d * .8 + 1400 * lt * lt;
      if (y > H + 80) continue;
      push(); translate(x, y); rotate(hash(j * 5) * TAU + lt * (hash(j + 2) - .5) * 14); scale(1.3 - lt * .6);
      paint([[-50, -6], [-20, -22], [25, -18], [55, 4], [20, -4], [-18, -2]], { wash: PINK, fill: PAL.violet, fillOp: 40, ink: PINK_DK, sw: .7, curv: .5 });
      pop();
    }
  }

  // =====================================================================================================
  // A · "I'm upping my P(doom)" · The bubble pops and the pyro fires: the same stage, now an arena. Building-sized
  // Clawd works two pumps, a down-stroke on every beat; the meter climbs from 34; the tiny Researcher cheers at its
  // feet for scale. Low angle, a slow push up. Seam in: the pop. Seam out: cut on the beat.
  // =====================================================================================================
  const GA = 912, UA = 86, XA = 830, MXA = 1640, MSA = 1.05;
  function upping(t, lt, dur) {
    const hit = pulse(t, 5), popK = Math.exp(-Math.max(0, lt - .05) * 3);   // the pop's pyro blast decays
    const [sx, sy] = shakeXY(t, 7 * hit + 14 * popK * (lt > .05 ? 1 : 0));
    camBegin(930 + sx - lt * 14, 495 + sy - lt * 22, 1.03 + lt * .035, -.025);
    arenaBack(t, [[XA, PAL.cream]]);
    beams(t);
    [[150, 0], [620, .5], [1280, .5], [1900, 0]].forEach(([x, ph], i) => pyro(x, 806, Math.max(620 * jetEnv(t, ph), 900 * popK), t, 58, i));
    meterProp(MXA, GA - 10, MSA, pdoomAt(t), { glow: .2 + .8 * hit });
    const md = clawd.emotions(t, [[UP, 'excited'], [STAR, 'starstruck']]);
    twoPumps(XA, GA, UA, t, { hoseTo: [MXA - 60 * MSA, GA - 10 - 92 * MSA], pose: { ...md, dy: (md.dy || 0) * .15, sq: (md.sq || 0) * .3, mouth: 'grin', blush: 1, noShadow: false, seed: 1 } });
    // for scale: the tiny Researcher cheering between Clawd's feet
    const rd = researcher.dance('hop', t - BEAT * .25, 3);
    researcher(XA + 300, GA + 6, 7.5, { ...rd, eyes: 'star', mouth: 'grin', hairUp: .6, aL: 1.2 + .3 * hit, aR: 1.2 + .3 * hit, boilKey: 'researcher' });
    // big foreground jets at the stage lip
    pyro(70, 1010, Math.max(820 * jetEnv(t), 1100 * popK), t, 90, 11);
    pyro(1860, 1010, Math.max(820 * jetEnv(t), 1100 * popK), t, 90, 12);
    camEnd();
    valanceTop(96);
    crowd(t, 1050);
    flushLetters();                                   // the meter's lettering belongs under the bubble film
    bubblePop(lt);
  }

  // =====================================================================================================
  // B · "I hear the basilisk boom" · Wider. Clawd keeps pumping until "basilisk", when the floor starts to bulge;
  // on "boom" the crowned basilisk bursts up through the stage: BOOM, planks flying, the pumps topple, Clawd and the
  // Researcher go over. The Researcher bounces up sitting and throws GPUs at it as offerings, on the eighth notes:
  // the first one is gobbled, the second sails up out of frame. Seam out: that GPU flies up into the next Shot.
  // =====================================================================================================
  function mound(x, y, k, t) {
    boilSeed('mound');
    const hgt = 95 * k * k * (1 + .35 * Math.sin(t * 43)) + 6 * k, w = 190 + 90 * k, pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([x - w + u * 2 * w, y + 8 - Math.pow(Math.sin(u * Math.PI), 1.4) * hgt]); }
    pts.push([x + w, y + 34], [x - w, y + 34]);
    paint(pts, { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .7, ink: PAL.ink, sw: 1, curv: .4 });
    for (let i = 0; i < 8; i++) {
      if (k < i / 11) continue;
      const a = (i + .5) / 8 * Math.PI, sgn = i % 2 ? 1 : -1, len = (90 + 190 * hash(i)) * clamp(k * 1.5 - i / 11), p = [[x + sgn * 20, y - hgt * .5]];
      for (let q = 1; q <= 4; q++) p.push([x + sgn * 20 + Math.cos(a) * len * q / 4 * 1.7 + (q % 2 ? 10 : -10), y - hgt * .5 + Math.abs(Math.sin(a)) * len * q / 4 * .35 + (q % 2 ? -6 : 6)]);
      inkLine(p, 1.3, PAL.ink, 'ink', 0);
    }
    for (let i = 0; i < 4; i++) { const ph = frac(t * 2.6 + hash(i)), px = x + (hash(i + 4) - .5) * w * 1.7; paint(ellPts(px, y - 10 - ph * 110 - hgt * .5, 26 + 40 * ph, 20 + 26 * ph, 12, 4), { wash: '#EFE3CF', washOp: 200 * (1 - ph) * k, ink: null }); }
  }
  const holePts = (x, y, rx, ry, jag) => { const p = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = 1 + jag * (hash(i * 3.1) - .3); p.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]); } return p; };
  function holeBack(x, y) {
    boilSeed('hole back');
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i + .5) / 6 * Math.PI, px = x + Math.cos(a) * 190, py = y + Math.sin(a) * 50; paint([[px - 16, py + 6], [px + 16, py + 6], [px + Math.cos(a) * 30 + 8, py - 40 - 20 * hash(i)], [px + Math.cos(a) * 30 - 6, py - 30]], { wash: WOOD, fill: WOOD_DK, fillOp: 60, ink: PAL.ink, sw: .8 }); }
    paint(holePts(x, y, 200, 52, .18), { wash: '#2B1A22', fill: VIO, fillOp: 60, ink: PAL.ink, sw: 1.2 });
  }
  function holeFront(x, y) {
    boilSeed('hole front');
    const p = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI - i / 10 * Math.PI; p.push([x + Math.cos(a) * 214, y + Math.sin(a) * 64 + 6]); }
    for (let i = 10; i >= 0; i--) { const a = Math.PI - i / 10 * Math.PI; p.push([x + Math.cos(a) * 120, y + Math.sin(a) * 18 + 10 - (i % 2 ? 16 : 0)]); }
    paint(p, { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .7, ink: PAL.ink, sw: 1 });
  }
  function planks(x, y, a) {
    if (a < 0 || a > 1.6) return;
    for (let i = 0; i < 12; i++) {
      boilSeed('plank' + i);
      const vx = (hash(i * 3.3) - .5) * 1900, vy = -(900 + 900 * hash(i * 5.1)), px = x + vx * a, py = y - 30 + vy * a + 1900 * a * a;
      if (py > 1300) continue;
      push(); translate(px, py); rotate(hash(i) * TAU + a * (hash(i * 2.2) - .5) * 18); scale(1 + a * 1.3 * hash(i * 7.7));
      paint(rectPts(-62, -13, 124, 26, 2), { wash: WOOD, ink: PAL.ink, sw: .9 });
      inkLine([[-50, -3], [48, -4]], .4, WOOD_DK, 'inkfine', 0);
      pop();
    }
  }
  function dust(x, y, a) {
    if (a < 0 || a > 1.4) return;
    boilSeed('dust');
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI + (i + .5) / 6 * Math.PI, d = 120 + 260 * easeOut(a / .9), r = (70 + 60 * hash(i)) * (.6 + easeOut(a / .8));
      paint(ellPts(x + Math.cos(ang) * d * 1.3, y + Math.sin(ang) * d * .35 - 20 - 90 * a, r, r * .7, 16, r * .22), { wash: i % 2 ? '#E4D0AC' : '#EFDFC4', washOp: 190 * Math.pow(1 - a / 1.4, 1.3), ink: null });
    }
  }
  // a little graphics card: black board, green edge, two fans, gold contacts (no lettering)
  function gpuCard(x, y, sc, rot) {
    push(); translate(x, y); rotate(rot); scale(sc);
    paint(rrPts(-38, -19, 76, 38, 6), { wash: '#2E2C38', ink: PAL.ink, sw: .8 });
    paint(rectPts(-38, -19, 76, 8), { wash: GREEN, ink: null });
    for (const fx of [-17, 17]) paint(ellPts(fx, 4, 11, 11, 10), { wash: '#5D5B72', ink: PAL.cream, sw: .4 });
    paint(rectPts(-24, 19, 44, 6), { wash: GOLD, ink: null });
    pop();
  }
  function crate(x, y) {
    boilSeed('crate');
    for (let i = 0; i < 3; i++) gpuCard(x - 40 + i * 40, y - 70 - (i % 2) * 10, 1, -.3 + i * .3);
    paint(rectPts(x - 80, y - 70, 160, 70, 2), { wash: WOOD, fill: WOOD_DK, fillOp: 70, tex: .6, ink: PAL.ink, sw: 1 });
    inkLine([[x - 80, y - 36], [x + 80, y - 36]], .6, WOOD_DK, 'inkfine', 0);
  }
  const BX = 780, BY = 880, BSZ = 31, RXB = 330, RYB = 935, RSB = 16, CXB = 1340, CUB = 42, MXB = 1775;
  // where the second GPU flies: from the Researcher's hand, up past the basilisk and out of the top of the frame
  const gpu2At = t => { const f = (t - THROW2) / .5; return [lerp(RXB + 60, BX + 260, f), lerp(RYB - 150, -700, Math.pow(f, .8)) - 260 * Math.sin(f * Math.PI) * .3, f]; };
  function basiliskShot(t, lt, dur) {
    const a = t - BOOM, rumble = seg(t, RUMBLE, BOOM);
    const shake = a < 0 ? 2 + 11 * rumble * rumble : 26 * Math.exp(-a * 3.2);
    const [sx, sy] = shakeXY(t, shake);
    const pushIn = a < 0 ? 0 : ease(seg(a, .15, .6));
    const pre = 1 - ease(seg(t, RUMBLE, BOOM));
    camBegin(960 + sx - 40 * pushIn + 60 * pre, 540 + sy - 40 * pushIn + 50 * pre, 1 + .08 * pre + (a < 0 ? .03 * rumble : .08 * Math.exp(-a * 5) + .06 * pushIn), 0);
    arenaBack(t, [[CXB, PAL.cream]]);
    beams(t);
    if (a < 0) [[300, 0], [1180, .5], [1660, 0]].forEach(([x, ph], i) => pyro(x, 806, 420 * jetEnv(t, ph) * (1 - rumble), t, 50, i));
    if (a < 0) mound(BX, BY, rumble, t); else holeBack(BX, BY);

    // the meter, rocked by the BOOM
    meterProp(MXB + (a > 0 ? 40 * Math.exp(-a * 4) * Math.sin(a * 30) : 0), 905, .72, pdoomAt(t), { glow: a > 0 ? 0 : .4 * pulse(t, 5) });   // (its lettering can't rotate with it, so it rocks sideways)
    // Clawd pumps until the rumble, stares down at the bulge, and is thrown over by the BOOM
    const knock = a < 0 ? 0 : backOut(seg(a, .03, .3));
    const h = t < RUMBLE ? pumpH(t) : lerp(pumpH(RUMBLE), .6, ease(seg(t, RUMBLE, RUMBLE + .25)));
    const cm = clawd.emotions(t, [[HEAR, 'excited'], [RUMBLE + .05, 'surprised', { lookX: -.8, lookY: 1 }], [beatsAfter(RUMBLE, 1), 'scared', { lookX: -.8, lookY: .8 }], [BOOM + .04, 'ko']]);
    const fall = a < 0 ? 0 : easeOut(seg(a, .02, .25));
    twoPumps(CXB + 60 * fall, 905, CUB, t, {
      h, knock, hoseTo: a < 0 ? [MXB - 60 * .72, 905 - 92 * .72] : null,
      pose: { ...cm, mouth: a < 0 ? (t < RUMBLE ? 'grin' : 'wobble') : 'O', rot: .5 * fall, dy: (cm.dy || 0) * .4 - (a < 0 ? jit(.15) * rumble : 0), aL: a < 0 ? cm.aL : 1.3 + .4 * Math.sin(t * 20), aR: a < 0 ? cm.aR : 1.4 + .4 * Math.sin(t * 22), noShadow: false, blush: t < RUMBLE ? 1 : 0 }
    });

    // the Researcher: hopping along, then startled, knocked flat, bounces up sitting and throws GPUs on the eighths
    crate(RXB - 150, RYB);
    let rrot = 0, sit = false, aL = -1.2, aR = -1.2, eyes = 'dot', hairUp = rumble, handL = null, handR = null, mouth = 'grin';
    const card = () => gpuCard(12, 0, .62, .4);
    if (t < RUMBLE) { const d = researcher.dance('bounce', t, 2); aL = d.aL - .6; aR = d.aR - .6; eyes = 'closed'; }
    else if (a < 0) { aL = -1.0 + .3 * rumble; aR = -1.0 + .3 * rumble; eyes = 'look'; mouth = 'wobble'; }
    else if (a < .2) { rrot = -1.45 * easeOut(seg(a, .02, .14)); aL = aR = 1.2; hairUp = 1; eyes = a < .06 ? 'wide' : 'x'; mouth = 'O'; }
    else { rrot = lerp(-1.45, 0, backOut(seg(a, .2, .32))); sit = true; hairUp = 1; eyes = 'wide'; mouth = 'O'; }
    // throws: wind back holding a card, then fling up and out (right hand, then left)
    const swing = (t0) => { const p = (t - (t0 - .12)) / .22; return p < 0 ? null : p < .55 ? lerp(-.3, -1.0, ease(p / .55)) : p < 1 ? lerp(-1.0, 1.6, easeOut((p - .55) / .45)) : lerp(1.6, .4, ease(seg(p, 1, 2))); };
    const s1 = swing(THROW1), s2 = swing(THROW2);
    if (s1 != null && t < THROW2 - .12) { aR = s1; if (t < THROW1) handR = card; aL = .6 + .3 * Math.sin(t * 17); }
    if (s2 != null) { aL = s2; if (t < THROW2) handL = card; aR = .5; }
    const rm = t < RUMBLE ? researcher.feel('happy', t) : {};
    researcher(RXB, RYB, RSB, {
      ...rm, rot: rrot, sit, dy: sit ? .9 : (t < RUMBLE ? (rm.dy || 0) : 0), aL, aR, eyes, lookX: .8, lookY: a < 0 ? .8 : -.6, brows: t < RUMBLE ? 'up' : 'worried', mouth, hairUp,
      glassesTilt: a > 0 ? .15 * Math.sin(t * 13) : 0, handL, handR, emote: a < 0 && t > RUMBLE + .1 ? '!' : a > .25 ? 'sweat' : null, emoteK: a < 0 ? seg(t, RUMBLE + .1, RUMBLE + .3) : 1, boilKey: 'researcher'
    });

    // the basilisk rises: a roar, then it gobbles the first offering and follows the second one up
    let head = null;
    if (a >= 0) {
      const rise = backOut(seg(a, 0, .3)), roar = t < THROW1 + FLY1 - .08, gobbled = t > THROW1 + FLY1;
      const chomp = gobbled ? Math.exp(-(t - THROW1 - FLY1) * 10) : 0;
      const g2 = gpu2At(t), watching = t > THROW2;
      head = CAST.basilisk(BX, BY, BSZ, t, {
        rise, open: roar ? .95 * seg(a, .03, .15) : .6 * chomp, eyes: gobbled && !watching ? 'happy' : roar ? 'slit' : 'wide', lids: .6,
        lookX: watching ? .5 : -.6, lookY: watching ? -1 : .3, lean: watching ? .25 * seg(t, THROW2, THROW2 + .2) : -.12 * seg(a, .3, .6), blush: gobbled ? 1 : 0, sway: .8 + .6 * seg(a, 0, 1), boilKey: 'basilisk'
      });
      if (gobbled) emote('heart', head.hx + 170, head.hy - 150, 30, seg(t, THROW1 + FLY1, THROW1 + FLY1 + .15), t - THROW1 - FLY1);
      holeFront(BX, BY);
    }
    planks(BX, BY, a);
    dust(BX, BY, a);
    // GPU offerings in flight
    if (head && t > THROW1 && t < THROW1 + FLY1) { boilSeed('gpu1'); const f = (t - THROW1) / FLY1, p = arcPt([RXB + 60, RYB - 160], [head.mx, head.my], 160, f); gpuCard(p[0], p[1], 1.2 - .3 * f, f * 9); }
    if (t > THROW2) { boilSeed('gpu2'); const [x, y, f] = gpu2At(t); gpuCard(x, y, 1.25 + .5 * f, -.4 + f * 7); }
    bigFront(t);
    camEnd();
    crowd(t, 1030 + (a > 0 ? 30 * Math.exp(-a * 3) : 0));
    if (a >= 0) { flash(.45 * (1 - a / .1), '#FFF1D0'); sfx('BOOM', 1380, 210, 240, '#F7C948', a, { life: .9, rot: -.12, screen: true }); }   // a Sound Word
  }

  // =====================================================================================================
  // C · "NVDA to the moon" · The GPU flies up onto a stock chart and lands as the first point of a green line, which
  // wiggles across to a dip; Clawd hops onto its tip, crouches, and the line rockets off the chart, up through the
  // clouds into space, to the moon. Clawd backflips onto the moon and plants a flag (an up-and-right arrow) on the
  // bar. Tilt up. Seam out: hold on the moon; the next Shot pulls back from it.
  // =====================================================================================================
  const MOON = [4200, -2600], MR = 460;
  const STOCK = (() => {
    const P = [[150, 800], [240, 780], [310, 815], [390, 770], [470, 795], [550, 745], [630, 775], [710, 720], [790, 752], [870, 700], [950, 730], [1010, 748],
      [1070, 690], [1150, 540], [1260, 380], [1400, 170], [1560, -20], [1700, -170], [1950, -420], [2150, -700], [2400, -930], [2650, -1260], [2900, -1500],
      [3150, -1830], [3400, -2060], [3620, -2330], [MOON[0] - MR * .94, MOON[1] + MR * .34]];
    const pts = [], per = 8;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const s = k / per, s2 = s * s, s3 = s2 * s, f = (a, b, c, d) => .5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(P[P.length - 1]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], dip: cum[11 * per] };
  })();
  function atL(L) {
    const { pts, cum } = STOCK; L = clamp(L, 0, STOCK.len);
    let i = 1; while (i < cum.length - 1 && cum[i] < L) i++;
    const f = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]), a = pts[i - 1], b = pts[i];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  function puff(x, y, s) {
    boilSeed('puff' + x);
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI, r = 1 + .24 * Math.abs(Math.sin(i * 1.35 + x * .01)); pts.push([x + Math.cos(a) * 190 * s * r, y + Math.sin(a) * 88 * s * r]); }
    pts.push([x + 170 * s, y + 26 * s], [x - 170 * s, y + 26 * s]);
    paint(pts, { wash: PAL.cream, washOp: 245, fill: PAL.sky, fillOp: 70, bleed: .1, tex: .5, border: .5, ink: PAL.ink, sw: .9, curv: .6 });
  }
  const PUFFS = [[1560, -250, 1.1, 0], [2080, -560, 1.35, 1], [1760, -900, 1.0, 0], [2560, -1060, 1.4, 0], [2330, -1420, 1.15, 1], [3060, -1560, 1.2, 0], [2800, -1980, 1.0, 0], [3380, -1880, .95, 1]];
  // the flag: an up-and-to-the-right arrow, the only thing worth putting on it. (x, y) foot of the pole; sc its scale.
  function moonFlag(x, y, k, t, sc = 1) {
    if (k <= 0) return;
    boilSeed('flag');
    const drop = (1 - easeIn(clamp(k * 3))) * -260;
    push(); translate(x, y + drop * sc); rotate(.18); scale(sc);
    inkLine([[0, 0], [0, -190]], 2.4, PAL.ink, 'ink', 0);
    const wv = Math.sin(t * 9) * 8;
    paint([[0, -188], [120, -178 + wv], [118, -110 + wv], [0, -118]], { wash: PAL.cream, fill: PAL.sky, fillOp: 40, ink: PAL.ink, sw: 1, curv: .3 });
    inkLine([[22, -130 + wv * .6], [52, -150 + wv * .8], [70, -140 + wv * .8], [98, -172 + wv]], 3, GREEN, 'ink', 0);
    paint([[104, -178 + wv], [80, -172 + wv], [100, -156 + wv]], { wash: GREEN, ink: null });
    pop();
  }
  function moonDisc(mx, my, r) {
    boilSeed('moon');
    paint(ellPts(mx, my, r * 1.3, r * 1.3, 26, 10), { fill: PAL.cream, fillOp: 60, bleed: .3, ink: null });
    paint(ellPts(mx, my, r, r, 36, 3), { wash: '#F3E3B0', fill: '#D9C27A', fillOp: 80, bleed: .08, tex: .7, border: .5, ink: PAL.ink, sw: 1.6 * Math.min(1, r / 300) + .4 });
    for (const [ox, oy, cr] of [[-.35, -.2, .2], [.3, .25, .16], [.1, -.5, .1], [-.1, .45, .12], [.5, -.25, .09]]) paint(ellPts(mx + ox * r, my + oy * r, cr * r, cr * r * .8, 14, 2), { wash: '#E2CD8E', fill: '#B99E5E', fillOp: 70, ink: PAL.ink, sw: .7 });
  }
  const camC = t => {
    const tip = atL(stockL(t)), follow = ease(seg(t, LAUNCH + .02, LAUNCH + .3)), endK = ease(seg(t, HITM - .12, FLAG + .1));
    let cx = lerp(960, tip[0] + 90, follow), cy = lerp(540, tip[1] - 60, follow);
    cx = lerp(cx, MOON[0] - 60, endK); cy = lerp(cy, MOON[1] - 290, endK);
    return [cx, cy, lerp(lerp(1, .8, follow), .95, endK)];
  };
  const stockL = t => t < DOT ? 0 : t < LANDC ? STOCK.dip * easeOut(seg(t, DOT, LANDC)) : t < LAUNCH ? STOCK.dip : lerp(STOCK.dip, STOCK.len, easeIO(seg(t, LAUNCH, HITM)));
  function moonShot(t, lt, dur) {
    const L = stockL(t), tip = atL(L), [cx, cy, zoom] = camC(t);
    const alt = clamp((-900 - cy) / 1500);
    boilSeed('sky C');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: mixCol(mixCol(PAL.sky, '#6A68B8', clamp(alt * 1.6)), SPACE, clamp(alt * 1.4 - .4)), ink: null });
    paint(ellPts(500, 300, 900, 500, 20, 20), { fill: alt < .5 ? PAL.cream : VIO, fillOp: 70, bleed: .3, tex: .5, border: .4, ink: null });
    if (alt > .35) for (let i = 0; i < 36; i++) {
      const x = frac(hash(i) - cx * .00006) * W, y = frac(hash(i + 40) + cy * .00008) * H, r = 2 + 4 * hash(i + 80);
      paint(starPts(x, y, r * 2.2, .35, 4), { wash: i % 5 ? PAL.cream : GOLD2, washOp: 255 * clamp((alt - .35) * 3), ink: null });
    }
    const [sx, sy] = shakeXY(t, t > HITM ? 14 * Math.exp(-(t - HITM) * 7) : 0);
    camBegin(cx + sx, cy + sy, zoom, 0);
    // the chart the line escapes from (no labels: the line is the story)
    if (cy > -900) {
      boilSeed('chart');
      paint(rectPts(110, 90, 1700, 880, 4), { wash: PAL.cream, fill: PAL.sky, fillOp: 35, tex: .5, border: .4, ink: PAL.ink, sw: 1.4 });
      for (let i = 1; i < 13; i++) inkLine([[110 + i * 130, 96], [110 + i * 130, 964]], .5, '#9CC7C3', 'inkfine', 0);
      for (let i = 1; i < 8; i++) inkLine([[116, 90 + i * 110], [1804, 90 + i * 110]], .5, '#9CC7C3', 'inkfine', 0);
      inkLine([[150, 110], [150, 930], [1790, 930]], 1.8, PAL.ink, 'ink', 0);
    }
    const fwd = t >= LAUNCH && t < HITM;
    for (const [x, y, s, front] of PUFFS) if (!front) puff(x, y, s);
    // the line: a thick green ribbon with a glow while it rockets
    if (t > DOT) {
      boilSeed('line');
      const L0 = Math.max(0, L - 4200), rib = [], ribB = [];
      for (let l = L0; l <= L; l += 26) { const [x, y, an] = atL(l), nx = Math.sin(an), ny = -Math.cos(an); rib.push([x + nx * 11, y + ny * 11]); ribB.push([x - nx * 11, y - ny * 11]); }
      { const [x, y, an] = tip, nx = Math.sin(an), ny = -Math.cos(an); rib.push([x + nx * 11, y + ny * 11]); ribB.push([x - nx * 11, y - ny * 11]); }
      if (fwd) { const g = []; for (let l = Math.max(STOCK.dip + 300, L - 900); l <= L - 80; l += 60) { const [x, y] = atL(l); g.push([x, y]); } if (g.length > 2) inkLine(g, 5, '#B7E39A', 'dry', .5); }
      if (rib.length > 2) paint([...rib, ...ribB.reverse()], { wash: GREEN, fill: GREEN_DK, fillOp: 60, tex: .5, ink: PAL.ink, sw: 1 });
      const d = [Math.cos(tip[2]), Math.sin(tip[2])], n = [-d[1], d[0]], g = backOut(seg(t, DOT, DOT + .12));
      paint([[tip[0] + d[0] * 46 * g, tip[1] + d[1] * 46 * g], [tip[0] + n[0] * 30 * g - d[0] * 8, tip[1] + n[1] * 30 * g - d[1] * 8], [tip[0] - n[0] * 30 * g - d[0] * 8, tip[1] - n[1] * 30 * g - d[1] * 8]], { wash: GREEN, fill: GREEN_DK, fillOp: 60, ink: PAL.ink, sw: 1 });
      // the dot's pop where the GPU landed
      const pa = t - DOT; if (pa < .3) paint(starPts(150, 800, 40 + 140 * easeOut(pa / .3), .3, 8, .2), { wash: GREEN, washOp: 255 * (1 - pa / .3), ink: null });
      if (fwd) for (let i = 0; i < 9; i++) { const o = (hash(i) - .5) * 700, bk = 200 + 500 * frac(hash(i + 9) + t * 3); inkLine([[tip[0] + n[0] * o - d[0] * bk, tip[1] + n[1] * o - d[1] * bk], [tip[0] + n[0] * o - d[0] * (bk + 260), tip[1] + n[1] * o - d[1] * (bk + 260)]], 1, PAL.cream, 'inkfine', 0); }
    }
    // the GPU, still flying up from the last Shot, lands on the chart's first point and becomes the dot
    if (t < DOT) { boilSeed('gpu2'); const k = ease(seg(t, NVDA, DOT)); gpuCard(lerp(480, 150, k), lerp(1100, 800, k), lerp(2.8, .5, k), lerp(2.2, 6.6, k)); }
    // the moon, with the line stuck in its side
    if (cy < -1500) {
      const hitA = t - HITM, wob = hitA > 0 ? Math.sin(hitA * 40) * 16 * Math.exp(-hitA * 6) : 0;
      moonDisc(MOON[0] + wob, MOON[1], MR);
      boilSeed('moon hit');
      if (hitA > 0 && hitA < .5) for (let i = 0; i < 6; i++) { const a = Math.PI * .75 + i * .22, e = [MOON[0] - MR * .94, MOON[1] + MR * .34], r0 = 30 + 160 * easeOut(hitA / .3); paint(starPts(e[0] + Math.cos(a) * r0, e[1] + Math.sin(a) * r0, 22 * (1 - hitA / .5), .4, 4), { wash: GOLD2, ink: null }); }
      moonFlag(MOON[0] + 110, MOON[1] - MR + 6, (t - (FLAG - .12)) / .12 * .34, t);
      if (t > FLAG) { const fa = t - FLAG; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .5, r0 = 40 + 140 * easeOut(fa / .3); if (fa < .3) paint(starPts(MOON[0] + 110 + Math.cos(a) * r0, MOON[1] - MR + Math.sin(a) * r0 * .6 - 30, 26 * (1 - clamp(fa / .3)), .4, 4), { wash: i % 2 ? GOLD2 : PAL.cream, ink: PAL.ink, sw: .5 }); } }
    }
    // Clawd: hops in onto the dip, crouches, rides the tip, then backflips onto the moon's crown
    const jump = seg(t, HITM + .02, FLAG - .04);
    if (t < LANDC) {
      const k = seg(t, DOT, LANDC), d = atL(STOCK.dip), p = arcPt([760, 1250], [d[0], d[1] - 10], 300, easeOut(k));
      if (k > 0) clawd(p[0], p[1], 20, { sq: -.15, rot: -.3 + .3 * k, aL: 1.4, aR: 1.4, eyes: 'wide', mouth: 'O', noShadow: true, boilKey: 'clawd' });
    } else if (jump <= 0) {
      const p = atL(L - 58), up = [Math.sin(p[2]), -Math.cos(p[2])];
      const land = t < LAUNCH ? .25 * Math.exp(-(t - LANDC) * 14) : 0, crouch = t < LAUNCH ? .2 * seg(t, LANDC + .06, LAUNCH) + land : 0, stretch = t >= LAUNCH ? -.16 * (1 - seg(t, LAUNCH, LAUNCH + .2)) : 0;
      clawd(p[0] + up[0] * 10, p[1] + up[1] * 10, 20, { rot: clamp(p[2], -1.0, .25), sq: crouch + stretch, aL: t < LAUNCH ? .2 : 1.4, aR: t < LAUNCH ? -.2 : .5, eyes: t < LAUNCH ? 'determined' : 'spark', mouth: t < LAUNCH ? 'flat' : 'open', blush: 1, noShadow: true, boilKey: 'clawd' });
    } else {
      const p = atL(STOCK.len - 58), top = [MOON[0] - 20, MOON[1] - MR + 4], k = easeOut(jump);
      const land = t > FLAG - .04, sq = land ? .22 * Math.exp(-(t - FLAG + .04) * 9) : -.1;
      clawd(lerp(p[0], top[0], k), lerp(p[1], top[1], k) - 170 * Math.sin(jump * Math.PI), 20, { rot: land ? 0 : lerp(p[2], 0, k) - TAU * ease(jump), sq, aL: land ? 1.3 : 1.1, aR: land ? .9 : 1.1, eyes: land ? 'happy' : 'spark', mouth: 'grin', blush: 1, noShadow: !land, boilKey: 'clawd' });
    }
    for (const [x, y, s, front] of PUFFS) if (front) puff(x, y, s);
    camEnd();
  }

  // =====================================================================================================
  // D · "The Omega Point's coming soon" · Pull back from the moon into deep space: galaxies spiral inward, stretching
  // as they fall, and meet in one blinding point on the bar; Clawd floats up off the moon, arms wide, in awe.
  // Seam in: the pull back continues C's framing. Seam out: the flare whites out the frame.
  // =====================================================================================================
  const OP = [960, 330], MD = [960, 930], MDR = 210, MRAT = MDR / MR;
  const GAL = Array.from({ length: 8 }, (_, i) => ({ a0: i / 8 * TAU + hash(i) * .5, r0: 520 + hash(i + 3) * 460, size: 70 + hash(i + 5) * 60, cols: [[VIO, GOLD2, PAL.cream], [PAL.rose, PAL.sky, PAL.cream], [PAL.teal, GOLD2, PAL.cream]][i % 3], spin: hash(i + 9) * TAU }));
  function galaxy(x, y, r, spin, cols, sx = 1, sy = .55, tilt = 0) {
    push(); translate(x, y); rotate(tilt); scale(sx, sy);
    paint(ellPts(0, 0, r, r, 18), { fill: cols[0], fillOp: 120, bleed: .3, tex: .4, border: .3, ink: null });
    for (const arm of [0, Math.PI]) {
      const pts = []; for (let k = 0; k <= 9; k++) { const a = spin + arm + k * .5, rr = r * (.1 + k * .095); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      inkLine(pts, clamp(r / 45, .8, 3), cols[1], 'ink', .7);
    }
    paint(ellPts(0, 0, r * .26, r * .26, 14), { wash: cols[2], fill: cols[1], fillOp: 90, ink: null });
    pop();
  }
  function omegaShot(t, lt, dur) {
    const k = seg(t, OMEGA + .3, POINT), flare = easeIn(seg(t, POINT - .3, OMEGA + dur)), white = ease(seg(t, POINT - .05, OMEGA + dur - .04));
    const pull = ease(seg(lt, 0, .85));
    boilSeed('space D');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: SPACE, fill: DEEP, fillOp: 140 * pull, tex: .6, border: .3, ink: null });
    for (let i = 0; i < 30; i++) paint(starPts(hash(i + 3) * W, hash(i + 43) * H, 5 + 5 * hash(i + 83), .35, 4), { wash: i % 5 ? PAL.cream : GOLD2, ink: null });
    // from C's moon framing out to the whole sky, then a slow push and twist toward the point
    const cx = lerp(932.6, 960, pull), cy = lerp(797.5, 560, pull), z = lerp(2.08, .92, pull) * (1 + .1 * ease(k));
    camBegin(cx, cy, z, .12 * ease(k));
    // the vortex: dry-brush spiral arms winding in
    if (pull > .2) for (let b = 0; b < 5; b++) {
      boilSeed('vortex' + b);
      const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, a = b * TAU / 5 + u * 4.2 + t * 1.3, r = 1300 * Math.pow(1 - u, 1.4) + 30; pts.push([OP[0] + Math.cos(a) * r, OP[1] + Math.sin(a) * r * .8]); }
      inkLine(pts, b % 2 ? 1.3 : 2.2, [VIO, GOLD2, PAL.rose, '#7FB2E5', VIO][b], 'dry', .7);
    }
    // stars streaming inward along the spiral
    boilSeed('streams');
    for (let j = 0; j < 40; j++) {
      const p = frac(hash(j) + (t - OMEGA) * .5 * (1 + hash(j + 1))), r = 1250 * Math.pow(1 - p, 1.3), a = hash(j + 2) * TAU + p * 3 + t * .9;
      const x = OP[0] + Math.cos(a) * r, y = OP[1] + Math.sin(a) * r * .8, x2 = OP[0] + Math.cos(a - .12) * (r + 60), y2 = OP[1] + Math.sin(a - .12) * (r + 60) * .8;
      inkLine([[x2, y2], [x, y]], 1.2, j % 4 ? PAL.cream : GOLD2, 'inkfine', 0);
    }
    // galaxies, faster and more stretched the closer they get
    GAL.forEach((g, i) => {
      const f = 1 - Math.pow(easeIn(k), .8), r = g.r0 * f;
      if (r < 30) return;
      boilSeed('galaxy' + i);
      const a = g.a0 + (t - OMEGA) * .9 + 3.2 * k * k, x = OP[0] + Math.cos(a) * r, y = OP[1] + Math.sin(a) * r * .8;
      galaxy(x, y, g.size * (.5 + .5 * f), g.spin + t * 2.5, g.cols, 1 + 2.2 * (1 - f), .5 * (.6 + .4 * f), a + Math.PI / 2);
    });
    // the point itself
    boilSeed('omega point');
    const gr = 26 + 50 * k + 10 * pulse(t, 4);
    glow(OP[0], OP[1], gr * 5, GOLD2, .6 + .4 * k);
    for (const [m, op] of [[4, 30], [2.6, 45], [1.7, 70]]) paint(ellPts(OP[0], OP[1], gr * m, gr * m, 24), { wash: m > 3 ? GOLD2 : '#FFE9A8', washOp: op, ink: null });
    if (flare > 0) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * .6, l = 200 + 1500 * flare; paint([[OP[0], OP[1]], [OP[0] + Math.cos(a - .05) * l, OP[1] + Math.sin(a - .05) * l], [OP[0] + Math.cos(a + .05) * l, OP[1] + Math.sin(a + .05) * l]], { fill: PAL.cream, fillOp: 110, bleed: .1, tex: .2, ink: null }); }
    paint(ellPts(OP[0], OP[1], gr + 900 * flare * flare, gr + 900 * flare * flare, 22), { wash: FLARE, fill: GOLD2, fillOp: 60, ink: null });
    // the moon (C's), drifting down out of the way, with its flag
    const mY = MD[1] + 260 * ease(seg(lt, .3, 1.4));
    boilSeed('line stub');                                        // the end of the stock line, stuck in the moon's side
    { const e = [MD[0] - MDR * .94, mY + MDR * .34], d = [-.62, .78]; paint(ribbon([e, [e[0] + d[0] * 300, e[1] + d[1] * 300], [e[0] + d[0] * 700 - 60, e[1] + d[1] * 700]], 11 * MRAT * 2, 11 * MRAT * 2), { wash: GREEN, ink: PAL.ink, sw: .6 }); }
    moonDisc(MD[0], mY, MDR);
    moonFlag(MD[0] + 110 * MRAT, mY - MDR + 6 * MRAT, 1, t, MRAT);
    // Clawd floats up off the moon, arms wide, in awe
    const lift = ease(seg(lt, .15, 1.1)), cu = 20 * MRAT * lerp(1, 2.1, lift);
    const md = clawd.emotions(t, [[OMEGA, 'happy'], [OMEGA + .45, 'starstruck']]);
    clawd(lerp(MD[0] - 20 * MRAT, 960, lift), lerp(MD[1] - MDR + 2, 700, lift) - 14 * wob(t, .7) * lift, cu, {
      ...md, mouth: 'O', blush: 1, aL: lerp(1.3, .55, lift) + .18 * Math.sin(t * 3), aR: lerp(.9, .55, lift) + .18 * Math.sin(t * 3 + .5), rot: .09 * Math.sin(t * 1.8) * lift, dy: (md.dy || 0) * .3, sq: (md.sq || 0) * .3, noShadow: true, boilKey: 'clawd'
    });
    camEnd();
    flash(Math.max(white, Math.pow(flare, 1.6)), FLARE);
  }

  // =====================================================================================================
  // E · "One E thirty flops a second" · The flare resolves into a planet-sized GPU floating in space (Earth a dot
  // beside it), galaxies spinning in its fans. Its odometer's wheels spin faster and faster, all roll over to
  // zeros on the bar, and the zeros overflow: round gumballs pour out of a hatch and bounce along the card on the
  // beat while Clawd dances among them. The P(doom) meter drifts in and dings at 61 on the next bar.
  // Seam out: a fall back to Earth with speed lines.
  // =====================================================================================================
  const CARD = { x0: 230, x1: 1690, y0: 360, y1: 860 }, FANS = [[640, 615], [1280, 615]], ODO = { x0: 560, y0: 190, ww: 92, wh: 108, gap: 12 };
  const ODO_X1 = ODO.x0 + 7 * (ODO.ww + ODO.gap) + 10, HATCH = [ODO_X1, 250];
  const odoTotal = t => t >= ROLL ? 1e7 : Math.pow(10, 7 * Math.pow(seg(t, FLOPS + .5, ROLL), 1.6)) - 1;
  const fanSpin = t => 1.2 * (t - FLOPS) + 7 * Math.pow(clamp(t - FLOPS - .8, 0, 1.6), 2) + (t > ROLL ? 18 * (t - ROLL) : 0);
  const GUMCOLS = [PAL.rose, GOLD2, PAL.sky, GREEN, VIO, PAL.clayLt, PAL.teal];
  const NG = 30;
  // a zero as a gumball: a glossy round sweet with a hole (no digits: just the round shape)
  function zeroBall(x, y, r, col, rot) {
    paint(ellPts(x, y, r * .78, r, 14, 0, rot), { wash: col, fill: PAL.cream, fillOp: 40, ink: PAL.ink, sw: .8 });
    paint(ellPts(x, y, r * .3, r * .5, 10, 0, rot), { wash: '#2B2440', ink: PAL.ink, sw: .5 });
    paint(ellPts(x - r * .42, y - r * .5, r * .14, r * .2, 6, 0, rot), { wash: PAL.cream, ink: null });
  }
  // gumball i, in closed form: out of the hatch on an arc, then a bounce per beat along the card's top edge, then off
  // the end into space. Returns [x, y, r, rot] or null.
  function gumball(i, t) {
    const ts = ROLL + .1 + i * BEAT / 5; if (t < ts) return null;
    const r = 30 + 18 * hash(i * 6.1), top = CARD.y0 - r;
    const vx = hash(i * 1.7) < .38 ? -(160 + 260 * hash(i * 2.9)) : 120 + 360 * hash(i * 2.9);
    const x = HATCH[0] + vx * (t - ts), rot = (t - ts) * (hash(i) - .5) * 10;
    const b1 = Math.ceil(bpOf(ts + .25)), tl1 = beatAt(b1);
    const tOff = vx > 0 ? ts + (CARD.x1 + r - HATCH[0]) / vx : ts + (CARD.x0 - r - HATCH[0]) / vx;   // when it passes an end
    if (t < tl1) { const k = (t - ts) / (tl1 - ts); return [x, lerp(HATCH[1], top, k) - 110 * 4 * k * (1 - k), r, rot]; }
    const bp = bpOf(t) - b1, n = Math.floor(bp), tEnd = beatAt(b1 + n + 1);
    const tFall = beatAt(Math.max(b1, Math.ceil(bpOf(tOff))));                  // the first landing past the end: it falls
    if (t > tFall) { const a = t - tFall; return [x, top + 300 * a + 1400 * a * a, r, rot]; }
    const hh = 150 * Math.pow(.74, n) * (.7 + .6 * hash(i + n * 3)), k = frac(bp);
    return [x, top - hh * 4 * k * (1 - k), r, rot, tEnd];
  }
  function fanGalaxy(fx, fy, t, j) {
    boilSeed('fan' + j);
    paint(ellPts(fx, fy, 220, 220, 30), { wash: '#1E1B2B', ink: PAL.ink, sw: 1.4 });
    paint(ellPts(fx, fy, 200, 200, 28), { fill: SPACE, fillOp: 200, bleed: .05, tex: .5, border: .3, ink: GREEN, sw: 1.1 });
    const sp = fanSpin(t) * (j ? -1 : 1), cols = j ? [PAL.rose, PAL.sky] : [VIO, GOLD2];
    paint(ellPts(fx, fy, 180, 180, 20), { fill: cols[0], fillOp: 110, bleed: .3, tex: .4, ink: null });
    for (let arm = 0; arm < 3; arm++) {
      const pts = []; for (let k = 0; k <= 9; k++) { const a = sp + arm * TAU / 3 + k * .45, rr = 18 + k * 18; pts.push([fx + Math.cos(a) * rr, fy + Math.sin(a) * rr]); }
      inkLine(pts, 2.4, arm === 1 ? PAL.cream : cols[1], 'ink', .7);
    }
    paint(ellPts(fx, fy, 40, 40, 14), { wash: PAL.cream, fill: GOLD2, fillOp: 90, ink: PAL.ink, sw: .6 });
  }
  function gpuShot(t, lt, dur) {
    const reveal = easeOut(seg(lt, 0, 1.0)), zoom = lerp(3.2, 1.1, reveal), cx0 = lerp(FANS[0][0], 1000, reveal), cy0 = lerp(FANS[0][1], 480, reveal);
    const hum = seg(t, FLOPS + 1.2, ROLL), rolled = t - ROLL, drop = easeIn(seg(lt, dur - .3, dur));
    const [sx, sy] = shakeXY(t, 5 * hum * hum + (rolled > 0 ? 18 * Math.exp(-rolled * 4) : 0));
    boilSeed('space E');
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: DEEP, fill: SPACE, fillOp: 160, tex: .6, border: .3, ink: null });
    const rot = .025 * Math.sin(lt * .8) * reveal;                                    // a slow drift round it
    camBegin(cx0 + sx + 30 * Math.sin(lt * .7) * reveal, cy0 + sy + drop * 1100, zoom, rot);
    boilSeed('stars E');
    for (let i = 0; i < 40; i++) paint(starPts(hash(i) * 2400 - 240, hash(i + 50) * 1400 - 160, 5 + 7 * hash(i + 9), .35, 4), { wash: i % 4 ? PAL.cream : GOLD2, ink: null });
    paint(ellPts(900, 300, 900, 380, 20, 20), { fill: VIO, fillOp: 60, bleed: .3, tex: .4, ink: null });
    // Earth and its moon, for scale: tiny next to the card
    boilSeed('earth');
    paint(ellPts(150, 200, 60, 60, 18), { fill: PAL.sky, fillOp: 80, bleed: .3, ink: null });
    paint(ellPts(150, 200, 34, 34, 18), { wash: '#4E8FD1', ink: PAL.ink, sw: .8 });
    paint([[132, 182], [156, 178], [164, 196], [148, 212], [136, 204]], { wash: PAL.sap, ink: null, curv: .5 });
    paint(ellPts(212, 162, 8, 8, 10), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
    // the card, face on: board, green edge, gold contact fingers, heat haze while it works
    boilSeed('card');
    const { x0, x1, y0, y1 } = CARD;
    paint(rrPts(x0, y0, x1 - x0, y1 - y0, 26), { wash: '#2E2C38', fill: VIO, fillOp: 45, bleed: .05, tex: .7, border: .5, ink: PAL.ink, sw: 1.4 });
    inkLine([[x0 + 16, y0 + 14], [x1 - 16, y0 + 14]], 3, GREEN, 'ink', 0);
    for (let i = 1; i < 6; i++) inkLine([[x0 + 40, y0 + 60 + i * 66], [x0 + 150, y0 + 60 + i * 66]], .7, '#5C5A70', 'inkfine', 0);
    for (let i = 1; i < 6; i++) inkLine([[x1 - 150, y0 + 60 + i * 66], [x1 - 40, y0 + 60 + i * 66]], .7, '#5C5A70', 'inkfine', 0);
    const comb = [[x0 + 260, y1 - 4]]; for (let i = 0; i < 30; i++) { const x = x0 + 270 + i * 30; comb.push([x, y1 - 4], [x, y1 + 30], [x + 20, y1 + 30], [x + 20, y1 - 4]); } comb.push([x0 + 270 + 30 * 30, y1 - 4]);
    paint(comb, { wash: GOLD, fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: .6 });
    if (hum > 0) { boilSeed('haze'); for (let i = 0; i < 7; i++) { const x = 420 + i * 170, ph = frac(t * 1.6 + hash(i)), y = y0 - 20 - ph * 150; inkLine([[x, y], [x + 14 * Math.sin(t * 9 + i), y - 30], [x, y - 60]], 1.3 * hum, '#F08A5D', 'inkfine', .6); } }
    FANS.forEach(([fx, fy], j) => fanGalaxy(fx, fy, t, j));

    // the odometer: a scoreboard of seven wheels on the card's top edge. Its "digits" are painted rings (zeros);
    // they scroll, blur into streaks as it races, and all land on rings at the roll-over.
    boilSeed('odometer');
    const { x0: ox, y0: oy, ww, wh, gap } = ODO;
    for (const lx of [ox + 60, ODO_X1 - 70]) paint(rectPts(lx, oy + wh + 24, 26, y0 - oy - wh - 22), { wash: '#1E1B2B', ink: PAL.ink, sw: .8 });
    paint(rectPts(ox - 20, oy - 26, ODO_X1 - ox + 20, wh + 52, 3), { wash: '#2E2C38', fill: GOLD2, fillOp: 30, tex: .5, ink: PAL.ink, sw: 1.3 });
    const tot = odoTotal(t), tot2 = odoTotal(t + .02);
    for (let i = 0; i < 7; i++) {
      const x = ox + i * (ww + gap), mid = x + ww / 2, cyw = oy + wh / 2;
      paint(rectPts(x, oy, ww, wh), { wash: PAL.cream, fill: '#D8CDB8', fillOp: 90, tex: .4, ink: PAL.ink, sw: .8 });
      const div = Math.pow(10, 6 - i), p = tot / div, rate = (tot2 - tot) / div / .02;
      const ring = (yy, a = 255) => { paint(ellPts(mid, yy, 27, 38, 14), { wash: GUMCOLS[i], washOp: a, ink: PAL.ink, sw: .7 }); paint(ellPts(mid, yy, 11, 20, 10), { wash: PAL.cream, ink: null }); };
      if (rolled > 0) ring(cyw + 40 * Math.exp(-rolled * 12) * Math.cos(rolled * 40));
      else if (rate > 12) for (let g = 0; g < 3; g++) inkLine([[x + 14 + g * 24, oy + 10], [x + 14 + g * 24 + jit(3), oy + wh - 10]], 1.4, GUMCOLS[i], 'inkfine', 0);
      else { const f = frac(p); ring(cyw + f * wh); if (f > .5) ring(cyw + (f - 1) * wh); }
    }
    // bezel strips over the scrolling wheels
    paint(rectPts(ox - 20, oy - 26, ODO_X1 - ox + 20, 26), { wash: '#2E2C38', ink: null });
    paint(rectPts(ox - 20, oy + wh, ODO_X1 - ox + 20, 26), { wash: '#2E2C38', ink: null });
    paint(rectPts(ox - 20, oy - 26, ODO_X1 - ox + 20, wh + 52, 1), { ink: GOLD, sw: 1.4 });
    // the overflow hatch flips open on the right end of the scoreboard
    const hatch = rolled > 0 ? backOut(seg(rolled, 0, .15)) : 0;
    push(); translate(HATCH[0], oy - 20); rotate(-hatch * 1.9); paint(rectPts(0, 0, 36, 90), { wash: GOLD, fill: PAL.ochre, fillOp: 60, ink: PAL.ink, sw: .9 }); pop();

    // Clawd dances on the card, stares at the counter, gasps at the roll-over, then frolics in the gumball flood
    const cm = clawd.emotions(t, [[FLOPS, 'happy'], [FLOPS + 1.3, 'surprised', { lookX: -1, lookY: -.6, emote: null }], [ROLL, 'scared', { lookX: -1, lookY: -.5 }], [beatsAfter(ROLL, 2), 'excited'], [DING, 'starstruck']]);
    const hop = clawd.dance(t < FLOPS + 1.3 ? 'hop' : t < beatsAfter(ROLL, 2) ? 'idle' : 'bounce', t, 1);
    const drawC = () => clawd(1530, y0, 30, { ...hop, ...cm, dy: hop.dy + (cm.dy || 0) * .5, sq: hop.sq + (cm.sq || 0), mouth: t < ROLL ? 'smile' : t < beatsAfter(ROLL, 2) ? 'O' : 'grin', blush: 1, aL: t > beatsAfter(ROLL, 2) ? 1.4 : cm.aL, aR: t > beatsAfter(ROLL, 2) ? 1.2 : cm.aR, boilKey: 'clawd' });
    drawC();
    // gumballs: half bounce in front of Clawd, half behind it is enough to read as a flood
    if (rolled > 0) for (let i = 0; i < NG; i++) {
      const g = gumball(i, t); if (!g || g[1] > 1500 || g[0] < -200 || g[0] > 2200) continue;
      boilSeed('gum' + i);
      zeroBall(g[0], g[1], g[2], GUMCOLS[i % GUMCOLS.length], g[3]);
    }
    // the floating P(doom) meter drifts in and dings at 61 on the bar
    const da = t - DING, ding = da > 0 ? Math.exp(-da * 7) : 0, mxx = lerp(2250, 1700, easeOut(seg(t, DING - 1.4, DING - .2))), myy = 930 + 12 * wob(t, .6);
    if (t > DING - 1.4) {
      const v = lerp(pdoomAt(t), 61, ease(seg(t, DING - .9, DING)));
      if (da > 0 && da < .7) { boilSeed('ding'); for (let r = 0; r < 3; r++) { const rr = 60 + 260 * easeOut(clamp((da - r * .08) / .5)); paint(ellPts(mxx, myy - 55, rr, rr, 26), { ink: GOLD2, sw: 1.6 * (1 - da / .7) }); } }
      meterProp(mxx, myy, .78 * (1 + .14 * ding), v, { glow: .3 + ding });
    }
    camEnd();
    flash(Math.pow(1 - seg(lt, 0, .3), 1.5), FLARE);
    if (drop > 0) { boilSeed('fall streaks'); for (let i = 0; i < 16; i++) { const x = hash(i) * W, y = hash(i + 5 + boilN(t)) * H; inkLine([[x, y - 260 * drop], [x, y + 260 * drop]], 1.2, i % 2 ? LAV : GOLD2, 'inkfine', 0); } }
  }

  // =====================================================================================================
  // F · "That was safe enough, we reckoned" · Dusk in a yard: a steel vault, its round door open and a glowing
  // monster peeking out. Hard-hat Clawds shove the door shut on "safe", one spins the wheel, and the two shovers
  // jump for a high five on the bar. Whip pan round the back: there's no back wall. The monster, sitting inside
  // facing the door, turns round and waves. Seam in: the fall from space lands with speed lines. Seam out: a brush
  // wipe in parchment colours, covering the frame on the bar where Verse 3 starts.
  // =====================================================================================================
  const VB = { x0: 420, x1: 1500, y0: 250, y1: 800 }, DC = [960, 500], DR = 190, HINGE = DC[0] - DR, GY = 842, CU = 30, BACKX = 3300;
  const LEVER = [1330, 720];
  // the door's open angle as drawn key views: wide open (edge on), ajar, nearly shut, shut; it steps through them
  const DOOR_W = [.1, .5, .86, 1];
  const doorView = t => t < SLAM - .22 ? 0 : t >= SLAM ? 3 : 1 + Math.min(1, Math.floor(seg(t, SLAM - .22, SLAM) * 2.99));
  // dusk, in world coordinates around the camera (so the fall from space comes down through it); the skyline slides
  // slower than the yard as the camera pans (parallax)
  function duskSky(t, camX) {
    boilSeed('dusk');
    const L = camX - 1300, R = camX + 1300;
    paint(rectPts(L, -1500, R - L, 2100), { wash: '#43347E', ink: null });
    paint(rectPts(L, 300, R - L, 260), { wash: '#B0619A', washOp: 200, fill: PAL.rose, fillOp: 60, bleed: .2, tex: .5, ink: null });
    paint(rectPts(L, 500, R - L, 220), { wash: '#F2B04F', fill: PAL.rose, fillOp: 50, bleed: .2, tex: .5, ink: null });
    for (let i = 0; i < 26; i++) paint(starPts(camX - 960 + hash(i * 7.7) * W, -1300 + hash(i * 3.1) * 1600, 7 + 5 * hash(i), .45, 4, 0), { wash: PAL.cream, ink: null });
    const off = camX * .35, wrap = (x0, span) => camX - 960 + ((x0 - off) % span + span) % span - 300;
    paint(ellPts(wrap(1350, 2600), 690, 140, 140, 26), { wash: '#FFD98A', ink: null });
    for (let i = 0; i < 18; i++) {
      const x = wrap(i * 190, 3420), hh = 70 + 130 * hash(i * 3.3), bw = 120 + 40 * hash(i * 1.9);
      if (x < camX - 1200 || x > camX + 1020) continue;
      paint(rectPts(x, 700 - hh, bw, hh + 8), { wash: '#2E2458', ink: null });
      for (let wi = 0; wi < 3; wi++) if (hash(i * 5 + wi) > .35) paint(rectPts(x + 18 + wi * (bw - 36) / 3, 700 - hh + 22 + 38 * (wi % 2), 16, 20), { wash: '#FFD36B', ink: null });
    }
  }
  function yard(x0, x1) {
    boilSeed('yard' + x0);
    paint(rectPts(x0, 700, x1 - x0, 600), { wash: '#CDB6C8', fill: '#9C84A8', fillOp: 55, tex: .7, border: .4, ink: null });
    inkLine([[x0, 702], [x1, 700]], 1, PAL.ink, 'ink', 0);
    for (let i = 0; i < 6; i++) inkLine([[x0 + 80 + i * (x1 - x0) / 6, 860 + 40 * (i % 2)], [x0 + 200 + i * (x1 - x0) / 6, 862 + 40 * (i % 2)]], .5, '#9A83A6', 'inkfine', 0);
  }
  const rivets = (pts, r = 8) => pts.forEach(([x, y]) => paint(ellPts(x, y, r, r, 8), { wash: '#C9D2DE', ink: PAL.ink, sw: .5 }));
  const boxShell = (x0, x1, col, fcol) => {
    const { y0, y1 } = VB;
    paint(ellPts((x0 + x1) / 2, y1 + 10, (x1 - x0) * .58, 40, 20), { fill: PAL.ink, fillOp: 70, bleed: .2, tex: .3, ink: null });
    paint(rectPts(x0, y0, x1 - x0, y1 - y0), { wash: col, fill: fcol, fillOp: 70, bleed: .05, tex: .6, border: .5, ink: PAL.ink, sw: 1.3 });
  };
  const roof = (x0, x1) => paint(rectPts(x0 - 24, VB.y0 - 36, x1 - x0 + 48, 40, 2), { wash: '#A4B1C4', fill: '#5E6B85', fillOp: 50, tex: .5, ink: PAL.ink, sw: 1.2 });
  const leverAng = t => lerp(-.5, -2.0, backOut(seg(t, SLAM + .04, SLAM + .2)));
  function vaultFront(t) {
    const { x0, x1, y0, y1 } = VB;
    boilSeed('vault front');
    boxShell(x0, x1, '#8E9DB3', '#5E6B85');
    roof(x0, x1);
    rivets([[x0 + 34, y0 + 34], [x1 - 34, y0 + 34], [x0 + 34, y1 - 34], [x1 - 34, y1 - 34]]);
    // the lever on the wall that throws the bolts
    boilSeed('lever');
    paint(rrPts(LEVER[0] - 34, LEVER[1] - 40, 68, 80, 10), { wash: '#5E6B85', ink: PAL.ink, sw: 1 });
    const la = leverAng(t), tip = [LEVER[0] + Math.sin(la) * 120, LEVER[1] - Math.cos(la) * 120];
    inkLine([LEVER, tip], 5, PAL.ink, 'ink', 0);
    paint(ellPts(tip[0], tip[1], 20, 20, 12), { wash: '#D8394E', ink: PAL.ink, sw: .8 });
    const view = doorView(t), sa = t - SLAM, cp = ellPts(DC[0], DC[1], DR, DR, 30);
    if (view < 3) {
      // the open doorway: glowing, with the monster's eyes in it
      boilSeed('doorway');
      paint(cp, { wash: '#6A3F98', fill: GOLD2, fillOp: 110, bleed: .2, tex: .4, ink: PAL.ink, sw: 1.2 });
      glow(DC[0], DC[1], 300, GOLD2, .9);
      const peek = 1 - seg(t, SLAM - .25, SLAM - .1);
      if (peek > 0) for (const [ex, ey, er] of [[-70, -10, 26], [0, -40, 36], [70, -10, 26]]) {
        paint(ellPts(DC[0] + ex, DC[1] + ey + 30 * (1 - peek), er, er * 1.1 * peek, 12), { wash: PAL.cream, ink: PAL.ink, sw: .7 });
        paint(ellPts(DC[0] + ex - 8 * Math.sin(t * 2), DC[1] + ey + 4 + 30 * (1 - peek), er * .45, er * .5 * peek, 10), { wash: PAL.ink, ink: null });
      }
      // the door, swung out toward us on its left hinge: a drawn key view, foreshortened
      const w = DOOR_W[view] * DR;
      boilSeed('door');
      paint(ellPts(HINGE + w - 14, DC[1], Math.max(w, 18), DR, 26), { wash: '#6B7690', ink: PAL.ink, sw: 1 });
      paint(ellPts(HINGE + w, DC[1], Math.max(w, 12), DR, 26), { wash: '#B8C2CC', fill: '#7F8AA0', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.3 });
      if (view === 2) for (const dy of [-90, 0, 90]) inkLine([[HINGE + w * 2 + 30, DC[1] + dy - 30], [HINGE + w * 2 + 60, DC[1] + dy], [HINGE + w * 2 + 30, DC[1] + dy + 30]], 1.2, PAL.ink, 'ink', .5);   // swing lines
      return;
    }
    // shut: glow leaks from the seam, then the bolts shoot and the wheel spins as the lever comes down
    boilSeed('door shut');
    const leak = .5 + .5 * Math.sin(t * 9);
    paint(ellPts(DC[0], DC[1], DR * 1.1, DR * 1.1, 28), { fill: GOLD2, fillOp: 90 * leak + (sa < .3 ? 120 * (1 - sa / .3) : 0), bleed: .25, tex: .3, ink: null });
    paint(cp, { wash: '#B8C2CC', fill: '#7F8AA0', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.4 });
    paint(ellPts(DC[0], DC[1], DR * .76, DR * .76, 24), { ink: PAL.ink, sw: .9 });
    const bolt = easeOut(seg(sa, .06, .2));
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, r = DR + 6 + 34 * bolt; paint(ribbon([[DC[0] + Math.cos(a) * (DR - 20), DC[1] + Math.sin(a) * (DR - 20)], [DC[0] + Math.cos(a) * r, DC[1] + Math.sin(a) * r]], 12, 12), { wash: '#C9D2DE', ink: PAL.ink, sw: .6 }); }
    rivets(Array.from({ length: 10 }, (_, i) => [DC[0] + Math.cos(i / 10 * TAU) * 165, DC[1] + Math.sin(i / 10 * TAU) * 165]));
    const spin = 2.4 * TAU * easeOut(seg(sa, .08, .7));
    for (let i = 0; i < 3; i++) {
      const a = spin + i / 3 * TAU, e = [DC[0] + Math.cos(a) * 100, DC[1] + Math.sin(a) * 100], e2 = [DC[0] - Math.cos(a) * 100, DC[1] - Math.sin(a) * 100];
      inkLine([e, e2], 3, PAL.ink, 'ink', 0);
      for (const q of [e, e2]) paint(ellPts(q[0], q[1], 14, 14, 8), { wash: GOLD, ink: PAL.ink, sw: .5 });
    }
    paint(ellPts(DC[0], DC[1], 28, 28, 12), { wash: GOLD, fill: PAL.ochre, fillOp: 70, ink: PAL.ink, sw: .8 });
  }
  // the hard-hat crew: two shove the door shut in a line (B pushes A, A pushes the door), the third throws the lever;
  // then the shovers jump for a high five on the bar and everyone dances
  function crew(t) {
    const sa = t - SLAM, view = doorView(t), shove = t < SLAM, open = 1 - DOOR_W[view];
    const pA = shove ? HINGE - 110 - open * 50 : lerp(HINGE - 110, 690, ease(seg(sa, .1, .5)));
    const pB = shove ? HINGE - 370 - open * 50 : lerp(HINGE - 370, 450, ease(seg(sa, .1, .5)));
    const five = jump(t, HF - .2, HF + .08, 2.2);
    const party = t > HF + .45;
    const face = clawd.emotions(t, [[SAFE, 'determined'], [SLAM + .05, 'relieved'], [HF - .25, 'happy']]);
    const pushing = { eyes: 'determined', mouth: 'flat', aL: .1, aR: .25, sq: .06 };
    const A = shove ? { ...pushing, rot: .32, walk: t * 3 } : party ? { ...face, ...clawd.dance('roof', t, 2), mouth: 'grin' } : { ...face, dy: five.dy, sq: five.sq, aL: .2, aR: t > HF - .3 ? 1.45 : .3, mouth: 'grin', rot: -.1 * Math.max(0, -five.dy) / 2.2 };
    const B = shove ? { ...pushing, rot: .3, walk: t * 3 + .3, aR: .4 } : party ? { ...face, ...clawd.dance('roof', t - .08, 3), mouth: 'grin' } : { ...face, dy: five.dy, sq: five.sq, aL: .2, aR: t > HF - .3 ? 1.45 : .3, mouth: 'grin', flip: true, rot: .1 * Math.max(0, -five.dy) / 2.2 };
    clawd(pB, GY, CU, { hat: 'hard', blush: 1, boilKey: 'crew B', ...B, flip: !shove && !party && t > SLAM + .3 ? false : false, view: !shove && !party && t > SLAM + .3 ? 'q' : 'front' });
    clawd(pA, GY, CU, { hat: 'hard', blush: 1, boilKey: 'crew A', ...A, view: !shove && !party && t > SLAM + .3 ? 'q' : 'front', flip: !shove && !party && t > SLAM + .3 });
    // the third throws the lever: its arm follows the handle down
    const la = leverAng(t), C = t < SLAM ? { ...clawd.feel('nervous', t), aL: 1.35, aR: .3, mouth: 'wobble' } : party ? { ...clawd.dance('hop', t, 4), eyes: 'happy', mouth: 'grin' } : { aL: lerp(1.35, -.75, seg(la, -.5, -2.0)), aR: .4, eyes: 'narrow', mouth: 'smile', sq: .08 * seg(la, -.5, -2.0) };
    clawd(1420, GY, CU, { hat: 'hard', blush: 1, boilKey: 'crew C', ...C });
    if (t > HF && t < HF + .5) { boilSeed('high five'); const hf = t - HF, x = (pA + pB) / 2, y = GY - (8 + 2.2 + 2.5) * CU; paint(starPts(x, y, (30 + 160 * easeOut(hf / .25)) * (1 - hf / .5), .35, 8, hf * 2), { wash: PAL.cream, fill: GOLD2, fillOp: 90, ink: PAL.ink, sw: .8 }); }
  }
  // round the back: the same vault seen from behind, and there's no back wall. The monster sits inside, facing the
  // back of the shut door, then turns round to us and waves.
  function vaultBack(t) {
    const x0 = BACKX - 540, x1 = BACKX + 540, { y0, y1 } = VB, door = [BACKX - 170, DC[1]];
    boilSeed('vault back');
    // the inside of the front wall, with the back of the shut door
    boxShell(x0, x1, '#4F5870', '#2E3448');
    paint(ellPts(door[0], door[1], DR, DR, 28), { wash: '#6B7690', fill: '#4F5870', fillOp: 60, tex: .5, ink: PAL.ink, sw: 1.1 });
    paint(ellPts(door[0], door[1], 34, 34, 12), { wash: '#8E9DB3', ink: PAL.ink, sw: .8 });
    rivets(Array.from({ length: 8 }, (_, i) => [door[0] + Math.cos(i / 8 * TAU) * 140, door[1] + Math.sin(i / 8 * TAU) * 140]));
    paint(rectPts(x0, y1 - 46, x1 - x0, 46), { wash: '#56607A', ink: PAL.ink, sw: 1 });
    // the monster, glowing, filling the room
    const turnK = t < WAVE - .06 ? 0 : t < WAVE + .06 ? .5 : 1;
    CAST.vaultMonster(BACKX + 200, y1 - 40, 27, t, { view: turnK, wave: ease(seg(t, WAVE + .15, WAVE + .4)), happy: t > beatsAfter(WAVE, 1), blush: 1, boilKey: 'vault monster' });
    if (Math.abs(t - WAVE) < .1) { boilSeed('turn smear'); for (let i = 0; i < 4; i++) inkLine([[BACKX + 20, y1 - 330 + i * 60], [BACKX + 380, y1 - 320 + i * 60]], 1.4, PAL.cream, 'inkfine', 0); }
    // the side walls and roof, seen end on: a frame with nothing at the back, torn edges where the wall should be
    paint(rectPts(x0 - 36, y0 - 20, 52, y1 - y0 + 20), { wash: '#8E9DB3', fill: '#5E6B85', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.3 });
    paint(rectPts(x1 - 16, y0 - 20, 52, y1 - y0 + 20), { wash: '#8E9DB3', fill: '#5E6B85', fillOp: 70, tex: .6, ink: PAL.ink, sw: 1.3 });
    roof(x0 - 10, x1 + 10);
    for (const [ex, sgn] of [[x0 + 16, 1], [x1 - 16, -1]]) inkLine([[ex, y0 + 10], [ex + sgn * 26, y0 + 70], [ex + sgn * 8, y0 + 130], [ex + sgn * 30, y0 + 200]], 1.2, PAL.ink, 'ink', 0);
  }
  function vaultShot(t, lt, dur) {
    const arrive = easeOut(seg(lt, 0, .3)), sa = t - SLAM;
    const pan = easeIO(seg(t, WHIP - .05, WHIP + .3)), camX = lerp(960, BACKX, pan);
    const [sx, sy] = shakeXY(t, sa > 0 ? 18 * Math.exp(-sa * 6) : 0);
    camBegin(camX + sx, 520 + sy - 760 * (1 - arrive), 1 + .03 * seg(lt, 0, dur), 0);
    duskSky(t, camX);
    if (camX < 2400) { yard(-300, 2400); vaultFront(t); crew(t); }
    if (camX > 1700) { yard(1700, BACKX + 1300); vaultBack(t); }
    camEnd();
    // the fall from space ends; the whip pan smears
    if (arrive < 1) { boilSeed('fall in'); for (let i = 0; i < 16; i++) { const x = hash(i) * W, y = hash(i + 5 + boilN(t)) * H, l = 300 * (1 - arrive); inkLine([[x, y - l], [x, y + l]], 1.2, i % 2 ? LAV : GOLD2, 'inkfine', 0); } }
    const ws = Math.sin(pan * Math.PI);
    if (ws > .05) { boilSeed('whip'); for (let i = 0; i < 16; i++) { const y = hash(i + boilN(t) * 3) * H, x = hash(i * 7 + 1) * W, L = 800 * ws; inkLine([[x - L / 2, y], [x + L / 2, y]], 1.4, i % 2 ? PAL.cream : '#43347E', 'inkfine', 0); } }
    if (lt > dur - .3) { flushLetters(); brushWipe((lt - (dur - .3)) / .6, [PAL.ochre, PAL.cream]); }
  }

  chapter('chorus2', CHO.start, CHO.end, [[UP, upping], [HEAR, basiliskShot], [NVDA, moonShot], [OMEGA, omegaShot], [FLOPS, gpuShot], [SAFE, vaultShot]]);
})();
