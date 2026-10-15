// body.js: person(design), a whole human Character on a bendable skeleton, drawn to the Character Contract (acting.js)
// with the Style Profile's paint() and inkLine() only, so it works in every look.
//
// A design is data: how many heads tall, a shape language, colours, hair, clothes and face. person() turns it into a
// Character with five key views (front, q, side, qback, back), a spine that leans and bends (the line of action),
// elbows and knees that bend (the feet stay planted and the knees find themselves), hands that make shapes, and a
// face that gains detail as it grows on screen: far (a head under ~34 px) is dots and lines; mid adds eye whites,
// irises, brows, nose and ears; close (over ~95 px) adds lids, lashes, highlights, lips, teeth, hair strands and cloth
// folds. Each MV designs its own people with it (GUIDE.md step 3); a creature or a robot uses character() directly.
//
//   const mei = person({ name: 'mei', heads: 4, shape: 'round', skin: '#F0C8A8', hair: { style: 'bob', color: '#2B2233' },
//                        top: { kind: 'tee', color: '#E07A55' }, bottom: { kind: 'pants', color: '#33418A' } });
//   mei(x, groundY, 24, { ...mei.feel('happy', t), view: 'q' });
//
// Design fields (all optional but name):
//   heads     how many heads tall: 2.5 chibi … 4 cartoon (default) … 6.5 stylised
//   height    top of the head to the feet, in u (14)
//   shape     'round' | 'square' | 'tri': the shape language of head, body, eyes, brows and hands
//   build     { shoulders, waist, hips, limbs, legs, belly, chest }: multipliers (1; belly and chest 0 = none)
//   skin, eyes: { color, size, lashes 0..1 }, brows: { color, weight }, nose: 'dot' | 'button' | 'line' | 'none'
//   hair      { style: 'short' | 'spiky' | 'bob' | 'long' | 'pony' | 'bun' | 'curly' | 'bald', color,
//               fringe: 'blunt' | 'side' | 'none', length: 0..1 (long hair, pony) }
//   top       { kind: 'tee' | 'shirt' | 'hoodie' | 'jacket' | 'coat' | 'robe' | 'dress', color, trim, sleeves: 'long' |
//               'short' | 'none', open: true (a coat or jacket worn open over `under`), under: colour }
//   bottom    { kind: 'pants' | 'shorts' | 'skirt', color }; shoes: { color }; line: outline weight (1)
//   extras(part, k)  its own things: part 'back' (behind it all), 'chest', 'head' (in the head's frame, origin at the
//             head's centre: hats, glasses), 'front' (over it all); k = { u, sw, lod, view, o, hw, hh, D }
//   emotions  added to, or replacing, PERSON_EMOTIONS
//
// Pose fields, beyond the standard ones (acting.js):
//   eL, eR     elbow bend (0 straight; + folds the forearm in, toward the chest or head)
//   hL, hR     hand shapes: open, relaxed, point, fist, thumb, grip, flat, cup, peace
//   lL, lR     lift a leg (0 down; + out to the side in front views, forward in side views); kL, kR bend its knee
//   lean       the torso's lean (rad, + toward where it faces); arc: the spine's curve (+ chest out, − hunched)
//   hipTilt    contrapposto: + drops the hip on the screen-right side, and the shoulders tilt against it
//   crouch     0..1: bend the knees, feet planted; sit 0..1: sit on something at knee height
//   headTilt   rad; eyes (open wide half sleepy closed happy angry sad tight blank heart), brows (flat up angry sad
//              worried raised), mouth (flat smile grin laugh frown o O smirk wobble pressed grit cat), sing 0..1 (an
//              open singing mouth: singOpen() in song.js), blush 0..1, tear 0..1
//   hug 0..1   both arms round itself; cross 0..1: arms crossed
// Limb L is the one on screen-left in the front view; it stays the same limb as the person turns (near in q and side).

const BODY_VIEWS = ['front', 'q', 'side', 'qback', 'back'];
// per view: how the body's width shows (xs), where the face sits on the head (fx, in head half-widths), the turn's
// cos and sin, which way each arm's "out" points on screen, and which way each knee bends
const BODY_VIEW = {
  front: { xs: 1, fx: 0, c: 1, s: 0, hxL: -1, hxR: 1, kbL: -1, kbR: 1 },
  q: { xs: .86, fx: .36, c: .71, s: .71, hxL: -.78, hxR: .78, kbL: 1, kbR: 1 },
  side: { xs: .62, fx: .62, c: 0, s: 1, hxL: .9, hxR: .9, kbL: 1, kbR: 1 },
  qback: { xs: .86, fx: 0, c: -.71, s: .71, hxL: .78, hxR: -.78, kbL: 1, kbR: 1 },
  back: { xs: 1, fx: 0, c: -1, s: 0, hxL: 1, hxR: -1, kbL: 1, kbR: -1 },
};

// ---------- the design ----------
function _personDesign(D) {
  const heads = D.heads ?? 4, Ht = D.height ?? 14, shape = D.shape || 'round', k = clamp((heads - 2.5) / 4);
  const b = { shoulders: 1, waist: 1, hips: 1, limbs: 1, legs: 1, belly: 0, chest: 0, ...(D.build || {}) };
  const hh = Ht / heads, hw = hh * (shape === 'tri' ? .86 : shape === 'square' ? .9 : .92);
  const neck = hh * lerp(.05, .2, k), body = Ht - hh - neck, legs = body * lerp(.42, .52, k) * b.legs, torso = body - legs;
  const sh = hw * lerp(1.05, 1.75, k) * b.shoulders * (shape === 'tri' ? 1.12 : 1);
  const hips = sh * lerp(.9, .76, k) * b.hips * (shape === 'tri' ? .84 : shape === 'round' ? 1.08 : 1);
  const waist = lerp(hips, sh, .5) * (shape === 'square' ? .96 : shape === 'tri' ? .78 : .84) * b.waist;
  const skin = D.skin || '#EDC3A0', hairC = (D.hair && D.hair.color) || '#2B2233';
  const top = { kind: 'tee', color: '#E07A55', sleeves: null, ...(D.top || {}) };
  if (!top.sleeves) top.sleeves = top.kind === 'tee' ? 'short' : top.kind === 'dress' ? 'short' : 'long';
  const bottom = { kind: top.kind === 'dress' || top.kind === 'robe' ? 'none' : 'pants', color: '#3A4470', ...(D.bottom || {}) };
  return {
    ...D, heads, Ht, shape, k, b, hh, hw, neck, legs, torso, sh, hips, waist,
    arm: torso * lerp(.74, 1.12, k) * b.limbs, wU: sh * lerp(.2, .2, k) * b.limbs, wT: hips * .44 * b.limbs,
    hand: hh * lerp(.2, .36, k), foot: hh * lerp(.42, .46, k), footH: legs * .07,
    skin, skinDk: mixCol(skin, '#7A3A35', .25), hairC, hairDk: mixCol(hairC, '#000000', .3), hairLt: mixCol(hairC, '#FFFFFF', .22),
    hair: { style: 'short', fringe: 'side', length: .5, ...(D.hair || {}) },
    eyes: { color: '#4A3428', size: 1, lashes: 0, ...(D.eyes || {}) }, brows: { color: mixCol(hairC, '#000000', .15), weight: 1, ...(D.brows || {}) },
    nose: D.nose || 'button', top, topDk: mixCol(top.color, '#1A1420', .25), bottom, botDk: mixCol(bottom.color, '#1A1420', .25),
    shoes: { color: '#3A3038', ...(D.shoes || {}) }, line: D.line ?? 1,
  };
}

