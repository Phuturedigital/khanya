/* Render an arbitrary region of a supplied logo SVG.
 * Usage:  node tools/crop-logo.mjs <file.svg> "<x y w h>" <outname> [w]
 */
import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'C:/Users/Acer/Downloads/Khanya Logo Design';
const OUT = join(ROOT, 'tools', 'shots');
const require = createRequire('file:///C:/Users/Acer/thatha/');
const { chromium } = require('playwright');

const [file, vb, outName, wArg] = process.argv.slice(2);
const [, , vw, vh] = vb.split(/\s+/).map(Number);
const outW = Number(wArg || 900);
const outH = Math.round((outW * vh) / vw);

await mkdir(OUT, { recursive: true });
const raw = await readFile(join(SRC, file), 'utf8');
const fixed = raw
  .replace(/viewBox="[^"]*"/, `viewBox="${vb}"`)
  .replace(/\swidth="\d+"/, '')
  .replace(/\sheight="\d+"/, '');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: outW, height: outH } });
await page.setContent(`
  <style>
    html,body{margin:0;height:100%}
    body{display:grid;place-items:center;
      background-image:
        linear-gradient(45deg,#bbb 25%,transparent 25%),
        linear-gradient(-45deg,#bbb 25%,transparent 25%),
        linear-gradient(45deg,transparent 75%,#bbb 75%),
        linear-gradient(-45deg,transparent 75%,#bbb 75%);
      background-size:24px 24px;
      background-position:0 0,0 12px,12px -12px,-12px 0;
      background-color:#fff}
    svg{width:100%;height:100%}
  </style>${fixed}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `${outName}.png`) });
await browser.close();
console.log(`${outName}.png  ${outW}x${outH}  from ${file} viewBox="${vb}"`);
