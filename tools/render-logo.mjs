/* Render the supplied logo SVGs to PNG so they can be looked at.
 *
 * The supplied files declare viewBox="0 0 750 750" but their artwork sits
 * OUTSIDE that box, so opening them naively shows a cropped corner. This
 * measures the real rendered bounds with getBBox() and rewrites the viewBox
 * before rendering — the same "measure the crop geometry" step the THATHA
 * build needed.
 *
 * Usage:  node tools/render-logo.mjs
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'C:/Users/Acer/Downloads/Khanya Logo Design';
const OUT = join(ROOT, 'tools', 'shots');

const require = createRequire('file:///C:/Users/Acer/thatha/');
const { chromium } = require('playwright');

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const name of ['1.svg', '2.svg']) {
  const raw = await readFile(join(SRC, name), 'utf8');
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  await page.setContent(`<body style="margin:0">${raw}</body>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  /* Real ink bounds in user units, independent of the declared viewBox. */
  const box = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const b = svg.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  console.log(`${name}: declared viewBox 0 0 750 750 — actual content ` +
    `x=${box.x.toFixed(0)} y=${box.y.toFixed(0)} w=${box.w.toFixed(0)} h=${box.h.toFixed(0)}`);

  /* Re-render with a viewBox that actually contains the artwork, plus 2% padding. */
  const pad = Math.max(box.w, box.h) * 0.02;
  const vb = `${(box.x - pad).toFixed(1)} ${(box.y - pad).toFixed(1)} ` +
             `${(box.w + pad * 2).toFixed(1)} ${(box.h + pad * 2).toFixed(1)}`;
  const ratio = (box.w + pad * 2) / (box.h + pad * 2);
  const outW = 1000;
  const outH = Math.round(outW / ratio);

  const fixed = raw
    .replace(/viewBox="[^"]*"/, `viewBox="${vb}"`)
    .replace(/\swidth="\d+"/, '')
    .replace(/\sheight="\d+"/, '');

  await page.setViewportSize({ width: outW, height: outH });
  await page.setContent(`
    <style>
      html,body{margin:0;height:100%}
      body{display:grid;place-items:center;
        background-image:
          linear-gradient(45deg,#ccc 25%,transparent 25%),
          linear-gradient(-45deg,#ccc 25%,transparent 25%),
          linear-gradient(45deg,transparent 75%,#ccc 75%),
          linear-gradient(-45deg,transparent 75%,#ccc 75%);
        background-size:20px 20px;
        background-position:0 0,0 10px,10px -10px,-10px 0;
        background-color:#fff}
      svg{width:100%;height:100%}
    </style>${fixed}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `logo-${name.replace('.svg', '')}.png`) });

  /* Keep the corrected file — this is the version worth shipping. */
  await writeFile(join(OUT, `fixed-${name}`), fixed);
  await page.close();
}

await browser.close();
console.log('\nCorrected SVGs written to tools/shots/fixed-*.svg');