// ---------- the skeleton ----------
// Two bones from a to the target, bending toward dir (+1: to the right of a → target): returns [joint, end].
function _ik(a, tg, l1, l2, dir) {
  const dx = tg[0] - a[0], dy = tg[1] - a[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + .01, l1 + l2 - .01);
  const ang = Math.atan2(dy, dx), off = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), j = ang - dir * off;
  const J = [a[0] + Math.cos(j) * l1, a[1] + Math.sin(j) * l1], e = Math.atan2(a[1] + Math.sin(ang) * d - J[1], a[0] + Math.cos(ang) * d - J[0]);
  return [J, [J[0] + Math.cos(e) * l2, J[1] + Math.sin(e) * l2]];
}
// A quadratic curve's point and unit normal (pointing to its right) at k.
function _qb(P0, P1, P2, k) {
  const m = 1 - k, p = [m * m * P0[0] + 2 * m * k * P1[0] + k * k * P2[0], m * m * P0[1] + 2 * m * k * P1[1] + k * k * P2[1]];
  const tx = 2 * m * (P1[0] - P0[0]) + 2 * k * (P2[0] - P1[0]), ty = 2 * m * (P1[1] - P0[1]) + 2 * k * (P2[1] - P1[1]), d = Math.hypot(tx, ty) || 1;
  return { p, n: [-ty / d, tx / d], t: [tx / d, ty / d] };
}
const _pl = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, ease((x - a) / (b - a))); } return pts[pts.length - 1][1]; };

