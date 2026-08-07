# Khanya Dental Studio — concept demo

A concept build for an **invented** South African dental brand: **6 static pages, no
framework, no build step.** Same infrastructure pattern as the Africrest pitch demo and the
THATHA demo — flat HTML, one stylesheet, one small progressive-enhancement script, deployed
to Vercel.

> **Khanya Dental Studio does not exist.** There is no practice, no practitioners, no HPCSA
> registration and no appointment diary. Everything on the site — brand, people, prices,
> statistics, reviews, address — is invented for demonstration. See
> [Concept labelling](#concept-labelling) for how that is enforced.

```
index.html          Home — hero, signature services, about split, illustrative stats
services.html       General + cosmetic dentistry, indicative fees
about.html          The name, the design system, honest status, photo credits
testimonials.html   Sample review layout (all quotes invented, monograms not faces)
blog.html           Sample article cards (headlines only — nothing written)
contact.html        Booking form, location, hours, FAQ
styles.css          The whole design system (~22KB, hand-rolled)
site.js             Mobile nav + form handling (~3KB, no dependencies)
assets/             Photography (5 hero slides + 10), logo mark, favicon (~538KB)
tools/              Image sourcing + screenshot harness — NOT deployed
```

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8765
# http://127.0.0.1:8765/
```

---

## The brand

**Khanya** is a verb in isiXhosa and isiZulu: *to shine, to give light, to become bright*.
It is also a common given name across South Africa.

It was chosen over the two obvious alternatives for reasons worth recording:

- **Not a surname.** Most SA dental practices are named for the principal dentist, which
  stops working the moment that dentist retires or sells.
- **Pronounceable across language groups.** `Mamatheka` (isiZulu, "to smile") is more
  literal and more distinctly SA, but five syllables is a real cost for a brand people must
  say aloud to refer a friend.

Positioning line: **"Modern dentistry, gentle hands."**

---

## Design system

| Colour | Hex | Used for |
|---|---|---|
| Deep sea navy | `#0C2A33` | Text, nav, dark bands |
| Coastal mist | `#DCE8EC` | Page background |
| Khanya gold | `#E8A33D` | CTAs, eyebrows, the concept banner |
| Aloe | `#2E9E8F` | Secondary accent |

All tokens live in `:root` at the top of `styles.css`. Breakpoints: **1080 / 980 / 640**.

**Type** — `Archivo` (headings, tight uppercase) and `Inter` (body, light). Both are
open-licensed and served from Google Fonts, so there is no font licence to buy before this
could go to production. That is deliberate: the THATHA build inherited a brand pack
specifying Benton Sans, which is licensed and cannot legally be web-embedded.

**Layout** — the page sits on mist; the hero is an inset rounded card floating on it, and
everything below lives on a white sheet sharing the same radius. That inset-card structure
is the load-bearing idea of the reference design.

---

## Concept labelling

This is a demo, and it is labelled in **five** independent places so no single edit can
quietly turn it into something mistakable for a live practice:

1. **`.demo-banner`** — gold bar above the nav on every page.
2. **`robots.txt`** — `Disallow: /`.
3. **`vercel.json`** — `X-Robots-Tag: noindex, nofollow` on every response.
4. **`.concept-note`** — full disclosure block in the footer of every page.
5. **Inline `.placeholder-tag`s** — beside every invented figure, practitioner and location.

The header matters more than the banner. The banner stops a *person* mistaking this for a
real practice; the header stops Google indexing a fictional dental clinic and surfacing it
to somebody actually searching for care. On a healthcare concept that second risk is the
serious one.

### Rules applied to the copy

- **No invented practitioner names or credentials.** The reference design shows
  "Dr Jonas Suherman, Pediatric Dentistry, 7 year Experience, 4.5 Rating". Attaching an
  invented clinical credential to a real stock-photo person is a different and worse fiction
  than an obviously fake statistic, so every practitioner card reads *"Dental practitioner /
  Placeholder profile"*.
- **No stock faces on testimonials.** Invented quotes get a monogram, never a photograph —
  putting words in a real photographed person's mouth is the thing to avoid.
- **Every number captioned.** The `98% / 50K / 4.9` stat row carries an explicit
  "illustrative figures, not audited" note directly beneath it.
- **The form says so.** Submitting the booking form states plainly that no appointment was
  booked, rather than silently swallowing it — which on a dental site would mean somebody
  believing they have an appointment that does not exist.

---

## Motion

Everything animated uses **transform and opacity only**, so it composites on the GPU and
never triggers layout.

| Effect | How |
|---|---|
| Hero entrance | Pure CSS, staggered `animation-delay` — runs with JS disabled |
| **Hero carousel** | **5 crossfading slides, 6.5s autoplay, Ken Burns per slide** |
| Scroll reveal | `IntersectionObserver`, revealed once, staggered per group |
| Counting stats | `requestAnimationFrame`, easeOutExpo, fires when the row enters view |
| Reading progress | A fixed bar driven by a `--p` custom property → `scaleX` |
| Hover | Lift on cards, arrow lean on service cards, centre-out nav underline |
| Concept banner | A slow travelling highlight — the one element that must not be skimmed |

### The hero carousel

Five slides, all present in the DOM from the start at `opacity:0` — switching never waits on
an image decode, so there is no flash partway through the sequence. Slide 1 is `eager` +
`fetchpriority="high"` because it is the LCP element; the rest are `lazy`.

- **Autoplay** every 6.5s, **held** while the pointer is over the hero, while focus is inside
  it, or while the tab is in the background.
- The **progress bar is that timer made visible** — a `scaleX` animation whose duration must
  stay in step with `INTERVAL` in `site.js`. Change the two together.
- **Prev / next / arrow keys** all work; a manual move restarts the clock so the slide you
  chose gets its full turn.
- **Chips stay real links** to their service section. Hover or focus previews that slide, and
  the active chip tracks whichever slide is live — so nothing is taken away from someone who
  just wants to click through.
- **`prefers-reduced-motion`**: no autoplay at all, no zoom, no crossfade. The controls still
  work, and the progress bar is pinned full rather than sitting empty and implying a
  countdown that will never arrive.

`tools/check-carousel.mjs` asserts all of it — including the failure modes a screenshot can't
show, like two slides live at once or a counter drifting out of step with the imagery.

### The flash-of-content problem

Scroll-reveal normally means "JS sets `opacity:0` after load", which guarantees a flash on a
slow connection: the stylesheet is render-blocking, your script is not. Instead, a one-line
inline `<script>` in `<head>` stamps a `.js` class on `<html>` **before first paint**, and
the CSS hides reveal targets only under `.js`. No-JS visitors get the full page; JS visitors
never see the flash.

### Three states that must all stay readable

`tools/check-motion.mjs` asserts that no content is ever stranded invisible:

- **`prefers-reduced-motion: reduce`** — CSS forces every reveal target back to `opacity:1`.
  Killing the transition *without* this would leave them stuck hidden, i.e. a blank page.
- **JavaScript disabled** — `.js` is never stamped, so nothing is hidden at all.
- **Normal, before any scroll** — anything already touching the viewport is revealed on the
  first frame. The observer holds elements back until 12% inside the viewport, which is what
  makes scrolling feel deliberate, but it also meant an element straddling the bottom edge on
  load sat blank until the reader happened to scroll. A prime pass fixes that.

Run it with `node tools/check-motion.mjs`.

## Tools (not deployed)

`tools/` is in `.vercelignore` and never ships.

```bash
node tools/find-images.mjs --all      # search Pexels, download preview candidates
node tools/fetch-assets.mjs           # fetch the CHOSEN photos as webp into assets/
node tools/dims.mjs                   # print intrinsic dimensions for width/height attrs
node tools/shoot.mjs                  # 6 pages x 7 viewports: overflow + tap-target audit
node tools/shoot.mjs --url https://…  # same, against a live deploy
node tools/overflow.mjs about.html 390 # name the elements past the viewport edge
node tools/check-motion.mjs           # assert nothing is stranded invisible
node tools/check-carousel.mjs         # 18 behavioural checks on the hero carousel
node tools/shoot-slides.mjs           # capture each hero slide in place
node tools/render-logo.mjs            # measure + render the supplied logo files
node tools/sample-colours.mjs <png>   # pull brand colours out of a rendered logo
```

`shoot.mjs` sweeps **1440 / 1024 / 768 / 414 / 390 / 360 / 320** and fails on horizontal
overflow, console errors, failed requests, or any standalone tap target under 24×24
(WCAG 2.2 SC 2.5.8 — links sitting inline inside a sentence are exempt, and it detects that).
It scrolls each page before capturing so scroll-reveal content is actually in the screenshot.

`shoot.mjs` and `overflow.mjs` borrow Playwright from the sibling `thatha` checkout rather
than adding `node_modules` here — the site itself stays zero-dependency, which is the point
of the pattern. If that repo moves, one `createRequire` line in each needs updating.

---

## One CSS trap worth knowing

An `<img>`'s `width`/`height` **attributes** become CSS presentational hints, and
`aspect-ratio` only resolves a **missing** dimension. So a definite attribute height
alongside `width:100%` makes `aspect-ratio` a silent no-op and lets `object-fit:cover` crop
the frame. `styles.css` guards this globally with `img[width][height] { height: auto }`.

That guard scores **(0,2,1)** — two attribute selectors beat a lone class. Images that must
*fill* their box therefore have to out-specify it, which is why you will see
`.about-figure img[width][height]` rather than `.about-figure img`. Dropping the attributes
from those selectors will not error; it will just silently stop working.

---

Built by [Phuture Digital](https://www.phuturedigital.co.za).
