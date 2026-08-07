# Content notes — what is invented, and where it came from

Companion to `README.md`. This file exists so that anyone picking the repo up later can tell
at a glance which parts of the site are design work and which parts are placeholder fiction.

---

## Everything on this site that is invented

| Thing | Status |
|---|---|
| Khanya Dental Studio | **Invented brand.** No such practice exists. |
| The practitioners | **Stock models.** No names, no credentials attached. |
| `98%` satisfaction / `50K` smiles / `4.9` rating | **Invented.** Captioned as illustrative in-page. |
| `750+` reviews | **Invented.** Carries a placeholder tag. |
| All six testimonials | **Written for this demo.** Nobody said any of it. |
| All fees (R650 – R4 800) | **Invented.** Not benchmarked to any tariff guide. |
| Main Road, Sea Point address | **Invented.** No premises. |
| Opening hours | **Illustrative.** |
| Blog headlines | **Headlines only.** No articles written. |

## Everything that is real

- The design, the markup, the CSS and the JS.
- The responsive behaviour, verified at 1440 and 390.
- The photography licence (Pexels).
- Phuture Digital, who built it.

---

## Photography

All images licensed from **Pexels** under the [Pexels licence](https://www.pexels.com/license/)
— free for commercial use, attribution not required. Credits recorded anyway.

The five hero slides are sequenced as a small narrative — treatment in progress, seeing the
result, a welcomed patient, a child, the practice at work. Three come from the same Gustavo
Fring shoot, which stops the set looking like five unrelated stock photos bolted together.
All are 1800×1200, so nothing shifts during a crossfade.

| File | Pexels ID | Photographer | Why this frame |
|---|---|---|---|
| `hero.webp` | 5622242 | Gustavo Fring | Slide 1 — patient mid-treatment. Mirrors the reference hero composition. |
| `hero-2.webp` | 5622275 | Gustavo Fring | Slide 2 — patient sees the result in a hand mirror. Same shoot as slide 1. |
| `hero-3.webp` | 3845627 | Anna Shvets | Slide 3 — relaxed patient meeting the camera. Warmest frame of the five. |
| `hero-4.webp` | 7800568 | Nadezhda Moryak | Slide 4 — child check-up. Chosen over darker paediatric frames that read as distress. |
| `hero-5.webp` | 5622263 | Gustavo Fring | Slide 5 — wider room shot. Same shoot as slides 1 and 2. |
| `about-clinic.webp` | 16903641 | Shedrack Salami | Cool-toned clinical scene; the blue cast sits inside the coastal palette. |
| `svc-cleaning.webp` | 5622010 | Gustavo Fring | Scale-and-polish in progress. |
| `svc-checkup.webp` | 6502742 | cottonbro studio | Dark, close mirror examination — highest contrast of the three. |
| `svc-veneers.webp` | 5355899 | Tima Miroshnichenko | Shade guide in blue nitrile; clearest shorthand for veneers. |
| `practitioner-1.webp` | 18828741 | Tessy Agbonome | Front-facing, warm, even studio light. |
| `practitioner-2.webp` | 4989135 | Ivan S | Matched to practitioner-1 for lighting and background value. |
| `avatar-1.webp` | 3534962 | TUBARONES Photography | Review avatar. |
| `avatar-2.webp` | 7432863 | August de Richelieu | Review avatar. |
| `avatar-3.webp` | 9592569 | Estelle Umaes | Review avatar. |

**Selection brief.** Queries leaned deliberately toward African practitioners and patients.
A South African dental brand illustrated entirely with white European stock would undercut
the premise of the exercise, so `find-images.mjs` encodes that in its query strings rather
than leaving it to whatever the default stock ranking returns.

**Sourcing gotcha.** A few Pexels photos are served under a slugged CDN filename rather than
the canonical `pexels-photo-<id>.jpeg` pattern, and 404 on the pinned URL. The first pick
for `avatar-3` (id 17746329) hit this and was substituted. `fetch-assets.mjs` verifies the
RIFF/WEBP magic bytes on every download, so a JPEG fallback or an error page cannot be
silently written into `assets/`.

**Format.** Pexels' CDN performs both the resize and the WebP encode via `fm=webp`, so there
is no local image toolchain — no sharp, no ImageMagick. Widths are ~1.5× the largest CSS
display size. Total payload **≈200KB** for all ten images.

---

## ⚠️ The supplied logo files are broken exports

Source: `C:\Users\Acer\Downloads\Khanya Logo Design\` — `1.svg` (399KB) and `2.svg` (102KB).
Both carry C2PA metadata identifying **Canva** as the generator.

Neither is usable as delivered. Three separate faults:

1. **The artwork overflows the declared canvas.** Both declare `viewBox="0 0 750 750"`, but
   the content sits outside it — `2.svg`'s tooth is transformed to y≈503–889, and `1.svg`'s
   measures 897×975 starting at x=301. Opening either file normally shows a cropped corner.
2. **The wordmark is hard-clipped in the source.** `2.svg` clips its text paths with
   `clipPath` at **x=749.5**, so of "KHANYA DENTAL" only the **K** and roughly half of
   "DE" survive. The rest of the letterforms are not hidden — they are absent.
3. **They are not really vector.** Both wrap base64-embedded raster `<image>` elements. Only
   the small wordmark fragments are true paths (`fill="#11324d"` and `fill="#4399a4"`). The
   tooth and the gold arc are bitmaps, and the tooth's base is cut off flat inside its own
   raster.

`1.svg` is the worse of the two — only a fragment of gold arc and one navy swoosh render at
all.

**What was done about it.** The mark was **redrawn as clean vector** in `assets/mark.svg`,
keeping the supplied design (brush-stroke tooth, open gold arc, sparkle above) as real paths
with the tooth stroked in `currentColor`. One file therefore serves the dark nav (white
tooth) and the light footer (navy tooth) without shipping colourways. The wordmark is set as
HTML text in Archivo rather than as an image — the same call the THATHA build made when its
supplied lockup turned out not to be web-safe.

**Palette, recovered from the files.** `#11324D` and `#4399A4` are declared fills in the SVG
source. The gold has no hex anywhere — it lives inside a raster — so it was sampled with
`tools/sample-colours.mjs`. Averaging gold pixels returns a washed pastel (`#c0b8a0`),
because the arc is one pixel of ink wide and nearly every pixel is antialiased toward white;
taking the **top 5% most saturated** pixels in the yellow hue band instead gives **`#DFB865`**,
which is what the site uses.

**For production:** ask for the logo re-exported with the canvas fitted to the artwork, the
type converted to outlines, and the whole lockup as paths rather than embedded bitmaps.

Reproduce any of this with:

```bash
node tools/render-logo.mjs                       # measure bounds, render corrected
node tools/crop-logo.mjs 2.svg "130 490 660 420" out 1000
node tools/sample-colours.mjs tools/shots/logo2-full.png
```

---

## Reference design

The layout follows a supplied design reference for a dental clinic site. Reproduced:

- Inset rounded hero card with the nav **inside** it rather than in a sticky band
- Oversized uppercase display headline left, light supporting paragraph right
- Glassy translucent service pill-chips bottom-left
- `01 —— 05` slider counter with a floating practitioner card bottom-right
- Eyebrow-beside-title section heads (`Our services /`)
- Three-up image carousel with corner arrow affordances
- Avatar-stack social proof
- Split about section with large image left
- Three-column stats row

The carousel the reference implies is **real**: five crossfading slides, working prev/next,
a counter that tracks the imagery, a progress bar that doubles as a countdown, autoplay that
holds while you read, and chips that both preview a slide on hover and remain links to their
service section.

> Earlier in this build the slider was static furniture with `disabled` controls, on the
> grounds that faking a five-slide carousel with one photograph is a small lie. That is no
> longer the trade-off — there are five actual photographs.

Deliberately **not** reproduced:

- **Named practitioners with credentials and ratings.** See `README.md` → Concept labelling.
- **Undisclaimed statistics.**

---

## Deliberate deviations from the reference, and why

1. **Hero lede got a `text-shadow`.** The chosen photograph is bright exactly where that
   paragraph sits and the angled scrim alone did not carry it. The shadow is doing
   accessibility work, not decoration.
2. **Service-card scrim tightened.** A gradient climbing half the card read as grey haze over
   the photograph rather than as a label backing.
3. **About figure stretches to the row.** With `align-items:start` the image left a well of
   dead white space beneath it.
4. **Round nav arrow hidden below 640px.** It pushed the nav bar ~37px past a 390px
   viewport. It duplicates the "Book a call" pill's destination, so it was the cheap thing to
   drop — hiding the CTA itself would have removed the primary action on the devices most
   likely to use it.
5. **Hero scrim tuned against the brightest slide, not the first.** The lede sits in the
   55–80% band of the gradient, where slide 4 is nearly white. Balancing that band for slide
   1 alone left the paragraph unreadable two slides later.

---

## Open items

- ⬜ Contact form has no backend. It submits to a pre-filled `mailto:` and says so plainly.
- ⬜ No brochure or price-list PDF.
- ⬜ Blog cards do not link anywhere — no article pages exist.
- ⬜ No map embed on `contact.html`; the address is invented, so a real pin would be worse
  than none.
