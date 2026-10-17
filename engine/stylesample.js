// stylesample.js: LOOPS['style-sample'], four seconds that show a Style Profile off for the Style Sample Gate (GUIDE.md
// step 0): a sky, hills with shading, a hatched rock, a sun with its light, a Character acting a change and jumping, an
// emote, a Sound Word, a brush wipe across a Seam, and the karaoke band. It only calls the Style Profile's API, so it
// works for every profile. The Character is Clawd when the MV lists it in mv.json "characters", else a painted blob.
//   node engine/render.mjs --loop=style-sample --sheet=0.5,1.5,2.5,3.2 --cols=2 --w=1600 --out=out/check/style_sample.jpg
LOOPS['style-sample'] = t => {
  const gy = H * .74, cx = W * .4;
  boilSeed('sample sky'); paint(rectPts(-40, -40, W + 80, gy + 60), { wash: PAL.sky, ink: null });
  paint(ellPts(W * .3, H * .3, W * .5, H * .12, 24), { fill: PAL.cream, fillOp: 90, bleed: .3, ink: null });
  glow(W * .8, H * .2, 260, '#FFD27A', 1);
  boilSeed('sample sun'); paint(ellPts(W * .8, H * .2, 64, 64, 28), { wash: PAL.ochre, fill: PAL.cream, fillOp: 90, ink: PAL.ink, sw: 1.2 });
  boilSeed('sample far hill');
  paint([[-40, gy], [W * .1, H * .5], [W * .32, H * .42], [W * .55, H * .55], [W * .78, H * .46], [W + 40, H * .56], [W + 40, gy]], { wash: mixCol(PAL.sap, PAL.sky, .45), ink: PAL.ink, sw: .8, curv: .6 });
  boilSeed('sample near hill');
  paint([[-40, gy + 10], [W * .05, H * .62], [W * .3, H * .58], [W * .6, H * .66], [W * .9, H * .6], [W + 40, H * .64], [W + 40, gy + 10]], { wash: PAL.sap, fill: mixCol(PAL.sap, PAL.ink, .35), fillOp: 120, ink: PAL.ink, sw: 1, curv: .6 });
  boilSeed('sample ground'); paint(rectPts(-40, gy, W + 80, H - gy + 40), { wash: mixCol(PAL.sap, PAL.paper, .35), ink: null });
  inkLine([[-20, gy + 2], [W / 2, gy], [W + 20, gy + 3]], 1, PAL.ink, 'ink', .5);
  boilSeed('sample rock');
  paint([[W * .66, gy + 4], [W * .68, gy - 70], [W * .74, gy - 104], [W * .8, gy - 76], [W * .83, gy + 4]], { wash: PAL.violet, hatch: { d: 14, a: .7, b: 'HB', c: PAL.ink, w: .8 }, ink: PAL.ink, sw: 1, curv: .3 });
  const j = jump(t, 1.4, 2.1, 4);
  if (typeof clawd === 'function') {
    const e = clawd.emotions(t, [[0, 'neutral'], [1.1, 'surprised'], [1.9, 'happy']]);
    clawd(cx, gy, 24, { ...e, dy: (e.dy || 0) + j.dy, sq: (e.sq || 0) + j.sq, aL: t > 1.9 ? 1 : e.aL, aR: t > 1.9 ? 1 : e.aR, boilKey: 'sample lead' });
  } else {
    boilSeed('sample blob'); const by = gy + j.dy * 24, s = 1 - j.sq * .5;
    paint(ellPts(cx, by - 90 * s, 110 / s, 90 * s, 30), { wash: PAL.clay, fill: PAL.clayDk, fillOp: 80, ink: PAL.ink, sw: 1.4 });
    for (const d of [-1, 1]) paint(ellPts(cx + d * 36, by - 110 * s, 9, 16, 12), { wash: PAL.ink, ink: null });
  }
  emote('!', cx + 150, gy - 230 + j.dy * 24, 22, seg(t, 1.1, 1.3), t - 1.1);
  sfx('POP!', W * .6, H * .36, 130, PAL.rose, t - 1.4);
  flushLetters();
  const kt = KARAOKE_SUB ? 'Paint me a little song' : 'Paint me a little song 小小的歌';
  KARAOKE = { text: kt, sub: KARAOKE_SUB ? '為我畫一首小小的歌' : undefined, a: 0, b: 4, grow: easeOut(seg(t, 0, .2)), sung: kt.length * seg(t, .3, 3.5), top: KARAOKE_TOP };
  STYLE.karaoke.band(KARAOKE);
  if (t > 2.4) brushWipe((t - 2.4) / 1.4, [PAL.indigo, PAL.rose]);   // fully covered at 3.1, gone by 3.8
};
LOOPS['style-sample'].len = 4;
