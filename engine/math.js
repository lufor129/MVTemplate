// math.js: numbers, easing, keyframes and colour mixing. Everything is a pure function: frames render in parallel and
// out of order, so nothing here may keep state between calls.
const TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, x) => a + (b - a) * x;
const seg = (t, a, b) => clamp((t - a) / (b - a));                 // 0..1 progress of t through [a, b]
const frac = x => x - Math.floor(x);
const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * TAU);
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- easing ----------
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeIn = x => Math.pow(clamp(x), 3);
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const backOut = x => { x = clamp(x); const s = 1.9; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const elasticOut = x => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (TAU / 3)) + 1; };

// keyframes: kf(t, [[t0, v0], [t1, v1], ...], easeFn). Values may be numbers or arrays of numbers.
function kf(t, keys, e = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i], k = e((t - a) / (b - a));
      return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
}

// hex colour mix
function mixCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = i => Math.round(lerp((pa >> i) & 255, (pb >> i) & 255, clamp(k)));
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}

// hex colour ⇄ [hue, saturation, lightness], each 0..1. Style Profiles tone every colour through these (their tone()).
function hexHsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslHex(h, s, l) {
  s = clamp(s); l = clamp(l);
  const a = s * Math.min(l, 1 - l), f = k => { const m = (k + h * 12) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(m - 3, 9 - m, 1)))); };
  return '#' + ((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4)).toString(16).slice(1);
}

// ---------- motion principles ----------
// Damped spring kicked at t0: 0 before, then a wobble that dies away. Use it for secondary motion and settles: a body
// after landing, a hat that jiggles, a stack that sways, a tail that drags. k = damping, w = wobble speed (rad/s).
const spring = (t, t0, k = 6, w = 18) => t < t0 ? 0 : Math.exp(-k * (t - t0)) * Math.sin(w * (t - t0));
const ring = (t, evs, k = 6, w = 18) => evs.reduce((s, e) => s + spring(t, e, k, w), 0);    // one kick per event time
// Hold each drawing for two frames (12 drawings a second), like hand-drawn animation "on twos". Wrap a shot's t in it.
const onTwos = t => Math.floor(t * 12 + 1e-6) / 12;
// Point on a thrown or jumping arc from p0 to p1, peaking h px above the straight line; k = 0..1 along the flight.
const arcPt = (p0, p1, h, k) => [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k) - h * 4 * k * (1 - k)];
// small deterministic camera shake, changes at 24 fps
const shakeXY = (t, amt) => { const f = Math.floor(t * 24); return [(hash(f * 1.7) - .5) * 2 * amt, (hash(f * 2.3 + 9) - .5) * 2 * amt]; };
