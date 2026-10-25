// storyboard.mjs: reads mv/STORYBOARD.md against song/song.json (GUIDE.md step 2) and writes the Chapter briefs from
// it (step 5). Every command takes --mv=<dir>, like render.mjs.
//
//   node engine/storyboard.mjs                  check it: ✗ breaks a rule (exit code 1), ⚠ might; then a summary
//   node engine/storyboard.mjs --briefs         → mv/briefs/cNN.md for every Chapter not yet built (--force rewrites
//                                               existing briefs, --all includes built Chapters)
//
// It reads the form GUIDE.md gives: the header fields, `Chapter n · name · Section + Section · start–end · …` lines,
// Shot lines `  A  start–end  [Seam: …]  L03 · … EVENT: … camera: …`, their `reads:` and the `[Seam out …]` marks.
// What it can't judge (is the event an event, does a read have time to land) stays the model's and the person's.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { ROOT } from './build.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const DIR = resolve(ROOT, args.mv || '.');
const SB = join(DIR, 'mv', 'STORYBOARD.md');
for (const p of [SB, join(DIR, 'song', 'song.json')])
  if (!existsSync(p)) { console.error(`no ${relative(process.cwd(), p)}${p === SB ? ': write the Storyboard first (GUIDE.md step 2)' : ': analyse the Song first (GUIDE.md step 1)'}`); process.exit(1); }
const SONG = JSON.parse(readFileSync(join(DIR, 'song', 'song.json'), 'utf8'));
const MVJ = existsSync(join(DIR, 'mv', 'mv.json')) ? JSON.parse(readFileSync(join(DIR, 'mv', 'mv.json'), 'utf8')) : {};
const LINES = SONG.lines, SECTIONS = SONG.sections, BARS = SONG.downbeats.length > 1 ? SONG.downbeats : SONG.beats.filter((b, i) => i % 4 === 0);
const BAR = (BARS.at(-1) - BARS[0]) / Math.max(1, BARS.length - 1);

const EDGE = .05;      // a Chapter edge this close to a Section edge is on it (the same as chapter() in timeline.js)
const SNAP = .08;      // a Shot start this close to a line, word, beat or half-beat starts on it (two frames at 24 fps)
const NEAR = .15;      // how far a named line's start may sit outside its Shot
const T = '(\\d+(?:\\.\\d+)?)', RANGE = new RegExp(`${T}\\s*[–-]\\s*${T}`);
const f2 = x => x.toFixed(2), Lname = i => `L${String(i).padStart(2, '0')}`;
// L03, L05–L09: a list of line numbers, runs joined
const Lrange = js => js.slice().sort((a, b) => a - b).reduce((r, j) => { const l = r.at(-1); if (l && j === l[1] + 1) l[1] = j; else r.push([j, j]); return r; }, []).map(([a, b]) => a === b ? Lname(a) : `${Lname(a)}–${Lname(b)}`).join(', ');

