// new_mv.mjs: makes a new MV, a copy of the template (ADR 0001) with nothing in it from other MVs (GUIDE.md › The
// workflow), and checks the tools the workflow needs:
//
//   node tools/new_mv.mjs <folder> [--song=<folder or audio file>] [--title="<title>"]
//
// The copy leaves out .git, out/, .build/, the song analysis and tools/song/.venv (uv makes the copy its own, about
// 650 MB, on the first analysis), and from song/ and mv/ everything but the blanks (song/README.md, mv/mv.json,
// mv/LOG.md). It keeps node_modules, so the copy renders without a network. With --song, the audio goes in song/ as
// song.<ext>, with lyric.txt (or lyrics.txt) and translation.txt when they are there.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, copyFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const target = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!target) { console.error('usage: node tools/new_mv.mjs <folder> [--song=<folder or audio file>] [--title="<title>"]'); process.exit(1); }
const DEST = resolve(process.cwd(), target);
if (existsSync(DEST) && readdirSync(DEST).length) { console.error(`${target} already exists and isn't empty: pick a new folder`); process.exit(1); }
if ((DEST + sep).startsWith(ROOT + sep)) { console.error('make the MV outside the template folder'); process.exit(1); }

// ---- the copy
const NEVER = new Set(['.git', '.venv', '__pycache__', '.DS_Store']), TOP = new Set(['out', '.build']);
const BLANKS = new Set(['song/README.md', 'mv/mv.json', 'mv/LOG.md']);
cpSync(ROOT, DEST, {
  recursive: true, verbatimSymlinks: true,
  filter: src => {
    const rel = relative(ROOT, src).split(sep).join('/');
    if (!rel) return true;
    if (rel.split('/').some(part => NEVER.has(part)) || TOP.has(rel.split('/')[0])) return false;
    if (/^(song|mv)\//.test(rel)) return BLANKS.has(rel) || (statSync(src).isDirectory() && /^mv\/(characters|chapters)$/.test(rel));
    return true;
  },
});
for (const d of ['mv/characters', 'mv/chapters']) mkdirSync(join(DEST, d), { recursive: true });
console.log(`copied the template to ${target}`);

const mvPath = join(DEST, 'mv', 'mv.json'), mv = JSON.parse(readFileSync(mvPath, 'utf8'));
if (args.title) { mv.title = args.title; writeFileSync(mvPath, JSON.stringify(mv, null, 2) + '\n'); console.log(`title: ${args.title}`); }

// ---- the song
const AUDIO = /\.(mp3|wav|flac|m4a|aac|ogg|aiff?)$/i;
const todo = [];
if (args.song) {
  const from = resolve(process.cwd(), args.song);
  if (!existsSync(from)) { console.error(`no ${args.song}`); process.exit(1); }
  const dir = statSync(from).isDirectory() ? from : dirname(from);
  const audio = statSync(from).isDirectory() ? readdirSync(dir).filter(f => AUDIO.test(f)) : [basename(from)];
  if (audio.length === 1) { copyFileSync(join(dir, audio[0]), join(DEST, 'song', `song${extname(audio[0]).toLowerCase()}`)); console.log(`song: ${audio[0]} → song/song${extname(audio[0]).toLowerCase()}`); }
  else todo.push(audio.length ? `${audio.length} audio files in ${args.song} (${audio.join(', ')}): pass the one with --song=<file>` : `no audio file in ${args.song}`);
  const lyric = ['lyric.txt', 'lyrics.txt'].find(f => existsSync(join(dir, f)));
  if (lyric) { copyFileSync(join(dir, lyric), join(DEST, 'song', lyric)); console.log(`lyrics: ${lyric}`); }
  else {
    const notes = readdirSync(dir).filter(f => /\.(md|txt)$/i.test(f));
    todo.push(`no lyric.txt: write song/lyric.txt${notes.length ? ` from ${notes.join(', ')}` : ''} (the sung lines and the Section marks only, without performer or style tags)`);
  }
  if (existsSync(join(dir, 'translation.txt'))) { copyFileSync(join(dir, 'translation.txt'), join(DEST, 'song', 'translation.txt')); console.log('translation: translation.txt'); }
} else todo.push('no song yet: put song.mp3 (or any song.*) and lyric.txt in song/');

// ---- the tools the workflow needs
const runs = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: 'utf8' }); return r.status === 0 ? (r.stdout || r.stderr).split('\n')[0].trim() : null; };
const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => p && existsSync(p));
const checks = [
  ['Node.js', process.version, 'https://nodejs.org'],
  ['Chrome', chrome, 'install Google Chrome, or set CHROME_PATH (render.mjs also takes --chrome=<path>)'],
  ['ffmpeg', runs('ffmpeg', ['-version']), 'brew install ffmpeg (or your package manager)'],
  ['uv', runs('uv', ['--version']), 'https://docs.astral.sh/uv/ (the song analysis runs on it)'],
  ['Pillow', runs('python3', ['-c', 'import PIL; print("Pillow", PIL.__version__)']), 'python3 -m pip install Pillow (the short and the description tools letter with it)'],
];
console.log('');
for (const [name, ok, how] of checks) console.log(ok ? `✓ ${name}: ${ok}` : `✗ ${name}: missing. ${how}`);
if (todo.length) { console.log(''); for (const t of todo) console.log(`• ${t}`); }
console.log(`\nNext: in ${target}, ask Claude to read GUIDE.md and make the MV. The first song analysis downloads its models (about 5 GB, once per machine).`);
process.exit(checks.some(c => !c[1]) ? 1 : 0);
