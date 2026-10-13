// timeline.js: Chapters, their Shots, and what is drawn at time t.
//
// Each chapter file calls chapter(name, start, end, shots), where shots = [[t0, fn], ...] in time order, and the
// shot list covers [start, end). A shot fn is called as fn(t, lt, dur): t = song time, lt = time since the shot
// started, dur = the shot's length. It paints the WHOLE frame, background included, and must be a pure function of t:
// frames render in parallel and out of order, so nothing may carry over from one frame to the next.
//
// Every Seam (shot to shot, chapter to chapter, the very start and end) is the shots' own job: nothing is added
// between them automatically. A Chapter's edges must fall on Section edges (song.json); a mismatch is reported in the
// console, which render.mjs prints.
const CH = [];
function chapter(name, start, end, shots) {
  if (!shots.length || Math.abs(shots[0][0] - start) > 1e-6) console.error(`chapter ${name}: its first shot must start at ${start}`);
  for (const [t, label] of [[start, 'start'], [end, 'end']])
    if (!SECTIONS.some(s => Math.abs(s.start - t) < .05 || Math.abs(s.end - t) < .05)) console.error(`chapter ${name}: its ${label} (${t}) is not on a Section edge`);
  CH.push({ name, start, end, shots }); CH.sort((a, b) => a.start - b.start);
}
// The Section edges, for chapter(): chapter('lab', sec(1).start, sec(2).start, ...), or by name: sec('Chorus 1').
const sec = k => typeof k === 'number' ? SECTIONS[k] : SECTIONS.find(s => s.name === k);

// Standalone loops (model sheets, GIFs, tests), outside the main timeline: window.LOOP = LOOPS[name] swaps the whole
// frame for that function, called with loop time. Give each a length: LOOPS.x = t => { ... }; LOOPS.x.len = 4;
const LOOPS = {};

function drawWorld(t) {
  KARAOKE = null; window.OVER_TEXT = null;
  if (window.SONGCHECK) { songCheck(t); karaoke(t); return; }
  if (window.LOOP) { window.LOOP(t); flushLetters(); return; }
  const ch = CH.find(c => t >= c.start && t < c.end);
  if (!ch) placeholder(t);
  else {
    let i = 0; while (i + 1 < ch.shots.length && t >= ch.shots[i + 1][0]) i++;
    const t0 = ch.shots[i][0], end = i + 1 < ch.shots.length ? ch.shots[i + 1][0] : ch.end;
    ch.shots[i][1](t, t - t0, end - t0);
    CAM = null;
  }
  flushLetters();
  if (MV.karaoke) karaoke(t);
}

// Time not yet covered by a chapter: says which Section and Lyric Line it is, so the timing reads while you build.
function placeholder(t) {
  const s = sectionAt(t), l = lineAt(t), k = pulse(t, 5);
  paint(ellPts(W / 2, H * .45, W * .27 * (1 + .03 * k), H * .26 * (1 + .03 * k), 30, 14), { fill: PAL.sky, fillOp: 90, bleed: .3, ink: null });
  letter(s ? s.section.name : '', W / 2, H * .38, 64, PAL.ink, { ink: false });
  letter(l ? '“' + l.line.text + '”' : '(no chapter here yet)', W / 2, H * .5, 34, PAL.ink, { ink: false, alpha: .7 });
}
