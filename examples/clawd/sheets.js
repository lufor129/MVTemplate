// sheets.js: Clawd's extra reference loop, beyond the Model Sheet every Character gets (?loop=clawd-sheet): the
// parts only Clawd has. Scrub it at studio.html?loop=clawd-parts, or render it:
//   node engine/render.mjs --loop=clawd-parts --sheet=1 --cols=1 --w=1920 --out=examples/clawd/docs/parts.jpg
(() => {
  const label = (txt, x, y, size = 20) => letter(txt, x, y, size, PAL.ink, { ink: false, alpha: .8 });
  const floor = y => inkLine([[40, y + 6], [W / 2, y + 4], [W - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
  LOOPS['clawd-parts'] = t => {
    // row 1: motion that needs Clawd's own fields
    const y1 = 400, u1 = 15, row = [
      ['walk (side)', x => clawd(x, y1, u1, { ...clawd.dance('walk', t), view: 'side' })],
      ['smear', x => clawd(x, y1, u1, { ...clawd.feel('excited', t), view: 'side', smear: .8, smearDir: 1, dx: Math.sin(t * TAU / 2) * .3 })],
      ['take', x => clawd(x, y1, u1, { ...clawd.feel('surprised', t), ...take(t % 2, .5, 1.2), emoteAge: (t % 2) - .5, emoteK: seg(t % 2, .5, .7) })],
      ['lid', x => clawd(x, y1, u1, { ...clawd.feel('laugh', t), mouth: null, lid: .35 + .3 * Math.abs(Math.sin(t * TAU * 1.5)) })],
      ['held prop', x => clawd(x, y1, u1, { ...clawd.feel('proud', t), aR: 1.2, armR: (u, sw) => paint(starPts(u * .8, 0, u * 1.4, .5, 5), { wash: '#FFE27A', sw }) })],
      ['dance: spin', x => clawd.dancer(x, y1, u1, 'spin', t, { eyes: 'happy', mouth: 'grin' })],
    ];
    row.forEach(([name, f], i) => { const x = 180 + i * 312; f(x); label(name, x, y1 + 38); });
    floor(y1);
    // row 2: hats and face pieces
    const hats = ['party', 'hard', 'crown', 'halo', 'wizard', 'top', 'fedora', 'band', 'beanie', 'bow', 'flower', 'headphones', 'cat', 'masq', 'bowtie'];
    hats.forEach((h, i) => { const x = 82 + i * 125.5; clawd(x, 860, 8, { ...clawd.feel('neutral', t, { seed: i }), hat: h }); label(h, x, 890, 17); });
    floor(860);
  };
  LOOPS['clawd-parts'].len = 4;
})();
