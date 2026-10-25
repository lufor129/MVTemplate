// build.mjs: gather one MV into .build/mv.js, the single script studio.html loads. render.mjs runs it before every
// render, so you only run it by hand to scrub the studio after changing files:  node engine/build.mjs [--mv=<dir>]
//
// An MV folder (the template root by default, or any folder laid out like it) holds:
//   song/song.json        the analysed Song (tools/song/analyze.py). Without it, mv.json's bpm and duration make a
//                         silent MV with an even Beat Grid.
//   mv/mv.json            the MV's settings (see DEFAULTS)
//   mv/characters/*.js    its Characters, loaded in name order, after any listed in mv.json "characters"
//   mv/chapters/*.js      its Chapters, loaded in name order (c01_…, c02_…)
// .build/mv.js defines MV and SONG, then writes the script tags: the Style Profile's libraries and fonts, the engine,
// the Style Profile's scripts, the Characters and the Chapters, in that order.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DEFAULTS = {
  title: 'Untitled MV',
  mode: 'narrative',       // or 'performance', 'mood', 'lyric' (GUIDE.md step 0); read by the model, not the engine
  format: '16:9',          // or '9:16' (YouTube Shorts: at most 3 minutes)
  style: 'watercolor',     // a folder in styles/
  karaoke: true,           // show each Lyric Line under the picture as it is sung
  fps: 24,
  hold: 1,                 // frames each drawing holds: 1, on ones (2 would be on twos: 12 drawings a second, choppy)
  boil: 12,                // boil drawings per second; 0 = nothing boils
  boilAmp: 1,              // how far edges wander as they boil: 1 = the Style Profile's own amount, .5 = half
  palette: {},             // colours added to or replacing the Style Profile's PAL
  characters: [],          // Character files from elsewhere in the template, e.g. "examples/clawd/clawd.js"
  bpm: 120, duration: 10,  // only used when there is no song.json
};
const ENGINE = ['math.js', 'song.js', 'frame.js', 'geometry.js', 'acting.js', 'emotes.js', 'timeline.js', 'karaoke.js', 'songcheck.js', 'stylesample.js'];