// ---- read the Storyboard
const src = readFileSync(SB, 'utf8').split('\n');
const chapterRe = new RegExp(`^#*\\s*Chapter\\s+(\\d+)\\s*·\\s*([^·]+?)\\s*·\\s*([^·]+?)\\s*·\\s*${T}\\s*[–-]\\s*${T}(.*)$`);
const shotRe = new RegExp(`^\\s+([A-Z]{1,2}\\d?)\\s+${T}\\s*[–-]\\s*${T}\\s+(.*)$`);
const readRe = new RegExp(`^\\s+${T}\\s*[–-]\\s*${T}\\s`);
const chapters = [];
let head = [], ch = null, shot = null, inReads = false;
for (const [n, line] of src.entries()) {
  const c = line.match(chapterRe);
  if (c) {
    ch = { n: +c[1], name: c[2].trim(), sections: c[3].split(/\s*[+,]\s*/).map(s => s.trim()), start: +c[4], end: +c[5], rest: c[6], shots: [], seamOut: null, lines: [line], at: n + 1 };
    chapters.push(ch); shot = null; inReads = false; continue;
  }
  if (!ch) { head.push(line); continue; }
  if (/^#/.test(line)) { ch = null; head.push(line); continue; }    // a heading after the Chapters ends them
  ch.lines.push(line);
  const s = line.match(shotRe);
  if (s) { shot = { label: s[1], start: +s[2], end: +s[3], text: s[4], reads: [], at: n + 1 }; ch.shots.push(shot); inReads = false; }
  else if (shot && /^\s+reads:/.test(line)) { inReads = true; addReads(line.replace(/^\s+reads:/, '')); }
  else if (shot && inReads && readRe.test(line)) addReads(line);
  else if (/^\s*\[Seam out/i.test(line)) { ch.seamOut = line.trim(); shot = null; inReads = false; }
  else if (shot && /^\s{4,}\S/.test(line) && !inReads) shot.text += ' ' + line.trim();
  if (shot && /\[Seam out/i.test(shot.text) && !ch.seamOut) ch.seamOut = shot.text.match(/\[Seam out[^\]]*\]?/i)[0];
}
function addReads(txt) {
  for (const m of txt.matchAll(new RegExp(RANGE, 'g'))) shot.reads.push([+m[1], +m[2]]);
}
const header = head.join('\n');

// ---- check it
const out = [];   // [chapter index or -1, '✗' | '⚠', message]
const err = (i, m) => out.push([i, '✗', m]), warn = (i, m) => out.push([i, '⚠', m]);
// what many Shots of a Chapter can lack, said once per Chapter: [mark, the Shots, what's missing]
const lack = new Map(), lacks = (i, mark, what, label) => { const k = `${i}|${what}`; if (!lack.has(k)) { lack.set(k, [mark, []]); out.push([i, mark, () => `Shot${lack.get(k)[1].length > 1 ? 's' : ''} ${lack.get(k)[1].join(', ')}: ${what}`]); } lack.get(k)[1].push(label); };

// the header fields GUIDE.md's form asks for
const FIELDS = [['Logline'], ['Mode'], ['Format'], ['Karaoke'], ['Style'], ['World'], ['Motif', 'Motifs?'], ['Cast'], ['Arc'], ['Sound Words'], ['Lyric Reading'], ['Open questions']];
for (const [name, re = name] of FIELDS)
  if (!new RegExp(`(^|\\n)(#{1,4}\\s*)?(\\*\\*)?${re}(\\*\\*)?\\s*(:|\\n)|\\b${re}:`, 'i').test(header + '\n'))
    (name === 'Open questions' ? warn : err)(-1, `no "${name}" in the header`);
const said = (re) => (header.match(re) || [])[1];
const compare = [['Style', /\bStyle:\s*([\w-]+)/, MVJ.style || 'watercolor'], ['Format', /\bFormat:\s*(16:9|9:16)/, MVJ.format || '16:9'],
  ['Mode', /\bMode:\s*(narrative|performance|mood|lyric)/i, MVJ.mode || 'narrative'], ['Karaoke', /\bKaraoke:\s*(on|off)/i, MVJ.karaoke === false ? 'off' : 'on']];
for (const [name, re, want] of compare) {
  const v = said(re);
  if (v && v.toLowerCase() !== String(want).toLowerCase()) warn(-1, `${name}: the Storyboard says ${v}, mv/mv.json says ${want}`);
}

// Sound Words: what the header lists, and capitals in the Shots that look like lettering it doesn't
const swField = (header.match(/(?:^|\n)(?:#{1,4}\s*)?(?:\*\*)?Sound Words[^\n]*(?::|\n)([\s\S]*?)(?=\n(?:#{1,4}\s*)?(?:Lyric Reading|Open questions|Cast|Arc|World|Motifs?)\b|\n#|$)/i) || [, ''])[0];
const listed = new Set();
for (const m of swField.matchAll(/\*\*([^*]+)\*\*/g)) if (!/[a-z]/.test(m[1])) listed.add(m[1].replace(/[^\p{L}]/gu, ''));
for (const m of swField.matchAll(/\b[A-Z]{2,}\b/g)) listed.add(m[0]);
for (const m of swField.matchAll(/^\s*[-*]\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+)/gmu)) listed.add(m[1]);
const sung = new Set(LINES.flatMap(L => L.text.toUpperCase().match(/[A-Z]+/g) || []));
const NOT_WORDS = new Set(['EVENT', 'SEAM', 'MV', 'AI', 'PR', 'PRS', 'OK', 'TV', 'CPU', 'GPU', 'LED', 'USB', 'CEO', 'API', 'URL', 'UI', 'DJ', 'SFX', 'BPM', 'POV', 'NOT', 'ALL']);

// the Chapters
if (!chapters.length) err(-1, 'no Chapter lines (`Chapter 1 · name · Section · start–end`)');
const edges = SECTIONS.flatMap(s => [s.start, s.end]);
const onEdge = t => edges.some(e => Math.abs(e - t) < EDGE);
const nearestEdge = t => edges.reduce((a, e) => Math.abs(e - t) < Math.abs(a - t) ? e : a, edges[0]);
const halves = SONG.beats.slice(1).map((b, k) => (b + SONG.beats[k]) / 2);
const grid = [...LINES.flatMap(L => [L.start, ...L.tokens.map(k => k[0])]), ...SONG.beats, ...halves, ...BARS].sort((a, b) => a - b);
const nearestGrid = t => grid.reduce((a, g) => Math.abs(g - t) < Math.abs(a - t) ? g : a, grid[0]);
const naming = new Map(), timed = new Map();    // Lyric Line → the Shots that name it (L03), and the Shots whose time holds its start
chapters.forEach((c, i) => {
  if (c.n !== i + 1) warn(i, `numbered ${c.n}, but it is Chapter ${i + 1} in order`);
  for (const [t, label] of [[c.start, 'start'], [c.end, 'end']])
    if (!onEdge(t)) err(i, `its ${label} ${f2(t)} is not on a Section edge (nearest ${f2(nearestEdge(t))})`);
  const named = c.sections.map(name => [name, SECTIONS.find(s => s.name === name)]);
  for (const [name, s] of named) if (!s) err(i, `no Section "${name}" in song.json (it has: ${SECTIONS.map(s => s.name).join(', ')})`);
  const found = named.filter(([, s]) => s).map(([, s]) => s);
  if (found.length === named.length && found.length) {
    const a = Math.min(...found.map(s => s.start)), b = Math.max(...found.map(s => s.end));
    if (Math.abs(a - c.start) > EDGE || Math.abs(b - c.end) > EDGE) warn(i, `${c.sections.join(' + ')} run ${f2(a)}–${f2(b)}, the Chapter ${f2(c.start)}–${f2(c.end)}`);
  }
  const prev = chapters[i - 1];
  if (prev && Math.abs(prev.end - c.start) > EDGE) err(i, `starts at ${f2(c.start)}, but Chapter ${prev.n} ends at ${f2(prev.end)}: ${c.start > prev.end ? 'a gap' : 'an overlap'}`);
  // a Chapter edge is crossed by this Chapter's [Seam out …] or the next one's first [Seam in …]; the MV's end only by a Seam out
  const nextIn = chapters[i + 1]?.shots[0] && /\[Seam/i.test(chapters[i + 1].shots[0].text);
  if (!c.seamOut && (i === chapters.length - 1 || !nextIn)) err(i, i === chapters.length - 1 ? 'no [Seam out of the MV: …]' : `no [Seam out to Chapter ${c.n + 1}: …], and Chapter ${c.n + 1} has no Seam in`);

  // its Shots
  if (!c.shots.length) { err(i, 'no Shots'); return; }
  if (Math.abs(c.shots[0].start - c.start) > EDGE) err(i, `its first Shot starts at ${f2(c.shots[0].start)}, not at the Chapter's start ${f2(c.start)}`);
  const last = c.shots.at(-1);
  if (c.end - last.end > .5) warn(i, `its last Shot ${last.label} ends at ${f2(last.end)}, ${f2(c.end - last.end)} s before the Chapter does`);
  c.shots.forEach((s, k) => {
    const next = c.shots[k + 1], to = next ? next.start : c.end, id = `Shot ${s.label}`;
    if (s.end <= s.start) err(i, `${id}: ends (${f2(s.end)}) before it starts (${f2(s.start)})`);
    if (next && next.start < s.start) err(i, `${id} and ${next.label} are out of order`);
    if (next && s.end - next.start > EDGE) warn(i, `${id} ends at ${f2(s.end)}, after ${next.label} starts (${f2(next.start)})`);
    if (s.end - c.end > EDGE) err(i, `${id} ends at ${f2(s.end)}, after the Chapter (${f2(c.end)})`);
    if (k > 0) { const g = nearestGrid(s.start); if (Math.abs(g - s.start) > SNAP) warn(i, `${id} starts at ${f2(s.start)}, on no line, word or beat (nearest ${f2(g)})`); }
    if (!/\[Seam/i.test(s.text)) lacks(i, '✗', "no [Seam…]: say how it's crossed, even a cut on the beat", s.label);
    if (!/\bEVENT:/.test(s.text)) lacks(i, '✗', 'no EVENT:', s.label);
    if (!/\bcamera:/i.test(s.text)) lacks(i, '⚠', 'no camera:', s.label);
    if (!s.reads.length) lacks(i, '⚠', 'no reads', s.label);
    s.reads.forEach(([a, b], r) => {
      if (b <= a) err(i, `${id}: read ${f2(a)}–${f2(b)} ends before it starts`);
      if (a < s.start - NEAR || b > to + NEAR) warn(i, `${id}: read ${f2(a)}–${f2(b)} is outside the Shot (${f2(s.start)}–${f2(to)})`);
      const p = s.reads[r - 1];
      if (p && a < p[1] - EDGE) warn(i, `${id}: reads ${f2(p[0])}–${f2(p[1])} and ${f2(a)}–${f2(b)} overlap: one read at a time`);
    });
    for (const m of s.text.matchAll(/\bL(\d+)(?:\s*[–-]\s*L?(\d+))?\b/g)) {
      const a = +m[1], b = m[2] != null ? +m[2] : a;
      for (let j = a; j <= b; j++) {
        if (!LINES[j]) { err(i, `${id}: ${Lname(j)} doesn't exist (song.json has ${Lname(0)}–${Lname(LINES.length - 1)})`); continue; }
        if (!(naming.get(j) || []).some(([, o]) => o === s)) naming.set(j, [...(naming.get(j) || []), [i, s]]);
        if (LINES[j].start < s.start - NEAR || LINES[j].start > to + NEAR) warn(i, `${id} names ${Lname(j)}, but it's sung at ${f2(LINES[j].start)}, outside the Shot (${f2(s.start)}–${f2(to)})`);
      }
    }
    LINES.forEach((L, j) => { if (L.start >= s.start - SNAP && L.start < to - SNAP) timed.set(j, [...(timed.get(j) || []), [i, s]]); });
    const caps = (s.text.replace(/["“][^"”]*["”]|`[^`]*`/g, '').match(/\b[A-Z]{3,}\b/g) || []).filter(w => !NOT_WORDS.has(w) && !sung.has(w) && !listed.has(w));
    for (const w of new Set(caps)) warn(i, `${id}: ${w} isn't a listed Sound Word: lettering beyond the list?`);
  });
});

// every Lyric Line gets a Shot; only a very short one shares
// a line belongs to the Shots that name it; one no Shot names, to the Shot its start falls in
const lineOf = new Map(LINES.map((_, j) => [j, naming.get(j) || timed.get(j)]).filter(([, l]) => l));
const nowhere = LINES.map((_, j) => j).filter(j => !lineOf.has(j));
if (nowhere.length) err(-1, `${Lrange(nowhere)} ${nowhere.length > 1 ? 'are' : 'is'} sung in no Shot`);
if (naming.size) { const un = [...lineOf.keys()].filter(j => !naming.has(j)); if (un.length) warn(-1, `no Shot names ${Lrange(un)} (each is in the Shot its start falls in)`); }
if (chapters.length && (chapters[0].start > EDGE || SONG.duration - chapters.at(-1).end > EDGE)) err(-1, `the Chapters run ${f2(chapters[0].start)}–${f2(chapters.at(-1).end)}, the song 0.00–${f2(SONG.duration)}`);
const perShot = new Map();
for (const [j, list] of lineOf) for (const [i, s] of list) perShot.set(s, [i, [...(perShot.get(s)?.[1] || []), j]]);
for (const [s, [i, js]] of perShot) {
  if (js.length > 2) warn(i, `Shot ${s.label} carries ${js.length} lines (${Lrange(js)}): every line gets its own Shot`);
  else if (js.length === 2 && LINES[js[0]].end - LINES[js[0]].start > BAR) warn(i, `Shot ${s.label} carries ${Lname(js[0])} and ${Lname(js[1])}, and ${Lname(js[0])} is longer than a bar: only a very short line shares a Shot`);
}
// the listed Sound Words are placed somewhere
const body = chapters.map(c => c.lines.join('\n')).join('\n');
for (const w of listed) if (!body.includes(w)) warn(-1, `the Sound Word ${w} isn't placed in any Shot`);
// the Lyric Reading covers every line, when it numbers them
const reading = (header.match(/(?:^|\n)(?:#{1,4}\s*)?(?:\*\*)?Lyric Reading[^\n]*(?::|\n)([\s\S]*?)(?=\n(?:#{1,4}\s*)?(?:Open questions|Chapters?)\b|\n#{1,2}\s|$)/i) || [, ''])[1];
const readL = new Set([...reading.matchAll(/\bL(\d+)(?:\s*[–-]\s*L?(\d+))?/g)].flatMap(m => { const a = +m[1], b = m[2] != null ? +m[2] : a; return Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k); }));
if (readL.size) { const miss = LINES.map((_, j) => j).filter(j => !readL.has(j)); if (miss.length) warn(-1, `the Lyric Reading leaves out ${Lrange(miss)}`); }
else if (reading.split('\n').filter(l => l.trim()).length < LINES.length) warn(-1, `the Lyric Reading has fewer lines than the song's ${LINES.length} Lyric Lines (number them L00, L01…)`);

// ---- write the Chapter briefs
if (args.briefs) {
  const bdir = join(DIR, 'mv', 'briefs'), cdir = join(DIR, 'mv', 'chapters');
  mkdirSync(bdir, { recursive: true });
  const built = existsSync(cdir) ? readdirSync(cdir).filter(f => f.endsWith('.js')) : [];
  const fileOf = c => built.find(f => f.startsWith(`c${String(c.n).padStart(2, '0')}_`));
  const slug = c => c.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `ch${c.n}`;
  const charFiles = existsSync(join(DIR, 'mv', 'characters')) ? readdirSync(join(DIR, 'mv', 'characters')).filter(f => f.endsWith('.js')) : [];
  let wrote = 0;
  chapters.forEach((c, i) => {
    const nn = String(c.n).padStart(2, '0'), p = join(bdir, `c${nn}.md`);
    if (fileOf(c) && !args.all) return;
    if (existsSync(p) && !args.force) { console.log(`kept ${relative(DIR, p)} (--force rewrites it)`); return; }
    const prev = chapters[i - 1], next = chapters[i + 1];
    const sungHere = LINES.map((L, j) => [L, j]).filter(([L]) => L.start >= c.start - EDGE && L.start < c.end - EDGE);
    const words = [...listed].filter(w => c.lines.join('\n').includes(w));
    const neighbour = (o, side) => !o ? null : fileOf(o) ? `Chapter ${o.n} (${o.name}) is built: \`mv/chapters/${fileOf(o)}\`; read its ${side} and meet it exactly.` : `Chapter ${o.n} (${o.name}) is built at the same time: write the frame where they meet, the same text in both briefs.`;
    const md = [
      `# Chapter ${c.n} brief: ${c.name}`, '',
      'Read docs/chapter-brief.md first (it applies in full), then this. Every TODO is filled in before a subagent gets this brief.', '',
      `**Your file:** \`mv/chapters/c${nn}_${slug(c)}.js\` (only this file). Register it with`,
      `\`chapter('${slug(c)}', sec('${c.sections[0]}').start, sec('${c.sections.at(-1)}').end, shots)\` (${f2(c.start)}–${f2(c.end)}).`, '',
      '## Your Shots (from the Storyboard; L<n> is LINES[n])', '', '```', ...c.lines.filter((l, k) => k === 0 || l.trim()), '```', '',
      "You may refine staging, camera and timing within each Shot (and say so in your report), but keep every Lyric Line's picture starting with its line, the events, and the Seams below exactly.", '',
      '## Lyric Lines', '', '| L | start | end | sung |', '|---|---|---|---|',
      ...sungHere.map(([L, j]) => `| ${Lname(j)} | ${f2(L.start)} | ${f2(L.end)} | ${L.text.replace(/\|/g, '\\|')} |`), '',
      '## Sound Words', '', words.length ? words.join(', ') : 'None: no lettering in this Chapter.', '',
      `## Seam in${prev ? `, from Chapter ${prev.n}` : ', the start of the MV'}`, '',
      ...(prev ? [neighbour(prev, 'last frames'), ''] : []),
      `The Storyboard: ${(c.shots[0]?.text.match(/\[Seam[^\]]*\]/i) || ['(none)'])[0]}`, '',
      'TODO: the exact contract (what the frame is at the edge, which helper draws it, with what arguments).', '',
      `## Seam out${next ? `, to Chapter ${next.n}` : ', the end of the MV'}`, '',
      ...(next ? [neighbour(next, 'first frames'), ''] : []),
      `The Storyboard: ${c.seamOut || '(none)'}`, '',
      'TODO: the exact contract.', '',
      '## Shared helpers', '',
      `TODO: the helpers in mv/characters/ this Chapter uses, by name and signature, and anything the MV does its own way. (mv/characters/ holds: ${charFiles.join(', ') || 'nothing yet'}.)`, '',
      '## Guests', '',
      'TODO: the Guests this Chapter introduces or brings back, and any that go on CAST (signature and options).', '',
    ].join('\n');
    writeFileSync(p, md); wrote++;
    console.log(`wrote ${relative(DIR, p)}`);
  });
  console.log(`${wrote} Chapter brief${wrote === 1 ? '' : 's'} written. Fill in every TODO before a subagent gets one.\n`);
}

// ---- report
const rel = relative(process.cwd(), SB).startsWith('../..') ? SB : relative(process.cwd(), SB);
console.log(`${rel} against song.json: ${f2(SONG.duration)} s, ${LINES.length} Lyric Lines, ${SECTIONS.length} Sections, ${chapters.length} Chapters\n`);
const say = m => typeof m === 'function' ? m() : m;
for (const [, mark, m] of out.filter(o => o[0] === -1)) console.log(`${mark} ${say(m)}`);
if (out.some(o => o[0] === -1)) console.log('');
chapters.forEach((c, i) => {
  const js = [...lineOf].filter(([, l]) => l.some(([k]) => k === i)).map(([j]) => j);
  console.log(`Chapter ${c.n} · ${c.name} · ${c.sections.join(' + ')} · ${f2(c.start)}–${f2(c.end)} · ${c.shots.length} Shots${js.length ? ` · ${Lrange(js)}` : ''}`);
  for (const [, mark, m] of out.filter(o => o[0] === i)) console.log(`  ${mark} ${say(m)}`);
});
const nE = out.filter(o => o[1] === '✗').length, nW = out.length - nE;
console.log(`\n${nE ? `✗ ${nE} to fix` : '✓ nothing breaks a rule'}${nW ? `, ⚠ ${nW} to look at` : ''}`);
process.exit(nE ? 1 : 0);