// ---------- drawing ----------
function _drawPerson(D, x, y, u, o) {
  const V = BODY_VIEW[o.view] || BODY_VIEW.front, view = BODY_VIEW[o.view] ? o.view : 'front', back = view === 'back', side = view === 'side';
  const zoom = CAM ? CAM.zoom : 1, lod = D.hh * u * zoom < 34 ? 0 : D.hh * u * zoom < 95 ? 1 : 2;
  const sw = clamp(u * .07, .3, 1.8) * D.line, U = v => v * u, rs = part => boilSeed(`${o.boilKey} ${part}`);
  const sq = o.sq || 0, sit = clamp(o.sit || 0), crouch = clamp(o.crouch || 0), hug = clamp(o.hug || 0), cross = clamp(o.cross || 0);
  const K = { u, sw, lod, view, o, hw: U(D.hw), hh: U(D.hh), D };
  const ext = part => { if (D.extras) { rs('x ' + part); D.extras(part, K); } };
  const ink = PAL.ink, far = c => mixCol(c, '#1A1420', .12);

  rs('shadow');
  if (!o.noShadow) paint(ellPts(x, y + U(.1), U(D.sh * .75 + 1), U(.5), 18), { fill: PAL.ink, fillOp: 80, bleed: .2, tex: .3, border: .1, ink: null });
  push(); translate(x + U(o.dx || 0), y + U(o.dy || 0)); if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + sq * .5) * (1 + .25 * clamp(o.smear || 0)), 1 - sq);
  ext('back');

  // ---- the skeleton, in screen space (y down, the ground at 0) ----
  const legL = U(D.legs), thigh = (legL - U(D.footH)) * .5, shin = thigh;
  const drop = sit ? lerp(crouch * thigh * .7, legL - shin - U(D.footH) * 1.5, sit) : crouch * thigh * .7;
  const P0 = [U(D.hips * .04) * (o.hipTilt || 0), -legL + drop];
  const lean = o.lean || 0, T = U(D.torso), up = [Math.sin(lean), -Math.cos(lean)], rt = [-up[1], up[0]];
  const arc = o.arc || 0, P2 = [P0[0] + up[0] * T, P0[1] + up[1] * T];
  const P1 = [(P0[0] + P2[0]) / 2 + rt[0] * arc * T * .32, (P0[1] + P2[1]) / 2 + rt[1] * arc * T * .32];
  const spine = k => _qb(P0, P1, P2, k), top = spine(1), tilt = o.hipTilt || 0;
  // a joint at body-width offset bx (L negative) on the spine at k, turned for the view: [x, y, depth]
  const joint = (k, bx, tl) => { const s = spine(k), sx = bx * V.c, a = Math.atan2(s.n[1], s.n[0]) + tl; return [s.p[0] + Math.cos(a) * sx, s.p[1] + Math.sin(a) * sx, -bx * V.s]; };
  const hipJ = [joint(0, -U(D.hips * .27), tilt * .5), joint(0, U(D.hips * .27), tilt * .5)];
  const shJ = [joint(.93, -U(D.sh * .42), -tilt * .35), joint(.93, U(D.sh * .42), -tilt * .35)];
  if (side) { hipJ[0][0] += U(D.hips * .06); shJ[0][0] += U(D.sh * .05); hipJ[1][0] -= U(D.hips * .06); shJ[1][0] -= U(D.sh * .05); }

  // legs: the feet planted at stance (or walking), the knees found by IK
  const walk = o.walk, stance = U(D.hips * .3), flatV = Math.abs(V.s) < .1;
  const legs = [0, 1].map(i => {
    const H = hipJ[i], sgn = i ? 1 : -1, hx = i ? V.hxR : V.hxL, lift = i ? (o.lR || 0) : (o.lL || 0), bend = i ? (o.kR || 0) : (o.kL || 0);
    let F = [H[0] + sgn * stance * Math.abs(V.c) * .35 + (side ? sgn * U(.15) : 0), -U(D.footH)];
    if (walk != null) { const ph = (walk + (i ? .5 : 0)) * TAU; F[0] += Math.sin(ph) * thigh * .9 * V.s; F[1] -= Math.max(0, Math.cos(ph)) * thigh * .45; }
    if (sit && (side || view === 'q' || view === 'qback')) F = [H[0] + hx * thigh * 1.05 * sit + (1 - sit) * (F[0] - H[0]), F[1]];
    let knee, foot;
    if (lift > .01 || bend > .01) {   // a lifted leg is posed by hand: the thigh swings out (front) or forward (side)
      const out = hx < 0 ? -1 : 1, a1 = Math.PI / 2 - lift, a2 = a1 + bend;
      knee = [H[0] + out * Math.cos(a1) * thigh, H[1] + Math.sin(a1) * thigh];
      foot = [knee[0] + out * Math.cos(a2) * shin, knee[1] + Math.sin(a2) * shin];
    } else if (sit && !side && view !== 'q' && view !== 'qback') {   // sitting, seen from the front: the thigh comes toward us
      knee = [H[0] + sgn * thigh * .12, H[1] + thigh * .25 * (1 - sit) + thigh * .12]; foot = [knee[0], -U(D.footH)];
    } else {
      [knee, foot] = _ik(H, F, thigh, shin, i ? V.kbR : V.kbL);
      if (flatV) { const mx = lerp(H[0], foot[0], .5); knee = [lerp(mx, knee[0], .4), knee[1]]; }   // seen from the front, a knee bends toward us
    }
    return { H, knee, foot, depth: H[2], i };
  });

  // arms: the shoulder angle (0 out, + up), the elbow bend, then the hand
  const arms = [0, 1].map(i => {
    const S = shJ[i], hx = i ? V.hxR : V.hxL, swing = walk != null ? -Math.sin((walk + (i ? .5 : 0)) * TAU) * .5 * V.s : 0;
    let a = (i ? o.aR : o.aL) ?? -1.25, e = (i ? o.eR : o.eL) ?? .15;
    a = lerp(lerp(a + swing, -1.45, hug), -.95, cross); e = lerp(lerp(e, 2.05, hug), 2.35 + i * .1, cross);
    const L1 = U(D.arm) * .5, L2 = U(D.arm) * .5, d1 = [hx * Math.cos(a), -Math.sin(a)], d2 = [hx * Math.cos(e - a), Math.sin(e - a)];
    const E = [S[0] + d1[0] * L1, S[1] + d1[1] * L1], W = [E[0] + d2[0] * L2, E[1] + d2[1] * L2];
    const shp = hug > .5 ? 'cup' : cross > .5 ? 'relaxed' : (i ? o.hR : o.hL) || 'relaxed';
    return { S, E, W, rot: Math.atan2(d2[1], d2[0]), flip: hx < 0, shape: shp, depth: S[2], inner: e > 1.4 || hug > .5 || cross > .5, i };
  });

  // ---- the parts ----
  // how far below the hips the top's hem falls, as a share of the legs, then in the torso's own units
  const hemL = { dress: .5, coat: .62, robe: .92, jacket: .14, hoodie: .14, shirt: .12, tee: .1 }[D.top.kind] ?? .1, hemK = -hemL * D.legs / D.torso;
  const drawLeg = L => {
    rs('leg' + L.i);
    const farK = L.depth < -.01, pantsLong = D.bottom.kind === 'pants', col = pantsLong ? D.bottom.color : D.skin;
    const wT = U(D.wT), wS = wT * .78, footC = D.shoes.color;
    paint(limbPts([L.H, L.knee, L.foot], wT, wS), { wash: farK ? far(col) : col, ink, sw: sw * .8, curv: .3 });
    if (D.bottom.kind === 'shorts') paint(limbPts([L.H, [lerp(L.H[0], L.knee[0], .55), lerp(L.H[1], L.knee[1], .55)]], wT * 1.12, wT * 1.08), { wash: farK ? far(D.bottom.color) : D.bottom.color, ink, sw: sw * .8 });
    if (lod === 2 && pantsLong) inkLine([[L.knee[0] - wT * .3, L.knee[1] - wT * .1], [L.knee[0] + wT * .05, L.knee[1] + wT * .12]], sw * .4, D.botDk, 'inkfine', .5);
    // the foot: toward where it faces in side views, toward us in front views
    const fl = U(D.foot), fd = side || view === 'q' || view === 'qback' ? 1 : 0, fx = L.foot[0] + fd * fl * .3, fy = L.foot[1] + U(D.footH) * .5;
    paint(D.shape === 'square' ? rrPts(fx - fl * (.3 + fd * .25), fy - fl * .28, fl * (.6 + fd * .5), fl * .4, fl * .14) : ellPts(fx, fy, fl * (.32 + fd * .24), fl * .22, 14),
      { wash: farK ? far(footC) : footC, ink, sw: sw * .7 });
  };
  // the torso's outline, from k0 (below the hips: negative) to the neck, with a width profile for the view
  const torsoPts = (k0, k1 = 1, flare = 0) => {
    const sh = U(D.sh) * V.xs, hp = U(D.hips) * V.xs, wa = U(D.waist) * V.xs, ch = lerp(wa, sh, .8) * (1 + D.b.chest * .12);
    const prof = [[-.16, hp * .62], [0, hp], [.42, wa * (1 + D.b.belly * .25)], [.76, ch], [.93, sh], [1, sh * .5]];
    const Lp = [], Rp = [], n = 14;
    for (let j = 0; j <= n; j++) {
      const kk = lerp(k0, k1, j / n), s = spine(clamp(kk)), base = kk < 0 ? [s.p[0] + up[0] * kk * T, s.p[1] + up[1] * kk * T] : s.p;
      let w = _pl(prof, kk); if (kk < 0 && flare) w = lerp(hp, hp * (1 + flare), clamp(-kk / Math.max(.01, -k0)));
      let wr = w / 2, wl = w / 2;
      if (side) { const dep = U(D.sh) * .5; wr = dep * _pl([[-.16, .3], [0, .5 + D.b.belly * .3], [.4, .48 + D.b.belly * .5], [.76, .55 + D.b.chest * .4], [.93, .42], [1, .28]], kk); wl = dep * _pl([[-.16, .55], [0, .62], [.42, .42], [.8, .55], [1, .32]], kk); if (kk < 0 && flare) { wr *= 1 + flare * .6; wl *= 1 + flare * .6; } }
      else if (view === 'q' || view === 'qback') { const sk = U(D.sh) * .05 * (view === 'q' ? 1 : -1) * clamp(kk * 2); wr += sk; wl -= sk; }
      Rp.push([base[0] + s.n[0] * wr, base[1] + s.n[1] * wr]); Lp.push([base[0] - s.n[0] * wl, base[1] - s.n[1] * wl]);
    }
    return Rp.concat(Lp.reverse());
  };
  const drawPelvis = () => {
    if (D.bottom.kind === 'none') return;
    rs('pelvis');
    paint(torsoPts(-.16, .3), { wash: D.bottom.color, ink, sw: sw * .8, curv: .5 });
    if (D.bottom.kind === 'skirt') paint(torsoPts(-.6, .3, .7), { wash: D.bottom.color, ink, sw: sw * .8, curv: .4 });
  };
  const drawTop = () => {
    rs('torso');
    const t = D.top, open = t.open && !back, long = hemL > .3;
    if (long) paint(torsoPts(hemK, .5, t.kind === 'robe' ? .5 : .38), { wash: t.color, ink, sw: sw * .85, curv: .4 });
    const P = torsoPts(long ? -.1 : hemK, 1);
    paint(P, { wash: t.color, ink, sw: sw * .9, curv: .45 });
    if (back) return;
    const s1 = spine(1), s5 = spine(.55), fx = side ? U(D.sh) * .2 : view === 'q' ? U(D.sh) * .1 : 0, nk = U(D.hw) * .28;
    if (open) {   // an open coat or jacket: the layer under it shows down the front
      const under = t.under || PAL.cream;
      paint([[s1.p[0] + fx - nk * 1.1, s1.p[1] + U(.1)], [s1.p[0] + fx + nk * 1.1, s1.p[1] + U(.1)], [s5.p[0] + fx + nk * .9, spine(-.05).p[1]], [s5.p[0] + fx - nk * .9, spine(-.05).p[1]]], { wash: under, ink, sw: sw * .6, curv: .2 });
      if (lod) for (const sgn of [-1, 1]) inkLine([[s1.p[0] + fx + sgn * nk * 1.2, s1.p[1]], [s1.p[0] + fx + sgn * nk * .3, s1.p[1] + U(D.torso) * .3]], sw * .6, ink, 'ink', .3);   // lapels
    } else if (t.kind === 'shirt' || t.kind === 'robe') {
      paint([[s1.p[0] + fx - nk, s1.p[1] - U(.05)], [s1.p[0] + fx + nk, s1.p[1] - U(.05)], [s1.p[0] + fx, s1.p[1] + nk * 1.1]], { wash: t.trim || PAL.cream, ink, sw: sw * .55 });   // collar
      if (lod && t.kind === 'shirt') for (let j = 1; j <= 3; j++) paint(ellPts(lerp(s1.p[0], s5.p[0], j / 3.5) + fx, lerp(s1.p[1], spine(.1).p[1], j / 3.5), U(.09), U(.09), 8), { wash: t.trim || PAL.cream, ink: null });
    } else if (t.kind === 'hoodie') {
      paint(limbPts([[s1.p[0] + fx - nk * 1.6, s1.p[1] + U(.05)], [s1.p[0] + fx, s1.p[1] + nk * .9], [s1.p[0] + fx + nk * 1.6, s1.p[1] + U(.05)]], nk * .55), { wash: D.topDk, ink, sw: sw * .6 });
      if (lod === 2) for (const sgn of [-1, 1]) inkLine([[s1.p[0] + fx + sgn * nk * .4, s1.p[1] + nk * .9], [s1.p[0] + fx + sgn * nk * .5, s1.p[1] + nk * 2.2]], sw * .5, PAL.cream, 'inkfine', .3);
    } else inkLine([[s1.p[0] + fx - nk, s1.p[1] + U(.02)], [s1.p[0] + fx, s1.p[1] + nk * .7], [s1.p[0] + fx + nk, s1.p[1] + U(.02)]], sw * .55, ink, 'inkfine', .5);   // a round neckline
    if (t.trim && (t.kind === 'robe' || t.kind === 'coat')) for (const sgn of [-1, 1]) inkLine([[s1.p[0] + fx + sgn * nk, s1.p[1]], [s5.p[0] + fx + sgn * nk * .3, s5.p[1]], [spine(-.1).p[0] + fx + sgn * nk * .4, spine(hemK).p[1]]], sw * 1.6, t.trim, 'ink', .3);
    if (lod === 2) {   // a few folds where cloth gathers
      const w = spine(.38);
      inkLine([[w.p[0] - U(D.waist) * .3 + fx, w.p[1]], [w.p[0] - U(D.waist) * .1 + fx, w.p[1] + U(.25)]], sw * .4, D.topDk, 'inkfine', .5);
      inkLine([[w.p[0] + U(D.waist) * .35 + fx, w.p[1] - U(.2)], [w.p[0] + U(D.waist) * .2 + fx, w.p[1] + U(.15)]], sw * .4, D.topDk, 'inkfine', .5);
    }
    ext('chest');
  };
  const drawArm = A => {
    rs('arm' + A.i);
    const farK = A.depth < -.01, t = D.top, wU = U(D.wU), wF = wU * .82, sleeve = t.sleeves;
    const up = sleeve === 'none' ? D.skin : t.color, fore = sleeve === 'long' ? t.color : D.skin, cuff = [lerp(A.E[0], A.W[0], .85), lerp(A.E[1], A.W[1], .85)];
    paint(limbPts([A.E, [lerp(A.E[0], A.W[0], .5), lerp(A.E[1], A.W[1], .5)], A.W], wF, wF * .86), { wash: farK ? far(fore) : fore, ink, sw: sw * .75 });
    paint(limbPts([A.S, [lerp(A.S[0], A.E[0], .5), lerp(A.S[1], A.E[1], .5)], A.E], wU * (sleeve === 'short' ? 1.12 : 1), wF * (sleeve === 'short' ? 1.15 : 1)), { wash: farK ? far(up) : up, ink, sw: sw * .75 });
    if (sleeve === 'long' && t.trim) paint(limbPts([cuff, A.W], wF * 1.05, wF * .95), { wash: t.trim, ink, sw: sw * .5 });
    if (lod === 2 && sleeve === 'long') inkLine([[A.E[0] - wF * .3, A.E[1] - wF * .2], [A.E[0] + wF * .1, A.E[1] + wF * .25]], sw * .4, D.topDk, 'inkfine', .5);   // the elbow's fold
    drawHand(A.W[0], A.W[1], U(D.hand), { shape: A.shape, rot: A.rot, flip: A.flip, col: farK ? far(D.skin) : D.skin, lod, shapeLang: D.shape, sw: sw * .7, boilKey: `${o.boilKey} hand${A.i}` });
  };
  // the head's frame: the neck's base and top, the head's centre and its angle
  const s1 = spine(1), hAng = Math.atan2(s1.t[0], -s1.t[1]) + (o.headTilt || 0), nkL = U(D.neck) + U(D.hh) * .22;
  const nb = [s1.p[0] + (side ? U(D.sh) * .06 : 0), s1.p[1] + U(.15)], nt = [nb[0] + Math.sin(hAng) * nkL, nb[1] - Math.cos(hAng) * nkL];
  const hc = [nt[0] + Math.sin(hAng) * U(D.hh) * .3, nt[1] - Math.cos(hAng) * U(D.hh) * .3];   // the neck goes well into the head, so no chin shows it
  // hair that falls below the head hangs behind the body, so it's painted first (in the back view, last)
  const hangs = (D.hair.style === 'long' || D.hair.style === 'pony' && view !== 'front') && !back;
  const drawHangingHair = () => { push(); translate(hc[0], hc[1]); rotate(hAng); _hairBack(D, U(D.hw), U(D.hh), view, sw, o); pop(); };
  const drawHead = () => {
    const ang = hAng, hh = U(D.hh), hw = U(D.hw);
    rs('neck');
    paint(limbPts([nb, nt], hw * .3, hw * .28), { wash: D.skin, ink, sw: sw * .6, shade: false });
    if (lod) paint(limbPts([[lerp(nb[0], nt[0], .55), lerp(nb[1], nt[1], .55)], nt], hw * .3, hw * .3), { wash: D.skinDk, washOp: 150, ink: null });
    push(); translate(hc[0], hc[1]); rotate(ang);
    _drawHead(D, hw, hh, view, o, lod, sw, rs, ext, hangs);
    pop();
  };

  // ---- in depth order ----
  const nearLeg = legs[0].depth >= legs[1].depth ? 0 : 1, nearArm = arms[0].depth >= arms[1].depth ? 0 : 1;
  const flat = Math.abs(V.s) < .1;   // front and back: no near side
  if (hangs) drawHangingHair();
  if (!flat) { if (!arms[1 - nearArm].inner) drawArm(arms[1 - nearArm]); drawLeg(legs[1 - nearLeg]); drawLeg(legs[nearLeg]); }
  else { drawLeg(legs[0]); drawLeg(legs[1]); if (back) arms.forEach(A => { if (!A.inner) drawArm(A); }); }
  drawPelvis(); drawTop();
  if (back) arms.forEach(A => { if (A.inner) drawArm(A); });
  drawHead();
  if (!back) {
    if (flat) arms.forEach(A => drawArm(A));
    else { if (arms[1 - nearArm].inner) drawArm(arms[1 - nearArm]); drawArm(arms[nearArm]); }
  }
  ext('front');
  pop();
}

