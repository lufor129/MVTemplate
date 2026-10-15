// lineup.mjs: the squint test for the Style Sample Gate (GUIDE.md step 0). Renders one moment of the style-sample loop
// in every Style Profile, small, side by side → out/check/style_lineup.jpg. At that size each profile must still be
// told from the others at a glance; one that can't isn't a look of its own yet.
//   node engine/lineup.mjs [--mv=<dir>] [--styles=watercolor,cel] [--t=1.6] [--w=480]
import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build, ROOT } from './build.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const styles = args.styles ? args.styles.split(',') : readdirSync(join(ROOT, 'styles')).filter(s => existsSync(join(ROOT, 'styles', s, 'style.json'))).sort();
const { MV, dir } = build(args.mv || '.'), w = +(args.w || 480), h = Math.round(w * (MV.format === '9:16' ? 16 / 9 : 9 / 16));
const tmp = join(ROOT, '.build', 'lineup'), out = resolve(process.cwd(), args.out || join(dir, 'out', 'check', 'style_lineup.jpg'));
mkdirSync(tmp, { recursive: true }); mkdirSync(join(out, '..'), { recursive: true });

// one at a time: every render rebuilds .build/mv.js for its own style
for (const s of styles) {
  const r = spawnSync('node', [join(ROOT, 'engine', 'render.mjs'), `--mv=${args.mv || '.'}`, `--style=${s}`, '--loop=style-sample', `--sheet=${args.t || 1.6}`,
    '--cols=1', `--w=${w}`, `--tag=${s}`, `--out=${join(tmp, s + '.jpg')}`], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
const cols = Math.min(4, styles.length), layout = styles.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|');
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...styles.flatMap(s => ['-i', join(tmp, s + '.jpg')]),
  '-filter_complex', styles.length > 1 ? `xstack=inputs=${styles.length}:layout=${layout}:fill=black` : 'null', '-q:v', '3', out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log(`wrote ${out}  (${styles.join(', ')})`);
build(args.mv || '.');   // leave .build/mv.js on the MV's own style
