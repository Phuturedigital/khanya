/* Print intrinsic pixel dimensions of every webp in assets/.
 *
 * These go into each <img>'s width/height ATTRIBUTES to reserve layout space
 * and stop cumulative layout shift. Getting them exactly right matters more
 * than it looks: a width/height attribute becomes a CSS presentational hint,
 * and `aspect-ratio` only resolves a MISSING dimension — so a definite
 * attribute height next to `width:100%` silently makes aspect-ratio a no-op
 * and lets object-fit crop the frame. Every rule that sets `width:100%` on
 * these images must also set `height:auto`.
 *
 * Usage:  node tools/dims.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

/* Minimal WebP dimension reader. Handles the three container flavours:
   VP8 (lossy), VP8L (lossless) and VP8X (extended). */
function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('ascii', 12, 16);

  if (fourcc === 'VP8 ') {
    // Frame header: 3-byte tag, 3-byte start code, then 16-bit w/h (14 bits used).
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    // 1 signature byte, then 14 bits width-1, 14 bits height-1, little-endian.
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    // 24-bit canvas width-1 / height-1 at offsets 24 and 27.
    const u24 = (o) => buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16);
    return { w: u24(24) + 1, h: u24(27) + 1 };
  }
  return null;
}

for (const name of (await readdir(DIR)).filter((f) => f.endsWith('.webp')).sort()) {
  const size = webpSize(await readFile(join(DIR, name)));
  console.log(
    size
      ? `${name.padEnd(24)} width="${size.w}" height="${size.h}"   ratio ${(size.w / size.h).toFixed(3)}`
      : `${name.padEnd(24)} UNREADABLE`
  );
}