// ---------- the head ----------
// The head's outline around (0, 0): the shape language sets how square it is and how the jaw narrows; in the side
// view it gains a brow, a nose and a chin on the side it faces.
function _headPts(w, h, shape, view, n = 40) {
  const p = shape === 'square' ? 3.4 : 2.2, out = [], side = view === 'side', ww = side ? h * .96 : w;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
    let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * ww / 2, y = Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * h / 2;
    if (s > 0) x *= shape === 'tri' ? 1 - .36 * s * s : shape === 'round' ? 1 - .1 * s * s : 1 - .06 * s * s * s;
    if (side && c > 0) {   // the profile: a brow, a nose, lips and the chin push out on the facing side
      const g = (y0, sg, a0) => a0 * Math.exp(-Math.pow((y - y0 * h) / (sg * h), 2));
      x += ww * (g(-.04, .06, .03) + g(.15, .06, .11) + g(.31, .04, .03) + g(.42, .05, .04)) * clamp(c * 2);
    }
    out.push([x, y]);
  }
  return out;
}
function _drawHead(D, hw, hh, view, o, lod, sw, rs, ext, hung) {
  const ink = PAL.ink, back = view === 'back', side = view === 'side', V = BODY_VIEW[view], fxc = V.fx * hw / 2;
  rs('hair back'); if (!back && !hung) _hairBack(D, hw, hh, view, sw, o);
  // ears
  if (lod) {
    rs('ears');
    const ear = (ex, sc) => { paint(ellPts(ex, hh * .06, hw * .1 * sc, hh * .14, 12), { wash: D.skin, ink, sw: sw * .6 }); if (lod === 2) inkLine([[ex - hw * .02 * sc, hh * .01], [ex + hw * .02 * sc, hh * .08], [ex - hw * .01 * sc, hh * .13]], sw * .4, D.skinDk, 'inkfine', .5); };
    if (view === 'front' || back) { ear(-hw * .49, 1); ear(hw * .49, 1); } else if (view === 'q') ear(-hw * .36, .9); else if (side) ear(-hh * .06, 1.1); else ear(hw * .36, .9);
  }
  rs('head');
  paint(_headPts(hw, hh, D.shape, view), { wash: D.skin, ink, sw: sw * .85, curv: .3, shade: false });   // a face takes its shade from the hair (_hairCap)
  if (view === 'qback') { _hairCap(D, hw, hh, view, sw, o, lod); _hairBack(D, hw, hh, view, sw, o); ext('head'); return; }
  if (back) { _hairCap(D, hw, hh, view, sw, o, lod); _hairBack(D, hw, hh, view, sw, o); ext('head'); return; }
  // the face
  rs('face');
  const ey = hh * lerp(.12, .05, D.k), er = hh * lerp(.13, .085, D.k) * D.eyes.size, sep = hw * lerp(.24, .2, D.k);
  const eyes = view === 'front' ? [[-sep, 1, -1], [sep, 1, 1]] : view === 'q' ? [[fxc - sep * .92, 1, -1], [fxc + sep * .62, .74, 1]] : side ? [[hh * .3, .7, 1]] : [];
  if (o.blush > .02 && lod) for (const [ex, sc] of eyes) paint(ellPts(ex + (ex < fxc ? -1 : 1) * er * .3, ey + er * 1.7, er * 1.15 * sc, er * .55, 14), { fill: PAL.rose, fillOp: 160 * clamp(o.blush), bleed: .2, ink: null });
  for (const [ex, sc, sideSign] of eyes) _eye(D, ex, ey, er, sc, sideSign, o, lod, sw);
  _brows(D, eyes, ey, er, o, lod, sw);
  // the nose
  const nyy = hh * lerp(.27, .2, D.k);
  if (lod && D.nose !== 'none' && !side) {
    const nx = view === 'q' ? fxc + hw * .1 : 0;
    if (D.nose === 'dot' || lod === 0) paint(ellPts(nx, nyy, hw * .03, hw * .025, 8), { wash: D.skinDk, ink: null });
    else if (D.nose === 'line') inkLine([[nx, nyy - hh * .08], [nx + hw * .035, nyy], [nx - hw * .01, nyy + hh * .015]], sw * .5, D.skinDk, 'inkfine', .5);
    else { paint(ellPts(nx, nyy, hw * .06, hw * .045, 10), { wash: mixCol(D.skin, D.skinDk, .35), ink: lod === 2 ? D.skinDk : null, sw: sw * .4 }); if (lod === 2) paint(ellPts(nx - hw * .015, nyy - hw * .015, hw * .02, hw * .014, 6), { wash: mixCol(D.skin, '#FFFFFF', .4), ink: null }); }
  }
  if (side && lod === 2) inkLine([[hh * .5, nyy + hh * .02], [hh * .46, nyy + hh * .035]], sw * .4, D.skinDk, 'inkfine', 0);   // the nostril
  _mouth(D, view === 'front' ? 0 : view === 'q' ? fxc * .8 + hw * .04 : hh * .42, hh * lerp(.38, .31, D.k), hw * lerp(.11, .1, D.k) * (side ? .7 : view === 'q' ? .82 : 1), o, lod, sw, side);
  if (o.tear > .02 && eyes.length) {
    const [ex] = eyes[0], k = clamp(o.tear), ty = ey + er * (1 + 2.4 * k);
    paint([[ex - er * .15, ey + er * .8], [ex + er * .2, ty], [ex - er * .45, ty]], { wash: PAL.sky, washOp: 210, ink, sw: sw * .3, curv: .5 });
  }
  _hairCap(D, hw, hh, view, sw, o, lod);
  ext('head');
}