const readJSON = p => JSON.parse(readFileSync(p, 'utf8'));
// The names a script declares at its top level (column 0): function, class, var/let/const (destructuring too), and a
// bare `name = …`, which makes a global as well. Code inside an IIFE is the script's own and isn't counted.
export function topNames(src) {
  const out = new Set(), id = '[A-Za-z_$][\\w$]*';
  for (const m of src.matchAll(new RegExp(`^(?:async\\s+)?function\\s*\\*?\\s*(${id})|^class\\s+(${id})|^(?:const|let|var)\\s+(${id})|^(${id})\\s*=(?![=>])`, 'gm')))
    out.add(m[1] || m[2] || m[3] || m[4]);
  for (const m of src.matchAll(/^(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/gm))
    for (const part of m[1].split(',')) { const n = part.split('=')[0].split(':').pop().trim().replace(/^\.\.\./, ''); if (n) out.add(n); }
  return out;
}
const jsIn = d => existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.js')).sort().map(f => join(d, f)) : [];

// over: settings that win over mv.json for this build only (render.mjs --style=<name>, for the Style Sample's lineup).
export function build(mvDir = '.', over = {}) {
  const dir = resolve(ROOT, mvDir), rel = p => relative(ROOT, p).split('\\').join('/');
  const mvPath = join(dir, 'mv', 'mv.json');
  const own = { ...(existsSync(mvPath) ? readJSON(mvPath) : {}), ...over };
  // the Style Profile's own defaults (style.json "defaults", e.g. hold or boil) sit between the template's and the MV's
  const styleOf = name => readJSON(join(ROOT, 'styles', name, 'style.json'));
  const MV = { ...DEFAULTS, ...(styleOf(own.style || DEFAULTS.style).defaults || {}), ...own };
  const songPath = join(dir, 'song', 'song.json');
  let SONG;
  if (existsSync(songPath)) {
    SONG = readJSON(songPath);
    MV.audioPath = rel(join(dir, 'song', SONG.audio));
    // song/translation.txt (optional): one translated line per Lyric Line, in order ([Section] marks and blank lines
    // are skipped). Each becomes its line's `sub`, which the karaoke shows on a row above the sung words.
    const trPath = join(dir, 'song', 'translation.txt');
    if (existsSync(trPath)) {
      const tr = readFileSync(trPath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !/^\[.+\]$/.test(s));
      if (tr.length !== SONG.lines.length) throw new Error(`build: song/translation.txt has ${tr.length} lines, song.json ${SONG.lines.length}`);
      SONG.lines.forEach((l, i) => { l.sub = tr[i]; });
    }
  } else {   // a silent MV: an even grid at mv.json's bpm, four beats to the bar
    const beat = 60 / MV.bpm, n = Math.ceil(MV.duration / beat) + 1, beats = Array.from({ length: n }, (_, i) => +(i * beat).toFixed(3));
    SONG = { audio: null, duration: MV.duration, bpm: MV.bpm, beats, downbeats: beats.filter((_, i) => i % 4 === 0),
             sections: [{ name: 'Film', kind: 'section', start: 0, end: MV.duration }], lines: [] };
    MV.audioPath = null;
  }
  MV.dir = rel(dir) || '.';
  const style = styleOf(MV.style);
  MV.renderer = style.renderer || 'webgl';   // the canvas the profile paints on: 'webgl' or '2d' (frame.js)
  const scripts = [
    ...style.libraries,
    ...ENGINE.map(f => 'engine/' + f),
    ...style.scripts.map(f => `styles/${MV.style}/${f}`),
    ...MV.characters,
    ...jsIn(join(dir, 'mv', 'characters')).map(rel),
    ...jsIn(join(dir, 'mv', 'chapters')).map(rel),
  ];
  for (const s of scripts) if (!existsSync(join(ROOT, s))) throw new Error(`build: missing ${s}`);
  // An MV's own scripts may not take a name the page already has: the browser's (a `var fence` or `name = …` fails
  // silently, or turns the value into a string), p5's (engine/globals.json, from engine/globals.mjs), or one the
  // engine or the Style Profile declares (a second `function paint` quietly replaces the first).
  const mine = new Set([...MV.characters, ...jsIn(join(dir, 'mv', 'characters')).map(rel), ...jsIn(join(dir, 'mv', 'chapters')).map(rel)]);
  const taken = new Map(readJSON(join(ROOT, 'engine', 'globals.json')).map(n => [n, 'the browser or p5']));
  for (const s of scripts.filter(s => !mine.has(s) && s.endsWith('.js') && !s.startsWith('node_modules/')))
    for (const n of topNames(readFileSync(join(ROOT, s), 'utf8'))) if (!taken.has(n)) taken.set(n, s);
  const clash = [];
  for (const s of mine) for (const n of topNames(readFileSync(join(ROOT, s), 'utf8'))) {
    if (taken.has(n) && taken.get(n) !== s) clash.push(`${s}: "${n}" is already a global of ${taken.get(n)}`);
    else taken.set(n, s);
  }
  if (clash.length) throw new Error(`build: rename these top-level names (or move them inside the file's IIFE):\n  ${clash.join('\n  ')}`);
  const tags = [
    style.fonts ? `<link rel="stylesheet" href="${style.fonts}">` : '',
    ...scripts.map(s => `<script src="${s}"></script>`),
  ].join('\n');
  mkdirSync(join(ROOT, '.build'), { recursive: true });
  writeFileSync(join(ROOT, '.build', 'mv.js'),
    `// generated by engine/build.mjs from ${MV.dir}: don't edit\n` +
    `const MV = ${JSON.stringify(MV)};\nconst SONG = ${JSON.stringify(SONG)};\n` +
    `document.write(${JSON.stringify(tags)});\n`);
  return { MV, SONG, dir, scripts };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv.find(a => a.startsWith('--mv='));
  const { MV, scripts } = build(arg ? arg.slice(5) : '.');
  console.log(`built .build/mv.js for ${MV.dir} (${MV.title}): ${scripts.length} scripts`);
}
