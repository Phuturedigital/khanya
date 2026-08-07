/* Capture each hero slide in place, so the crop and the scrim can be judged
 * against every photograph rather than only the first.
 *
 * Usage:  node tools/shoot-slides.mjs [width]
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', 'shots');
const require = createRequire('file:///C:/Users/Acer/thatha/');
const { chromium } = require('playwright');

const width = Number(process.argv[2] || 1440);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
/* reducedMotion stops autoplay stealing the slide between the click and the
   screenshot, and freezes the Ken Burns so each frame is captured unzoomed. */
const page = await browser.newPage({ viewport: { width, height: 860 }, reducedMotion: 'reduce' });
await page.goto(pathToFileURL(join(ROOT, 'index.html')).href, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const count = await page.evaluate(() => document.querySelectorAll('.hero-slide').length);
for (let i = 0; i < count; i++) {
  if (i > 0) { await page.click('[data-next]'); await page.waitForTimeout(400); }
  await page.screenshot({ path: join(OUT, `slide-${i + 1}.png`), clip: { x: 0, y: 0, width, height: 860 } });
  console.log(`slide-${i + 1}.png`);
}

await browser.close();