// An eye at (cx, cy), radius r, scaled sc across (far eyes turn away). The lids cut the eye's shape: what's left is
// the white, and the iris is cut by the same lids, so a lowered lid hides the iris too.
function _eye(D, cx, cy, r, sc, sgn, o, lod, sw) {
  const ink = PAL.ink, kind = (o.squint || 0) > .5 ? 'closed' : o.eyes || 'open', rx = r * .82 * sc * (kind === 'wide' ? 1.12 : 1), ry = r * (kind === 'wide' ? 1.18 : 1);
  const blink = (kind === 'open' || kind === 'sad') && ((T * .8 + (o.seed || 0) * 1.9 + 1.3) % 3.7) < .12;
  if (kind === 'closed' || kind === 'sleepy' && lod === 0 || blink) return inkLine([[cx - rx, cy], [cx, cy + ry * .35], [cx + rx, cy]], sw * 1.1, ink, 'ink', .5);
  if (kind === 'happy') return inkLine([[cx - rx, cy + ry * .2], [cx, cy - ry * .45], [cx + rx, cy + ry * .2]], sw * 1.1, ink, 'ink', .5);
  if (kind === 'tight') return inkLine([[cx - sgn * rx, cy - ry * .5], [cx + sgn * rx * .7, cy], [cx - sgn * rx, cy + ry * .5]], sw * 1.1, ink, 'ink', .1);
  if (kind === 'heart') return paint(heartPts(cx, cy, r * 1.1), { wash: PAL.rose, ink, sw: sw * .6 });
  const sh = D.shape, edge = u => sh === 'square' ? Math.pow(1 - Math.pow(Math.abs(u), 3), 1 / 3) : sh === 'tri' ? Math.pow(1 - u * u, .8) : Math.sqrt(Math.max(0, 1 - u * u));
  const inner = u => clamp(u * -sgn * .5 + .5);   // 0 at the outer corner, 1 at the inner (toward the nose)
  const lidTop = u => kind === 'half' ? -ry * .05 : kind === 'sleepy' ? ry * .2 : kind === 'angry' ? -ry * .55 + inner(u) * ry * .7 : kind === 'sad' ? -ry * .2 - inner(u) * ry * .35 : -ry;
  const topY = u => Math.max(-ry * edge(u), lidTop(u)), botY = u => ry * edge(u) * (sh === 'tri' ? .78 : 1);
  if (lod === 0) {   // far: a dot, cut by the lid
    const P = ellPts(cx + (o.lookX || 0) * rx * .25, cy, rx * .55, ry * .7, 10).map(([x, y]) => [x, Math.max(y, cy + lidTop((x - cx) / rx))]);
    return paint(P, { wash: ink, ink: null });
  }
  const W = [], n = 14;
  for (let j = 0; j <= n; j++) { const u = -1 + 2 * j / n; W.push([cx + u * rx, cy + topY(u)]); }
  for (let j = n - 1; j > 0; j--) { const u = -1 + 2 * j / n; W.push([cx + u * rx, cy + Math.max(botY(u), topY(u))]); }   // the corners once
  paint(W, { wash: PAL.cream, ink: null, shade: false });
  // the iris and pupil, looking where lookX / lookY say, cut by the lids and the eye's edge
  const ir = ry * (kind === 'wide' || kind === 'blank' ? .4 : lod === 2 ? .62 : .54), ix = cx + clamp(o.lookX || 0, -1, 1) * rx * .38, iy = cy + clamp(o.lookY || 0, -1, 1) * ry * .3 + ry * .08;
  const cut = P => P.map(([x, y]) => { const u = clamp((x - cx) / rx, -.98, .98); return [clamp(x, cx - rx * .98, cx + rx * .98), clamp(y, cy + topY(u), cy + Math.max(botY(u), topY(u)))]; });
  if (kind !== 'blank') paint(cut(ellPts(ix, iy, ir * sc, ir, 16)), { wash: D.eyes.color, ink: null, shade: false });
  paint(cut(ellPts(ix, iy, ir * .52 * sc, ir * .56, 12)), { wash: ink, ink: null, shade: false });
  if (lod === 2 && kind !== 'blank') inkLine(cut(ellPts(ix, iy, ir * sc * .92, ir * .92, 16)).slice(9, 15), sw * .35, mixCol(D.eyes.color, '#FFFFFF', .45), 'inkfine', .5);   // the iris's lit rim
  const hl = (dx, dy, k) => { const hx = ix + dx * ir, hy = iy + dy * ir; if (hy > cy + topY((hx - cx) / rx)) paint(ellPts(hx, hy, ir * k * sc, ir * k, 8), { wash: PAL.cream, ink: null, shade: false }); };
  if (kind !== 'blank') { hl(.32, -.32, .26); if (lod === 2) hl(-.3, .3, .12); }
  // the lids: the upper one bold, the lower one fine (close up)
  const up = [];
  for (let j = 0; j <= n; j++) { const u = -1 + 2 * j / n; up.push([cx + u * rx * 1.04, cy + topY(u) - (lod === 2 ? ry * .03 : 0)]); }
  inkLine(up, sw * (lod === 2 ? .95 : .6), ink, 'ink', .4);
  if (lod === 2) {
    inkLine([[cx - rx * .7, cy + botY(-.7)], [cx, cy + botY(0) + ry * .03], [cx + rx * .7, cy + botY(.7)]], sw * .4, ink, 'inkfine', .5);
    if (D.eyes.lashes > 0) for (let j = 0; j < 3; j++) { const u = sgn * (.62 + j * .17), bx = cx + u * rx, by = cy + topY(u); inkLine([[bx, by], [bx + sgn * rx * (.18 + .1 * j) * D.eyes.lashes, by - ry * (.2 + .06 * j) * D.eyes.lashes]], sw * .7, ink, 'ink', 0); }   // at the outer corner
  }
}
// The brows: one tapered stroke each, arched (round), straight (square) or angled (tri), lifted, knitted or dropped.
function _brows(D, eyes, ey, er, o, lod, sw) {
  const kind = o.brows || ({ angry: 'angry', sad: 'sad', wide: 'up', tight: 'sad' })[o.eyes] || 'flat';
  if (lod === 0 && kind === 'flat') return;
  for (const [ex, sc, sgn] of eyes) {
    const w = er * 1.15 * sc, by = ey - er * 1.75, inr = -sgn;   // inr: toward the nose
    const lift = kind === 'up' ? -er * .55 : kind === 'raised' && sgn > 0 ? -er * .6 : 0;
    const tilt = kind === 'angry' ? er * .55 : kind === 'sad' || kind === 'worried' ? -er * .5 : 0;   // + drops the inner end
    const a = [ex + inr * w * .95, by + lift + tilt], b = [ex - inr * w * .95, by + lift - tilt * .3];
    const mid = D.shape === 'tri' ? [lerp(a[0], b[0], .68), Math.min(a[1], b[1]) - er * .32] : D.shape === 'square' ? [lerp(a[0], b[0], .5), lerp(a[1], b[1], .5) - er * .05] : [lerp(a[0], b[0], .5), lerp(a[1], b[1], .5) - er * .28];
    const wt = er * .26 * D.brows.weight * (lod ? 1 : .8);
    paint(ribbon([a, mid, b], wt * (D.shape === 'square' ? 1 : 1.1), wt * (D.shape === 'square' ? .9 : .45)), { wash: D.brows.color, ink: null, shade: false });
  }
}
// The mouth at (mx, my), m wide on each side.
function _mouth(D, mx, my, m, o, lod, sw, side) {
  const ink = PAL.ink, dark = '#5E2630', sg = clamp(o.sing || 0), kind = sg > .05 ? 'sing' : o.mouth || 'flat';
  const open = (w, h, smile = 0) => {   // an open mouth: dark, with teeth and a tongue as it grows
    const P = [];
    for (let j = 0; j <= 16; j++) { const a = j / 16 * TAU, c = Math.cos(a), s = Math.sin(a); P.push([mx + c * w, my + (s > 0 ? s * h : s * h * (1 - smile * .8)) + (s < 0 ? h * smile * .25 : 0)]); }
    paint(P, { wash: dark, ink, sw: sw * .6, shade: false });
    if (lod && h > m * .3) paint(rectPts(mx - w * .62, my - h * (1 - smile * .8) + h * .04, w * 1.24, h * .26), { wash: PAL.cream, ink: null, shade: false });
    if (lod === 2 && h > m * .5) paint(ellPts(mx, my + h * .62, w * .55, h * .3, 12), { wash: '#C2546A', ink: null, shade: false });
  };
  if (side) mx -= m * .2;
  switch (kind) {
    case 'sing': open(m * (.55 + .3 * sg), m * (.15 + .9 * sg)); break;
    case 'smile': inkLine([[mx - m, my - m * .2], [mx, my + m * .3], [mx + m, my - m * .2]], sw * .8, ink, 'ink', .6); break;
    case 'grin': open(m * 1.05, m * .7, 1); break;
    case 'laugh': open(m * 1.1, m * 1.05, .7); break;
    case 'frown': inkLine([[mx - m * .9, my + m * .3], [mx, my - m * .1], [mx + m * .9, my + m * .3]], sw * .8, ink, 'ink', .6); break;
    case 'o': open(m * .38, m * .45); break;
    case 'O': open(m * .7, m * .95); break;
    case 'smirk': inkLine([[mx - m * .8, my + m * .1], [mx + m * .2, my + m * .12], [mx + m, my - m * .3]], sw * .8, ink, 'ink', .5); break;
    case 'wobble': inkLine([[mx - m, my], [mx - m * .5, my - m * .2], [mx, my], [mx + m * .5, my - m * .2], [mx + m, my]], sw * .7, ink, 'ink', .3); break;
    case 'pressed': inkLine([[mx - m * .7, my], [mx + m * .7, my]], sw * 1.6, mixCol(ink, dark, .4), 'ink', 0); break;
    case 'grit': paint(rrPts(mx - m, my - m * .32, m * 2, m * .64, m * .15), { wash: PAL.cream, ink, sw: sw * .6, shade: false }); inkLine([[mx - m * .9, my], [mx + m * .9, my]], sw * .4, ink, 'inkfine', 0); break;
    case 'cat': inkLine([[mx - m, my - m * .15], [mx - m * .5, my + m * .25], [mx, my - m * .05], [mx + m * .5, my + m * .25], [mx + m, my - m * .15]], sw * .7, ink, 'ink', .5); break;
    default: inkLine([[mx - m * .7, my], [mx + m * .7, my]], sw * .8, ink, 'ink', 0);
  }
  if (lod === 2 && (kind === 'flat' || kind === 'smile' || kind === 'smirk')) inkLine([[mx - m * .35, my + m * .5], [mx + m * .35, my + m * .5]], sw * .35, D.skinDk, 'inkfine', .5);   // the lower lip
}

