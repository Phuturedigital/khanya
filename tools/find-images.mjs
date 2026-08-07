/* Khanya concept demo — stock image sourcing.
 *
 * Queries Pexels for each image slot the design needs and writes small preview
 * JPEGs to tools/previews/ so candidates can be eyeballed before anything is
 * committed. Nothing here runs at build or deploy time; the site is static and
 * ships only the converted webp files under assets/.
 *
 * Pexels licence: free for commercial use, no attribution required. We record
 * photographer credits in CONTENT-NOTES.md anyway — it costs nothing and the
 * brief is a client-facing concept, where "where did this come from" is a
 * question that gets asked.
 *
 * Usage:  node tools/find-images.mjs <slot>       # search + download previews
 *         node tools/find-images.mjs --all        # every slot
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW_DIR = join(ROOT, 'tools', 'previews');

/* Pexels' web client key. Public — it is shipped in their own front-end bundle. */
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Accept: 'application/json',
  'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
};

/* Each slot names the query that best fills it. Queries lean deliberately
   toward African practitioners and patients: a South African dental brand whose
   imagery is entirely white European stock would undercut the whole premise. */
const SLOTS = {
  hero:        'african dentist patient dental chair',
  'svc-clean': 'teeth cleaning dental hygienist',
  'svc-check': 'dental checkup mirror examination',
  'svc-veneer':'dentist shade guide teeth whitening',
  about:       'african dentist working on patient clinic',
  'dr-1':      'african woman doctor portrait white coat',
  'dr-2':      'african man doctor portrait white coat',
  'avatar-1':  'smiling african woman portrait headshot',
  'avatar-2':  'smiling african man portrait headshot',
  'avatar-3':  'smiling woman portrait headshot',
};

async function search(query, perPage = 6) {
  const url =
    `https://www.pexels.com/en-us/api/v3/search/photos` +
    `?query=${encodeURIComponent(query)}&per_page=${perPage}&page=1&orientation=all`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}"`);
  const { data = [] } = await res.json();
  return data.map((d) => ({
    id: d.id,
    photographer: d.attributes?.user?.first_name
      ? `${d.attributes.user.first_name} ${d.attributes.user.last_name ?? ''}`.trim()
      : 'unknown',
    alt: (d.attributes?.image?.alt ?? '').replace(/\s+/g, ' ').trim(),
    width: d.attributes?.width,
    height: d.attributes?.height,
    /* Strip Pexels' download-disposition params and re-size on their CDN. */
    base: String(d.attributes?.image?.download_link ?? '').split('?')[0],
  })).filter((c) => c.base);
}

const sized = (base, w) => `${base}?auto=compress&cs=tinysrgb&w=${w}`;

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const wanted = process.argv[2] === '--all' ? Object.keys(SLOTS) : [process.argv[2]];
await mkdir(PREVIEW_DIR, { recursive: true });

for (const slot of wanted) {
  const query = SLOTS[slot];
  if (!query) { console.error(`unknown slot: ${slot}`); continue; }
  const results = await search(query);
  console.log(`\n=== ${slot} :: "${query}" ===`);
  for (const [i, c] of results.entries()) {
    const file = join(PREVIEW_DIR, `${slot}-${i}-${c.id}.jpg`);
    await download(sized(c.base, 400), file);
    console.log(`[${i}] id=${c.id} ${c.width}x${c.height} by ${c.photographer} :: ${c.alt}`);
    console.log(`     ${file}`);
  }
}
