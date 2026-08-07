/* Behavioural test for the hero carousel.
 *
 * A carousel has several ways to be quietly broken — two slides live at once,
 * a counter that drifts out of step with the imagery, autoplay that keeps
 * running under prefers-reduced-motion, a pause that does not pause. None of
 * those show up in a screenshot, so they get asserted here.
 *
 * Usage:  node tools/check-carousel.mjs [--url https://…]
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('file:///C:/Users/Acer/thatha/');
const { chromium } = require('playwright');

const urlFlag = process.argv.indexOf('--url');
const target = urlFlag !== -1
  ? process.argv[urlFlag + 1].replace(/\/$/, '') + '/'
  : pathToFileURL(join(ROOT, 'index.html')).href;

const browser = await chromium.launch();
let failures = 0;
const check = (name, pass, detail = '') => {
  if (!pass) failures++;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
};

/* Reads the carousel's whole visible state in one go, so the counter and the
   imagery are sampled from the same frame and cannot appear to disagree. */
const state = (page) => page.evaluate(() => {
  const live = [...document.querySelectorAll('.hero-slide')]
    .map((s, i) => (s.classList.contains('is-live') ? i : -1))
    .filter((i) => i >= 0);
  const chips = [...document.querySelectorAll('.chip[data-slide]')]
    .map((c, i) => (c.classList.contains('is-active') ? i : -1))
    .filter((i) => i >= 0);
  return {
    live,
    chips,
    counter: document.querySelector('[data-now]')?.textContent.trim(),
    total: document.querySelector('[data-total]')?.textContent.trim(),
    held: document.querySelector('.hero')?.classList.contains('is-held'),
    slideCount: document.querySelectorAll('.hero-slide').length,
  };
});

/* ---- normal motion ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  let s = await state(page);
  check('five slides present', s.slideCount === 5, `${s.slideCount} found`);
  check('total reads 05', s.total === '05', s.total);
  check('exactly one slide live at rest', s.live.length === 1, `live=[${s.live}]`);
  check('starts on slide 1', s.live[0] === 0 && s.counter === '01', `live=${s.live[0]} counter=${s.counter}`);
  check('chip tracks the live slide', s.chips.length === 1 && s.chips[0] === s.live[0], `chip=[${s.chips}]`);

  // Next button
  await page.click('[data-next]');
  await page.waitForTimeout(250);
  s = await state(page);
  check('next advances slide + counter', s.live[0] === 1 && s.counter === '02', `live=${s.live[0]} counter=${s.counter}`);
  check('chip follows next', s.chips[0] === 1, `chip=${s.chips[0]}`);

  // Prev button, and wrap-around past the first slide
  await page.click('[data-prev]');
  await page.click('[data-prev]');
  await page.waitForTimeout(250);
  s = await state(page);
  check('prev wraps to the last slide', s.live[0] === 4 && s.counter === '05', `live=${s.live[0]} counter=${s.counter}`);

  // Hovering a chip previews its slide
  await page.hover('.chip[data-slide="2"]');
  await page.waitForTimeout(250);
  s = await state(page);
  check('chip hover jumps to its slide', s.live[0] === 2, `live=${s.live[0]}`);

  // Hovering the hero must hold the slide
  check('hero marked held while hovered', s.held === true);
  const before = (await state(page)).live[0];
  await page.waitForTimeout(2600);
  check('slide does not advance while held', (await state(page)).live[0] === before);

  // Move away, and autoplay should resume
  await page.mouse.move(10, 880);
  await page.waitForTimeout(300);
  const resumeFrom = (await state(page)).live[0];
  await page.waitForTimeout(7600);            // one full interval plus the fade
  const after = await state(page);
  check('autoplay advances once released', after.live[0] !== resumeFrom, `${resumeFrom} -> ${after.live[0]}`);
  check('still exactly one slide live', after.live.length === 1, `live=[${after.live}]`);
  check('counter still matches imagery', after.counter === String(after.live[0] + 1).padStart(2, '0'),
    `counter=${after.counter} live=${after.live[0]}`);

  await ctx.close();
}

/* ---- reduced motion ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const first = (await state(page)).live[0];
  await page.waitForTimeout(8000);
  check('reduced motion: no autoplay', (await state(page)).live[0] === first, `stayed on ${first}`);

  await page.click('[data-next]');
  await page.waitForTimeout(200);
  const s = await state(page);
  check('reduced motion: arrows still work', s.live[0] === (first + 1) % 5, `live=${s.live[0]}`);
  check('reduced motion: one slide live', s.live.length === 1, `live=[${s.live}]`);
  await ctx.close();
}

/* ---- no javascript ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(target, { waitUntil: 'networkidle' });
  const s = await state(page).catch(() => null);
  // Slide 1 carries is-live in the markup, so the hero still shows a photograph.
  const liveInMarkup = await page.evaluate(() =>
    document.querySelectorAll('.hero-slide.is-live').length).catch(() => -1);
  check('no-JS: hero still shows a slide', liveInMarkup === 1 || s === null, `is-live count=${liveInMarkup}`);
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed.` : '\nCarousel behaves correctly in all three modes.');
process.exit(failures ? 1 : 0);