// ---------- hair ----------
// The hairline: where the hair stops on the face (y, for an x across the head), by view and fringe.
function _hairline(D, hw, hh, view, x) {
  const H = D.hair, V = BODY_VIEW[view], fx = V.fx * hw / 2, f = H.style === 'pony' || H.style === 'bun' || H.fringe === 'none' ? -hh * .3 : -hh * .14;
  if (view === 'back') return hh * .28;
  if (view === 'qback') return lerp(hh * .28, -hh * .08, clamp((x - hw * .12) / (hw * .14)));   // only the far cheek and ear show
  const dx = x - fx, edge = view === 'side' ? (dx < -hh * .2 ? 1 : 0) : clamp((Math.abs(dx) - hw * .36) / (hw * .12));
  const back = view === 'side' || view === 'q' ? clamp((-dx - hw * .4) / (hw * .2)) : 0;
  let y = f;
  if (H.fringe === 'side') y += (dx / hw) * hh * .16;
  if (H.style === 'spiky') y += (Math.abs(Math.sin(dx / hw * 14)) - .5) * hh * .06;
  return lerp(lerp(y, hh * .05, edge), hh * .26, back);
}
function _hairCap(D, hw, hh, view, sw, o, lod) {
  const H = D.hair; if (H.style === 'bald') return;
  boilSeed(`${o.boilKey} hair`);
  const P = _headPts(hw, hh, D.shape, view, 48), n = P.length, abv = P.map(([x, y]) => y < _hairline(D, hw, hh, view, x));
  let s = abv.findIndex((v, i) => v && !abv[(i - 1 + n) % n]); if (s < 0) s = 0;
  const vol = H.style === 'curly' ? 1.16 : H.style === 'spiky' ? 1.08 : 1.07, arcP = [];
  for (let j = 0; j < n && abv[(s + j) % n]; j++) {
    const i = (s + j) % n, [x, y] = P[i];
    const v = H.style === 'spiky' ? vol + (j % 2 ? .26 : 0) * clamp(-y / hh * 3) : H.style === 'curly' ? vol + .07 * Math.abs(Math.sin(j * 1.3)) : vol;
    arcP.push([x * v, (y + hh * .02) * v - hh * .02]);
  }
  if (arcP.length < 3) return;
  const a0 = arcP[0][0], a1 = arcP[arcP.length - 1][0], close = [];
  for (let j = 1; j < 12; j++) { const x = lerp(a1, a0, j / 12); close.push([x, _hairline(D, hw, hh, view, x)]); }
  const cap = arcP.concat(close);
  if (lod && view !== 'back' && view !== 'qback') {   // the shadow the hair casts on the forehead
    const band = close.slice(1, -1); if (band.length > 2) paint(band.concat(band.slice().reverse().map(([x, y]) => [x, y + hh * .07])), { wash: D.skinDk, washOp: 120, ink: null, shade: false, curv: .4 });
  }
  paint(cap, { wash: D.hairC, ink: PAL.ink, sw: sw * .8, curv: H.style === 'spiky' ? .05 : .35 });
  if (lod) {   // the shine: a tapered band across the crown, on the side the light comes from; close up, a few strands
    const sh = []; for (let j = 0; j <= 8; j++) { const a = Math.PI * (1.18 + j / 8 * .42); sh.push([Math.cos(a) * hw * .36, Math.sin(a) * hh * .36 - hh * .06]); }
    paint(ribbon(sh, hh * .02, hh * (lod === 2 ? .07 : .06)), { wash: D.hairLt, ink: null, shade: false });
    if (lod === 2) for (let j = 0; j < 5; j++) { const q = arcP[Math.floor(arcP.length * (.15 + j * .16))]; if (q) inkLine([[q[0] * .9, q[1] * .9], [lerp(q[0], 0, .35), lerp(q[1], _hairline(D, hw, hh, view, q[0] * .6), .5)]], sw * .4, D.hairDk, 'inkfine', .5); }
  }
}
function _hairBack(D, hw, hh, view, sw, o) {
  const H = D.hair, st = H.style, col = view === 'back' ? D.hairC : mixCol(D.hairC, '#000000', .12), side = view === 'side', bx = side ? -hh * .12 : view === 'q' ? -hw * .06 : 0;
  boilSeed(`${o.boilKey} hair back`);
  const sway = Math.sin(bpOf(T) * Math.PI) * .06 + (o.rot || 0) * -.6 + (o.lean || 0) * -.5;
  if (st === 'bob') paint(rrPts(bx - hw * (side ? .5 : .6), -hh * .25, hw * (side ? .9 : 1.2), hh * .7, hw * .25), { wash: col, ink: PAL.ink, sw: sw * .8, curv: .3 });
  else if (st === 'long') {
    const L = hh * (.55 + H.length * 1.3), w = hw * (side ? .5 : .64);
    paint([[bx - w, -hh * .2], [bx + w, -hh * .2], [bx + w * 1.12 + Math.sin(sway) * L * .3, L * .7], [bx + w * .4 + Math.sin(sway) * L, L], [bx - w * .4 + Math.sin(sway) * L, L * .97], [bx - w * 1.12 + Math.sin(sway) * L * .3, L * .7]], { wash: col, ink: PAL.ink, sw: sw * .8, curv: .4 });
  } else if (st === 'pony') {
    const r0 = [side ? -hh * .48 : view === 'q' ? -hw * .42 : 0, -hh * .3], L = hh * (.5 + H.length);
    if (view !== 'front') paint(ribbon([r0, [r0[0] - hh * .22, r0[1] + L * .3], [r0[0] - hh * .18 + Math.sin(sway) * L * .6, r0[1] + L * .75], [r0[0] - hh * .05 + Math.sin(sway) * L, r0[1] + L]], hh * .28, hh * .06), { wash: col, ink: PAL.ink, sw: sw * .8 });
    else for (const sg of [-1, 1]) paint(ellPts(sg * hw * .5, -hh * .25, hw * .1, hh * .12, 10), { wash: col, ink: PAL.ink, sw: sw * .6 });
  } else if (st === 'bun') paint(ellPts(side ? -hh * .3 : view === 'q' ? -hw * .12 : 0, -hh * .58, hh * .2, hh * .18, 16), { wash: D.hairC, ink: PAL.ink, sw: sw * .8 });
  else if (st === 'curly' && view !== 'front') paint(ellPts(bx - hw * .05, hh * .02, hw * .6, hh * .5, 18), { wash: col, ink: PAL.ink, sw: sw * .8 });
}

