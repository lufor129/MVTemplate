// acting.js: the Character Contract, and the Acting Tools that drive any Character drawn to it.
//
// Characters are designed per MV. character(spec) takes a design and returns a Character the Acting Tools can drive:
//   name       e.g. 'clawd'; also names its Model Sheet loop (studio.html?loop=clawd-sheet)
//   size       [w, h]: its width and height in units of u (Clawd is [10, 8])
//   views      its drawn key views from the front round to the back, all facing screen-right, e.g.
//              ['front', 'q', 'side', 'qback', 'back']. Turns step through them, mirrored (flip) for the other side.
//   emotions   { name: { take, fade, body(t), ...face fields } }. Must include 'neutral'. take = how big the reaction
//              is on switching INTO it; fade = its emote is a one-off that fades; body(t) = its idle motion as pose
//              fields, locked to the beat (pulse(), bpOf()); the other fields (eyes, mouth, emote…) are its face,
//              whatever draw() reads; a Character without a face leaves them out and acts with body and colour.
//   rest       { field: value }: pose fields that settle with overshoot when the emotion changes (dy, sq, arms…)
//   fades      [field, ...]: 0..1 appearance fields that cross-fade smoothly when the emotion changes (blush…)
//   mix(prev, cur, k)        optional: any other fields to blend across a change (colours); returns them
//   draw(x, y, u, pose)      paints one frame of it: (x, y) is the ground point under it, u its size unit
//   emoteAt(x, y, u, pose, top) optional: where a popped emote sits; top = it's one that goes over the head
//
// Pose fields every Character should take (a Character ignores what doesn't apply to it):
//   dx, dy (in u; −dy = up), sq (squash; negative stretches), rot, flip, view, smear 0..1 + smearDir ±1 (0 = both),
//   walk (leg phase), aL / aR (limb raise: 0 = out, + up, − down), lookX / lookY (−1..1), squint 0..1,
//   emote + emoteK (0..1 pop) + emoteAge, boilKey (a stable boil id if characters come and go mid-shot)
//
// The Character is a function, ch(x, y, u, pose), with the Acting Tools on it:
//   ch.feel(name, t, over)       one emotion, alive at t: face and body together
//   ch.emotions(t, keys, o)      acted changes: keys = [[t0, 'sleepy'], [t1, 'surprised', { lookX: .8 }], ...]
//   ch.turn(t, t0, t1, a0, a1)   a drawn turn from heading a0 to a1 (in turns: 0 front, .25 right, .5 back, −.25 left)
//   ch.spin(a)                   the key view (and flip) for heading a
//   ch.stroll(t, t0, t1, x0, x1, u)   an eased walk from x0 to x1
//   ch.dance(style, t, seed)     beat-locked dance offsets (see move())
// Poses compose by spreading; later spreads win, and fields both set (dy, sq) should be added:
//   clawd(x, y, 24, { ...clawd.feel('happy', t), ...clawd.turn(t, 1, 1.2, 0, .25), hat: 'party' })

function character(spec) {
  const ch = (x, y, u, o = {}) => {
    const id = o.boilKey ?? `${spec.name} ${++CHAR_N}`;
    spec.draw(x, y, u, { ...o, boilKey: id });
    boilSeed(`${id} emote`);
    if (o.emote) {
      const top = EMOTE_TOP.includes(o.emote);
      const [ex, ey] = spec.emoteAt ? spec.emoteAt(x, y, u, o, top) : _emoteAt(spec, x, y, u, o, top);
      emote(o.emote, ex, ey, u * .9, o.emoteK ?? 1, o.emoteAge ?? T);
    }
    boilSeed(`${id} after`);   // so whatever is drawn next doesn't depend on this pose
  };
  ch.spec = spec;
  ch.spin = a => spinView(spec.views, a);
  ch.turn = (t, t0, t1, a0, a1) => turn(spec.views, t, t0, t1, a0, a1);
  ch.feel = (name, t, over) => feel(spec, name, t, over);
  ch.emotions = (t, keys, o) => emotions(spec, t, keys, o);
  ch.stroll = (t, t0, t1, x0, x1, u) => { const s = stroll(t, t0, t1, x0, x1, u); return { ...s, view: s.moving ? spec.views[Math.min(1, spec.views.length - 1)] : spec.views[0] }; };
  ch.dance = (style, t, seed = 0) => move(style, t, seed, ch.spin);
  ch.dancer = (x, y, u, style, t, extra = {}) => ch(x, y, u, { ...ch.dance(style, t, extra.seed || 0), ...extra });
  LOOPS[spec.name + '-sheet'] = modelSheet(ch);
  LOOPS[spec.name + '-sheet'].len = 4;
  return ch;
}
function _emoteAt(spec, x, y, u, o, top) {
  const [w, h] = spec.size, dir = o.flip ? -1 : 1, dy = (o.dy || 0) * u, sq = o.sq || 0;
  return top ? [x, y + dy - (h + 2.4) * u * (1 - sq)] : [x + dir * (w / 2 + .4) * u, y + dy - (h + .6) * u * (1 - sq)];
}

