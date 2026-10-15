// render.mjs: renders studio.html in headless Chrome. Builds .build/mv.js first. Every command takes --mv=<dir> (the
// MV folder: the template root by default, or any folder laid out like it); outputs go to <dir>/out/.
//
//   The Gates:
//     node engine/render.mjs --songcheck                         the Song Check video (song + beat clicks) → out/check/songcheck.mp4
//     node engine/render.mjs --loop=clawd-sheet --sheet=1 --cols=1 --w=1920 --out=…   a Model Sheet as a still
//     node engine/render.mjs --rough [--workers=3]               the Rough Cut: half size, 12 fps, with the song → out/rough/rough.mp4
//     node engine/render.mjs --final [--workers=3]               the MV: full size, mv.json fps, with the song → out/final/<title>.mp4
//   Look at it (open the images with the Read tool):
//     --sheet=0.5,1,1.5,2 [--cols=4] [--w=480] --out=out/check/a.jpg          contact sheet of chosen times
//     --strip=2.0:2.5 [--cols=6] [--w=320] --out=out/check/strip.jpg          EVERY frame in a stretch (motion)
//     --sheet=2.1,2.2 --crop=760,300,400,400 --w=600 --out=out/check/face.jpg  full-res crops (details)
//     --strip=2.0:2.5 --crop-at=960,780,500,400 --out=out/check/feet.jpg       crops that follow a WORLD point
//     --stills=1.2,3.4 --out=out/stills                                      full-res PNGs
//     --clip=12:20 --out=out/check/clip.mp4                                  a stretch straight to MP4, with the song
//   Loops (LOOPS in the page): add --loop=<name> (times are then loop times); --png renders one cycle as PNGs.
//   Other flags: --style=<name> (another Style Profile, for this render only), --tag=<text> (a sheet's cell label),
//   --scale=0.5 (render smaller), --fps=24, --audio=<file>, --chrome=<path>, --soft-gl,
//   --gpu-angle=vulkan|gl-egl (headless Linux on NVIDIA).
//   --rough and --final are resumable: frames already on disk are kept (delete the frames folder to start over).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync, renameSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { build, ROOT } from './build.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const { MV, dir: MVDIR } = build(args.mv || '.', args.style ? { style: args.style } : {});
const OUT = join(MVDIR, 'out'), at = p => resolve(process.cwd(), p);
const mode = args.songcheck ? 'songcheck' : args.rough ? 'rough' : args.final ? 'final' : null;
const scale = +(args.scale || (mode === 'rough' || mode === 'songcheck' ? .5 : 1));
const fps = +(args.fps || (mode === 'rough' ? 12 : MV.fps));
const audioOf = () => args.audio ? at(args.audio) : mode === 'songcheck' ? join(MVDIR, 'song', '.analysis', 'check_mix.wav') : MV.audioPath ? join(ROOT, MV.audioPath) : null;

const CHROMES = [args.chrome, process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ...playwrightChromes()];
// Chromium builds Playwright downloaded (~/.cache/ms-playwright/chromium-NNNN), newest first
function playwrightChromes() {
  const d = `${homedir()}/.cache/ms-playwright`;
  if (!existsSync(d)) return [];
  return readdirSync(d).filter(n => /^chromium-\d+$/.test(n)).sort((a, b) => b.split('-')[1] - a.split('-')[1]).map(n => `${d}/${n}/chrome-linux64/chrome`);
}
const run = (cmd, a) => new Promise((ok, bad) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('close', c => c ? bad(new Error(cmd + ' exited ' + c)) : ok()); });
const times = s => String(s).split(',').map(Number);
const span = s => String(s).split(':').map(Number);
// comma-separated fields, keeping commas inside parentheses ('PLK.MX(1.38),PLK.WL,500,300'); numbers stay numbers
const fields = s => { const out = []; let d = 0, cur = ''; for (const ch of String(s)) { if (ch === ',' && !d) { out.push(cur); cur = ''; continue; } d += ch === '(' ? 1 : ch === ')' ? -1 : 0; cur += ch; } out.push(cur); return out.map(v => isNaN(+v) ? v : +v); };

