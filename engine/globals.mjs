// globals.mjs: lists every name the page already has before an MV's own scripts load (the browser's window, p5 in
// global mode, and every Style Profile's libraries) into engine/globals.json, which build.mjs checks the MV's names
// against. Run it again after a Chrome or p5 update:  node engine/globals.mjs [--chrome=<path>]
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './build.mjs';

const arg = process.argv.find(a => a.startsWith('--chrome='));
const CHROME = [arg && arg.slice(9), process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome not found: pass --chrome=<path> or set CHROME_PATH'); process.exit(1); }

const libs = [...new Set(readdirSync(join(ROOT, 'styles')).filter(d => existsSync(join(ROOT, 'styles', d, 'style.json')))
  .flatMap(d => JSON.parse(readFileSync(join(ROOT, 'styles', d, 'style.json'), 'utf8')).libraries))];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
const html = join(ROOT, '.build', 'globals.html'); mkdirSync(join(ROOT, '.build'), { recursive: true });
writeFileSync(html, '<meta charset="utf-8">' + libs.map(l => `<script src="../${l}"></script>`).join('') + '<script>function setup() { noCanvas(); }</script>');
await page.goto(pathToFileURL(html).href);
await page.waitForFunction(() => typeof window.line === 'function', { timeout: 30000 });
const names = await page.evaluate(() => {
  const out = new Set();
  for (let o = window; o; o = Object.getPrototypeOf(o)) for (const k of Object.getOwnPropertyNames(o)) out.add(k);
  return [...out].filter(k => /^[A-Za-z_$][\w$]*$/.test(k)).sort();
});
await browser.close();
writeFileSync(join(ROOT, 'engine', 'globals.json'), JSON.stringify(names) + '\n');
console.log(`engine/globals.json: ${names.length} names (window, p5, ${libs.join(', ')})`);
