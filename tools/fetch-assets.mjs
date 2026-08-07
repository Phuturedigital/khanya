/* Khanya concept demo — fetch the CHOSEN stock images into assets/.
 *
 * The candidates were reviewed by eye from tools/previews/ and the winners are
 * pinned by Pexels photo id below. Re-running this script is deterministic: it
 * always fetches these exact photos at these exact widths.
 *
 * Pexels' CDN does the resize AND the webp encode for us (`fm=webp`), so there
 * is no local image toolchain to install and no sharp/ImageMagick dependency.
 * Widths are ~1.5x the largest CSS display size — enough for a crisp render on
 * a 2x screen without shipping a 5760px original.
 *
 * Usage:  node tools/fetch-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

/* id        = Pexels photo id (pinned)
   out       = path under assets/
   w         = delivered width in px
   credit    = photographer, recorded in CONTENT-NOTES.md
   note      = why this frame was chosen */
const ASSETS = [
  /* --- hero carousel, five slides ---------------------------------------
     Sequenced as a small narrative: treatment in progress, seeing the result,
     a welcomed patient, a child, the practice at work. Three of the five come
     from the same Gustavo Fring shoot, which keeps the set from looking like
     five unrelated stock photos bolted together. All landscape, all composed
     right-of-centre because the headline occupies the left third. */
  { id: 5622242,  out: 'assets/hero.webp',            w: 1800, credit: 'Gustavo Fring',
    note: 'Slide 1 — patient in chair mid-treatment. Mirrors the reference hero composition.' },
  { id: 5622275,  out: 'assets/hero-2.webp',          w: 1800, credit: 'Gustavo Fring',
    note: 'Slide 2 — patient sees the result in a hand mirror. Same shoot as slide 1.' },
  { id: 3845627,  out: 'assets/hero-3.webp',          w: 1800, credit: 'Anna Shvets',
    note: 'Slide 3 — relaxed patient meeting the camera. The warmest frame of the five.' },
  { id: 7800568,  out: 'assets/hero-4.webp',          w: 1800, credit: 'Nadezhda Moryak',
    note: 'Slide 4 — child check-up. Chosen over darker paediatric frames that read as distress.' },
  { id: 5622263,  out: 'assets/hero-5.webp',          w: 1800, credit: 'Gustavo Fring',
    note: 'Slide 5 — wider room shot, the practice at work. Same shoot as slides 1 and 2.' },
  { id: 16903641, out: 'assets/about-clinic.webp',    w: 1400, credit: 'Shedrack Salami',
    note: 'Cool-toned clinical scene; the blue cast sits naturally inside the coastal palette.' },
  { id: 5622010,  out: 'assets/svc-cleaning.webp',    w: 900,  credit: 'Gustavo Fring',
    note: 'Scale-and-polish in progress — reads unmistakably as a cleaning.' },
  { id: 6502742,  out: 'assets/svc-checkup.webp',     w: 900,  credit: 'cottonbro studio',
    note: 'Dark, close mirror examination. Highest-contrast of the three service frames.' },
  { id: 5355899,  out: 'assets/svc-veneers.webp',     w: 900,  credit: 'Tima Miroshnichenko',
    note: 'Shade guide in blue nitrile — the single clearest visual shorthand for veneers.' },
  { id: 18828741, out: 'assets/practitioner-1.webp',  w: 640,  credit: 'Tessy Agbonome',
    note: 'Front-facing, warm, even studio light. Crops cleanly to the card aspect.' },
  { id: 4989135,  out: 'assets/practitioner-2.webp',  w: 640,  credit: 'Ivan S',
    note: 'Matches practitioner-1 for lighting and background value, so the pair sits level.' },
  { id: 3534962,  out: 'assets/avatar-1.webp',        w: 160,  credit: 'TUBARONES PHOTOGRAPHY', note: 'Review avatar.' },
  { id: 7432863,  out: 'assets/avatar-2.webp',        w: 160,  credit: 'August de Richelieu',   note: 'Review avatar.' },
  /* First pick (17746329) 404s: a few Pexels photos are served under a slugged
     filename rather than the canonical pexels-photo-<id>.jpeg. Substituted. */
  { id: 9592569,  out: 'assets/avatar-3.webp',        w: 160,  credit: 'Estelle Umaes',        note: 'Review avatar.' },
];

/* Resolve a photo id to its CDN base path. Pexels' canonical file URL embeds
   the id twice, which is stable across their API versions. */
const cdn = (id, w) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg` +
  `?auto=compress&cs=tinysrgb&fm=webp&w=${w}`;

await mkdir(join(ROOT, 'assets'), { recursive: true });

let failures = 0;
for (const a of ASSETS) {
  const dest = join(ROOT, a.out);
  try {
    const res = await fetch(cdn(a.id, a.w), { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    /* Verify we actually got WebP and not a JPEG fallback: RIFF....WEBP. */
    const isWebp =
      buf.length > 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP';
    if (!isWebp) throw new Error('not a webp — CDN ignored fm=webp');

    await writeFile(dest, buf);
    console.log(`ok   ${a.out.padEnd(30)} ${String(Math.round(buf.length / 1024)).padStart(4)} KB  © ${a.credit}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${a.out.padEnd(30)} ${err.message}`);
  }
}
console.log(failures ? `\n${failures} asset(s) failed.` : '\nAll assets fetched.');
process.exit(failures ? 1 : 0);