async function encode(framesDir, out, audio) {
  const n = readdirSync(framesDir).filter(f => f.endsWith('.jpg')).length;
  console.log(`encoding ${n} frames → ${out}${audio ? ' with ' + audio : ''}`);
  mkdirSync(dirname(out), { recursive: true });
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-framerate', String(fps), '-i', `${framesDir}/f%05d.jpg`,
    ...(audio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('wrote ' + out);
}
if (args.encode) { await encode(at(args.frames || join(OUT, 'frames')), at(args.out || join(OUT, 'video.mp4')), audioOf()); process.exit(0); }

const CHROME = CHROMES.find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome not found: pass --chrome=<path> or set CHROME_PATH'); process.exit(1); }
// --soft-gl: no GPU on this machine; render WebGL in software (SwiftShader), which Chrome only allows when asked.
// --gpu-angle=vulkan|gl-egl: headless Linux on an NVIDIA GPU; plain --use-gl=angle gets no WebGL context there.
const ANGLE = { vulkan: ['--use-angle=vulkan', '--enable-features=Vulkan'], 'gl-egl': ['--use-angle=gl-egl'] };
const gpu = args['soft-gl'] ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : args['gpu-angle'] ? ANGLE[args['gpu-angle']]
  : process.platform === 'win32' ? ['--use-angle=d3d11'] : process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-gl=angle'];
const sandbox = process.platform === 'linux' ? ['--no-sandbox'] : [];   // Ubuntu 23.10+ blocks Chrome's sandbox
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: [...sandbox, '--allow-file-access-from-files', '--ignore-gpu-blocklist', ...gpu, '--enable-gpu-rasterization', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling']
});
async function openPage(tag = '') {
  const page = await browser.newPage();
  page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log(`[page${tag}]`, m.text()); });
  page.on('pageerror', e => console.log(`[page error${tag}]`, e.message));
  await page.goto(pathToFileURL(join(ROOT, 'studio.html')).href + `?render&scale=${scale}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.ready === true', { timeout: 120000 });
  if (args.loop) {
    const ok = await page.evaluate(name => { if (!LOOPS[name]) return false; window.LOOP = LOOPS[name]; return true; }, args.loop);
    if (!ok) { console.error(`no loop named "${args.loop}" (loops: ${await page.evaluate(() => Object.keys(LOOPS).join(', '))})`); process.exit(1); }
  }
  if (mode === 'songcheck') await page.evaluate(() => { window.SONGCHECK = true; });
  return page;
}
const frameOf = async (page, t, type, q) => {
  const url = await page.evaluate((t, type, q) => window.renderAt(t, type, q), t, type, q);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
};
const lengthOf = page => page.evaluate(() => window.lengthOf());

// Parallel and resumable: each worker pulls the next missing frame; files are written atomically.
async function frames(framesDir, a, b, workers) {
  const probe = await openPage(), len = await lengthOf(probe); await probe.close();
  b = Math.min(b ?? len, len);
  mkdirSync(framesDir, { recursive: true });
  const first = Math.round(a * fps), last = Math.ceil(b * fps) - 1;
  const todo = []; for (let i = first; i <= last; i++) { const f = `${framesDir}/f${String(i).padStart(5, '0')}.jpg`; if (!existsSync(f) || statSync(f).size < 1000) todo.push(i); }
  console.log(`${todo.length} frames to render (${last - first + 1 - todo.length} already done), ${workers} workers, ${fps} fps, scale ${scale}`);
  let next = 0, done = 0; const start = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage('#' + w);
    while (next < todo.length) {
      const i = todo[next++], f = `${framesDir}/f${String(i).padStart(5, '0')}.jpg`;
      const buf = await frameOf(page, i / fps, 'image/jpeg', .94);
      writeFileSync(f + '.tmp', buf); renameSync(f + '.tmp', f);
      if (++done % 24 === 0 || done === todo.length) {
        const el = (Date.now() - start) / 1000;
        console.log(`frame ${done}/${todo.length}  ${(el / done * 1000).toFixed(0)} ms/frame effective  eta ${((todo.length - done) * el / done / 60).toFixed(1)} min`);
      }
    }
  }));
}

if (args.sheet || args.strip) {
  const page = await openPage(), out = at(args.out || join(OUT, 'check', 'sheet.jpg')); mkdirSync(dirname(out), { recursive: true });
  let ts;
  if (args.strip) { const [a, b] = span(args.strip); ts = []; for (let i = Math.round(a * fps); i <= Math.round(b * fps); i++) ts.push(i / fps); }
  else ts = times(args.sheet);
  const crop = args.crop ? times(args.crop) : null, cat = args['crop-at'] ? fields(args['crop-at']) : null;
  const { url, ms } = await page.evaluate((ts, c, w, crop, at, tag) => window.renderSheet(ts, c, w, crop, at, tag), ts, +(args.cols || (args.strip ? 6 : 3)), +(args.w || (args.strip ? 320 : 640)), crop, cat, args.tag || null);
  writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  console.log(`${out}  (${ts.length} frames)  ms/frame: ${ms.join(' ')}`);
} else if (args.stills) {
  const page = await openPage(), out = at(args.out || join(OUT, 'stills')); mkdirSync(out, { recursive: true });
  console.log('GPU:', await page.evaluate(() => window.gpuInfo()));
  for (const s of times(args.stills)) {
    const t0 = Date.now(), buf = await frameOf(page, s, 'image/png');
    const f = `${out}/t${s.toFixed(2).replace('.', '_')}.png`; writeFileSync(f, buf);
    console.log(`${f}  ${Date.now() - t0} ms`);
  }
} else if (args.png) {
  // PNG sequence (for GIFs): a loop's full cycle (frame n equals frame 0, so it isn't rendered), or --range=a:b.
  const probe = await openPage(), len = await lengthOf(probe); await probe.close();
  const [a, b] = args.range ? span(args.range) : [0, len], n = Math.round((b - a) * fps);
  const out = at(args.out || join(OUT, args.loop ? 'loop_' + args.loop : 'png')), workers = +(args.workers || 3); mkdirSync(out, { recursive: true });
  let next = 0; const start = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage('#' + w);
    while (next < n) { const i = next++; writeFileSync(`${out}/f${String(i).padStart(4, '0')}.png`, await frameOf(page, a + i / fps, 'image/png')); }
  }));
  console.log(`${n} frames → ${out}  (${((Date.now() - start) / n).toFixed(0)} ms/frame)`);
} else if (mode === 'rough' || mode === 'final') {
  const [a, b] = args.range ? span(args.range) : [0, undefined], fdir = join(OUT, mode, 'frames');
  await frames(fdir, a, b, +(args.workers || 3));
  await browser.close();
  const name = mode === 'rough' ? 'rough.mp4' : (MV.title || 'mv').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() + '.mp4';
  await encode(fdir, at(args.out || join(OUT, mode, name)), audioOf());
  process.exit(0);
} else if (args.frames) {
  const [a, b] = args.range ? span(args.range) : [0, undefined];
  await frames(at(typeof args.frames === 'string' ? args.frames : join(OUT, 'frames')), a, b, +(args.workers || 3));
} else if (args.clip || mode === 'songcheck') {
  const page = await openPage(), len = await lengthOf(page);
  const [a, b] = args.range ? span(args.range) : typeof args.clip === 'string' ? span(args.clip) : [0, len];
  const audio = audioOf();
  const out = at(args.out || join(OUT, 'check', mode === 'songcheck' ? 'songcheck.mp4' : 'clip.mp4')); mkdirSync(dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...(audio ? ['-ss', String(a), '-t', String(b - a), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((b - a) * fps), start = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await frameOf(page, a + i / fps, 'image/jpeg', .93);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 48 === 0 || i === n - 1) console.log(`frame ${i + 1}/${n}  ${((Date.now() - start) / (i + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out}`);
} else {
  console.log('nothing to do: see the usage notes at the top of engine/render.mjs');
}
await browser.close();