// ---------- turns ----------
// Turns are drawn KEY VIEWS, like a cartoon model sheet, never a rotated 3D box. The views run front → back facing
// right; the way back round to the front reuses them mirrored. Snaps to the nearest step, one drawing per step.
function spinView(views, a) {
  const n = views.length; if (n < 2) return { view: views[0], flip: false };
  const K = 2 * (n - 1), i = ((Math.round(a * K) % K) + K) % K;
  return i < n ? { view: views[i], flip: false } : { view: views[K - i], flip: true };
}
// A turn from heading a0 to a1 (in turns) between t0 and t1. It steps through the key views and smears the
// in-between drawings.
function turn(views, t, t0, t1, a0, a1) {
  const k = ease(seg(t, t0, t1)), v = spinView(views, lerp(a0, a1, k));
  return { ...v, smear: t > t0 && t < t1 ? .55 * Math.sin(k * Math.PI) : 0, smearDir: 0 };
}

// ---------- emotions ----------
function feel(spec, name, t, over = {}) {
  const E = spec.emotions[name] || spec.emotions.neutral, face = {};
  for (const f of spec.fades || []) face[f] = 0;
  for (const k in E) if (!['take', 'fade', 'body'].includes(k)) face[k] = E[k];
  return { ...face, ...(E.body ? E.body(t) : {}), ...over };
}
// An emotion timeline with ACTED changes. Around each change the eyes squeeze shut and the body squashes just before
// (anticipation), and the face swaps under the squint. Then a take fires (a squash-stretch the size of the new
// emotion's `take`), the body settles into its new motion with overshoot, appearance cross-fades, and the new emote
// pops in. o.take scales every take.
function emotions(spec, t, keys, o = {}) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const [tc, name, over] = keys[i], age = t - tc, cur = feel(spec, name, t, over);
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, tkS = o.take ?? 1;
  const E = spec.emotions[name] || spec.emotions.neutral;
  let squint = cur.squint || 0;
  if (tn - t < .1) squint = Math.max(squint, 1 - (tn - t) / .1);
  if (i > 0 && age < .14) squint = Math.max(squint, 1 - age / .14);
  const prev = i > 0 ? feel(spec, keys[i - 1][1], t, keys[i - 1][2]) : null;
  if (prev && age < .5) {
    const base = { lookX: 0, lookY: 0, dx: 0, rot: 0, ...(spec.rest || {}) };
    const k = backOut(seg(age, 0, .4)), kc = ease(seg(age, 0, .3));
    for (const f in base) cur[f] = lerp(prev[f] ?? base[f], cur[f] ?? base[f], k);
    for (const f of spec.fades || []) cur[f] = lerp(prev[f] || 0, cur[f] || 0, kc);
    if (spec.mix) Object.assign(cur, spec.mix(prev, cur, kc));
  }
  // takes: the one this key fires, plus the anticipation squash of the next one
  const t1 = prev ? take(t, tc, (E.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  const En = i + 1 < keys.length ? spec.emotions[keys[i + 1][1]] || spec.emotions.neutral : null, t2 = En ? take(t, tn, (En.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  cur.sq = (cur.sq || 0) + t1.sq + t2.sq; cur.dy = (cur.dy || 0) + t1.dy + t2.dy;
  cur.squint = squint;
  // the emote pops in after the swap (it carries on if the emote didn't change); one-off emotes fade out
  const same = prev && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : seg(age, .06, .32) * (E.fade && !(over && over.emote) ? 1 - seg(age, 1.4, 1.8) : 1);
  cur.emoteAge = age;
  return cur;
}

// ---------- acting moves (pure functions of t; spread the result into a pose) ----------
// A hop that takes off at t0 and lands at t1, h body units high: crouch (anticipation), stretch on takeoff,
// round at the top, squash on landing and spring back. Returns { dy, sq }.
function jump(t, t0, t1, h = 3) {
  if (t < t0 - .12) return { dy: 0, sq: 0 };
  if (t < t0) return { dy: 0, sq: .18 * ease(seg(t, t0 - .12, t0)) };
  if (t < t1) { const k = (t - t0) / (t1 - t0); return { dy: -h * 4 * k * (1 - k), sq: -.16 * Math.abs(1 - 2 * k) }; }
  const a = t - t1; return { dy: 0, sq: .22 * Math.exp(-8 * a) * Math.cos(20 * a) };
}
// A surprise "take" peaking at t0: a quick squash, then a big stretch up that springs back. amt scales it.
function take(t, t0, amt = 1) {
  if (t < t0 - .1) return { sq: 0, dy: 0 };
  if (t < t0) return { sq: .12 * amt * ease(seg(t, t0 - .1, t0)), dy: 0 };
  const a = t - t0; return { sq: -.26 * amt * Math.exp(-6 * a) * Math.cos(16 * a), dy: -1.2 * amt * Math.exp(-7 * a) * Math.max(0, Math.cos(9 * a)) };
}
// Walk from x0 to x1 (px) between t0 and t1, for a character of unit u: eases in and out, faces the way it's going.
// Returns { x, walk, flip, dy, moving }; ch.stroll() adds the view.
function stroll(t, t0, t1, x0, x1, u) {
  const x = lerp(x0, x1, ease(seg(t, t0, t1))), d = Math.abs(x - x0) / (4 * u), moving = t > t0 && t < t1;
  return { x, walk: d, flip: x1 < x0, dy: moving ? -Math.abs(Math.sin(d * Math.PI)) * .5 : 0, moving };
}

// ---------- dances ----------
// Beat-locked dances: bounce, hop, roof (arms up), sway, spin (a drawn spin through the key views, once a bar), wave,
// walk, run, idle, stomp, shimmy, mix (changes every two bars). Returns pose offsets. Give each dancer in a crowd its
// own seed, and offset them, so they don't move in unison.
function move(style, t, seed = 0, spin = a => ({})) {
  const bp = bpOf(t), bi = Math.floor(bp), bf = bp - bi, hit = Math.max(0, 1 - bf * 3.5), s1 = Math.sin(bp * Math.PI), ab = Math.abs(s1);
  const o = { dy: 0, sq: 0, aL: .2, aR: .2, rot: 0, walk: null, dx: 0 };
  if (style === 'mix') style = ['bounce', 'roof', 'sway', 'spin', 'hop', 'wave'][(Math.floor(bp / 8) + seed) % 6];
  switch (style) {
    case 'bounce': o.dy = -ab * 1.6; o.sq = hit * .12; o.aL = .4 + s1; o.aR = .4 - s1; break;
    case 'hop': o.dy = -ab * 4; o.sq = hit * .18; o.aL = o.aR = .3 + ab * 1.1; break;
    case 'roof': o.dy = -ab * 1.2; o.sq = hit * .1; o.aL = o.aR = 1.25 + .3 * Math.sin(bp * TAU); break;
    case 'sway': o.dx = s1 * 3; o.rot = s1 * .12; o.aL = .5 + .6 * s1; o.aR = .5 - .6 * s1; o.sq = hit * .08; break;
    case 'spin': {
      const ph = (((bi % 4) + 4) % 4 === 3) ? bf : 0;
      Object.assign(o, spin(ph)); o.smear = ph > .1 && ph < .9 ? .5 : 0; o.smearDir = 0;
      o.dy = -Math.sin(ph * Math.PI) * 3 - ab; o.aL = o.aR = .6 + ph; o.sq = hit * .1; break;
    }
    case 'wave': o.dy = -ab; o.aL = 1.1 + .5 * Math.sin(bp * TAU * 2); o.aR = -.2; o.sq = hit * .08; break;
    case 'walk': o.walk = bp / 2; o.dy = -ab * .6; o.aL = .3 * s1; o.aR = -o.aL; break;
    case 'run': o.walk = bp * 1.5; o.dy = -Math.abs(Math.sin(bp * TAU)); o.aL = .8 * Math.sin(bp * TAU * 1.5); o.aR = -o.aL; o.rot = -.08; break;
    case 'idle': o.dy = -ab * .5; o.sq = hit * .05; break;
    case 'stomp': o.dy = -Math.max(0, Math.sin(bp * TAU)) * 1.4; o.sq = hit * .2; o.rot = (bi % 2 ? 1 : -1) * .06 * hit; o.aL = o.aR = -.3 + hit * .9; break;
    case 'shimmy': o.dx = Math.sin(bp * TAU * 2) * .6; o.rot = Math.sin(bp * TAU * 2) * .05; o.aL = .9 + .4 * Math.sin(bp * TAU * 2); o.aR = .9 - .4 * Math.sin(bp * TAU * 2); o.dy = -ab * .5; break;
  }
  return o;
}

// ---------- the Model Sheet ----------
// Every Character gets one, for the Model Sheet Gate: its key views, a turn, a jump, a run of acted emotion changes,
// and every emotion alive. Labels are fine here: it's reference, not part of the MV.
function modelSheet(ch) {
  return t => {
    const S = ch.spec, [sw, sh] = S.size, names = Object.keys(S.emotions), label = (s, x, y, z = 20) => letter(s, x, y, z, PAL.ink, { ink: false, alpha: .8 });
    const floor = (y, x0 = 0, x1 = W) => inkLine([[x0 + 40, y + 6], [W / 2, y + 4], [x1 - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
    // row 1: key views, then a turn, a jump and acted changes
    const n1 = S.views.length + 3, cw1 = W / n1, u1 = Math.min(cw1 * .62 / sw, H * .22 / sh), y1 = H * .33;
    S.views.forEach((v, i) => { const x = cw1 * (i + .5); boilSeed('sheet v' + i); ch(x, y1, u1, { ...ch.feel('neutral', t, { seed: i }), view: v, boilKey: 'v' + i }); label(v, x, y1 + 30); });
    const extras = [
      ['turn', x => ch(x, y1, u1, { ...ch.feel('happy', t), ...ch.turn(t % 2, .4, .65, 0, .5), boilKey: 'turn' })],
      ['jump', x => ch(x, y1, u1, { ...ch.feel('happy', t), ...jump(t % 1.5, .35, .95, 3), boilKey: 'jump' })],
      ['emotions()', x => ch(x, y1, u1, { ...ch.emotions(t, [[0, 'neutral'], [1, names[1] || 'neutral'], [2.5, names[names.length - 1]]]), boilKey: 'acted' })],
    ];
    extras.forEach(([name, f], i) => { const x = cw1 * (S.views.length + i + .5); f(x); label(name, x, y1 + 30); });
    floor(y1);
    // the rest: every emotion, alive
    const cols = Math.min(8, names.length), rows = Math.ceil(names.length / cols), cw = W / cols, top = H * .42, ch2 = (H - top) / rows;
    const u = Math.min(cw * .5 / sw, ch2 * .55 / sh);
    names.forEach((name, i) => {
      const cx = cw * (i % cols) + cw / 2, gy = top + ch2 * Math.floor(i / cols) + ch2 - 40;
      ch(cx, gy, u, { ...ch.feel(name, t, { seed: i }), boilKey: 'e' + i });
      label(name, cx, gy + 24, 18);
    });
    for (let r = 0; r < rows; r++) floor(top + ch2 * r + ch2 - 40);
  };
}
