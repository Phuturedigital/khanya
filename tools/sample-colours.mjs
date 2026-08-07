/* Pull the dominant brand colours out of a rendered logo PNG.
 * The gold in the supplied files lives inside an embedded raster, so there is
 * no hex to read out of the SVG source — it has to be sampled.
 *
 * Usage:  node tools/sample-colours.mjs tools/shots/logo2-mark.png
 */
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('file:///C:/Users/Acer/thatha/');
const { chromium } = require('playwright');

const target = process.argv[2] || 'tools/shots/logo2-mark.png';
const b64 = (await readFile(join(ROOT, target))).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
const counts = await page.evaluate(async (dataUri) => {
  const img = new Image();
  img.src = dataUri;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);

  const tally = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 240) continue;
    // Skip the checkerboard (pure white and the #bbb/#ccc greys) and near-greys.
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 18 && mx > 140) continue;
    const key = `${r >> 3 << 3},${g >> 3 << 3},${b >> 3 << 3}`;
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  /* The gold arc is one pixel of ink wide, so nearly every gold pixel is
     antialiased toward white. Averaging them yields a washed pastel. Instead,
     take the most SATURATED pixels in the yellow hue band — those are the ones
     closest to the unblended source colour. */
  let best = [];
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 250) continue;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    if (r > g && g > b && sat > 0.3) best.push({ r, g, b, sat });
  }
  best.sort((x, y) => y.sat - x.sat);
  const top = best.slice(0, Math.max(1, Math.floor(best.length * 0.05)));
  const avg = top.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
  const n = top.length || 1;
  const gold = { r: Math.round(avg.r / n), g: Math.round(avg.g / n), b: Math.round(avg.b / n), n: best.length };

  return {
    common: [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    gold,
  };
}, `data:image/png;base64,${b64}`);

const hex = (s) => '#' + s.split(',').map((n) => Number(n).toString(16).padStart(2, '0')).join('');
const rgbHex = (o) => '#' + [o.r, o.g, o.b].map((n) => n.toString(16).padStart(2, '0')).join('');

console.log(`Dominant colours in ${target}:\n`);
for (const [key, n] of counts.common) console.log(`  ${hex(key)}   ${n} px`);
console.log(`\nGold, from the top 5% most saturated of ${counts.gold.n} yellow-band pixels:`);
console.log(`  ${rgbHex(counts.gold)}`);

await browser.close();