// ---------- hands ----------
// A hand at its wrist (x, y), palm about s long, fingers along rot; o.shape: open, relaxed, point, fist, thumb, grip,
// flat, cup, peace. Far away it's a mitten; o.shapeLang ('square', 'tri') makes the fingers blockier or pointier.
const HAND_SHAPES = {
  open: { curl: [0, 0, 0, 0, 0], spread: 1 }, relaxed: { curl: [.25, .3, .35, .45, .25], spread: .35 }, point: { curl: [0, 1, 1, 1, .75], spread: .2 },
  fist: { curl: [1, 1, 1, 1, .85], spread: .1 }, thumb: { curl: [1, 1, 1, 1, 0], spread: .1, thumbUp: true }, grip: { curl: [.8, .82, .84, .86, .6], spread: .15 },
  peace: { curl: [0, 0, 1, 1, .8], spread: .7 }, flat: { edge: true, curl: 0 }, cup: { edge: true, curl: .75 },
};
function drawHand(x, y, s, o = {}) {
  const key = o.boilKey || 'hand', H = HAND_SHAPES[o.shape] || HAND_SHAPES.relaxed, col = o.col || '#EDC3A0', dk = mixCol(col, '#7A3A35', .2), sw = o.sw ?? clamp(s / 40, .3, 1.4);
  const lang = o.shapeLang || 'round', tipK = lang === 'tri' ? .7 : lang === 'square' ? 1.05 : .92;
  boilSeed(key);
  push(); translate(x, y); rotate(o.rot || 0); if (o.flip) scale(1, -1);
  if (o.lod === 0) { paint(ellPts(s * .45, 0, s * .5, s * .38, 12), { wash: col, ink: PAL.ink, sw }); pop(); return; }
  const finger = (P, w0, w1, c) => paint(limbPts(P, w0, w1 * tipK), { wash: c, ink: PAL.ink, sw: sw * .85 });
  const fpath = (bx, by, a, l, b) => { const P = [[bx, by]]; let px = bx, py = by, ang = a; for (let i = 0; i < 3; i++) { px += Math.cos(ang) * l / 3; py += Math.sin(ang) * l / 3; P.push([px, py]); ang += b; } return P; };
  if (H.edge) {   // seen edge-on: a flat blade, or cupped
    const c = H.curl, b = c * .85, P = [[0, 0], [.5 * s, -.02 * s], [.95 * s, 0]];
    let px = .95 * s, py = 0, ang = b * .3;
    for (let i = 0; i < 3; i++) { px += Math.cos(ang) * .3 * s; py += Math.sin(ang) * .3 * s; P.push([px, py]); ang += b; }
    finger(P, .62 * s, .3 * s, col);
    finger(fpath(.22 * s, .1 * s, .22 + c * .6, .55 * s, .1 + c * .3), .28 * s, .22 * s, mixCol(col, dk, .12));
  } else {
    const C = H.curl, sp = H.spread, base = [[.92, -.33, .88, .26], [.97, -.11, .98, .27], [.95, .11, .92, .26], [.88, .32, .72, .22]];
    base.forEach(([bx, by, l, w], i) => {
      const a = (i - 1.5) * .16 * sp, c = C[i], L = l * s * (1 - .62 * c);
      finger(fpath(bx * s - .15 * s, by * s, a, L + .15 * s, c * .25), w * s * (lang === 'square' ? 1.12 : 1), w * s * (.92 + .15 * c), i === 3 ? mixCol(col, dk, .1) : col);
    });
    paint([[0, -.33 * s], [.5 * s, -.45 * s], [.95 * s, -.44 * s], [1.02 * s, 0], [.95 * s, .43 * s], [.5 * s, .45 * s], [0, .33 * s]], { wash: col, ink: PAL.ink, sw, curv: lang === 'square' ? .25 : .55 });
    if (o.lod === 2) inkLine([[.35 * s, -.05 * s], [.62 * s, .1 * s]], sw * .45, dk, 'inkfine', .5);   // a crease in the palm
    const tc = C[4], ta = H.thumbUp ? -1.57 : lerp(-.95, -.2, tc), tl = H.thumbUp ? .8 * s : .72 * s * (1 - .4 * tc);
    finger(fpath(.3 * s, -.34 * s, ta, tl, H.thumbUp ? 0 : tc * .3), .3 * s, .26 * s, col);
  }
  pop();
}

// ---------- emotions ----------
// Every person starts with these; a design adds its own or replaces them (emotions: { … }). Each idles on the beat.
const _beatOf = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { s1, ab: Math.abs(s1), hit: pulse(t) }; };
const PERSON_EMOTIONS = {
  neutral: { eyes: 'open', mouth: 'flat', take: .3, body: t => { const b = _beatOf(t); return { dy: -.05 * b.ab, aL: -1.25 + .04 * b.s1, aR: -1.25 - .04 * b.s1, hipTilt: .06 }; } },
  happy: { eyes: 'open', brows: 'up', mouth: 'smile', take: .5, body: t => { const b = _beatOf(t); return { dy: -.25 * b.ab, sq: .05 * b.hit, aL: -.85 + .15 * b.s1, aR: -.85 - .15 * b.s1, eL: .35, eR: .35, hL: 'open', hR: 'open', arc: .12, headTilt: .06 * b.s1 }; } },
  laugh: { eyes: 'happy', brows: 'up', mouth: 'laugh', take: .7, body: t => { const s2 = Math.abs(Math.sin(bpOf(t) * TAU)); return { dy: -.15 * s2, sq: .04 * s2, arc: .25, headTilt: -.14, aL: -1.0, aR: -.5, eR: 1.7, hR: 'fist', hL: 'open' }; } },
  excited: { eyes: 'wide', brows: 'up', mouth: 'grin', emote: 'spark', take: 1, body: t => { const b = _beatOf(t); return { dy: -.6 * b.ab, sq: .1 * b.hit, aL: .9 + .2 * b.s1, aR: .9 - .2 * b.s1, eL: .4, eR: .4, hL: 'fist', hR: 'fist', crouch: .15 * b.hit }; } },
  sad: { eyes: 'sad', brows: 'sad', mouth: 'frown', take: .4, body: t => ({ arc: -.28, headTilt: .2, lean: .05, aL: -1.4, aR: -1.4, eL: .1, eR: .1, sq: .03 + .01 * Math.sin(t * 1.1) }) },
  cry: { eyes: 'tight', brows: 'sad', mouth: 'wobble', tear: 1, take: .6, body: t => ({ arc: -.3, headTilt: .14, aL: -.8, aR: -.8, eL: 2.15, eR: 2.15, hL: 'fist', hR: 'fist', dx: .02 * Math.sin(t * TAU * 7), sq: .04 }) },
  angry: { eyes: 'angry', brows: 'angry', mouth: 'grit', emote: 'anger', take: .8, body: t => { const b = _beatOf(t); return { lean: .12, aL: -1.05, aR: -1.05, eL: .45, eR: .45, hL: 'fist', hR: 'fist', sq: .05 * b.hit, crouch: .1 }; } },
  surprised: { eyes: 'wide', brows: 'up', mouth: 'O', emote: '!', fade: true, take: 1.3, body: t => ({ sq: -.08, arc: .15, aL: .4, aR: .4, eL: .5, eR: .5, hL: 'open', hR: 'open', lean: -.08 }) },
  scared: { eyes: 'wide', brows: 'worried', mouth: 'wobble', emote: 'sweat', take: .8, body: t => ({ crouch: .35, lean: -.06, arc: -.15, aL: -.5, aR: -.5, eL: 1.75, eR: 1.75, hL: 'fist', hR: 'fist', dx: .02 * Math.sin(t * TAU * 9) }) },
  shy: { eyes: 'half', brows: 'worried', mouth: 'smile', blush: 1, take: .4, body: t => ({ headTilt: .18, lookX: -.6, lookY: .4, aL: -1.1, aR: -1.1, eL: 1.15, eR: 1.15, hipTilt: .14, lR: .15, kR: .4 }) },
  determined: { eyes: 'angry', brows: 'angry', mouth: 'pressed', take: .7, body: t => { const b = _beatOf(t); return { aR: -.35, eR: 2.25, hR: 'fist', hL: 'fist', lean: .06, sq: .04 * b.hit, dy: -.05 * b.ab }; } },
  thinking: { eyes: 'half', brows: 'raised', mouth: 'flat', lookX: .5, lookY: -.6, emote: 'dots', take: .4, body: t => ({ aR: -.7, eR: 2.55, hR: 'point', aL: -1.0, eL: 1.3, headTilt: -.1, hipTilt: -.12 }) },
  sleepy: { eyes: 'sleepy', brows: 'flat', mouth: 'o', emote: 'zzz', take: .2, body: t => ({ headTilt: .25 + .05 * Math.sin(t * 1.2), arc: -.2, aL: -1.4, aR: -1.4, sq: .04 }) },
  love: { eyes: 'heart', brows: 'up', mouth: 'smile', blush: 1, emote: 'hearts', take: .6, body: t => { const b = _beatOf(t); return { aL: -.75, aR: -.75, eL: 1.65, eR: 1.65, hL: 'cup', hR: 'cup', dy: -.2 * b.ab, headTilt: .12 * b.s1 }; } },
  smug: { eyes: 'half', brows: 'raised', mouth: 'smirk', take: .5, body: t => ({ cross: 1, headTilt: -.12, arc: .12, hipTilt: .12 }) },
  confused: { eyes: 'open', brows: 'worried', mouth: 'wobble', emote: '?', take: .6, body: t => ({ headTilt: -.2, aR: .25, eR: 2.45, hR: 'relaxed', lookX: .4 }) },
};

// ---------- the Character ----------
function person(design) {
  const D = _personDesign(design);
  const ch = character({
    name: D.name, size: [Math.max(D.sh * 1.5, D.hw * 1.2), D.Ht], views: BODY_VIEWS, emotions: { ...PERSON_EMOTIONS, ...(design.emotions || {}) },
    rest: { dy: 0, sq: 0, aL: -1.25, aR: -1.25, eL: .15, eR: .15, lL: 0, lR: 0, kL: 0, kR: 0, lean: 0, arc: 0, hipTilt: 0, headTilt: 0, crouch: 0, sit: 0, hug: 0, cross: 0 },
    fades: ['blush', 'tear'],
    draw: (x, y, u, o) => _drawPerson(D, x, y, u, o),
    emoteAt: (x, y, u, o, top) => top ? [x, y + (o.dy || 0) * u - (D.Ht + 1.6) * u * (1 - (o.sq || 0))] : [x + (o.flip ? -1 : 1) * (D.hw * .9 + .6) * u, y + (o.dy || 0) * u - (D.Ht - D.hh * .4) * u],
  });
  ch.design = D;
  LOOPS[D.name + '-check'] = checkSheet(ch);
  LOOPS[D.name + '-check'].len = 4;
  return ch;
}

// ---------- design options ----------
// personOptions('mei', [designA, designB, designC]): a sheet that puts two or three designs for one Lead side by side
// before any is built in full: each one's silhouette in three views, then in colour, happy and determined. Render it
// with --loop=mei-options and let the person choose (GUIDE.md step 3).
function personOptions(name, designs) {
  const chs = designs.map((d, i) => person({ ...d, name: `${name}-${'ABC'[i]}` }));
  LOOPS[name + '-options'] = t => {
    const n = chs.length, cw = W / n, gy1 = H * .42, gy2 = H * .9;
    chs.forEach((ch, i) => {
      const x0 = cw * i, u = Math.min(cw * .22 / ch.spec.size[0], H * .3 / ch.spec.size[1]);
      silhouette(PAL.ink, () => ['front', 'q', 'side'].forEach((v, j) => ch(x0 + cw * (.2 + j * .3), gy1, u * .9, { ...ch.feel('neutral', t), view: v, emote: null, boilKey: `o${i}s${j}` })));
      ch(x0 + cw * .3, gy2, u * 1.1, { ...ch.feel('happy', t), view: 'q', boilKey: `o${i}a` });
      ch(x0 + cw * .72, gy2, u * 1.1, { ...ch.feel('determined', t), view: 'front', flip: true, boilKey: `o${i}b` });
      letter('ABC'[i], x0 + 40, 50, 44, PAL.ink, { ink: false, alpha: .8 });
    });
  };
  LOOPS[name + '-options'].len = 4;
  return chs;
}
